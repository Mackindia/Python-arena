// Mirrors live data from the Timetable Engine (Vite app, localhost:5173) into the
// MongoDB `timetables` collection used by Smart Chanakya. Read-only against the
// Timetable Engine (GET /api/sync) — does not modify anything in that project.
import { MongoClient } from "mongodb";
import { readFileSync, writeFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dirname, "../.env.local");
const statePath = resolve(__dirname, ".timetable-sync-state.json");

const TIMETABLE_ENGINE_URL = process.env.TIMETABLE_ENGINE_URL || "http://localhost:5173";
const POLL_INTERVAL_MS = Number(process.env.TIMETABLE_SYNC_INTERVAL_MS || 15000);
const WATCH = process.argv.includes("--watch");

const DAY_MAP = { Mon: "Monday", Tue: "Tuesday", Wed: "Wednesday", Thu: "Thursday", Fri: "Friday", Sat: "Saturday", Sun: "Sunday" };

function loadEnv() {
  const env = {};
  const content = readFileSync(envPath, "utf-8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, "");
    env[key] = val;
  }
  return env;
}

const MONGODB_URI = loadEnv().MONGODB_URI;
if (!MONGODB_URI) {
  console.error("MONGODB_URI not found in .env.local");
  process.exit(1);
}

// Vite app classIds look like "11b" (number + section, no separator)
function splitClassId(classId) {
  const match = String(classId).match(/^(\d+)([a-zA-Z]+)$/);
  if (!match) return null;
  return { class: match[1], section: match[2].toUpperCase() };
}

function loadState() {
  if (!existsSync(statePath)) return { since: 0 };
  try {
    return JSON.parse(readFileSync(statePath, "utf-8"));
  } catch {
    return { since: 0 };
  }
}

function saveState(state) {
  writeFileSync(statePath, JSON.stringify(state, null, 2), "utf-8");
}

function convertTimetables(timetables) {
  const rows = [];
  Object.entries(timetables || {}).forEach(([classId, slots]) => {
    const parsed = splitClassId(classId);
    if (!parsed || !Array.isArray(slots)) return;
    slots.forEach((slot) => {
      if (!slot.day || !slot.period || !slot.subject) return;
      const teacherRaw = (slot.teacher || "").trim();
      const base = {
        class: parsed.class,
        section: parsed.section,
        group: "MAIN",
        day: DAY_MAP[slot.day] || slot.day,
        period_no: Number(slot.period),
        subject: slot.subject,
      };

      // "GA,AD" = two teachers share this period -> ONE ROW PER TEACHER,
      // otherwise the 2nd teacher's own schedule would be missing it.
      const teachers = teacherRaw
        .split(",")
        .map((t) => t.trim())
        .filter((t) => t && !/^(nan|0)$/i.test(t));

      if (teachers.length === 0) {
        rows.push({ ...base, teacher_id: "UNASSIGNED", teacher_name: "" });
        return;
      }
      teachers.forEach((teacherId) => {
        rows.push({ ...base, teacher_id: teacherId, teacher_name: teacherRaw });
      });
    });
  });
  return rows;
}

async function fetchSyncPayload(since) {
  const res = await fetch(`${TIMETABLE_ENGINE_URL}/api/sync?since=${since}`);
  if (!res.ok) throw new Error(`Timetable engine responded ${res.status}`);
  return res.json();
}

async function syncOnce(client) {
  const state = loadState();
  let data;
  try {
    data = await fetchSyncPayload(state.since);
  } catch (err) {
    console.warn(`[sync] Could not reach Timetable Engine at ${TIMETABLE_ENGINE_URL}: ${err.message}`);
    return;
  }

  // Guard: if the engine's version went BACKWARDS (fresh sync-data.json,
  // restored backup, new machine) our cursor would say "up to date" forever.
  // Reset the cursor and refetch everything.
  if (typeof data.version === "number" && data.version < state.since) {
    console.warn(`[sync] Engine version ${data.version} < local cursor ${state.since} — resetting cursor and refetching.`);
    state.since = 0;
    saveState(state);
    try {
      data = await fetchSyncPayload(0);
    } catch (err) {
      console.warn(`[sync] Refetch failed: ${err.message}`);
      return;
    }
  }

  if (data.upToDate) {
    console.log(`[sync] Already up to date (version ${state.since}).`);
    return;
  }

  const rows = convertTimetables(data.timetables);
  if (rows.length === 0) {
    console.log("[sync] No timetable rows found in this payload; skipping DB write to avoid wiping existing data.");
  } else {
    const maxPeriod = rows.reduce((max, r) => Math.max(max, r.period_no), 0);
    const expectedPeriods = Number(process.env.TIMETABLE_EXPECTED_PERIODS || 9);
    if (maxPeriod < expectedPeriods && !process.argv.includes("--force")) {
      console.warn(
        `[sync] Timetable Engine payload has only ${maxPeriod} periods/day (expected ${expectedPeriods}). ` +
          "Skipping DB write so the 9-period schedule stays intact. Re-run with --force to overwrite."
      );
      saveState({ since: data.version });
      return;
    }

    const collection = client.db().collection("timetables");
    await collection.deleteMany({});
    await collection.insertMany(rows);
    console.log(`[sync] Mirrored ${rows.length} periods into MongoDB (engine version ${data.version}).`);
  }

  saveState({ since: data.version });
}

async function main() {
  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  console.log("Connected to MongoDB. Mirroring from Timetable Engine ->", TIMETABLE_ENGINE_URL);

  await syncOnce(client);

  if (WATCH) {
    console.log(`Watching for changes every ${POLL_INTERVAL_MS / 1000}s... (Ctrl+C to stop)`);
    setInterval(() => {
      syncOnce(client).catch((e) => console.error("[sync] error:", e.message));
    }, POLL_INTERVAL_MS);
  } else {
    await client.close();
  }
}

main().catch((err) => {
  console.error("sync-timetable-live failed:", err.message);
  process.exit(1);
});
