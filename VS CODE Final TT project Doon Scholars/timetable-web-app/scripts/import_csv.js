const fs = require('fs');
const path = require('path');

const csvPath = path.join(__dirname, '..', '..', 'subject teacher map.csv');
const timetablesPath = path.join(__dirname, '..', 'src', 'data', 'timetables.json');
const mapOutputPath = path.join(__dirname, '..', 'src', 'data', 'teacher_subject_map.json');

const csvData = fs.readFileSync(csvPath, 'utf8');
const rows = csvData.split('\n').filter(r => r.trim());
const dataRows = rows.slice(1);

const mapping = {};
const uiMatrix = {};

dataRows.forEach(row => {
  const matches = row.match(/(".*?"|[^",]+)(?=\s*,|\s*$)/g);
  if (!matches || matches.length < 4) return;
  
  let [subject, cls, section, teacher] = matches.map(m => m.replace(/^"|"$/g, '').trim());
  
  const classIdLower = `${cls}${section}`.toLowerCase();
  const classIdUpper = `${cls}${section}`.toUpperCase();
  
  // For timetables script
  if (!mapping[classIdLower]) mapping[classIdLower] = {};
  mapping[classIdLower][subject] = teacher;

  // For UI Matrix
  if (!uiMatrix[subject]) uiMatrix[subject] = {};
  uiMatrix[subject][classIdUpper] = teacher;
});

// Write UI Matrix to JSON
fs.writeFileSync(mapOutputPath, JSON.stringify(uiMatrix, null, 2));
console.log(`Generated teacher_subject_map.json for the UI!`);

// Update timetables
const timetables = JSON.parse(fs.readFileSync(timetablesPath, 'utf8'));
let updatedCount = 0;

Object.keys(timetables).forEach(classId => {
  const classMap = mapping[classId];
  if (!classMap) return;
  
  timetables[classId].forEach(slot => {
    if (!slot.subject) return;
    
    if (classMap[slot.subject]) {
      slot.teacher = classMap[slot.subject];
      updatedCount++;
    } else {
      for (const key of Object.keys(classMap)) {
        if (key.includes(slot.subject) || slot.subject.includes(key)) {
           slot.teacher = classMap[key];
           updatedCount++;
           break;
        }
      }
    }
  });
});

fs.writeFileSync(timetablesPath, JSON.stringify(timetables, null, 2));
console.log(`Successfully updated ${updatedCount} slots in timetables.json!`);
