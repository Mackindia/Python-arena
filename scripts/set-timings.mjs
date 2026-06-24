import { MongoClient } from "mongodb";
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
const MONGODB_URI = env.MONGODB_URI || process.env.MONGODB_URI;

// ==============================================
// EDIT YOUR TIMINGS HERE (Use 24-Hour Format)
// ==============================================
const periodTimings = [
  { period_no: 1, start_time: "08:00", end_time: "08:40" },
  { period_no: 2, start_time: "08:40", end_time: "09:20" },
  { period_no: 3, start_time: "09:20", end_time: "10:00" },
  { period_no: 4, start_time: "10:00", end_time: "10:40" },
  { period_no: 5, start_time: "11:00", end_time: "11:40" }, // After Break
  { period_no: 6, start_time: "11:40", end_time: "12:20" },
  { period_no: 7, start_time: "12:20", end_time: "13:00" },
  { period_no: 8, start_time: "13:00", end_time: "13:40" }
];

async function updateTimings() {
  if (!MONGODB_URI) {
    console.error("❌ MONGODB_URI not found!");
    process.exit(1);
  }

  const client = new MongoClient(MONGODB_URI);
  try {
    await client.connect();
    const db = client.db();
    
    // Clear old timings
    await db.collection("periods").deleteMany({});
    
    // Insert new timings
    await db.collection("periods").insertMany(periodTimings);
    
    console.log("✅ Successfully updated Period Timings in the database!");
    console.log(periodTimings);
  } catch (error) {
    console.error("❌ Error updating timings:", error);
  } finally {
    await client.close();
  }
}

updateTimings();
