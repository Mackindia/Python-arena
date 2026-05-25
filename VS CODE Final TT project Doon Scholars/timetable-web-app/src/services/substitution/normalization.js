// services/substitution/normalization.js

export const normalizeTeacherId = (
  teacherString
) => {

  if (!teacherString) return ""

  return String(teacherString)
    .trim()
    .toUpperCase()
    .replace(/\(.*?\)/g, "")
    .split(",")[0]
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