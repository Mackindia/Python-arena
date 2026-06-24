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
const CLERK_SECRET_KEY = env.CLERK_SECRET_KEY;

if (!CLERK_SECRET_KEY) {
  console.error("❌ CLERK_SECRET_KEY not found");
  process.exit(1);
}

const username = process.argv[2];
if (!username) {
  console.error("❌ Please provide a username, e.g.: node scripts/check-student-metadata.mjs s1547");
  process.exit(1);
}

async function checkUser() {
  console.log(`🔍 Checking Clerk data for: ${username}...`);
  try {
    const response = await fetch(`https://api.clerk.com/v1/users?username=${username}`, {
      headers: { "Authorization": `Bearer ${CLERK_SECRET_KEY}` }
    });
    const users = await response.json();

    if (!response.ok || users.length === 0) {
      console.error("❌ User not found in Clerk.");
      return;
    }

    const user = users[0];
    console.log(`\n✅ User Found: ${user.first_name} ${user.last_name}`);
    console.log(`🆔 ID: ${user.id}`);
    console.log(`🏢 Public Metadata:`, JSON.stringify(user.public_metadata, null, 2));

    if (!user.public_metadata?.class) {
      console.log("\n⚠️ WARNING: This user has NO CLASS assigned in metadata!");
      console.log("This is why announcements aren't showing up.");
    } else {
      console.log(`\n✨ This user is in: "${user.public_metadata.class}"`);
    }

  } catch (error) {
    console.error("❌ Error:", error.message);
  }
}

checkUser();
