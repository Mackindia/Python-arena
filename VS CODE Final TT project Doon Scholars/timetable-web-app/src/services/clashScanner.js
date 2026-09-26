// =============================================
// GLOBAL CLASH SCANNER
// One-pass scan over ALL class timetables.
// A "clash" = one teacher allotted to 2+ classes in the same day+period.
// Every clash is reported at once (no first-match short-circuit), so a
// clash hidden inside a composite/combination slot is never masked by
// another clash in the same slot.
// =============================================

const DAYS_ORDER = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const KEPT_STORAGE_KEY = 'keptClashKeys';

const lower = (t) => (t || '').trim().toLowerCase();
const periodOf = (p) => parseInt(p, 10);

// Unique id for one atomic clash (one teacher double-booked in a cell).
export const clashId = (day, period, teacher, classIds) =>
  `${day}|${period}|${lower(teacher)}|${[...classIds].sort().join(',')}`;

// Scan every class timetable and return ALL teacher double-bookings.
// Returns: [{ id, day, period, teacher, teacherKey, classIds, slots: [{classId, subject}] }]
export const scanAllClashes = (masterTimetable) => {
  const occupancy = {}; // "day|period|teacherKey" -> [{classId, subject}]

  Object.entries(masterTimetable || {}).forEach(([classId, schedule]) => {
    (schedule || []).forEach((slot) => {
      if (!slot || !slot.day || !slot.period || !slot.teacher) return;
      const p = periodOf(slot.period);
      if (Number.isNaN(p)) return;

      slot.teacher
        .split(',')
        .map(lower)
        .filter(Boolean)
        .forEach((t) => {
          const bucketKey = `${slot.day}|${p}|${t}`;
          if (!occupancy[bucketKey]) occupancy[bucketKey] = [];
          // one entry per class even if duplicate slots exist
          if (!occupancy[bucketKey].some((e) => e.classId === classId)) {
            occupancy[bucketKey].push({ classId, subject: slot.subject || '' });
          }
        });
    });
  });

  const clashes = [];
  Object.entries(occupancy).forEach(([bucketKey, slots]) => {
    if (slots.length < 2) return; // single class = no clash
    const [day, periodStr, teacherKey] = bucketKey.split('|');
    const period = parseInt(periodStr, 10);
    const classIds = slots.map((s) => s.classId);
    clashes.push({
      id: clashId(day, period, teacherKey, classIds),
      day,
      period,
      teacherKey,
      teacher: teacherKey.toUpperCase(),
      classIds,
      slots,
    });
  });

  clashes.sort((a, b) => {
    const d = DAYS_ORDER.indexOf(a.day) - DAYS_ORDER.indexOf(b.day);
    if (d !== 0) return d;
    if (a.period !== b.period) return a.period - b.period;
    return a.teacherKey.localeCompare(b.teacherKey);
  });

  return clashes;
};

// Clashes involving one class, grouped per conflicting slot so a composite
// subject shows ALL its clashing teachers in a single row.
// Returns: [{ day, period, subject, allTeachers, isComposite,
//             clashClasses, entries: [{ teacher, id }] }]
export const getClassClashRows = (allClashes, masterTimetable, classId) => {
  if (!classId) return [];
  const schedule = (masterTimetable || {})[classId] || [];
  const grouped = {};

  allClashes
    .filter((c) => c.classIds.includes(classId))
    .forEach((c) => {
      const slot = schedule.find(
        (s) => s.day === c.day && periodOf(s.period) === c.period
      );
      const otherClasses = c.classIds.filter((x) => x !== classId);
      const groupKey = `${c.day}|${c.period}|${[...otherClasses].sort().join(',')}`;

      if (!grouped[groupKey]) {
        const slotTeachers = slot?.teacher
          ? slot.teacher.split(',').map((t) => t.trim()).filter(Boolean)
          : [];
        grouped[groupKey] = {
          day: c.day,
          period: c.period,
          subject: slot?.subject || '',
          allTeachers: slotTeachers,
          isComposite: slotTeachers.length > 1,
          clashClasses: otherClasses,
          entries: [],
        };
      }
      grouped[groupKey].entries.push({ teacher: c.teacher, id: c.id });
    });

  return Object.values(grouped);
};

// All clashes for one teacher (used by Teacher Timetable).
export const getTeacherClashes = (allClashes, teacherId) => {
  const key = lower(teacherId);
  if (!key) return [];
  return allClashes.filter((c) => c.teacherKey === key);
};

// ---- "Keep" persistence (intentional combined classes) ----
export const loadKeptClashes = () => {
  try {
    const raw = localStorage.getItem(KEPT_STORAGE_KEY);
    const list = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
};

export const saveKeptClashes = (list) => {
  try {
    localStorage.setItem(KEPT_STORAGE_KEY, JSON.stringify(list));
  } catch {
    // storage unavailable — kept marks stay in memory for this session
  }
};

export const keepClashes = (kept, ids) => [...new Set([...kept, ...ids])];

export const unkeepClashes = (kept, ids) =>
  kept.filter((id) => !ids.includes(id));
