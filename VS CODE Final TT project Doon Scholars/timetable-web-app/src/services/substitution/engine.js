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

  const assignedMap = {}

  teachers.forEach(t => {

    const tId =
      normalizeTeacherId(t)

    assignedMap[tId] = []
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

        teachers

          .map(t => ({
            raw: t,
            id:
              normalizeTeacherId(t)
          }))

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

            return !assignedMap[
              t.id
            ].includes(
              normalizedPeriod
            )
          })

          // max 7 periods
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
              assignedMap[
                t.id
              ].length

            return (
              baseLoad +
              extraLoad
            ) < 7
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

            const loadA =

              Object.entries(usageA)

                .filter(([_, value]) =>
                  value
                ).length

              +

              assignedMap[a.id]
                .length

            const loadB =

              Object.entries(usageB)

                .filter(([_, value]) =>
                  value
                ).length

              +

              assignedMap[b.id]
                .length

            return loadA - loadB
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