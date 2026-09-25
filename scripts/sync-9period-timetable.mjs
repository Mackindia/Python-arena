// Mirrors the 9-period school timetable ("9 periods timetable csv file.csv")
// into the MongoDB `timetables` collection read by Smart Chanakya / the app.
//
// It reuses the SAME parser as the Timetable Engine's "Import CSV" button
// (src/utils/csvTimetableImport.js), so both paths produce identical data:
//   - CSV cell teachers win ("English (SW)", "Comp NP", "Comp/Hsc (GA/AD)")
//   - cells without a teacher are filled from the refreshed
//     subject-teacher map (only teachers currently in school)
//
// Usage:
//   node scripts/sync-9period-timetable.mjs               # parse + write to MongoDB
//   node scripts/sync-9period-timetable.mjs --dry-run     # parse only, print summary
//   node scripts/sync-9period-timetable.mjs "path/to.csv" # use another CSV
//
// NOTE: run EITHER this script or the live mirror (sync:timetable-live:watch),
//       not both at the same time — they both own the `timetables` collection.
import { MongoClient } from "mongodb";
import { readFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath, pathToFileURL } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(__dirname, "..");
const APP_DIR = resolve(rootDir, "VS CODE Final TT project Doon Scholars", "timetable-web-app");

const args = process.argv.slice(2);
const DRY_RUN = args.includes("--dry-run");
const csvArg = args.find((a) => !a.startsWith("--"));
const csvPath = csvArg ? resolve(rootDir, csvArg) : resolve(rootDir, "9 periods timetable csv file.csv");
const envPath = resolve(rootDir, ".env.local");

const DAY_MAP = {
  Mon: "Monday", Tue: "Tuesday", Wed: "Wednesday",
  Thu: "Thursday", Fri: "Friday", Sat: "Saturday", Sun: "Sunday",
  Monday: "Monday", Tuesday: "Tuesday", Wednesday: "Wednesday",
  Thursday: "Thursday", Friday: "Friday", Saturday: "Saturday", Sunday: "Sunday",
};

function loadEnv() {
  const env = {};
  for (const line of readFileSync(envPath, "utf-8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;
    env[trimmed.slice(0, eqIdx).trim()] = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, "");
  }
  return env;
}

async function main() {
  if (!existsSync(csvPath)) {
    console.error(`CSV not found: ${csvPath}`);
    process.exit(1);
  }

  // --- Parse with the engine's own importer (single source of truth) ---
  const importerPath = resolve(APP_DIR, "src", "utils", "csvTimetableImport.js");
  const { parseGridTimetableCsv } = await import(pathToFileURL(importerPath).href);
  const parsed = parseGridTimetableCsv(readFileSync(csvPath, "utf-8"));

  // --- Convert to Mongo rows: ONE ROW PER TEACHER ---
  const rows = [];
  let unassigned = 0;
  for (const [classId, slots] of Object.entries(parsed.timetables || {})) {
    const m = String(classId).match(/^(\d+)\s*([A-Za-z]+)$/);
    if (!m) { console.warn(`Skipping unparsable classId "${classId}"`); continue; }
    const classNo = m[1];
    const section = m[2].toUpperCase();

    for (const slot of slots) {
      const base = {
        class: classNo,
        section,
        group: "MAIN",
        day: DAY_MAP[slot.day] || slot.day,
        period_no: Number(slot.period),
        subject: slot.subject,
      };
      const teachers = String(slot.teacher || "")
        .split(",")
        .map((t) => t.trim())
        .filter((t) => t && !/^(nan|0|unassigned)$/i.test(t));

      if (!teachers.length) {
        unassigned++;
        rows.push({ ...base, teacher_id: "UNASSIGNED", teacher_name: "" });
        continue;
      }
      // "GA,AD" share the period -> both teachers must appear in their own schedule
      for (const teacherId of teachers) {
        rows.push({ ...base, teacher_id: teacherId, teacher_name: slot.teacher });
      }
    }
  }

  // --- Summary / validation ---
  const classIds = [...new Set(rows.map((r) => `${r.class}-${r.section}`))];
  const days = [...new Set(rows.map((r) => r.day))].sort();
  const periods = [...new Set(rows.map((r) => r.period_no))].sort((a, b) => a - b);
  const teacherCodes = [...new Set(rows.map((r) => r.teacher_id))].sort();

  console.log(`Source:  ${csvPath}`);
  console.log(`Classes: ${classIds.length} (${classIds.join(", ")})`);
  console.log(`Days:    ${days.join(", ")}`);
  console.log(`Periods: ${periods.join(", ")}`);
  console.log(`Rows:    ${rows.length}  (one per teacher per period)`);
  console.log(`Unassigned cells: ${unassigned}`);
  console.log(`Teachers (${teacherCodes.length}): ${teacherCodes.join(", ")}`);

  const sample = rows.filter((r) => r.class === "6" && r.section === "A" && r.day === "Monday");
  console.log("\nSample 6-A Monday:");
  sample.sort((a, b) => a.period_no - b.period_no).forEach((r) => {
    console.log(`  P${r.period_no} | ${r.subject} | ${r.teacher_id}`);
  });

  const incomplete = [];
  for (const c of classIds) {
    for (const d of days) {
      const n = new Set(
        rows.filter((r) => `${r.class}-${r.section}` === c && r.day === d).map((r) => r.period_no)
      ).size;
      if (n !== periods.length) incomplete.push(`${c} ${d}: ${n}/${periods.length}`);
    }
  }
  if (incomplete.length) {
    console.log(`\nIncomplete class/day rows (${incomplete.length}):`);
    incomplete.forEach((m) => console.log("  " + m));
  }

  if (DRY_RUN) {
    console.log("\nDry run - MongoDB not modified.");
    return;
  }
  if (!rows.length) {
    console.error("No rows parsed - aborting (database untouched).");
    process.exit(1);
  }

  const uri = loadEnv().MONGODB_URI;
  if (!uri) { console.error("MONGODB_URI not found in .env.local"); process.exit(1); }

  const client = new MongoClient(uri);
  await client.connect();
  const collection = client.db().collection("timetables");
  const before = await collection.countDocuments();

  await collection.deleteMany({});
  await collection.insertMany(rows);
  const after = await collection.countDocuments();
  await client.close();

  console.log(`\nMongoDB updated: ${before} -> ${after} rows (collection "timetables").`);
}

main().catch((err) => {
  console.error("sync-9period-timetable failed:", err.message);
  process.exit(1);
});
