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

async function clearSessions() {
  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  const db = client.db();
  
  const result = await db.collection("activesessions").deleteMany({});
  console.log(`✅ Cleared ${result.deletedCount} old stuck active sessions!`);
  
  await client.close();
}

clearSessions();
