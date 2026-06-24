import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const MONGODB_URI = process.env.MONGODB_URI;

async function main() {
  console.log("Connecting to MongoDB...");
  await mongoose.connect(MONGODB_URI);
  console.log("Connected.");

  const db = mongoose.connection.db;

  console.log("\n--- Checking SyncStore Document ---");
  const syncStore = await db.collection("syncstores").findOne({});
  console.log(JSON.stringify(syncStore, null, 2));

  await mongoose.disconnect();
}

main().catch(console.error);
