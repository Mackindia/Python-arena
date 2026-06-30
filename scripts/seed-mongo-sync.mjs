/**
 * One-time script to seed the production MongoDB SyncStore with initial data.
 * Run: node scripts/seed-mongo-sync.mjs
 *
 * Requires MONGODB_URI in .env.local
 */
import mongoose from "mongoose";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config({ path: ".env.local" });

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ttDir = path.join(__dirname, "..", "VS CODE Final TT project Doon Scholars", "timetable-web-app");
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error("MONGODB_URI not found in .env.local");
  process.exit(1);
}

async function main() {
  console.log("Loading initial data...");
  const timetables = JSON.parse(fs.readFileSync(path.join(ttDir, "src/data/timetables.json"), "utf-8"));
  const loadMaster = JSON.parse(fs.readFileSync(path.join(ttDir, "src/data/load_master.json"), "utf-8"));

  // Derive teachers from timetables
  const teachersSet = new Set();
  Object.values(timetables).forEach(schedule => {
    schedule.forEach(slot => {
      if (slot.teacher) {
        slot.teacher.split(',').forEach(t => {
          const cleanT = t.trim().toUpperCase();
          if (cleanT && cleanT.toLowerCase() !== 'nan' && cleanT !== '0') {
            teachersSet.add(cleanT);
          }
        });
      }
    });
  });
  const teachers = Array.from(teachersSet).sort();

  // Derive masterClasses
  const derived = {};
  Object.keys(timetables).forEach(classId => {
    const match = classId.match(/^(\d+)(.*)$/i);
    let cName = classId;
    let sName = "";
    if (match) {
      cName = match[1];
      sName = match[2].trim().toUpperCase();
    }
    if (!derived[cName]) derived[cName] = new Set();
    if (sName) derived[cName].add(sName);
  });
  const masterClasses = Object.keys(derived).map(k => ({
    className: k,
    sections: Array.from(derived[k]),
  }));

  console.log(`Loaded: ${Object.keys(timetables).length} classes, ${teachers.length} teachers, ${loadMaster.length} load master entries, ${masterClasses.length} master classes`);
  console.log("Connecting to MongoDB...");
  await mongoose.connect(MONGODB_URI);
  console.log("Connected.");

  const db = mongoose.connection.db;
  const collection = db.collection("syncstores");

  const existing = await collection.findOne({});
  if (existing) {
    console.log(`\nExisting SyncStore found (version ${existing.version}).`);
    console.log(`  timetables: ${existing.timetables ? Object.keys(existing.timetables).length + ' classes' : 'NULL'}`);
    console.log(`  loadMaster: ${Array.isArray(existing.loadMaster) ? existing.loadMaster.length + ' entries' : 'NULL'}`);
    console.log(`  masterClasses: ${Array.isArray(existing.masterClasses) ? existing.masterClasses.length + ' classes' : 'NULL'}`);
  }

  const result = await collection.findOneAndUpdate(
    {},
    {
      $set: {
        version: (existing?.version || 0) + 1,
        updatedAt: Date.now(),
        updatedBy: "seed-script",
        timetables,
        teachers,
        loadMaster,
        masterClasses,
      },
    },
    { upsert: true, returnDocument: "after" }
  );

  console.log(`\nMongoDB SyncStore seeded successfully! Version: ${result.version}`);
  console.log(`  teachers: ${teachers.length} teachers synced`);
  await mongoose.disconnect();
}

main().catch(err => {
  console.error("Error:", err.message);
  process.exit(1);
});
