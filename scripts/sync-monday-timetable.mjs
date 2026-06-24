import { MongoClient } from "mongodb";
import { readFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dirname, "../.env.local");
const csvPath = resolve(__dirname, "monday.csv");

// Parse .env.local
const envContent = readFileSync(envPath, "utf-8");
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

const MONGODB_URI = env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error("MONGODB_URI not found in .env.local");
  process.exit(1);
}

if (!existsSync(csvPath)) {
  console.error("❌ monday.csv not found!");
  console.log("Please create a file named 'monday.csv' inside the scripts folder with these columns:");
  console.log("class,section,group,period_no,subject,teacher_id,teacher_name");
  console.log("Example row: 11,A,MAIN,1,Physics,T101,John Doe");
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

async function run() {
  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    console.log("✓ Connected to MongoDB");

    const db = client.db();
    const timetablesCollection = db.collection("timetables");

    const content = readFileSync(csvPath, "utf-8");
    const periods = parseCSV(content);

    console.log(`Found ${periods.length} periods in monday.csv.\n`);
    
    // Clear existing Monday schedule to avoid duplicates
    const deleteResult = await timetablesCollection.deleteMany({ day: "Monday" });
    console.log(`Cleared ${deleteResult.deletedCount} old Monday periods.`);

    let successCount = 0;
    const newEntries = [];

    for (const p of periods) {
      if (p.class && p.section && p.period_no && p.subject && p.teacher_id) {
        newEntries.push({
          class: p.class,
          section: p.section,
          group: p.group || "MAIN",
          day: "Monday",
          period_no: Number(p.period_no),
          subject: p.subject,
          teacher_id: p.teacher_id,
          teacher_name: p.teacher_name || "",
        });
        successCount++;
      } else {
         console.warn("⚠️ Skipping row missing required data (class/section/period_no/subject/teacher_id):", p);
      }
    }

    if (newEntries.length > 0) {
      await timetablesCollection.insertMany(newEntries);
      console.log(`✅ Successfully inserted ${successCount} periods for Monday!`);
      console.log("🎉 Your online classes are now aligned with the new Monday schedule!");
    } else {
      console.log("⚠️ No valid rows found to insert.");
    }

  } catch (err) {
    console.error("❌ Sync failed:", err.message);
    process.exit(1);
  } finally {
    await client.close();
  }
}

run();
