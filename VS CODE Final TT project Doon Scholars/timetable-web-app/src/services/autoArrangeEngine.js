// services/autoArrangeEngine.js
// ====================================================================
// Auto-Arrange Engine for Doon Scholars Timetable
// ====================================================================
// Strategy:
//   1. Read subjects + loads from loadMaster for a given class
//   2. Read teachers from teacherSubjectMap for that class
//   3. Fill a 6-day × 8-period grid using the subject loads
//   4. Assign teachers from the mapping (strictly from THIS class only)
//   5. Detect clashes against the FULL master timetable
//   6. Resolve clashes by SWAPPING periods within the SAME class
//      (never pull teachers from another class)
// ====================================================================

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const PERIODS = [1, 2, 3, 4, 5, 6, 7, 8];
const TOTAL_SLOTS = DAYS.length * PERIODS.length; // 48

// ========================
// 1. GET SUBJECTS + LOADS
// ========================
const getSubjectsForClass = (classId, loadMaster) => {
  const normalizedId = classId.replace(/\s+/g, '').toLowerCase();
  return loadMaster
    .filter(item => item.class_id.replace(/\s+/g, '').toLowerCase() === normalizedId)
    .map(item => ({
      subject: item.subject,
      load: Math.round(item.total_load || 0)
    }))
    .filter(item => item.load > 0);
};

// ========================
// 2. GET TEACHER FOR SUBJECT
// ========================
const getTeacherForSubject = (subject, classId, teacherSubjectMap) => {
  if (!teacherSubjectMap) return '';
  const normalizedClassId = classId.replace(/\s+/g, '').toUpperCase();

  // Direct lookup
  if (teacherSubjectMap[subject]?.[normalizedClassId]) {
    return teacherSubjectMap[subject][normalizedClassId];
  }

  // Try partial match (e.g. "Maths_DK" -> look for "Maths")
  for (const mapSubj of Object.keys(teacherSubjectMap)) {
    if (subject.toLowerCase().startsWith(mapSubj.toLowerCase()) ||
        mapSubj.toLowerCase().startsWith(subject.toLowerCase())) {
      if (teacherSubjectMap[mapSubj][normalizedClassId]) {
        return teacherSubjectMap[mapSubj][normalizedClassId];
      }
    }
  }
  return '';
};

// ========================
// 3. BUILD GLOBAL TEACHER OCCUPATION MAP
// ========================
// Returns: { teacherLower: { "Mon-1": "classId", "Mon-2": "classId", ... } }
const buildGlobalOccupationMap = (masterTimetable, excludeClassId) => {
  const map = {};
  Object.entries(masterTimetable).forEach(([classId, schedule]) => {
    if (classId === excludeClassId) return; // exclude current class
    (schedule || []).forEach(slot => {
      if (!slot.teacher || !slot.day || !slot.period) return;
      const teachers = slot.teacher.split(',').map(t => t.trim().toLowerCase()).filter(Boolean);
      teachers.forEach(t => {
        if (!map[t]) map[t] = {};
        map[t][`${slot.day}-${slot.period}`] = classId;
      });
    });
  });
  return map;
};

// ========================
// 4. CHECK IF TEACHER CLASHES
// ========================
const hasClash = (teacher, day, period, occupationMap) => {
  if (!teacher) return false;
  const teachers = teacher.split(',').map(t => t.trim().toLowerCase()).filter(Boolean);
  for (const t of teachers) {
    const key = `${day}-${period}`;
    if (occupationMap[t]?.[key]) {
      return { teacher: t, clashClass: occupationMap[t][key] };
    }
  }
  return false;
};

// ========================
// 5. AUTO ARRANGE: GENERATE TIMETABLE FOR ONE CLASS
// ========================
export const autoArrangeClass = (classId, loadMaster, teacherSubjectMap, masterTimetable) => {
  const subjects = getSubjectsForClass(classId, loadMaster);
  if (subjects.length === 0) {
    return { schedule: [], error: 'No subjects found in Load Master for this class.' };
  }

  // Build a pool of subject slots to place
  const pool = [];
  subjects.forEach(({ subject, load }) => {
    for (let i = 0; i < load; i++) {
      pool.push(subject);
    }
  });

  // Check if pool exceeds available slots
  if (pool.length > TOTAL_SLOTS) {
    return {
      schedule: [],
      error: `Total load (${pool.length}) exceeds available slots (${TOTAL_SLOTS}). Please reduce subject loads.`
    };
  }

  // Build occupation map excluding this class
  const occupationMap = buildGlobalOccupationMap(masterTimetable, classId);

  // Strategy: Distribute subjects evenly across days
  // For each subject, try to spread its load across different days
  const grid = {}; // { "Mon-1": { subject, teacher } }

  // Sort subjects by load DESC (place heavy subjects first for better distribution)
  const sortedSubjects = [...subjects].sort((a, b) => b.load - a.load);

  // Track how many of each subject is placed per day
  const subjectDayCount = {}; // { subject: { Mon: 0, Tue: 0, ... } }
  sortedSubjects.forEach(s => {
    subjectDayCount[s.subject] = {};
    DAYS.forEach(d => { subjectDayCount[s.subject][d] = 0; });
  });

  // Place each subject
  for (const { subject, load } of sortedSubjects) {
    const teacher = getTeacherForSubject(subject, classId, teacherSubjectMap);
    let placed = 0;

    // Try to spread across days evenly
    for (let round = 0; placed < load; round++) {
      for (const day of DAYS) {
        if (placed >= load) break;

        // Find first free period on this day
        for (const period of PERIODS) {
          const key = `${day}-${period}`;
          if (!grid[key]) {
            // Check teacher clash
            const clash = hasClash(teacher, day, period, occupationMap);

            grid[key] = {
              day,
              period,
              subject,
              teacher,
              assignedTeachers: teacher ? teacher.split(',').map(t => t.trim()).filter(Boolean) : [],
              clash: clash || null
            };

            // Update occupation map for THIS class's teachers too
            if (teacher) {
              teacher.split(',').map(t => t.trim().toLowerCase()).filter(Boolean).forEach(t => {
                if (!occupationMap[t]) occupationMap[t] = {};
                occupationMap[t][key] = classId;
              });
            }

            subjectDayCount[subject][day]++;
            placed++;
            break;
          }
        }
      }

      // Safety: prevent infinite loop
      if (round > TOTAL_SLOTS) break;
    }
  }

  // Convert grid to schedule array
  const schedule = [];
  DAYS.forEach(day => {
    PERIODS.forEach(period => {
      const key = `${day}-${period}`;
      if (grid[key]) {
        schedule.push(grid[key]);
      }
    });
  });

  return { schedule, error: null };
};

// ========================
// 6. DETECT CLASHES FOR AN EXISTING CLASS SCHEDULE
// ========================
// Now reports allTeachers in the slot so the UI knows about composite subjects
export const detectClashes = (classId, masterTimetable) => {
  const schedule = masterTimetable[classId] || [];
  const occupationMap = buildGlobalOccupationMap(masterTimetable, classId);

  const clashes = [];
  schedule.forEach(slot => {
    if (!slot.teacher || !slot.day || !slot.period) return;
    const allSlotTeachers = slot.teacher.split(',').map(t => t.trim()).filter(Boolean);
    const clash = hasClash(slot.teacher, slot.day, parseInt(slot.period), occupationMap);
    if (clash) {
      clashes.push({
        day: slot.day,
        period: parseInt(slot.period),
        subject: slot.subject,
        teacher: clash.teacher.toUpperCase(),
        allTeachers: allSlotTeachers,       // all teachers in this slot (for composite awareness)
        isComposite: allSlotTeachers.length > 1, // flag composite/combination subjects
        clashClass: clash.clashClass,
        slotKey: `${slot.day}-${slot.period}`
      });
    }
  });

  return clashes;
};

// ========================
// 7. RESOLVE A SINGLE CLASH BY SWAPPING (DEEP RESOLVE)
// ========================
// Attempts to resolve a clash at (targetDay, targetPeriod) in classId.
// First tries to swap internally within classId.
// If that fails, it tries to swap internally within the OTHER class (the clashing class) to free up the teacher.
// For composite/combination subjects, ALL teachers in the slot are checked and must be free.
// Returns: { success: boolean, method: string, updates: Array, message: string }
// Where updates is: [{ classId, day, period, subject, teacher, assignedTeachers }]
// ========================
export const resolveClashDeep = (classId, targetDay, targetPeriod, masterTimetable, allowCrossClass = true) => {
  const schedule = [...(masterTimetable[classId] || [])].map(s => ({ ...s }));
  const occupationMap = buildGlobalOccupationMap(masterTimetable, classId);

  // Find the clashing slot
  const clashIdx = schedule.findIndex(s =>
    s.day === targetDay && parseInt(s.period) === parseInt(targetPeriod)
  );

  if (clashIdx === -1) {
    return { success: false, message: 'Slot not found.' };
  }

  const clashSlot = schedule[clashIdx];
  const clashDay = clashSlot.day;
  const clashPeriod = parseInt(clashSlot.period);

  // Get ALL teachers in this slot (composite-aware)
  const allSlotTeachers = clashSlot.teacher
    ? clashSlot.teacher.split(',').map(t => t.trim().toLowerCase()).filter(Boolean)
    : [];

  if (allSlotTeachers.length === 0) {
    return { success: false, message: 'No teacher assigned to this slot.' };
  }

  // Verify there is actually a clash
  const currentClash = hasClash(clashSlot.teacher, clashDay, clashPeriod, occupationMap);
  if (!currentClash) {
    return { success: false, message: 'No clash detected at this slot anymore.' };
  }

  // ==========================================
  // STRATEGY 1: Swap internally within classId
  // ==========================================
  
  // 1a. Same-day internal swap
  for (let candidateIdx = 0; candidateIdx < schedule.length; candidateIdx++) {
    if (candidateIdx === clashIdx) continue;
    const candidate = schedule[candidateIdx];
    if (candidate.day !== clashDay) continue;

    const candidatePeriod = parseInt(candidate.period);

    // Check: ALL teachers of the clashing composite slot must be free at the candidate period
    let allClashTeachersFree = true;
    for (const t of allSlotTeachers) {
      if (occupationMap[t]?.[`${clashDay}-${candidatePeriod}`]) {
        allClashTeachersFree = false;
        break;
      }
    }
    if (!allClashTeachersFree) continue;

    // Check: ALL teachers of the candidate slot must be free at the clash period
    if (candidate.teacher) {
      const candidateTeachers = candidate.teacher.split(',').map(t => t.trim().toLowerCase()).filter(Boolean);
      let allCandTeachersFree = true;
      for (const t of candidateTeachers) {
        if (occupationMap[t]?.[`${clashDay}-${clashPeriod}`]) {
          allCandTeachersFree = false;
          break;
        }
      }
      if (!allCandTeachersFree) continue;
    }

    // Found valid internal same-day swap!
    const updates = [
      {
        classId,
        day: clashDay,
        period: clashPeriod,
        subject: candidate.subject,
        teacher: candidate.teacher,
        assignedTeachers: candidate.assignedTeachers || (candidate.teacher ? candidate.teacher.split(',').map(t => t.trim()).filter(Boolean) : [])
      },
      {
        classId,
        day: clashDay,
        period: candidatePeriod,
        subject: clashSlot.subject,
        teacher: clashSlot.teacher,
        assignedTeachers: clashSlot.assignedTeachers || (clashSlot.teacher ? clashSlot.teacher.split(',').map(t => t.trim()).filter(Boolean) : [])
      }
    ];

    return {
      success: true,
      method: 'internal-same-day',
      updates,
      message: `🔄 Internal Same-Day Swap in ${classId.toUpperCase()}: Swapped Period ${clashPeriod} (${clashSlot.subject}) with Period ${candidatePeriod} (${candidate.subject}) on ${clashDay} to free up ${clashSlot.teacher.toUpperCase()}`
    };
  }

  // 1b. Cross-day internal swap (same subject only)
  for (let candidateIdx = 0; candidateIdx < schedule.length; candidateIdx++) {
    if (candidateIdx === clashIdx) continue;
    const candidate = schedule[candidateIdx];
    if (candidate.subject !== clashSlot.subject) continue;

    const candDay = candidate.day;
    const candPeriod = parseInt(candidate.period);

    let allClashTeachersFree = true;
    for (const t of allSlotTeachers) {
      if (occupationMap[t]?.[`${candDay}-${candPeriod}`]) {
        allClashTeachersFree = false;
        break;
      }
    }
    if (!allClashTeachersFree) continue;

    if (candidate.teacher) {
      const candidateTeachers = candidate.teacher.split(',').map(t => t.trim().toLowerCase()).filter(Boolean);
      let allCandTeachersFree = true;
      for (const t of candidateTeachers) {
        if (occupationMap[t]?.[`${clashDay}-${clashPeriod}`]) {
          allCandTeachersFree = false;
          break;
        }
      }
      if (!allCandTeachersFree) continue;
    }

    // Found valid internal cross-day swap!
    const updates = [
      {
        classId,
        day: clashDay,
        period: clashPeriod,
        subject: candidate.subject,
        teacher: candidate.teacher,
        assignedTeachers: candidate.assignedTeachers || (candidate.teacher ? candidate.teacher.split(',').map(t => t.trim()).filter(Boolean) : [])
      },
      {
        classId,
        day: candDay,
        period: candPeriod,
        subject: clashSlot.subject,
        teacher: clashSlot.teacher,
        assignedTeachers: clashSlot.assignedTeachers || (clashSlot.teacher ? clashSlot.teacher.split(',').map(t => t.trim()).filter(Boolean) : [])
      }
    ];

    return {
      success: true,
      method: 'internal-cross-day',
      updates,
      message: `🔄 Internal Cross-Day Swap in ${classId.toUpperCase()}: Swapped ${clashDay} Period ${clashPeriod} (${clashSlot.subject}) with ${candDay} Period ${candPeriod} (${candidate.subject}) to free up ${clashSlot.teacher.toUpperCase()}`
    };
  }

  // 1c. Cross-day internal swap (different subjects)
  for (let candidateIdx = 0; candidateIdx < schedule.length; candidateIdx++) {
    if (candidateIdx === clashIdx) continue;
    const candidate = schedule[candidateIdx];
    if (candidate.day === clashDay) continue; // Same-day handled by 1a
    if (candidate.subject === clashSlot.subject) continue; // Same-subject handled by 1b

    const candDay = candidate.day;
    const candPeriod = parseInt(candidate.period);

    let allClashTeachersFree = true;
    for (const t of allSlotTeachers) {
      if (occupationMap[t]?.[`${candDay}-${candPeriod}`]) {
        allClashTeachersFree = false;
        break;
      }
    }
    if (!allClashTeachersFree) continue;

    if (candidate.teacher) {
      const candidateTeachers = candidate.teacher.split(',').map(t => t.trim().toLowerCase()).filter(Boolean);
      let allCandTeachersFree = true;
      for (const t of candidateTeachers) {
        if (occupationMap[t]?.[`${clashDay}-${clashPeriod}`]) {
          allCandTeachersFree = false;
          break;
        }
      }
      if (!allCandTeachersFree) continue;
    }

    // Found valid internal cross-day swap!
    const updates = [
      {
        classId,
        day: clashDay,
        period: clashPeriod,
        subject: candidate.subject,
        teacher: candidate.teacher,
        assignedTeachers: candidate.assignedTeachers || (candidate.teacher ? candidate.teacher.split(',').map(t => t.trim()).filter(Boolean) : [])
      },
      {
        classId,
        day: candDay,
        period: candPeriod,
        subject: clashSlot.subject,
        teacher: clashSlot.teacher,
        assignedTeachers: clashSlot.assignedTeachers || (clashSlot.teacher ? clashSlot.teacher.split(',').map(t => t.trim()).filter(Boolean) : [])
      }
    ];

    return {
      success: true,
      method: 'internal-cross-day-any',
      updates,
      message: `🔄 Internal Cross-Day Swap (Different Subjects) in ${classId.toUpperCase()}: Swapped ${clashDay} Period ${clashPeriod} (${clashSlot.subject}) with ${candDay} Period ${candPeriod} (${candidate.subject}) to free up ${clashSlot.teacher.toUpperCase()}`
    };
  }

  // ==========================================
  // STRATEGY 2: Swap within the CLASHING class
  // ==========================================
  if (!allowCrossClass) {
    return {
      success: false,
      message: `❌ Could not resolve internally: ${clashSlot.subject} (${clashDay} P${clashPeriod}) — ${currentClash.teacher.toUpperCase()} clashes with ${currentClash.clashClass.toUpperCase()}. Try Deep Resolve.`
    };
  }
  const otherClassId = currentClash.clashClass;
  const clashingTeacher = currentClash.teacher;
  const otherSchedule = masterTimetable[otherClassId];

  if (otherSchedule) {
    const otherClashIdx = otherSchedule.findIndex(s =>
      s.day === clashDay && parseInt(s.period) === clashPeriod
    );

    if (otherClashIdx !== -1) {
      const otherClashSlot = otherSchedule[otherClashIdx];
      const otherSlotTeachers = otherClashSlot.teacher
        ? otherClashSlot.teacher.split(',').map(t => t.trim().toLowerCase()).filter(Boolean)
        : [];

      // Build occupation map excluding otherClassId
      const otherOccupationMap = buildGlobalOccupationMap(masterTimetable, otherClassId);

      // 2a. Same-day swap in clashing class
      for (let candidateIdx = 0; candidateIdx < otherSchedule.length; candidateIdx++) {
        if (candidateIdx === otherClashIdx) continue;
        const candidate = otherSchedule[candidateIdx];
        if (candidate.day !== clashDay) continue;

        const candidatePeriod = parseInt(candidate.period);

        // Check: ALL teachers of other class's slot must be free at candidate period in other classes
        let allClashTeachersFree = true;
        for (const t of otherSlotTeachers) {
          if (otherOccupationMap[t]?.[`${clashDay}-${candidatePeriod}`]) {
            allClashTeachersFree = false;
            break;
          }
        }
        if (!allClashTeachersFree) continue;

        // Check: ALL teachers of candidate slot must be free at clash period in other classes
        if (candidate.teacher) {
          const candidateTeachers = candidate.teacher.split(',').map(t => t.trim().toLowerCase()).filter(Boolean);
          let allCandTeachersFree = true;
          for (const t of candidateTeachers) {
            if (otherOccupationMap[t]?.[`${clashDay}-${clashPeriod}`]) {
              allCandTeachersFree = false;
              break;
            }
          }
          if (!allCandTeachersFree) continue;
        }

        // Found valid swap in clashing class!
        const updates = [
          {
            classId: otherClassId,
            day: clashDay,
            period: clashPeriod,
            subject: candidate.subject,
            teacher: candidate.teacher,
            assignedTeachers: candidate.assignedTeachers || (candidate.teacher ? candidate.teacher.split(',').map(t => t.trim()).filter(Boolean) : [])
          },
          {
            classId: otherClassId,
            day: clashDay,
            period: candidatePeriod,
            subject: otherClashSlot.subject,
            teacher: otherClashSlot.teacher,
            assignedTeachers: otherClashSlot.assignedTeachers || (otherClashSlot.teacher ? otherClashSlot.teacher.split(',').map(t => t.trim()).filter(Boolean) : [])
          }
        ];

        return {
          success: true,
          method: 'cross-class-same-day',
          updates,
          message: `🔧 Deep Resolve (Cross-Class Swap): Freed up ${clashingTeacher.toUpperCase()} in ${classId.toUpperCase()} at ${clashDay} Period ${clashPeriod}. In clashing class ${otherClassId.toUpperCase()}, swapped Period ${clashPeriod} (${otherClashSlot.subject}) with Period ${candidatePeriod} (${candidate.subject}) on ${clashDay}`
        };
      }

      // 2b. Cross-day swap in clashing class (same subject only)
      for (let candidateIdx = 0; candidateIdx < otherSchedule.length; candidateIdx++) {
        if (candidateIdx === otherClashIdx) continue;
        const candidate = otherSchedule[candidateIdx];
        if (candidate.subject !== otherClashSlot.subject) continue;

        const candDay = candidate.day;
        const candPeriod = parseInt(candidate.period);

        let allClashTeachersFree = true;
        for (const t of otherSlotTeachers) {
          if (otherOccupationMap[t]?.[`${candDay}-${candPeriod}`]) {
            allClashTeachersFree = false;
            break;
          }
        }
        if (!allClashTeachersFree) continue;

        if (candidate.teacher) {
          const candidateTeachers = candidate.teacher.split(',').map(t => t.trim().toLowerCase()).filter(Boolean);
          let allCandTeachersFree = true;
          for (const t of candidateTeachers) {
            if (otherOccupationMap[t]?.[`${clashDay}-${clashPeriod}`]) {
              allCandTeachersFree = false;
              break;
            }
          }
          if (!allCandTeachersFree) continue;
        }

        // Found valid cross-day swap in clashing class!
        const updates = [
          {
            classId: otherClassId,
            day: clashDay,
            period: clashPeriod,
            subject: candidate.subject,
            teacher: candidate.teacher,
            assignedTeachers: candidate.assignedTeachers || (candidate.teacher ? candidate.teacher.split(',').map(t => t.trim()).filter(Boolean) : [])
          },
          {
            classId: otherClassId,
            day: candDay,
            period: candPeriod,
            subject: otherClashSlot.subject,
            teacher: otherClashSlot.teacher,
            assignedTeachers: otherClashSlot.assignedTeachers || (otherClashSlot.teacher ? otherClashSlot.teacher.split(',').map(t => t.trim()).filter(Boolean) : [])
          }
        ];

        return {
          success: true,
          method: 'cross-class-cross-day',
          updates,
          message: `🔧 Deep Resolve (Cross-Class Swap): Freed up ${clashingTeacher.toUpperCase()} in ${classId.toUpperCase()} at ${clashDay} Period ${clashPeriod}. In clashing class ${otherClassId.toUpperCase()}, swapped ${clashDay} Period ${clashPeriod} (${otherClashSlot.subject}) with ${candDay} Period ${candPeriod} (${candidate.subject})`
        };
      }

      // 2c. Cross-day swap in clashing class (different subjects)
      for (let candidateIdx = 0; candidateIdx < otherSchedule.length; candidateIdx++) {
        if (candidateIdx === otherClashIdx) continue;
        const candidate = otherSchedule[candidateIdx];
        if (candidate.day === clashDay) continue; // Same-day handled by 2a
        if (candidate.subject === otherClashSlot.subject) continue; // Same-subject handled by 2b

        const candDay = candidate.day;
        const candPeriod = parseInt(candidate.period);

        let allClashTeachersFree = true;
        for (const t of otherSlotTeachers) {
          if (otherOccupationMap[t]?.[`${candDay}-${candPeriod}`]) {
            allClashTeachersFree = false;
            break;
          }
        }
        if (!allClashTeachersFree) continue;

        if (candidate.teacher) {
          const candidateTeachers = candidate.teacher.split(',').map(t => t.trim().toLowerCase()).filter(Boolean);
          let allCandTeachersFree = true;
          for (const t of candidateTeachers) {
            if (otherOccupationMap[t]?.[`${clashDay}-${clashPeriod}`]) {
              allCandTeachersFree = false;
              break;
            }
          }
          if (!allCandTeachersFree) continue;
        }

        // Found valid cross-day swap in clashing class!
        const updates = [
          {
            classId: otherClassId,
            day: clashDay,
            period: clashPeriod,
            subject: candidate.subject,
            teacher: candidate.teacher,
            assignedTeachers: candidate.assignedTeachers || (candidate.teacher ? candidate.teacher.split(',').map(t => t.trim()).filter(Boolean) : [])
          },
          {
            classId: otherClassId,
            day: candDay,
            period: candPeriod,
            subject: otherClashSlot.subject,
            teacher: otherClashSlot.teacher,
            assignedTeachers: otherClashSlot.assignedTeachers || (otherClashSlot.teacher ? otherClashSlot.teacher.split(',').map(t => t.trim()).filter(Boolean) : [])
          }
        ];

        return {
          success: true,
          method: 'cross-class-cross-day-any',
          updates,
          message: `🔧 Deep Resolve (Cross-Class Swap - Different Subjects): Freed up ${clashingTeacher.toUpperCase()} in ${classId.toUpperCase()} at ${clashDay} Period ${clashPeriod}. In clashing class ${otherClassId.toUpperCase()}, swapped ${clashDay} Period ${clashPeriod} (${otherClashSlot.subject}) with ${candDay} Period ${candPeriod} (${candidate.subject})`
        };
      }
    }
  }

  return {
    success: false,
    message: `❌ Could not resolve: ${clashSlot.subject} (${clashDay} P${clashPeriod}) — ${clashingTeacher.toUpperCase()} clashes with ${otherClassId.toUpperCase()}`
  };
};

// Keep resolveSingleClash for backward compatibility / simple UI calls
export const resolveSingleClash = (classId, targetDay, targetPeriod, masterTimetable) => {
  const result = resolveClashDeep(classId, targetDay, targetPeriod, masterTimetable);
  if (result.success) {
    // Reconstruct updated schedule for classId
    const schedule = [...(masterTimetable[classId] || [])].map(s => ({ ...s }));
    result.updates.forEach(u => {
      if (u.classId === classId) {
        const slotIdx = schedule.findIndex(s => s.day === u.day && parseInt(s.period) === parseInt(u.period));
        if (slotIdx >= 0) {
          schedule[slotIdx] = {
            ...schedule[slotIdx],
            subject: u.subject,
            teacher: u.teacher,
            assignedTeachers: u.assignedTeachers
          };
        }
      }
    });
    return { schedule, success: true, message: result.message, updates: result.updates };
  }
  return { schedule: masterTimetable[classId] || [], success: false, message: result.message };
};

// ========================
// 8. RESOLVE ALL CLASHES (BULK) BY SWAPPING (DEEP RESOLVE)
// ========================
export const resolveClashes = (classId, masterTimetable) => {
  const currentTimetable = JSON.parse(JSON.stringify(masterTimetable));
  const log = [];
  const allUpdates = [];
  let resolved = 0;
  let unresolved = 0;

  // Detect all clashes first
  const initialClashes = detectClashes(classId, currentTimetable);

  for (const clash of initialClashes) {
    // Re-check if this slot still has a clash (might have been fixed by a prior swap in another class)
    const occupationMap = buildGlobalOccupationMap(currentTimetable, classId);
    const slotNow = currentTimetable[classId]?.find(s => s.day === clash.day && parseInt(s.period) === parseInt(clash.period));
    if (!slotNow || !slotNow.teacher) continue;
    const currentClash = hasClash(slotNow.teacher, clash.day, parseInt(clash.period), occupationMap);
    if (!currentClash) {
      resolved++;
      log.push(`✅ Pre-Resolved Clash in ${classId.toUpperCase()}: Clash at ${clash.day} Period ${clash.period} (${slotNow.subject}) was already resolved by a prior swap`);
      continue;
    }

    const result = resolveClashDeep(classId, clash.day, clash.period, currentTimetable);

    if (result.success) {
      // Apply updates to our local copy so subsequent steps see them
      result.updates.forEach(u => {
        const classSchedule = currentTimetable[u.classId] || [];
        const slotIdx = classSchedule.findIndex(s => s.day === u.day && parseInt(s.period) === parseInt(u.period));
        if (slotIdx >= 0) {
          classSchedule[slotIdx] = {
            ...classSchedule[slotIdx],
            subject: u.subject,
            teacher: u.teacher,
            assignedTeachers: u.assignedTeachers
          };
        }
        allUpdates.push(u);
      });
      resolved++;
      log.push(result.message);
    } else {
      unresolved++;
      log.push(result.message);
    }
  }

  return {
    updates: allUpdates,
    resolved,
    unresolved,
    totalClashes: initialClashes.length,
    log
  };
};
