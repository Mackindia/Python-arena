const fs = require('fs');
const path = require('path');

const csvPath = path.join(__dirname, '..', '..', 'subject teacher map.csv');
const uiConfigPath = path.join(__dirname, '..', 'src', 'data', 'teacher_mapping_config.json');
const timetablesPath = path.join(__dirname, '..', 'src', 'data', 'timetables.json');

const csvData = fs.readFileSync(csvPath, 'utf8');
const rows = csvData.split('\n').filter(r => r.trim());
const dataRows = rows.slice(1);

// We need to keep the exact subjects in the exact order they appear in the CSV for each wing
const wingDefinitions = [
  { id: 'primary', title: 'Primary Wing (Classes 1 - 5)', headerColor: '#4ade80', rowColor: '#f0fdf4', match: (cls) => ['1','2','3','4','5'].includes(cls) },
  { id: 'middle', title: 'Middle Wing (Classes 6 - 8)', headerColor: '#60a5fa', rowColor: '#eff6ff', match: (cls) => ['6','7','8'].includes(cls) },
  { id: 'secondary', title: 'Secondary Wing (Classes 9 - 10)', headerColor: '#94a3b8', rowColor: '#f1f5f9', match: (cls) => ['9','10'].includes(cls) },
  { id: 'senior', title: 'Senior Secondary Wing (Classes 11 - 12)', headerColor: '#fb923c', rowColor: '#ffedd5', match: (cls) => ['11','12'].includes(cls) }
];

const wings = {
  primary: { subjects: new Set(), columns: new Set() },
  middle: { subjects: new Set(), columns: new Set() },
  secondary: { subjects: new Set(), columns: new Set() },
  senior: { subjects: new Set(), columns: new Set() }
};

const mapForTimetables = {};
const mapForUI = {}; // mapForUI[subject][classId] = teacher

dataRows.forEach(row => {
  const matches = row.match(/(".*?"|[^",]+)(?=\s*,|\s*$)/g);
  if (!matches || matches.length < 4) return;
  
  let [subject, cls, section, teacher] = matches.map(m => m.replace(/^"|"$/g, '').trim());
  
  // Find which wing it belongs to
  const wingDef = wingDefinitions.find(w => w.match(cls));
  if (wingDef) {
    const classId = `${cls}${section}`.toUpperCase();
    
    // Add to Sets in order of appearance
    wings[wingDef.id].subjects.add(subject);
    wings[wingDef.id].columns.add(classId);
    
    // UI Map
    if (!mapForUI[subject]) mapForUI[subject] = {};
    mapForUI[subject][classId] = teacher;
    
    // Timetables Map
    const classIdLower = classId.toLowerCase();
    if (!mapForTimetables[classIdLower]) mapForTimetables[classIdLower] = {};
    mapForTimetables[classIdLower][subject] = teacher;
  }
});

// Build final config for UI
const finalConfig = wingDefinitions.map(w => ({
  title: w.title,
  headerColor: w.headerColor,
  rowColor: w.rowColor,
  columns: Array.from(wings[w.id].columns),
  subjects: Array.from(wings[w.id].subjects)
})).filter(w => w.columns.length > 0);

// Write UI config
fs.writeFileSync(uiConfigPath, JSON.stringify({
  wings: finalConfig,
  initialData: mapForUI
}, null, 2));

console.log('Successfully generated teacher_mapping_config.json');

// Update timetables
const timetables = JSON.parse(fs.readFileSync(timetablesPath, 'utf8'));
let updatedCount = 0;

Object.keys(timetables).forEach(classId => {
  const classMap = mapForTimetables[classId];
  if (!classMap) return;
  
  timetables[classId].forEach(slot => {
    if (!slot.subject) return;
    
    if (classMap[slot.subject]) {
      slot.teacher = classMap[slot.subject];
      updatedCount++;
    } else {
      for (const key of Object.keys(classMap)) {
        // e.g. "Bio/Eco/Phy_Edu"
        if (key.split('/').some(k => slot.subject.includes(k) || k.includes(slot.subject))) {
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
