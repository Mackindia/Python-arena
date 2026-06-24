const { execSync } = require('child_process');
const fs = require('fs');

try {
  console.log("Running eslint...");
  // Run eslint on the timetable app directory
  const output = execSync('npx eslint src/components/ClassTimetable.jsx src/components/Mastersheet.jsx', {
    cwd: 'c:\\Users\\Doon Scholars\\Downloads\\data\\.vscode\\Python arena\\VS CODE Final TT project Doon Scholars\\timetable-web-app',
    encoding: 'utf-8'
  });
  fs.writeFileSync('eslint-output.txt', output);
  console.log("ESLint passed cleanly.");
} catch (error) {
  // execSync throws if exit code is non-zero
  fs.writeFileSync('eslint-output.txt', error.stdout || error.message);
  console.log("ESLint found issues, saved to eslint-output.txt");
}
