import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(__dirname, "../.env.local") });

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error("MONGODB_URI not found in .env.local");
  process.exit(1);
}

const MessageSchema = new mongoose.Schema({
  userId: String,
  userName: String,
  userRole: String,
  subject: String,
  messages: [
    {
      senderId: String,
      sender: String,
      senderRole: String,
      text: String,
      createdAt: Date,
    },
  ],
  status: String,
  unreadByAdmin: Boolean,
  unreadByUser: Boolean,
}, { timestamps: true });

const UserSchema = new mongoose.Schema({
  fullName: String,
  username: String,
  role: String,
});

const Message = mongoose.models.Message || mongoose.model("Message", MessageSchema);
const User = mongoose.models.User || mongoose.model("User", UserSchema);

async function backfill() {
  console.log("Connecting to MongoDB...");
  await mongoose.connect(MONGODB_URI);
  console.log("Connected.\n");

  const totalThreads = await Message.countDocuments();
  console.log(`Total threads in database: ${totalThreads}`);

  const threadsWithoutSenderId = await Message.find({
    "messages.senderId": { $exists: false }
  });
  console.log(`Threads with old messages (no senderId): ${threadsWithoutSenderId.length}\n`);

  if (threadsWithoutSenderId.length === 0) {
    console.log("Nothing to backfill. All messages already have senderId.");
    await mongoose.disconnect();
    return;
  }

  const users = await User.find().lean();
  const nameToId = new Map<string, string>();
  for (const user of users) {
    const name = user.fullName || user.username;
    if (name) {
      nameToId.set(name, String(user._id));
    }
  }
  console.log(`Loaded ${nameToId.size} users for name-to-ID mapping.\n`);

  let totalMessages = 0;
  let matched = 0;
  let unmatched = 0;
  const unmatchedNames = new Set<string>();

  for (const thread of threadsWithoutSenderId) {
    let modified = false;
    for (const msg of thread.messages) {
      if (msg.senderId) continue;
      totalMessages++;

      const userId = nameToId.get(msg.sender);
      if (userId) {
        msg.senderId = userId;
        matched++;
        modified = true;
      } else {
        unmatched++;
        unmatchedNames.add(msg.sender);
      }
    }
    if (modified) {
      await thread.save();
    }
  }

  console.log("--- Backfill Complete ---");
  console.log(`Total old messages: ${totalMessages}`);
  console.log(`Matched (senderId added): ${matched}`);
  console.log(`Unmatched (no user found): ${unmatched}`);

  if (unmatchedNames.size > 0) {
    console.log(`\nUnmatched sender names:`);
    for (const name of unmatchedNames) {
      console.log(`  - "${name}"`);
    }
  }

  await mongoose.disconnect();
  console.log("\nDisconnected from MongoDB.");
}

backfill().catch((err) => {
  console.error("Backfill failed:", err);
  process.exit(1);
});
