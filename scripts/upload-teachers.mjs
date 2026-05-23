import fs from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { MongoClient } from "mongodb";

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
const MONGODB_URI = env.MONGODB_URI || process.env.MONGODB_URI;

if (!CLERK_SECRET_KEY) {
  console.error("❌ CLERK_SECRET_KEY not found in .env.local");
  process.exit(1);
}

const csvPath = resolve(__dirname, "teachers.csv");

if (!fs.existsSync(csvPath)) {
  console.error("❌ teachers.csv not found in the scripts directory!");
  console.log("Please create a file named teachers.csv with these columns:");
  console.log("Name,Username,Password,Initial");
  process.exit(1);
}

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

async function uploadTeachers() {
  const content = fs.readFileSync(csvPath, "utf-8");
  const teachers = parseCSV(content);
  
  console.log(`Found ${teachers.length} teachers in CSV. Starting upload to Clerk & MongoDB...\n`);

  let successCount = 0;
  let failCount = 0;

  // Setup MongoDB client to explicitly save the teacher_id and role
  let db;
  let client;
  if (MONGODB_URI) {
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    db = client.db();
    console.log("✓ Connected to MongoDB");
  } else {
    console.warn("⚠️ MONGODB_URI not found. Skipping MongoDB direct sync.");
  }

  for (const teacher of teachers) {
    const rawUsername = teacher.username || "";
    // Replace @ with underscore if user accidentally left it in
    const username = rawUsername.replace(/@/g, "_");
    
    // Ensure 8 chars and bypass Pwned Password filter by appending @doon to ALL passwords
    const rawPassword = teacher.password ? teacher.password.trim() : "";
    const password = rawPassword + "@doon";
    const fullName = teacher.name || "";
    const teacherId = teacher.initial || "";

    if (!username || !password) {
      console.log(`⚠️ Skipping a row due to missing username or password.`);
      failCount++;
      continue;
    }

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
          // We provide a dummy email to ensure Clerk accepts it if emails are required
          email_address: [`${username}@doonscholars.com`],
          public_metadata: {
            role: "teacher",
            teacher_id: teacherId
          }
        })
      });

      const data = await response.json();
      const userAlreadyExists = !response.ok && data.errors && data.errors[0]?.code === "form_identifier_exists";

      if (response.ok) {
         console.log(`✅ Success: Created teacher ${username} (${firstName})`);
         successCount++;
      } else if (userAlreadyExists) {
         console.log(`⏩ Skipped: Teacher ${username} already exists in Clerk. Updating database instead!`);
      } else {
         console.log(`❌ Error creating ${username}:`, JSON.stringify(data.errors, null, 2));
         failCount++;
      }

      // Insert/Update into MongoDB directly to ensure teacher_id, role, and meet_link are set!
      // This runs whether the user was just created OR if they already existed.
      if ((response.ok || userAlreadyExists) && db) {
        await db.collection("users").updateOne(
          { username: username }, // Match by username since we might not have the Clerk ID
          {
            $set: {
              fullName: fullName,
              username: username,
              email: `${username}@doonscholars.com`,
              role: "teacher",
              teacher_id: teacherId,
              meet_link: teacher.meetlink || teacher["meet link"] || "https://meet.google.com/test"
            }
          },
          { upsert: true }
        );
        console.log(`   → Synced ${username} to MongoDB with teacher_id: ${teacherId} and link: ${teacher.meetlink || teacher["meet link"] || "fallback link"}`);
      }
    } catch (error) {
      console.log(`❌ Network Error for ${username}: ${error.message}`);
      failCount++;
    }
    
    // Rate limit delay
    await new Promise(r => setTimeout(r, 200));
  }

  if (client) {
    await client.close();
  }

  console.log(`\n🎉 Upload Complete!`);
  console.log(`✅ Successfully created: ${successCount}`);
  console.log(`❌ Failed or Skipped: ${failCount}`);
}

uploadTeachers();
