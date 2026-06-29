import { normalizeTeacherId, normalizePeriod } from '../substitution/normalization.js';

export const buildTeacherScheduleMap = (timetables) => {
  const map = {};

  Object.entries(timetables || {}).forEach(([classId, schedule]) => {
    schedule.forEach(slot => {
      if (!slot.teacher) return;

      // Normalize all teacher names to uppercase for consistent matching
      const currentTeachers = slot.teacher.split(',').map(t => t.trim().toUpperCase()).filter(Boolean);
      
      currentTeachers.forEach(tStr => {
        const teacherId = normalizeTeacherId(tStr);

        if (!map[teacherId]) map[teacherId] = {};
        if (!map[teacherId][slot.day]) map[teacherId][slot.day] = {};

        map[teacherId][slot.day][normalizePeriod(slot.period)] = {
          classId,
          subject: slot.subject || "",
          originalTeacher: slot.teacher
        };
      });
    });
  });

  return map;
};
