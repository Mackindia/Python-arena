import { readFileSync } from "fs";
import { parseGridTimetableCsv, parseTimetableCell } from "./src/utils/csvTimetableImport.js";

const csv = readFileSync("../../9 periods timetable csv file.csv", "utf8");
const res = parseGridTimetableCsv(csv);
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const P = 9;

console.log("=== 11a / 11b grid (subject | teachers) ===");
for (const cls of ["11a", "11b"]) {
  console.log(`\n--- ${cls} ---`);
  const slots = res.timetables[cls] || [];
  console.log("P   " + DAYS.map((d, i) => d.padEnd(22)).join(""));
  for (let p = 1; p <= P; p++) {
    const row = DAYS.map((d) => {
      const s = slots.find((x) => x.day === d && x.period === p);
      if (!s) return "-".padEnd(22);
      return `${s.subject} [${s.teacher || "NONE"}]`.slice(0, 21).padEnd(22);
    });
    console.log(String(p).padEnd(3) + row.join(""));
  }
}

console.log("\n=== raw cell parse check ===");
for (const raw of ["Bio/Eco/Phy_Edu", "Maths/Hindi/Music DP/MG/MS", "Physics (SD)", "Acct/History(VV/SS)", "Bst/ Pol Sc(VV/SS)"]) {
  const c = parseTimetableCell(raw);
  console.log(JSON.stringify(raw), "=>", JSON.stringify(c));
}

console.log("\n=== slots with NO teacher (all classes) ===");
let n = 0;
for (const [cls, slots] of Object.entries(res.timetables)) {
  for (const s of slots) {
    if (!s.teacher) { n++; if (n <= 40) console.log(`  ${cls} ${s.day} P${s.period} ${s.subject}`); }
  }
}
console.log("total no-teacher slots:", n);

console.log("\n=== teacher load (slots) ===");
const load = {};
for (const slots of Object.values(res.timetables)) {
  for (const s of slots) {
    for (const t of String(s.teacher || "").split(",").map((x) => x.trim()).filter(Boolean)) {
      load[t] = (load[t] || 0) + 1;
    }
  }
}
const all = res.teachers;
console.log(all.map((t) => `${t}=${load[t] || 0}`).join("  "));
console.log("teachers with 0 slots:", all.filter((t) => !load[t]).join(",") || "none");

console.log("\n=== clashes: same teacher, same day+period, 2+ classes ===");
const seen = {};
for (const [cls, slots] of Object.entries(res.timetables)) {
  for (const s of slots) {
    for (const t of String(s.teacher || "").split(",").map((x) => x.trim()).filter(Boolean)) {
      const k = `${t}|${s.day}|${s.period}`;
      (seen[k] = seen[k] || []).push(cls);
    }
  }
}
let clashCount = 0;
for (const [k, clses] of Object.entries(seen)) {
  const uniq = [...new Set(clses)];
  if (uniq.length > 1) {
    clashCount++;
    const [t, d, p] = k.split("|");
    if (clashCount <= 40) console.log(`  ${t} ${d} P${p}: ${uniq.join(",")}`);
  }
}
console.log("total clash instances:", clashCount);
