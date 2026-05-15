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

async function listAllUsers() {
  console.log("Fetching users from Clerk...");
  try {
    const response = await fetch("https://api.clerk.com/v1/users?limit=100", {
      headers: {
        "Authorization": `Bearer ${CLERK_SECRET_KEY}`,
      }
    });

    const users = await response.json();

    if (!response.ok) {
      console.error("❌ Error fetching users:", users);
      return;
    }

    console.log(`Found ${users.length} users:`);
    users.forEach(u => {
      console.log(`- ${u.username} (${u.id}) | Role: ${u.public_metadata?.role || "none"} | Class: ${u.public_metadata?.class || "none"}`);
    });
  } catch (error) {
    console.error("❌ Error:", error.message);
  }
}

listAllUsers();
