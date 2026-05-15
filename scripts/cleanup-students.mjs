import fs from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import mongoose from "mongoose";

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dirname, "../.env.local");

// 1. Load Environment Variables
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
const MONGODB_URI = env.MONGODB_URI;

if (!CLERK_SECRET_KEY || !MONGODB_URI) {
  console.error("❌ CLERK_SECRET_KEY or MONGODB_URI not found in .env.local");
  process.exit(1);
}

async function cleanup() {
  console.log("🚀 Starting cleanup process...");

  try {
    // --- PART 1: CLERK CLEANUP ---
    console.log("\n--- Part 1: Deleting Students from Clerk ---");
    const response = await fetch("https://api.clerk.com/v1/users?limit=500", {
      headers: { "Authorization": `Bearer ${CLERK_SECRET_KEY}` }
    });
    const users = await response.json();

    if (!response.ok) throw new Error(`Clerk Error: ${JSON.stringify(users)}`);

    let deletedCount = 0;
    for (const user of users) {
      const role = user.public_metadata?.role;
      const hasClass = user.public_metadata?.class;

      // SAFETY: Only delete if role is not admin AND (it's a student role or has a class assigned)
      if (role !== "admin" && (role === "student" || hasClass)) {
        console.log(`🗑️ Deleting student: ${user.username} (${user.id})...`);
        const delRes = await fetch(`https://api.clerk.com/v1/users/${user.id}`, {
          method: "DELETE",
          headers: { "Authorization": `Bearer ${CLERK_SECRET_KEY}` }
        });
        if (delRes.ok) deletedCount++;
        else console.error(`❌ Failed to delete ${user.username}`);
        
        await new Promise(r => setTimeout(r, 100)); // Rate limiting
      } else {
        console.log(`🛡️ Skipping Admin/System user: ${user.username}`);
      }
    }
    console.log(`✅ Deleted ${deletedCount} students from Clerk.`);

    // --- PART 2: MONGODB CLEANUP ---
    console.log("\n--- Part 2: Cleaning up MongoDB ---");
    await mongoose.connect(MONGODB_URI);
    console.log("Connected to MongoDB.");

    // Define temporary schemas to clear collections
    const collectionsToClear = [
      { name: "User", filter: { role: "student" } },
      { name: "PythonProgram", filter: {} },
      { name: "QuizResult", filter: {} },
      { name: "ResetRequest", filter: {} }
    ];

    for (const col of collectionsToClear) {
      const model = mongoose.models[col.name] || mongoose.model(col.name, new mongoose.Schema({}, { strict: false }));
      const result = await model.deleteMany(col.filter);
      console.log(`🧹 Cleared ${result.deletedCount} items from ${col.name} collection.`);
    }

    console.log("\n✨ Cleanup Complete! Your system is now fresh.");
    console.log("You can now run: node scripts/upload-students.mjs");

  } catch (error) {
    console.error("\n❌ Fatal Error:", error.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

cleanup();
