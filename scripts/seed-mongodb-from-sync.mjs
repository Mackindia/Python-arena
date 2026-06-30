/**
 * One-time script to seed MongoDB SyncStore from sync-data.json.
 * This fixes the split-brain issue where dev data never reached production.
 *
 * Run: node scripts/seed-mongodb-from-sync.mjs
 */
import mongoose from "mongoose";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

dotenv.config({ path: ".env.local" });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error("ERROR: MONGODB_URI not set in .env.local");
  process.exit(1);
}

// Derive teachers list from timetables
function deriveTeachers(timetables) {
  const teachers = new Set();
  Object.values(timetables).forEach(schedule => {
    schedule.forEach(slot => {
      if (slot.teacher) {
        slot.teacher.split(',').forEach(t => {
          const cleanT = t.trim().toUpperCase();
          if (cleanT && cleanT.toLowerCase() !== 'nan' && cleanT !== '0') {
            teachers.add(cleanT);
          }
        });
      }
    });
  });
  return Array.from(teachers).sort();
}

// Derive masterClasses from timetables keys
function deriveMasterClasses(timetables) {
  const derived = {};
  Object.keys(timetables).forEach(classId => {
    const match = classId.match(/^(\d+)(.*)$/i);
    let cName = classId;
    let sName = '';
    if (match) {
      cName = match[1];
      sName = match[2].trim().toUpperCase();
    }
    if (!derived[cName]) derived[cName] = new Set();
    if (sName) derived[cName].add(sName);
  });
  return Object.keys(derived).map(k => ({
    className: k,
    sections: Array.from(derived[k]),
  }));
}

async function main() {
  console.log("Connecting to MongoDB...");
  await mongoose.connect(MONGODB_URI);
  console.log("Connected.");

  // Read sync-data.json (the dev data that needs to reach production)
  const syncDataPath = path.join(__dirname, '..', 'VS CODE Final TT project Doon Scholars', 'timetable-web-app', 'sync-data.json');

  if (!fs.existsSync(syncDataPath)) {
    console.error("ERROR: sync-data.json not found at", syncDataPath);
    await mongoose.disconnect();
    process.exit(1);
  }

  const syncData = JSON.parse(fs.readFileSync(syncDataPath, 'utf-8'));
  console.log(`Read sync-data.json: version ${syncData.version}, ${Object.keys(syncData.timetables || {}).length} classes`);

  const db = mongoose.connection.db;
  const collection = db.collection("syncstores");

  // Check current state
  const existing = await collection.findOne({});
  if (existing) {
    console.log(`\nCurrent SyncStore: version ${existing.version}, updatedAt ${existing.updatedAt}`);
    console.log("Overwriting with sync-data.json data...");
  } else {
    console.log("\nNo existing SyncStore found. Creating new one...");
  }

  // Derive teachers from timetables
  const teachers = deriveTeachers(syncData.timetables || {});
  console.log(`Derived ${teachers.length} teachers from timetables: ${teachers.join(', ')}`);

  // Derive masterClasses if missing
  const masterClasses = syncData.masterClasses || deriveMasterClasses(syncData.timetables || {});
  console.log(`Derived ${masterClasses.length} master classes`);

  // Build the sync document
  const syncDoc = {
    version: syncData.version || 1,
    updatedAt: Date.now(),
    updatedBy: 'seed-mongodb-script',
    timetables: syncData.timetables || {},
    teachers: teachers,
    teacherSubjectMap: syncData.teacherSubjectMap || null,
    loadMaster: syncData.loadMaster || [],
    masterClasses: masterClasses,
    substitutions: syncData.substitutions || {},
    absentTeachers: syncData.absentTeachers || {},
  };

  // Upsert into MongoDB
  const result = await collection.findOneAndUpdate(
    {},
    { $set: syncDoc },
    { upsert: true, returnDocument: 'after' }
  );

  console.log("\n=== SUCCESS ===");
  console.log(`SyncStore updated to version ${result.version}`);
  console.log(`  timetables: ${Object.keys(syncDoc.timetables).length} classes`);
  console.log(`  teachers: ${syncDoc.teachers.length} teachers`);
  console.log(`  loadMaster: ${syncDoc.loadMaster.length} entries`);
  console.log(`  masterClasses: ${syncDoc.masterClasses.length} classes`);
  console.log(`  substitutions: ${Object.keys(syncDoc.substitutions).length} dates`);
  console.log(`  absentTeachers: ${Object.keys(syncDoc.absentTeachers).length} dates`);
  console.log("\nAll browsers polling /api/sync will now receive this data.");

  await mongoose.disconnect();
}

main().catch(console.error);
