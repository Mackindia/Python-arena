export const isTeacherEligible = (teacher, period, dayName, dailyAbsent, teacherUsage, currentSubs) => {
  const { normalizeTeacherId, normalizePeriod } = require('./normalization');
  const normalizedTeacher = normalizeTeacherId(teacher);
  const normalizedPeriod = normalizePeriod(period);

  // 1. Teacher absent -> blocked
  const normalizedAbsent = dailyAbsent.map(t => normalizeTeacherId(t));
  if (normalizedAbsent.includes(normalizedTeacher)) return false;
  
  // 2. Teacher busy same period -> blocked
  if (teacherUsage[normalizedTeacher]?.[dayName]?.[normalizedPeriod] > 0) return false;
  
  // 3. Already substituting in same period -> blocked
  if (currentSubs.some(s => normalizePeriod(s.period) === normalizedPeriod && normalizeTeacherId(s.substituteTeacher) === normalizedTeacher)) return false;
  
  // 4. Calculate total load for the day
  let baseLoad = 0;
  const usage = teacherUsage[normalizedTeacher]?.[dayName];
  if (usage) baseLoad = Object.values(usage).reduce((sum, count) => sum + count, 0);
  const extraLoad = currentSubs.filter(s => normalizeTeacherId(s.substituteTeacher) === normalizedTeacher).length;
  const totalLoad = baseLoad + extraLoad;
  
  // 5. Already 7 periods -> blocked
  if (totalLoad >= 7) return false;
  
  return true; // Eligible
};
