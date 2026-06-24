export const isTeacherEligible = (teacher, period, dayName, dailyAbsent, teacherUsage, currentSubs) => {
  // 1. Teacher absent -> blocked
  if (dailyAbsent.includes(teacher)) return false;
  
  // 2. Teacher busy same period -> blocked
  if (teacherUsage[teacher]?.[dayName]?.[period] > 0) return false;
  
  // 3. Already substituting in same period -> blocked
  if (currentSubs.some(s => s.period === period && s.substituteTeacher === teacher)) return false;
  
  // 4. Calculate total load for the day
  let baseLoad = 0;
  const usage = teacherUsage[teacher]?.[dayName];
  if (usage) baseLoad = Object.values(usage).reduce((sum, count) => sum + count, 0);
  const extraLoad = currentSubs.filter(s => s.substituteTeacher === teacher).length;
  const totalLoad = baseLoad + extraLoad;
  
  // 5. Already 7 periods -> blocked
  if (totalLoad >= 7) return false;
  
  return true; // Eligible
};
