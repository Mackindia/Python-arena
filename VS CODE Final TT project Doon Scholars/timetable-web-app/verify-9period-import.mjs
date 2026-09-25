import { readFileSync } from "fs";
import { parseGridTimetableCsv } from "./src/utils/csvTimetableImport.js";

// The real 9-period CSV lives at the repo root (two levels up from this app)
const real = readFileSync("../../9 periods timetable csv file.csv", "utf8");

const csv = real;

for (const [label, text] of [["9-period CSV", csv]]) {
  try {
    const res = parseGridTimetableCsv(text);
    const codes = new Set();
    let noTeacher = 0;
    let total = 0;
    for (const slots of Object.values(res.timetables)) {
      for (const s of slots) {
        total++;
        if (!s.teacher) noTeacher++;
        String(s.teacher || "").split(",").forEach((t) => { if (t) codes.add(t); });
      }
    }
    console.log(`\n===== ${label} =====`);
    console.log("periodCount:", res.periodCount, "| classes:", res.classes.length, "| slots:", total, "| no-teacher slots:", noTeacher);
    console.log("teacher codes (" + codes.size + "):", [...codes].sort().join(","));
    console.log("stats:", JSON.stringify(res.stats));
    console.log("1a Monday:", JSON.stringify((res.timetables["1a"] || []).filter(s => s.day === "Mon")));
    console.log("6a Monday:", JSON.stringify((res.timetables["6a"] || []).filter(s => s.day === "Mon")));
    console.log("9a/11a keys sample:", res.classes.join(","));
  } catch (e) {
    console.log(`===== ${label} FAILED:`, e.message);
  }
}
