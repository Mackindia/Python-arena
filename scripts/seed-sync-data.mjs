/**
 * One-time script to seed sync-data.json from the initial JSON data imports.
 * Run: node scripts/seed-sync-data.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ttDir = path.join(__dirname, '..', 'VS CODE Final TT project Doon Scholars', 'timetable-web-app');

const timetables = JSON.parse(fs.readFileSync(path.join(ttDir, 'src/data/timetables.json'), 'utf-8'));
const loadMaster = JSON.parse(fs.readFileSync(path.join(ttDir, 'src/data/load_master.json'), 'utf-8'));

const syncData = {
  version: 100,
  updatedAt: Date.now(),
  updatedBy: 'seed-script',
  timetables,
  teacherSubjectMap: null,
  loadMaster,
  masterClasses: null,
  substitutions: {},
  absentTeachers: {},
};

// Derive masterClasses from timetables keys
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
syncData.masterClasses = Object.keys(derived).map(k => ({
  className: k,
  sections: Array.from(derived[k]),
}));

const outPath = path.join(ttDir, 'sync-data.json');
fs.writeFileSync(outPath, JSON.stringify(syncData, null, 2), 'utf-8');
console.log(`Seeded sync-data.json with ${Object.keys(timetables).length} classes, ${loadMaster.length} load master entries, ${syncData.masterClasses.length} master classes.`);
console.log(`Version set to ${syncData.version}.`);
