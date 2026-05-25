export const buildTeacherUsageMap = (teacherScheduleMap) => {
  const usage = {};
  
  Object.entries(teacherScheduleMap || {}).forEach(([teacherId, dayMap]) => {
    usage[teacherId] = {};
    Object.entries(dayMap || {}).forEach(([day, slots]) => {
      usage[teacherId][day] = {};
      Object.entries(slots || {}).forEach(([period]) => {
         // Simply mark as occupied
         usage[teacherId][day][period] = true;
      });
    });
  });
  
  return usage;
};
