import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const downloadsDir = 'C:\\Users\\Doon Scholars\\Downloads';
const ttDataDir = path.join(__dirname, 'VS CODE Final TT project Doon Scholars', 'timetable-web-app', 'src', 'data');

console.log('⏳ Looking for the latest Timetable Backup in Downloads...');

try {
  const files = fs.readdirSync(downloadsDir)
    .filter(f => f.startsWith('Timetable_Data_Backup_') && f.endsWith('.json'))
    .map(f => ({
      name: f,
      time: fs.statSync(path.join(downloadsDir, f)).mtime.getTime()
    }))
    .sort((a, b) => b.time - a.time);

  if (files.length === 0) {
    console.error('❌ No Timetable Backup file found in ' + downloadsDir);
    process.exit(1);
  }

  const latestFile = files[0].name;
  const backupPath = path.join(downloadsDir, latestFile);
  console.log(`📂 Found latest backup: ${latestFile}`);

  const backupData = JSON.parse(fs.readFileSync(backupPath, 'utf8'));

  // 1. Update timetables.json
  if (backupData.timetables) {
    const timetables = typeof backupData.timetables === 'string' 
      ? JSON.parse(backupData.timetables) 
      : backupData.timetables;
    fs.writeFileSync(
      path.join(ttDataDir, 'timetables.json'),
      JSON.stringify(timetables, null, 2)
    );
    console.log('✅ Updated timetables.json');
  }

  // 2. Update teachers.json if we have added/deleted lists
  if (backupData.addedTeachers || backupData.deletedTeachers) {
    const added = backupData.addedTeachers ? (typeof backupData.addedTeachers === 'string' ? JSON.parse(backupData.addedTeachers) : backupData.addedTeachers) : [];
    const deleted = backupData.deletedTeachers ? (typeof backupData.deletedTeachers === 'string' ? JSON.parse(backupData.deletedTeachers) : backupData.deletedTeachers) : [];
    
    const teachersPath = path.join(ttDataDir, 'teachers.json');
    let currentTeachers = JSON.parse(fs.readFileSync(teachersPath, 'utf8'));
    
    // Merge
    let updatedTeachers = [...new Set([...currentTeachers, ...added])].filter(t => !deleted.includes(t)).sort();
    fs.writeFileSync(teachersPath, JSON.stringify(updatedTeachers, null, 2));
    console.log('✅ Updated teachers.json');
  }

  console.log('\n🎉 Successfully imported backup into source files!');
  console.log('Now, you can run the sync command to build and apply changes to your LMS:');
  console.log('node sync_timetable.js');

} catch (error) {
  console.error('❌ Error importing backup:', error.message);
}
