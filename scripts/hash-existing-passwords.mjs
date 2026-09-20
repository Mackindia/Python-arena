/**
 * Migration script to hash all existing plaintext passwords in MongoDB
 * Run with: node scripts/hash-existing-passwords.mjs
 * 
 * This script finds all users with plaintext passwords and hashes them using bcrypt.
 * It sets passwordHashVersion = 1 to mark them as migrated.
 */

import mongoose from "mongoose";
import bcrypt from "bcrypt";

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/doon-scholars";
const SALT_ROUNDS = 12;

const UserSchema = new mongoose.Schema({
  username: String,
  password: String,
  passwordHashVersion: Number,
}, { strict: false });

const User = mongoose.model("User", UserSchema);

async function migratePasswords() {
  console.log("Connecting to MongoDB...");
  await mongoose.connect(MONGODB_URI);
  console.log("Connected.\n");

  const users = await User.find({
    $or: [
      { passwordHashVersion: { $exists: false } },
      { passwordHashVersion: { $lt: 1 } },
    ],
  }).select("username password").lean();

  console.log(`Found ${users.length} users with plaintext passwords.\n`);

  let migrated = 0;
  let skipped = 0;

  for (const user of users) {
    if (!user.password) {
      skipped++;
      continue;
    }

    if (user.password.startsWith("$2b$") || user.password.startsWith("$2a$")) {
      skipped++;
      continue;
    }

    try {
      const hashedPassword = await bcrypt.hash(user.password, SALT_ROUNDS);
      await User.updateOne(
        { _id: user._id },
        { $set: { password: hashedPassword, passwordHashVersion: 1 } }
      );
      migrated++;
      console.log(`  Migrated: ${user.username}`);
    } catch (err) {
      console.error(`  Failed to migrate ${user.username}:`, err.message);
    }
  }

  console.log(`\nMigration complete.`);
  console.log(`  Migrated: ${migrated}`);
  console.log(`  Skipped: ${skipped}`);

  await mongoose.disconnect();
  console.log("Disconnected.");
}

migratePasswords().catch(console.error);
