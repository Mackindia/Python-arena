// ============================================================
// refresh-teacher-map.mjs
// ------------------------------------------------------------
// Keeps the Timetable Engine's "official" subject-teacher data
// in sync with the teachers who are actually in school.
//
// What it updates (both files are baked into the web app):
//   1. src/data/csvData.js        -> official subject/teacher map
//   2. src/data/teacher_mapping.json -> known-teacher list
//
// Rules:
//   - Ground truth = MongoDB collection `timetables`
//     (it only contains teachers currently in school)
//   - A teacher code NOT in that roster is removed
//   - If MongoDB knows who teaches that subject/class,
//     that current teacher is used as the replacement
//   - If nobody is known, the row is dropped
//
// Usage:
//   node scripts/refresh-teacher-map.mjs           (apply)
//   node scripts/refresh-teacher-map.mjs --dry-run (preview only)
// ============================================================
import { MongoClient } from "mongodb";
import { readFileSync, writeFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const APP = resolve(root, "VS CODE Final TT project Doon Scholars", "timetable-web-app");
const CSV_DATA_PATH = resolve(APP, "src", "data", "csvData.js");
const MAPPING_PATH = resolve(APP, "src", "data", "teacher_mapping.json");
const ENV_PATH = resolve(root, ".env.local");
const DRY_RUN = process.argv.includes("--dry-run");

const INVALID = new Set(["", "UNASSIGNED", "NAN", "0", "NONE"]);

function loadEnv() {
  const env = {};
  if (!existsSync(ENV_PATH)) return env;
  for (const line of readFileSync(ENV_PATH, "utf-8").split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i === -1) continue;
    env[t.slice(0, i).trim()] = t.slice(i + 1).trim().replace(/^["']|["']$/g, "");
  }
  return env;
}

/** Split one CSV line, honouring double quotes */
function splitCsvLine(line) {
  const out = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') { cur += '"'; i++; }
      else inQuotes = !inQuotes;
      continue;
    }
    if (ch === "," && !inQuotes) { out.push(cur); cur = ""; continue; }
    cur += ch;
  }
  out.push(cur);
  return out.map((s) => s.trim());
}

const quote = (value) => (value.includes(",") ? `"${value}"` : value);

async function main() {
  const uri = loadEnv().MONGODB_URI;
  if (!uri) { console.error("MONGODB_URI not found in .env.local"); process.exit(1); }

  const client = new MongoClient(uri);
  await client.connect();
  const rows = await client.db().collection("timetables").find({}).toArray();
  await client.close();

  // --- Ground truth: who is in school, and who teaches what ---
  const staff = new Set();
  const byClassSubject = new Map(); // "1A::MATHS" -> [teacher, ...]
  for (const r of rows) {
    const t = String(r.teacher_id || "").trim().toUpperCase();
    if (INVALID.has(t)) continue;
    staff.add(t);
    const key = `${r.class}${r.section}::${String(r.subject || "").trim().toUpperCase()}`;
    if (!byClassSubject.has(key)) byClassSubject.set(key, new Set());
    byClassSubject.get(key).add(t);
  }
  console.log(`Ground truth: ${staff.size} teachers in school, ${rows.length} timetable rows.`);

  // --- 1. Official map (csvData.js) ---
  const source = readFileSync(CSV_DATA_PATH, "utf8");
  const match = source.match(/rawCsvData = `([\s\S]*)`;/);
  if (!match) { console.error("Could not find rawCsvData template in csvData.js"); process.exit(1); }

  const lines = match[1].split("\n").filter((l) => l.trim());
  const header = lines[0];
  const dataLines = lines.slice(1);

  const seen = new Set();
  const kept = [];
  const replaced = [];
  const dropped = [];

  for (const line of dataLines) {
    const [subject, cls, section, rawTeacher] = splitCsvLine(line);
    if (!subject || !cls || !section) { kept.push(line); continue; }

    const tokens = String(rawTeacher || "")
      .split(/[,/]+/)
      .map((x) => x.trim().toUpperCase())
      .filter((x) => x && !INVALID.has(x));

    const current = tokens.filter((t) => staff.has(t));
    const gone = tokens.filter((t) => !staff.has(t));

    let final = [...current];
    if (gone.length) {
      const key = `${cls}${section}::${subject.trim().toUpperCase()}`;
      const fromDb = [...(byClassSubject.get(key) || [])];
      for (const t of fromDb) {
        if (!final.includes(t)) final.push(t);
      }
      replaced.push(`${subject} ${cls}${section}: ${tokens.join(",")} -> ${final.join(",") || "(none)"}`);
    }

    if (!final.length) {
      dropped.push(`${subject} ${cls}${section}: ${tokens.join(",") || "(empty)"}`);
      continue;
    }

    const outLine = [subject, cls, section, final.map(quote).join(",")].join(",");
    if (seen.has(outLine)) continue;
    seen.add(outLine);
    kept.push(outLine);
  }

  const newBody = [header, ...kept].join("\n");
  const newSource = source.replace(/rawCsvData = `[\s\S]*`;/, "rawCsvData = `" + newBody + "`;");

  console.log(`\nOfficial map: ${dataLines.length} rows -> ${kept.length} rows`);
  console.log(`  replaced: ${replaced.length}`);
  replaced.slice(0, 30).forEach((r) => console.log("    " + r));
  console.log(`  dropped:  ${dropped.length}`);
  dropped.forEach((d) => console.log("    " + d));

  // --- 2. Known-teacher list (teacher_mapping.json) ---
  const mapping = JSON.parse(readFileSync(MAPPING_PATH, "utf8"));
  const before = mapping.map((m) => String(m.Teacher || "").trim().toUpperCase()).filter(Boolean);
  const removedFromMapping = before.filter((t) => !staff.has(t));
  const missingFromMapping = [...staff].filter((t) => !before.includes(t)).sort();
  const after = [...new Set([...before.filter((t) => staff.has(t)), ...[...staff].sort()])].sort();

  console.log(`\nTeacher list: ${before.length} -> ${after.length}`);
  console.log(`  removed (left school): ${removedFromMapping.join(", ") || "none"}`);
  console.log(`  added (in school, missing): ${missingFromMapping.join(", ") || "none"}`);

  if (DRY_RUN) {
    console.log("\n[dry-run] No files written.");
    return;
  }

  writeFileSync(CSV_DATA_PATH, newSource, "utf8");
  writeFileSync(
    MAPPING_PATH,
    JSON.stringify(after.map((t) => ({ Teacher: t })), null, 2) + "\n",
    "utf8"
  );
  console.log("\nFiles updated:");
  console.log("  " + CSV_DATA_PATH);
  console.log("  " + MAPPING_PATH);
}

main().catch((e) => { console.error("refresh-teacher-map failed:", e.message); process.exit(1); });
