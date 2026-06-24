export const calculateTeacherScore = (teacher, subjectToSubstitute, period, dayName, teacherUsage, currentSubs) => {
  let score = 0;
  
  let baseLoad = 0;
  const usage = teacherUsage[teacher]?.[dayName];
  if (usage) baseLoad = Object.values(usage).reduce((sum, count) => sum + count, 0);
  const extraLoad = currentSubs.filter(s => s.substituteTeacher === teacher).length;
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
