import { getMappedTeachers } from './mappingEngine';
import { getTeacherCollisions } from './collisionEngine';

export const autoAssignTeacher = (subject, classId, day, period, teacherSubjectMap, masterTimetable) => {
  if (!subject) return { teacher: '', status: 'empty', message: '' };

  const potentialTeachers = getMappedTeachers(subject, classId, teacherSubjectMap);
  
  if (potentialTeachers.length === 0) {
    return {
      teacher: '',
      status: 'no_mapping',
      message: 'No teacher mapped for this subject in this class'
    };
  }
  
  const collisions = getTeacherCollisions(potentialTeachers, day, period, classId, masterTimetable);
  const busyTeachers = collisions.map(c => c.teacher);
  const availableTeachers = potentialTeachers.filter(t => !busyTeachers.includes(t));
  
  if (availableTeachers.length > 0) {
    const selectedTeacher = availableTeachers[0];
    if (busyTeachers.length > 0) {
      return {
        teacher: selectedTeacher,
        status: 'partial_conflict',
        message: `Assigned: ${selectedTeacher}. Skipped (Busy): ${collisions.map(c => `${c.teacher} in ${c.classId}`).join(', ')}`
      };
    } else {
      return {
        teacher: selectedTeacher,
        status: 'success',
        message: `Auto-assigned: ${selectedTeacher}`
      };
    }
  } else {
    return {
      teacher: '',
      status: 'full_conflict',
      message: `No teacher available! Busy: ${collisions.map(c => `${c.teacher} in ${c.classId}`).join(', ')}`
    };
  }
};
