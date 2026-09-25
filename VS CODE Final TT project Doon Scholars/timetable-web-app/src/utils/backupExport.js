// Single shape for JSON export -> import round-trip (Mastersheet + Navigation).
// Parsed values (not raw strings) so importBackup's parseVal is a no-op,
// plus dataEpoch/periodCount so the receiving sync server accepts it as a
// fresh full-state replace instead of rejecting it as stale.

const pick = (key) => {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null || raw === undefined || raw === '') return null;
    try {
      return JSON.parse(raw);
    } catch {
      return raw;
    }
  } catch {
    return null;
  }
};

export const buildBackupPayload = () => ({
  dataEpoch: Date.now(),
  periodCount: (() => {
    try {
      const n = parseInt(localStorage.getItem('timetablePeriodCount') || '9', 10);
      return n === 8 || n === 9 ? n : 9;
    } catch {
      return 9;
    }
  })(),
  timetables: pick('timetables'),
  teachers: pick('teachers') || pick('syncedTeachers'),
  addedTeachers: pick('addedTeachers'),
  deletedTeachers: pick('deletedTeachers'),
  deletedSubjects: pick('deletedSubjects'),
  teacherSubjectMap: pick('teacherSubjectMap'),
  loadMaster: pick('loadMaster'),
  masterClasses: pick('masterClasses'),
  teacherSlotUsage: pick('teacherSlotUsage'),
  substitutions: pick('substitutions'),
  absentTeachers: pick('absentTeachers'),
});

export const downloadBackup = (filename) => {
  const blob = new Blob([JSON.stringify(buildBackupPayload(), null, 2)], {
    type: 'application/json',
  });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
};
