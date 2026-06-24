import { checkTeacherCollision } from './collisionEngine';

export const isTeacherAvailable = (teacher, day, period, masterTimetable, currentClassId = null) => {
  if (!teacher) return true;
  // If checkTeacherCollision returns a classId, they are BUSY. Otherwise FREE.
  const collisionClass = checkTeacherCollision(teacher, day, period, currentClassId, masterTimetable);
  return {
    isFree: !collisionClass,
    clashClass: collisionClass || null
  };
};
