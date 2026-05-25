import { checkTeacherCollision } from './collisionEngine';

export const isTeacherAvailable = (teacher, day, period, masterTimetable) => {
  return !checkTeacherCollision(teacher, day, period, null, masterTimetable);
};
