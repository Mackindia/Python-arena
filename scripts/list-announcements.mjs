import fs from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import mongoose from "mongoose";

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
const MONGODB_URI = env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error("❌ MONGODB_URI not found");
  process.exit(1);
}

async function listAnnouncements() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("Connected to MongoDB.");

    const Announcement = mongoose.models.Announcement || mongoose.model("Announcement", new mongoose.Schema({
      title: String,
      message: String,
      level: String,
      targetClass: String,
      isActive: Boolean,
    }, { timestamps: true }));

    const notices = await Announcement.find({});
    
    if (notices.length === 0) {
      console.log("\n⚠️ No announcements found in the database!");
      console.log("Please go to http://localhost:3000/admin/announcements and create one.");
    } else {
      console.log(`\n✅ Found ${notices.length} announcements:`);
      notices.forEach((n, i) => {
        console.log(`${i+1}. [${n.level.toUpperCase()}] To: ${n.targetClass} - ${n.title}`);
        console.log(`   Message: ${n.message}`);
        console.log(`   Active: ${n.isActive}\n`);
      });
    }

  } catch (error) {
    console.error("❌ Error:", error.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

listAnnouncements();
