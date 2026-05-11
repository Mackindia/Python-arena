/**
 * Seed script: sets admin role + seeds LMS subjects and classes
 * Run: node scripts/seed-lms.mjs
 */

import { MongoClient } from "mongodb";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dirname, "../.env.local");

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
const ADMIN_EMAIL = env.SEED_ADMIN_EMAIL || "abhishekr474@gmail.com";

if (!MONGODB_URI) {
  console.error("MONGODB_URI not found in .env.local");
  process.exit(1);
}

function toSlug(str) {
  return str.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-");
}

const SUBJECTS = [
  { name: "Python", slug: "python", description: "Python programming language lessons" },
  { name: "AI", slug: "ai", description: "Artificial Intelligence lessons" },
  { name: "Computer Science", slug: "computer-science", description: "Computer Science fundamentals" },
];

const CLASS_NAMES = [
  { name: "Class 6", slug: "class-6" },
  { name: "Class 7", slug: "class-7" },
  { name: "Class 8", slug: "class-8" },
  { name: "Class 9", slug: "class-9" },
  { name: "Class 10", slug: "class-10" },
  { name: "Class 11", slug: "class-11" },
  { name: "Class 12", slug: "class-12" },
];

async function run() {
  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    console.log("✓ Connected to MongoDB");

    const db = client.db();

    // 1. Set user role to admin
    const userResult = await db.collection("users").updateOne(
      { email: ADMIN_EMAIL },
      { $set: { role: "admin" } }
    );
    if (userResult.matchedCount === 0) {
      console.warn(`⚠ No user found with email: ${ADMIN_EMAIL}`);
      console.warn("  → The user role will be set when they first sign in.");
    } else {
      console.log(`✓ Set role=admin for user: ${ADMIN_EMAIL} (modified: ${userResult.modifiedCount})`);
    }

    // 2. Seed subjects
    console.log("\nSeeding subjects...");
    const subjectIds = {};

    for (const subject of SUBJECTS) {
      const existing = await db.collection("subjects").findOne({ slug: subject.slug });
      if (existing) {
        console.log(`  - Subject "${subject.name}" already exists`);
        subjectIds[subject.slug] = existing._id;
      } else {
        const result = await db.collection("subjects").insertOne({
          name: subject.name,
          slug: subject.slug,
          description: subject.description,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        console.log(`  ✓ Created subject: ${subject.name}`);
        subjectIds[subject.slug] = result.insertedId;
      }
    }

    // 3. Seed classes for each subject
    console.log("\nSeeding classes...");
    for (const [subjectSlug, subjectId] of Object.entries(subjectIds)) {
      for (const cls of CLASS_NAMES) {
        const existing = await db.collection("classes").findOne({
          slug: cls.slug,
          subject: subjectId,
        });
        if (existing) {
          console.log(`  - Class "${cls.name}" for ${subjectSlug} already exists`);
        } else {
          await db.collection("classes").insertOne({
            name: cls.name,
            slug: cls.slug,
            subject: subjectId,
            createdAt: new Date(),
            updatedAt: new Date(),
          });
          console.log(`  ✓ Created class: ${cls.name} (subject: ${subjectSlug})`);
        }
      }
    }

    console.log("\n✅ Seed complete! You can now:");
    console.log("   1. Sign out and sign back in (to refresh admin role from DB)");
    console.log("   2. Go to /admin/upload");
    console.log("   3. Upload your lesson PDF + thumbnail and publish");

  } catch (err) {
    console.error("Seed failed:", err.message);
    process.exit(1);
  } finally {
    await client.close();
  }
}

run();
