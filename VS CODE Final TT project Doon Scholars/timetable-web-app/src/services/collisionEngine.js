export const checkTeacherCollision = (teacher, day, period, currentClassId, masterTimetable) => {
  if (!teacher) return false;
  const searchTeacher = teacher.trim().toLowerCase();
  
  for (const [classId, schedule] of Object.entries(masterTimetable)) {
    if (classId === currentClassId) continue;
    
    const conflictSlot = schedule.find(
      slot => slot.day === day && parseInt(slot.period) === parseInt(period)
    );
    
    if (conflictSlot && conflictSlot.teacher) {
      const conflictTeachers = conflictSlot.teacher.split(',').map(t => t.trim().toLowerCase()).filter(Boolean);
      if (conflictTeachers.includes(searchTeacher)) {
        return classId; // Found a collision!
      }
    }
  }
  return false;
};

// Check if a specific teacher array has any collisions
export const getTeacherCollisions = (teachers, day, period, currentClassId, masterTimetable) => {
  const collisions = [];
  teachers.forEach(t => {
    const collisionClass = checkTeacherCollision(t, day, period, currentClassId, masterTimetable);
    if (collisionClass) {
      collisions.push({ teacher: t, classId: collisionClass });
    }
  });
  return collisions;
};
