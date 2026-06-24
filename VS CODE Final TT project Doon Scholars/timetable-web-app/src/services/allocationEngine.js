import { parseCompositeSubject } from './compositeSubjectEngine';
import { isTeacherAvailable } from './availabilityEngine';

export const autoAssignTeacher = (subject, classId, day, period, teacherSubjectMap, masterTimetable) => {
  if (!subject) return { teacher: '', status: 'empty', message: '' };

  const potentialTeachers = parseCompositeSubject(subject, classId, teacherSubjectMap);
  
  if (potentialTeachers.length === 0) {
    return {
      teacher: '',
      assignedTeachers: [],
      clashes: [],
      status: 'no_mapping',
      message: 'No teacher mapped for this subject'
    };
  }
  
  const assignedTeachers = [];
  const clashes = [];

  potentialTeachers.forEach(t => {
    const availability = isTeacherAvailable(t, day, period, masterTimetable);
    const hasClash = !availability.isFree && availability.clashClass !== classId;
    
    assignedTeachers.push({
      teacher: t,
      clash: hasClash,
      clashWith: hasClash ? `${availability.clashClass} P${period}` : null
    });

    if (hasClash) {
      clashes.push({ teacher: t, classId: availability.clashClass });
    }
  });
  
  const teacherString = assignedTeachers.map(at => at.teacher).join(',');

  if (clashes.length > 0) {
    // We still consider it a conflict, but ALL teachers are assigned
    return {
      teacher: teacherString,
      assignedTeachers,
      clashes,
      status: assignedTeachers.length === clashes.length ? 'full_conflict' : 'partial_conflict',
      message: `Assigned all. Clashes: ${clashes.map(c => `${c.teacher} busy in ${c.classId} P${period}`).join(', ')}`
    };
  } else {
    return {
      teacher: teacherString,
      assignedTeachers,
      clashes,
      status: 'success',
      message: `Auto-assigned: ${teacherString}`
    };
  }
};
