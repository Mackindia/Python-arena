// services/substitution/engine.js

import {
  normalizeTeacherId,
  normalizePeriod,
  normalizeClassId,
  generateSlotId
} from "./normalization"

export const generateAllSubstitutions = (

  absentTeachers,
  teacherScheduleMap,
  teachers,
  teacherUsage,
  selectedDayName

) => {

  const substitutions = []

  const normalizedAbsentTeachers =
    absentTeachers.map(t =>
      normalizeTeacherId(t)
    )

  // ──────────────────────────────────────────────────────────────────────
  // FIX: Build assignedMap from teacherScheduleMap (timetable truth),
  // NOT from the teachers array. The teachers array may be stale or
  // missing entries. teacherScheduleMap is built from actual timetable
  // data and is the single source of truth for which teachers exist.
  // ──────────────────────────────────────────────────────────────────────
  const assignedMap = {}

  Object.keys(teacherScheduleMap || {}).forEach(tId => {
    const normalized = normalizeTeacherId(tId)
    assignedMap[normalized] = []
  })

  // Also add any teachers from the teachers array that aren't in schedule map
  // (they may have been added but not yet assigned to a slot)
  teachers.forEach(t => {
    const tId = normalizeTeacherId(t)
    if (!assignedMap[tId]) {
      assignedMap[tId] = []
    }
  })

  Object.entries(
    teacherScheduleMap || {}
  ).forEach(([teacherId, dayMap]) => {

    const normalizedTeacherId =
      normalizeTeacherId(teacherId)

    // skip teachers who are NOT absent
    if (
      !normalizedAbsentTeachers.includes(
        normalizedTeacherId
      )
    ) {
      return
    }

    const daySchedule =
      dayMap?.[selectedDayName] || {}

    Object.entries(
      daySchedule
    ).forEach(([period, slot]) => {

      const normalizedPeriod =
        normalizePeriod(period)

      const availableTeachers =

        // ──────────────────────────────────────────────────────────────
        // FIX: Build candidate list from teacherScheduleMap keys
        // (actual timetable teachers) merged with teachers array.
        // This ensures newly renamed teachers are eligible even if
        // the teachers array hasn't fully synced yet.
        // ──────────────────────────────────────────────────────────────
        [...new Set([
          ...Object.keys(teacherScheduleMap || {}).map(k => normalizeTeacherId(k)),
          ...teachers.map(t => normalizeTeacherId(t))
        ])]
          .map(tId => {
            // Find the raw name from teachers array or teacherScheduleMap
            const rawFromTeachers = teachers.find(t => normalizeTeacherId(t) === tId)
            const rawFromMap = Object.keys(teacherScheduleMap || {}).find(k => normalizeTeacherId(k) === tId)
            return {
              raw: rawFromTeachers || rawFromMap || tId,
              id: tId
            }
          })

          // remove absent teachers
          .filter(t =>
            !normalizedAbsentTeachers.includes(
              t.id
            )
          )

          // teacher free this period
          .filter(t => {

            const usage =
              teacherUsage?.[
                t.id
              ]?.[
                selectedDayName
              ] || {}

            const occupiedPeriods =

              Object.entries(usage)

                .filter(([_, value]) =>
                  value
                )

                .map(([p]) =>
                  normalizePeriod(p)
                )

            return !occupiedPeriods.includes(
              normalizedPeriod
            )
          })

          // prevent duplicate substitute
          .filter(t => {

            return !(assignedMap[t.id] || []).includes(
              normalizedPeriod
            )
          })

          // exempt from substitution duty
          .filter(t => !['AN', 'P', 'RN'].includes(t.id))

          // max 3 arrangements AND total periods < 8
          .filter(t => {
            const usage =
              teacherUsage?.[
                t.id
              ]?.[
                selectedDayName
              ] || {}

            const baseLoad =
              Object.entries(usage)
                .filter(([_, value]) =>
                  value
                ).length

            const extraLoad =
              (assignedMap[t.id] || []).length

            return extraLoad < 3 && (baseLoad + extraLoad) < 8;
          })

          // fairness
          .sort((a,b) => {
            const usageA =
              teacherUsage?.[
                a.id
              ]?.[
                selectedDayName
              ] || {}

            const usageB =
              teacherUsage?.[
                b.id
              ]?.[
                selectedDayName
              ] || {}

            const baseLoadA =
              Object.entries(usageA)
                .filter(([_, value]) =>
                  value
                ).length

            const baseLoadB =
              Object.entries(usageB)
                .filter(([_, value]) =>
                  value
                ).length

            const extraLoadA =
              (assignedMap[a.id] || []).length

            const extraLoadB =
              (assignedMap[b.id] || []).length

            // Sort by extraLoad first (distribute arrangements evenly)
            if (extraLoadA !== extraLoadB) {
              return extraLoadA - extraLoadB;
            }

            // Sort by baseLoad (prefer teachers with fewer own classes / free for maximum periods)
            return baseLoadA - baseLoadB;
          })

      const assignedTeacher =
        availableTeachers[0]

      if (!assignedTeacher) {

        substitutions.push({

          slotId:
            generateSlotId(
              selectedDayName,
              normalizedPeriod,
              slot.classId
            ),

          absentTeacher:
            teacherId,

          absentTeacherId:
            normalizedTeacherId,

          substituteTeacher:
            "UNASSIGNED",

          substituteTeacherId:
            "",

          classId:
            normalizeClassId(
              slot.classId
            ),

          period:
            normalizedPeriod,

          subject:
            slot.subject || "",

          locked: false,
          autoAssigned: false,
          manualOverride: false
        })

        return
      }

      if (!assignedMap[assignedTeacher.id]) {
        assignedMap[assignedTeacher.id] = []
      }

      assignedMap[
        assignedTeacher.id
      ].push(
        normalizedPeriod
      )

      substitutions.push({

        slotId:
          generateSlotId(
            selectedDayName,
            normalizedPeriod,
            slot.classId
          ),

        absentTeacher:
          teacherId,

        absentTeacherId:
          normalizedTeacherId,

        substituteTeacher:
          assignedTeacher.raw,

        substituteTeacherId:
          assignedTeacher.id,

        classId:
          normalizeClassId(
            slot.classId
          ),

        period:
          normalizedPeriod,

        subject:
          slot.subject || "",

        locked: false,
        autoAssigned: true,
        manualOverride: false
      })
    })
  })

  console.log(
    "FINAL SUBSTITUTIONS",
    substitutions
  )

  return substitutions
}