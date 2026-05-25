import { normalizeTeacherId, normalizePeriod } from '../substitution/normalization.js';

export const buildTeacherScheduleMap = (timetables) => {
  const map = {};

  Object.entries(timetables || {}).forEach(([classId, schedule]) => {
    schedule.forEach(slot => {
      if (!slot.teacher) return;

      const teacherId = normalizeTeacherId(slot.teacher);

      if (!map[teacherId]) map[teacherId] = {};
      if (!map[teacherId][slot.day]) map[teacherId][slot.day] = {};

      map[teacherId][slot.day][normalizePeriod(slot.period)] = {
        classId,
        subject: slot.subject || "",
        originalTeacher: slot.teacher
      };
    });
  });

  return map;
};
