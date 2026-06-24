import fs from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dirname, "../.env.local");

function loadEnvFile(filePath) {
  try {
    const envContent = fs.readFileSync(filePath, "utf-8");
    const env = {};
    for (const line of envContent.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eqIdx = trimmed.indexOf("=");
      if (eqIdx === -1) continue;
      const key = trimmed.slice(0, eqIdx).trim();
      const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, "");
      env[key] = val;
    }
    return env;
  } catch {
    return {};
  }
}

const env = loadEnvFile(envPath);
const CLERK_SECRET_KEY = env.CLERK_SECRET_KEY || process.env.CLERK_SECRET_KEY;

if (!CLERK_SECRET_KEY) {
  console.error("❌ CLERK_SECRET_KEY not found in .env.local");
  process.exit(1);
}

const csvPath = resolve(__dirname, "../students_new.csv");

if (!fs.existsSync(csvPath)) {
  console.error("❌ students.csv not found in the root directory!");
  console.log("Please create a file named students.csv with these columns (separated by commas):");
  console.log("adm_no,student_name,class,password");
  process.exit(1);
}

// Very simple CSV parser for basic columns (assuming no commas inside quotes)
function parseCSV(content) {
  const lines = content.split("\n").map(l => l.trim()).filter(l => l.length > 0);
  if (lines.length < 2) return [];
  
  const headers = lines[0].split(",").map(h => h.trim().toLowerCase());
  const rows = [];
  
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(",").map(v => v.trim());
    const obj = {};
    headers.forEach((header, index) => {
      obj[header] = values[index] || "";
    });
    rows.push(obj);
  }
  return rows;
}

async function uploadStudents() {
  const content = fs.readFileSync(csvPath, "utf-8");
  const students = parseCSV(content);
  
  console.log(`Found ${students.length} students in CSV. Starting upload to Clerk...\n`);

  let successCount = 0;
  let failCount = 0;

  for (const student of students) {
    // Looks for 'username', 'adm no', or 'adm_no'
    let rawUsername = student.username || student["adm no"] || student.adm_no;
    
    // Clerk requires at least one letter in usernames so it doesn't confuse them with phone numbers.
    // We will automatically add 's' (for student) to the front if it's purely numbers.
    const username = /^\d+$/.test(rawUsername) ? `s${rawUsername}` : rawUsername;

    // Append @doon to all passwords to guarantee they meet the 8 character minimum
    const password = student.password ? student.password.trim() + "@doon" : "";
    // Looks for 'student name' or 'student_name'
    const fullName = student["student name"] || student.student_name || "";
    const studentClass = student.class || "";

    if (!username || !password) {
      console.log(`⚠️ Skipping a row due to missing username/adm_no or password.`);
      failCount++;
      continue;
    }

    // Split name to First and Last
    const nameParts = fullName.split(" ");
    const firstName = nameParts[0] || "";
    const lastName = nameParts.slice(1).join(" ") || "";

    try {
      const response = await fetch("https://api.clerk.com/v1/users", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${CLERK_SECRET_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          username: username,
          password: password,
          first_name: firstName,
          last_name: lastName,
          email_address: [`${username}@doonscholars.com`],
          public_metadata: {
            class: studentClass
          }
        })
      });

      const data = await response.json();

      if (response.ok) {
        console.log(`✅ Success: Created student ${username} (${firstName})`);
        successCount++;
      } else {
        // Ignore if user already exists
        if (data.errors && data.errors[0]?.code === "form_username_invalid" && data.errors[0]?.message.includes("taken")) {
           console.log(`⏩ Skipped: Student ${username} already exists in Clerk.`);
        } else {
           console.log(`❌ Error creating ${username}:`, JSON.stringify(data.errors, null, 2));
           failCount++;
        }
      }
    } catch (error) {
      console.log(`❌ Network Error for ${username}: ${error.message}`);
      failCount++;
    }
    
    // Slight delay to prevent hitting API rate limits (Clerk allows ~20 requests per second)
    await new Promise(r => setTimeout(r, 100));
  }

  console.log(`\n🎉 Upload Complete!`);
  console.log(`✅ Successfully created: ${successCount}`);
  console.log(`❌ Failed or Skipped: ${failCount}`);
}

uploadStudents();
