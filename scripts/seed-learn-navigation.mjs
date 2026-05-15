/**
 * Seed only the predefined Learn navigation matrix (idempotent).
 * Run: node scripts/seed-learn-navigation.mjs
 */

import { MongoClient } from "mongodb";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dirname, "../.env.local");

function loadEnvFile(filePath) {
  const envContent = readFileSync(filePath, "utf-8");
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
}

const env = loadEnvFile(envPath);
const MONGODB_URI = env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error("MONGODB_URI not found in .env.local");
  process.exit(1);
}

const NAV_MATRIX = JSON.parse(readFileSync(resolve(__dirname, "../src/data/learn-navigation.json"), "utf-8"));

async function run() {
  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    const db = client.db();

    console.log("Connected to MongoDB. Seeding Learn navigation...");

    for (const entry of NAV_MATRIX) {
      const now = new Date();
      const subjectResult = await db.collection("subjects").findOneAndUpdate(
        { slug: entry.subject.slug },
        {
          $set: {
            name: entry.subject.name,
            slug: entry.subject.slug,
            description: entry.subject.description,
            updatedAt: now,
          },
          $setOnInsert: {
            createdAt: now,
          },
        },
        { upsert: true, returnDocument: "after" },
      );

      const subjectDoc = subjectResult;
      if (!subjectDoc?._id) {
        throw new Error(`Failed to upsert subject ${entry.subject.slug}`);
      }

      for (const cls of entry.classes) {
        await db.collection("classes").updateOne(
          { subject: subjectDoc._id, slug: cls.slug },
          {
            $set: {
              name: cls.name,
              slug: cls.slug,
              subject: subjectDoc._id,
              updatedAt: now,
            },
            $setOnInsert: {
              createdAt: now,
            },
          },
          { upsert: true },
        );
      }

      console.log(`Upserted: ${entry.subject.name} (${entry.classes.length} classes/categories)`);
    }

    console.log("Learn navigation seed complete.");
  } catch (error) {
    console.error("Seed failed:", error instanceof Error ? error.message : String(error));
    process.exit(1);
  } finally {
    await client.close();
  }
}

run();
