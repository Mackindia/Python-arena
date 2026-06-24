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

// Data to create
const newNotice = {
  title: "EXAM UPDATE",
  message: "Your Python Practical Exam is scheduled for Monday, 20th May. Please bring your project files.",
  level: "exam",
  targetClass: "XI - SCIENCE-A", // Change to "All" for everyone
  isActive: true,
};

async function createNotice() {
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

    const result = await Announcement.create(newNotice);
    console.log("✅ Notice Created Successfully!");
    console.log(result);

  } catch (error) {
    console.error("❌ Error:", error.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

createNotice();
