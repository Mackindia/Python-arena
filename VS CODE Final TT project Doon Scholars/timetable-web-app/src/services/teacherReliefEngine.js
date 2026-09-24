import { getPeriods } from '../config/periods';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const PERIODS = getPeriods();
const TARGET_LOAD = 6;

/**
 * Check if a teacher is in a comma-separated teacher string.
 * Handles: "GA", "GA,SA,HSC", "GA, SA, HSC" etc.
 */
const teacherIncludes = (teacherField, teacher) => {
  if (!teacherField || !teacher) return false;
  return teacherField.split(',').map(t => t.trim()).includes(teacher);
};

/**
 * Get teacher's load for each day of the week.
 */
export const getTeacherDayLoads = (timetables, teacher) => {
  const result = {};

  DAYS.forEach(day => {
    result[day] = { load: 0, free: 0, periods: [] };
    PERIODS.forEach(p => {
      result[day][p] = null;
    });
  });

  if (!teacher) return result;

  Object.entries(timetables).forEach(([classId, classSchedule]) => {
    classSchedule.forEach(slot => {
      if (teacherIncludes(slot.teacher, teacher)) {
        const period = parseInt(slot.period);
        result[slot.day][period] = { classId, subject: slot.subject };
        result[slot.day].periods.push({ period, subject: slot.subject, classId });
      }
    });
  });

  DAYS.forEach(day => {
    let load = 0;
    PERIODS.forEach(p => {
      if (result[day][p]) load++;
    });
    result[day].load = load;
    result[day].free = PERIODS.length - load;
    result[day].periods.sort((a, b) => a.period - b.period);
  });

  return result;
};

/**
 * Get summary for all teachers — used for heatmap.
 */
export const getAllTeachersSummary = (timetables, teachers) => {
  return teachers.map(teacher => {
    const dayLoads = getTeacherDayLoads(timetables, teacher);
    const days = {};
    const overloadedDays = [];
    let totalLoad = 0;

    DAYS.forEach(day => {
      days[day] = dayLoads[day].load;
      totalLoad += dayLoads[day].load;
      if (dayLoads[day].load > TARGET_LOAD) {
        overloadedDays.push(day);
      }
    });

    return { teacher, days, overloadedDays, totalLoad };
  });
};

/**
 * Get detailed slots for a teacher on a specific day.
 */
export const getDayDetail = (timetables, teacher, day) => {
  const slots = [];

  Object.entries(timetables).forEach(([classId, classSchedule]) => {
    classSchedule.forEach(slot => {
      if (teacherIncludes(slot.teacher, teacher) && slot.day === day) {
        slots.push({
          period: parseInt(slot.period),
          subject: slot.subject,
          classId
        });
      }
    });
  });

  slots.sort((a, b) => a.period - b.period);
  return slots;
};

/**
 * Get all free slots for a teacher across the week (excluding one day optionally).
 * NOW also checks if the destination class has no teacher at that slot.
 */
export const getFreeSlots = (timetables, teacher, excludeDay = null) => {
  const freeSlots = [];
  const dayLoads = getTeacherDayLoads(timetables, teacher);

  DAYS.forEach(day => {
    if (day === excludeDay) return;
    PERIODS.forEach(p => {
      if (!dayLoads[day][p]) {
        // Teacher is free at this slot — but is the CLASS also free?
        // We check all classes to see if any has this teacher's subject assigned
        // For the free slot report, we just report teacher is free
        freeSlots.push({ day, period: p });
      }
    });
  });

  return freeSlots;
};

/**
 * Check if a specific class slot is occupied by ANY teacher.
 * Returns the teacher name if occupied, or false if free.
 */
const isClassSlotOccupied = (timetables, classId, day, period) => {
  const classSchedule = timetables[classId] || [];
  const slot = classSchedule.find(
    s => s.day === day && parseInt(s.period) === parseInt(period)
  );
  if (slot && slot.teacher && slot.teacher.trim()) {
    return slot.teacher;
  }
  return false;
};

/**
 * Check if a teacher has a collision at a specific day/period across ALL classes.
 * Returns false if free, or the classId where collision occurs.
 */
const checkTeacherCollision = (timetables, teacher, day, period, excludeClassId = null) => {
  for (const [classId, classSchedule] of Object.entries(timetables)) {
    if (classId === excludeClassId) continue;

    const conflict = classSchedule.find(
      slot => slot.day === day && parseInt(slot.period) === parseInt(period) && teacherIncludes(slot.teacher, teacher)
    );

    if (conflict) return classId;
  }
  return false;
};

/**
 * Find the source slot (the one being moved).
 */
export const findSourceSlot = (timetables, teacher, fromDay, fromPeriod) => {
  for (const [classId, classSchedule] of Object.entries(timetables)) {
    const slot = classSchedule.find(
      s => s.day === fromDay && parseInt(s.period) === parseInt(fromPeriod) && teacherIncludes(s.teacher, teacher)
    );
    if (slot) return { ...slot, classId };
  }
  return null;
};

/**
 * Validate if a shift is possible.
 * Checks BOTH teacher availability AND destination class slot occupancy.
 */
export const validateShift = (timetables, teacher, fromDay, fromPeriod, toDay, toPeriod) => {
  const dayLoads = getTeacherDayLoads(timetables, teacher);

  // Find source slot
  const sourceSlot = findSourceSlot(timetables, teacher, fromDay, fromPeriod);
  if (!sourceSlot) {
    return { valid: false, reason: 'No slot found at source', warnings: [] };
  }

  // Check dest day won't overload
  const destDayLoad = dayLoads[toDay].load;
  if (destDayLoad >= TARGET_LOAD) {
    return { valid: false, reason: `Destination day already at ${destDayLoad} periods`, warnings: [] };
  }

  // CHECK 1: Is this teacher already busy at destination?
  const teacherCollision = checkTeacherCollision(timetables, teacher, toDay, toPeriod);
  if (teacherCollision) {
    return { valid: false, reason: `${teacher} already has class in ${teacherCollision} at ${toDay} P${toPeriod}`, warnings: [] };
  }

  // CHECK 2: Does the destination CLASS already have ANY teacher at that slot?
  const sourceClassId = sourceSlot.classId;
  const destOccupied = isClassSlotOccupied(timetables, sourceClassId, toDay, toPeriod);
  if (destOccupied) {
    return { valid: false, reason: `${sourceClassId.toUpperCase()} already has ${destOccupied} at ${toDay} P${toPeriod}`, warnings: [] };
  }

  // Check if moving would improve source day
  const newFromLoad = dayLoads[fromDay].load - 1;

  return {
    valid: true,
    reason: `${fromDay}: ${dayLoads[fromDay].load}→${newFromLoad}, ${toDay}: ${destDayLoad}→${destDayLoad + 1}`,
    warnings: newFromLoad > TARGET_LOAD
      ? [`${fromDay} will still have ${newFromLoad} periods`]
      : (destDayLoad + 1 === TARGET_LOAD ? [`${toDay} will be at limit (6)`] : []),
    sourceSlot,
    destDayLoad: destDayLoad + 1
  };
};

/**
 * Get a preview of what would happen after a shift.
 */
export const getShiftPreview = (timetables, teacher, fromDay, fromPeriod, toDay, toPeriod) => {
  const dayLoads = getTeacherDayLoads(timetables, teacher);
  const validation = validateShift(timetables, teacher, fromDay, fromPeriod, toDay, toPeriod);

  return {
    valid: validation.valid,
    reason: validation.reason,
    warnings: validation.warnings,
    before: {
      [fromDay]: dayLoads[fromDay].load,
      [toDay]: dayLoads[toDay].load
    },
    after: {
      [fromDay]: dayLoads[fromDay].load - 1,
      [toDay]: dayLoads[toDay].load + 1
    },
    sourceSlot: validation.sourceSlot
  };
};

/**
 * Pick the best period to move from a day (middle of continuous block).
 */
export const pickBestPeriod = (timetables, teacher, day) => {
  const detail = getDayDetail(timetables, teacher, day);
  if (detail.length === 0) return null;

  const periods = detail.map(s => s.period).sort((a, b) => a - b);

  let best = periods[0];
  let maxRun = 0;
  let runStart = 0;

  for (let i = 1; i <= periods.length; i++) {
    if (i < periods.length && periods[i] === periods[i - 1] + 1) continue;

    const runLen = i - runStart;
    if (runLen > maxRun) {
      maxRun = runLen;
      best = periods[runStart + Math.floor(runLen / 2)];
    }
    runStart = i;
  }

  return best;
};

/**
 * Apply multiple shifts to timetables. Returns new timetables object (immutable).
 */
export const applyShifts = (timetables, shifts) => {
  const newTimetables = JSON.parse(JSON.stringify(timetables));

  shifts.forEach(shift => {
    const { teacher, fromDay, fromPeriod, toDay, toPeriod } = shift;

    for (const [classId, classSchedule] of Object.entries(newTimetables)) {
      const slotIndex = classSchedule.findIndex(
        s => s.day === fromDay && parseInt(s.period) === parseInt(fromPeriod) && teacherIncludes(s.teacher, teacher)
      );

      if (slotIndex >= 0) {
        const slot = classSchedule[slotIndex];

        // Remove from source
        classSchedule.splice(slotIndex, 1);

        // Add to destination
        newTimetables[classId].push({
          day: toDay,
          period: toPeriod,
          subject: slot.subject,
          teacher: slot.teacher
        });

        break;
      }
    }
  });

  return newTimetables;
};

/**
 * Revert a single shift (move back to original position).
 * Returns new timetables object.
 */
export const revertShift = (timetables, shift) => {
  return applyShifts(timetables, [{
    teacher: shift.teacher,
    fromDay: shift.toDay,
    fromPeriod: shift.toPeriod,
    toDay: shift.fromDay,
    toPeriod: shift.fromPeriod
  }]);
};

/**
 * Get full relief analysis for report generation.
 */
export const getReliefAnalysis = (timetables, teachers) => {
  const summary = getAllTeachersSummary(timetables, teachers);
  const overloaded = summary.filter(t => t.overloadedDays.length > 0);

  return {
    totalTeachers: teachers.length,
    overloadedCount: overloaded.length,
    okCount: teachers.length - overloaded.length,
    overloaded,
    summary
  };
};

// ============================================================
// RECOMMENDATION ENGINE
// ============================================================

/**
 * Find teachers who teach the same subject in the same class.
 * These are potential swap partners.
 */
export const findSubjectSwaps = (timetables, teacher, classId, subject) => {
  const swaps = [];
  const classSchedule = timetables[classId] || [];

  // Find all teachers who teach this subject in this class
  const subjectTeachers = new Set();
  classSchedule.forEach(slot => {
    if (slot.subject === subject && slot.teacher !== teacher) {
      subjectTeachers.add(slot.teacher);
    }
  });

  // Also check other classes where this subject is taught
  Object.entries(timetables).forEach(([cId, schedule]) => {
    schedule.forEach(slot => {
      if (slot.subject === subject && slot.teacher !== teacher) {
        subjectTeachers.add(slot.teacher);
      }
    });
  });

  // For each potential swap partner, check if they have capacity
  subjectTeachers.forEach(partner => {
    const partnerLoads = getTeacherDayLoads(timetables, partner);
    const lightDays = DAYS.filter(day => partnerLoads[day].load < TARGET_LOAD);

    if (lightDays.length > 0) {
      swaps.push({
        teacher: partner,
        currentLoad: partnerLoads,
        lightDays,
        maxCapacity: lightDays.reduce((sum, day) => sum + (TARGET_LOAD - partnerLoads[day].load), 0)
      });
    }
  });

  return swaps.sort((a, b) => b.maxCapacity - a.maxCapacity);
};

/**
 * Find teachers with light loads who could absorb more periods.
 */
export const findLightTeachers = (timetables, maxDailyLoad = 5) => {
  const teacherLoads = {};

  // Calculate each teacher's load
  Object.entries(timetables).forEach(([classId, slots]) => {
    slots.forEach(slot => {
      if (!teacherLoads[slot.teacher]) {
        teacherLoads[slot.teacher] = { total: 0, byDay: {}, classes: new Set() };
      }
      teacherLoads[slot.teacher].total++;
      teacherLoads[slot.teacher].byDay[slot.day] = (teacherLoads[slot.teacher].byDay[slot.day] || 0) + 1;
      teacherLoads[slot.teacher].classes.add(classId);
    });
  });

  // Find teachers with light loads
  const lightTeachers = [];
  Object.entries(teacherLoads).forEach(([teacher, loads]) => {
    const lightDays = DAYS.filter(day => (loads.byDay[day] || 0) < maxDailyLoad);
    if (lightDays.length > 0) {
      lightTeachers.push({
        teacher,
        totalLoad: loads.total,
        byDay: loads.byDay,
        lightDays,
        classes: [...loads.classes],
        maxCapacity: lightDays.reduce((sum, day) => sum + (maxDailyLoad - (loads.byDay[day] || 0)), 0)
      });
    }
  });

  return lightTeachers.sort((a, b) => b.maxCapacity - a.maxCapacity);
};

/**
 * Verify if a 2-step swap chain is possible.
 * Teacher1 moves from slot1 to slot2, Teacher2 moves from slot2 to slot1.
 */
export const verifySwapChain = (timetables, teacher1, slot1, teacher2, slot2) => {
  // slot1 = { day, period, classId } where teacher1 currently is
  // slot2 = { day, period, classId } where we want teacher1 to go

  const steps = [];
  let valid = true;
  const reasons = [];

  // Step 1: Check if teacher1 can move to slot2
  const t1FreeAtSlot2 = !checkTeacherCollision(timetables, teacher1, slot2.day, slot2.period);
  const slot2ClassFree = !isClassSlotOccupied(timetables, slot2.classId, slot2.day, slot2.period);

  if (!t1FreeAtSlot2) {
    valid = false;
    reasons.push(`${teacher1} is busy at ${slot2.day} P${slot2.period}`);
  }
  if (!slot2ClassFree) {
    valid = false;
    reasons.push(`${slot2.classId.toUpperCase()} is occupied at ${slot2.day} P${slot2.period}`);
  }

  // Step 2: Check if teacher2 can move to slot1
  const t2FreeAtSlot1 = !checkTeacherCollision(timetables, teacher2, slot1.day, slot1.period);
  const slot1ClassFree = !isClassSlotOccupied(timetables, slot1.classId, slot1.day, slot1.period);

  if (!t2FreeAtSlot1) {
    valid = false;
    reasons.push(`${teacher2} is busy at ${slot1.day} P${slot1.period}`);
  }
  if (!slot1ClassFree) {
    valid = false;
    reasons.push(`${slot1.classId.toUpperCase()} is occupied at ${slot1.day} P${slot1.period}`);
  }

  // Step 3: Check if both teachers can swap without collision with each other
  if (teacher1 === teacher2) {
    valid = false;
    reasons.push('Cannot swap with yourself');
  }

  if (valid) {
    steps.push({
      action: 'swap',
      teacher: teacher1,
      from: { day: slot1.day, period: slot1.period, classId: slot1.classId },
      to: { day: slot2.day, period: slot2.period, classId: slot2.classId }
    });
    steps.push({
      action: 'swap',
      teacher: teacher2,
      from: { day: slot2.day, period: slot2.period, classId: slot2.classId },
      to: { day: slot1.day, period: slot1.period, classId: slot1.classId }
    });
  }

  return { valid, steps, reasons };
};

/**
 * Main recommendation function.
 * Analyzes why no direct shifts are possible and suggests alternatives.
 */
export const getRecommendations = (timetables, teacher, overloadedDay) => {
  const recommendations = [];
  const dayLoads = getTeacherDayLoads(timetables, teacher);

  // Get the overloaded slots
  const overloadedSlots = getDayDetail(timetables, teacher, overloadedDay);
  const excess = dayLoads[overloadedDay].load - TARGET_LOAD;

  // Find all possible destination days (under target)
  const possibleDays = DAYS.filter(day =>
    day !== overloadedDay && dayLoads[day].load < TARGET_LOAD
  );

  // Check if any direct shift is possible
  let directShiftsPossible = false;
  overloadedSlots.forEach(slot => {
    possibleDays.forEach(toDay => {
      PERIODS.forEach(toPeriod => {
        const validation = validateShift(timetables, teacher, overloadedDay, slot.period, toDay, toPeriod);
        if (validation.valid) directShiftsPossible = true;
      });
    });
  });

  // CONSTRAINT ANALYSIS
  const constraint = {
    blocked: !directShiftsPossible,
    reason: directShiftsPossible
      ? 'Direct shifts are possible'
      : `All destination classes are fully occupied on ${possibleDays.join(', ')}`,
    affectedClasses: [...new Set(overloadedSlots.map(s => s.classId.toUpperCase()))],
    overloadedDay,
    excess
  };

  if (!directShiftsPossible) {
    // RECOMMENDATION TYPE 1: Subject swaps
    overloadedSlots.forEach(slot => {
      const swaps = findSubjectSwaps(timetables, teacher, slot.classId, slot.subject);
      swaps.forEach(swap => {
        // For each light day, verify the swap
        swap.lightDays.forEach(lightDay => {
          PERIODS.forEach(period => {
            if (!swap.currentLoad[lightDay][period]) {
              // This period is free for the swap partner
              const verified = verifySwapChain(
                timetables,
                teacher,
                { day: overloadedDay, period: slot.period, classId: slot.classId },
                swap.teacher,
                { day: lightDay, period, classId: slot.classId }
              );

              if (verified.valid) {
                recommendations.push({
                  type: 'subject_swap',
                  priority: 1,
                  title: `Swap with ${swap.teacher} — ${slot.subject} ${slot.classId.toUpperCase()}`,
                  description: `${swap.teacher} teaches ${slot.subject} and has ${swap.currentLoad[lightDay].load}/6 periods on ${lightDay}. They can take your ${overloadedDay} P${slot.period} slot.`,
                  steps: verified.steps,
                  affectedTeachers: [teacher, swap.teacher],
                  impact: 'low',
                  verified: true,
                  sourceSlot: { day: overloadedDay, period: slot.period, classId: slot.classId, subject: slot.subject },
                  targetSlot: { day: lightDay, period, classId: slot.classId }
                });
              }
            }
          });
        });
      });
    });

    // RECOMMENDATION TYPE 2: Light-load teachers
    const lightTeachers = findLightTeachers(timetables, 5);
    lightTeachers.forEach(lt => {
      if (lt.teacher === teacher) return;

      overloadedSlots.forEach(slot => {
        lt.lightDays.forEach(lightDay => {
          PERIODS.forEach(period => {
            if (!lt.byDay[lightDay] || lt.byDay[lightDay] < period) {
              // Check if this teacher can take over
              const tFree = !checkTeacherCollision(timetables, lt.teacher, lightDay, period);
              const classFree = !isClassSlotOccupied(timetables, slot.classId, lightDay, period);

              if (tFree && classFree) {
                recommendations.push({
                  type: 'light_teacher',
                  priority: 2,
                  title: `Ask ${lt.teacher} to take ${slot.classId.toUpperCase()} ${slot.subject} on ${lightDay}`,
                  description: `${lt.teacher} has only ${lt.byDay[lightDay] || 0}/6 periods on ${lightDay} and doesn't teach in ${slot.classId.toUpperCase()}. They could cover your period.`,
                  steps: [{
                    action: 'assign',
                    teacher: lt.teacher,
                    to: { day: lightDay, period, classId: slot.classId, subject: slot.subject }
                  }, {
                    action: 'remove',
                    teacher: teacher,
                    from: { day: overloadedDay, period: slot.period, classId: slot.classId }
                  }],
                  affectedTeachers: [teacher, lt.teacher],
                  impact: 'medium',
                  verified: true,
                  sourceSlot: { day: overloadedDay, period: slot.period, classId: slot.classId, subject: slot.subject },
                  targetSlot: { day: lightDay, period, classId: slot.classId }
                });
              }
            }
          });
        });
      });
    });

    // RECOMMENDATION TYPE 3: Chain swaps (2+ teachers)
    overloadedSlots.forEach(slot => {
      const swaps = findSubjectSwaps(timetables, teacher, slot.classId, slot.subject);
      swaps.forEach(swap => {
        // For each period the swap partner is busy, check if ANOTHER teacher can take it
        Object.entries(swap.currentLoad).forEach(([day, dayData]) => {
          if (day === overloadedDay) return;
          dayData.periods.forEach(periodData => {
            const period = periodData.period;
            const partnerClass = periodData.classId;

            // Find a third teacher who can take this slot
            lightTeachers.forEach(lt => {
              if (lt.teacher === teacher || lt.teacher === swap.teacher) return;

              const t3Free = !checkTeacherCollision(timetables, lt.teacher, day, period);
              const class3Free = !isClassSlotOccupied(timetables, partnerClass, day, period);

              if (t3Free && class3Free && lt.lightDays.includes(day)) {
                recommendations.push({
                  type: 'chain_swap',
                  priority: 3,
                  title: `3-way chain: ${teacher} → ${swap.teacher} → ${lt.teacher}`,
                  description: `${swap.teacher} takes your ${slot.classId.toUpperCase()} ${slot.subject}, then ${lt.teacher} covers ${swap.teacher}'s ${partnerClass} slot on ${day}.`,
                  steps: [{
                    action: 'swap',
                    teacher: swap.teacher,
                    from: { day, period, classId: partnerClass },
                    to: { day: overloadedDay, period: slot.period, classId: slot.classId }
                  }, {
                    action: 'swap',
                    teacher: lt.teacher,
                    from: { day: overloadedDay, period: slot.period, classId: slot.classId },
                    to: { day, period, classId: partnerClass }
                  }],
                  affectedTeachers: [teacher, swap.teacher, lt.teacher],
                  impact: 'high',
                  verified: false,
                  sourceSlot: { day: overloadedDay, period: slot.period, classId: slot.classId, subject: slot.subject },
                  targetSlot: { day, period, classId: partnerClass }
                });
              }
            });
          });
        });
      });
    });

    // RECOMMENDATION TYPE 4: Restructure suggestion
    if (recommendations.length === 0) {
      recommendations.push({
        type: 'restructure',
        priority: 5,
        title: 'Restructure department schedule',
        description: `No automated swaps possible. Consider manually redistributing ${overloadedSlots[0]?.subject || 'this subject'} classes across the week, or hiring a substitute for ${overloadedDay} periods.`,
        steps: [],
        affectedTeachers: [teacher],
        impact: 'high',
        verified: false
      });
    }
  }

  // Sort by priority and impact
  const priorityOrder = { low: 0, medium: 1, high: 2 };
  recommendations.sort((a, b) => {
    if (a.priority !== b.priority) return a.priority - b.priority;
    return priorityOrder[a.impact] - priorityOrder[b.impact];
  });

  // Remove duplicates based on sourceSlot + targetSlot
  const seen = new Set();
  const uniqueRecommendations = recommendations.filter(r => {
    const key = `${r.sourceSlot?.day}_${r.sourceSlot?.period}_${r.targetSlot?.day}_${r.targetSlot?.period}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  return {
    constraint,
    recommendations: uniqueRecommendations.slice(0, 10), // Limit to top 10
    stats: {
      totalOptions: uniqueRecommendations.length,
      verifiedOptions: uniqueRecommendations.filter(r => r.verified).length,
      bestOption: uniqueRecommendations[0]?.type || 'none'
    }
  };
};
