const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ttDir = path.join(__dirname, 'VS CODE Final TT project Doon Scholars', 'timetable-web-app');
const publicDir = path.join(__dirname, 'public', 'timetable');

console.log('⏳ Starting Automated Timetable Sync...');

try {
  // Step 1: Build the Vite app
  console.log('🛠️  Building the latest timetable logic...');
  execSync('npm run build', { cwd: ttDir, stdio: 'inherit' });

  // Step 2: Delete old files in public/timetable
  console.log('🗑️  Clearing old cached files from ERP...');
  if (fs.existsSync(publicDir)) {
    fs.rmSync(publicDir, { recursive: true, force: true });
  }

  // Step 3: Copy new files to public/timetable
  console.log('🚚 Moving new files into the ERP...');
  fs.cpSync(path.join(ttDir, 'dist'), publicDir, { recursive: true });

  console.log('✅ SUCCESS! The ERP timetable has been permanently updated.');
  console.log('You can now close the secondary server. The main localhost:3000 will show your latest changes!');
} catch (error) {
  console.error('❌ Failed to sync timetable:', error.message);
}
