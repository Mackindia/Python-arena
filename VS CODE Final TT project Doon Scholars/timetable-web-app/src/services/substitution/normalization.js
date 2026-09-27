// services/substitution/normalization.js

export const normalizeTeacherId = (
  teacherString
) => {

  if (!teacherString) return ""

  return String(teacherString)
    .trim()
    .toUpperCase()
    .replace(/\(.*?\)/g, "")
    .trim()
}

export const normalizePeriod = (
  period
) => {

  if (!period) return ""

  return String(period)
    .replace("P", "")
    .trim()
}

export const normalizeClassId = (
  classId
) => {

  if (!classId) return ""

  return String(classId)
    .trim()
    .toLowerCase()
}

export const generateSlotId = (
  day,
  period,
  classId
) => {

  return `${String(day).trim()}-${normalizePeriod(period)}-${normalizeClassId(classId)}`
}

// Teachers who NEVER take another teacher's class (exempt from relief duty).
// If THEY are absent, other teachers still cover their periods.
// Single source shared by the auto engine and the manual substitute dropdown.
export const SUBSTITUTION_EXEMPT = ['AN', 'P', 'RN', 'DK']