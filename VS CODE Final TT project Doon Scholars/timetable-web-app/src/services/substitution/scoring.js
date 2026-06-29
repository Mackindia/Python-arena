export const calculateTeacherScore = (teacher, subjectToSubstitute, period, dayName, teacherUsage, currentSubs) => {
  const { normalizeTeacherId, normalizePeriod } = require('./normalization');
  const normalizedTeacher = normalizeTeacherId(teacher);
  const normalizedPeriod = normalizePeriod(period);
  
  let score = 0;
  
  let baseLoad = 0;
  const usage = teacherUsage[normalizedTeacher]?.[dayName];
  if (usage) baseLoad = Object.values(usage).reduce((sum, count) => sum + count, 0);
  const extraLoad = currentSubs.filter(s => normalizeTeacherId(s.substituteTeacher) === normalizedTeacher).length;
  const currentLoad = baseLoad + extraLoad;
  
  // Scoring formula (Best score wins)
  
  // 1. Workload balancing: Heavy penalty for higher current load (-10 per class)
  score += (currentLoad * -10);
  
  // 2. Free periods preservation: small boost for remaining free periods
  const freePeriods = 8 - currentLoad;
  score += (freePeriods * 2);
  
  // Note: Subject matching preference and consecutive overload can be added here
  // once subject-to-teacher mapping is more rigidly defined in the backend.
  
  return { score, currentLoad };
};
