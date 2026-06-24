export const generateTeacherUsageGrid = (masterTimetable, teachersList) => {
  const usage = {};
  
  // Initialize grid
  teachersList.forEach(teacher => {
    usage[teacher] = {};
    ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].forEach(day => {
      usage[teacher][day] = {};
      for (let period = 1; period <= 8; period++) {
        usage[teacher][day][period] = 0;
      }
    });
  });
  
  // Fill grid
  Object.entries(masterTimetable).forEach(([classId, schedule]) => {
    schedule.forEach(slot => {
      if (slot.teacher && slot.teacher.trim()) {
        const assignedTeachers = slot.teacher.split(',').map(t => t.trim());
        assignedTeachers.forEach(t => {
          if (usage[t] && usage[t][slot.day] && slot.period) {
            usage[t][slot.day][slot.period]++;
          }
        });
      }
    });
  });
  
  return usage;
};

export const generateTeacherTimetable = (masterTimetable, teacherId) => {
  if (!teacherId) return [];
  const schedule = [];
  const searchId = teacherId.toLowerCase();
  
  Object.entries(masterTimetable).forEach(([classId, slots]) => {
    slots.forEach(slot => {
      if (slot.teacher) {
        const assignedTeachers = slot.teacher.split(',').map(t => t.trim().toLowerCase());
        if (assignedTeachers.includes(searchId)) {
          schedule.push({ ...slot, classId });
        }
      }
    });
  });
  return schedule;
};
