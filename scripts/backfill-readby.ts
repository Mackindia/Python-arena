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
      readBy: [
        {
          userId: String,
          readAt: Date,
        },
      ],
      createdAt: Date,
    },
  ],
  status: String,
  unreadByAdmin: Boolean,
  unreadByUser: Boolean,
}, { timestamps: true });

const Message = mongoose.models.Message || mongoose.model("Message", MessageSchema);

async function backfill() {
  console.log("Connecting to MongoDB...");
  await mongoose.connect(MONGODB_URI);
  console.log("Connected.\n");

  const totalThreads = await Message.countDocuments();
  console.log(`Total threads: ${totalThreads}`);

  // Update all messages that don't have readBy field
  const result = await Message.updateMany(
    { "messages.readBy": { $exists: false } },
    { $set: { "messages.$[].readBy": [] } }
  );

  console.log(`\nBackfill Complete!`);
  console.log(`Threads modified: ${result.modifiedCount}`);

  await mongoose.disconnect();
  console.log("Disconnected from MongoDB.");
}

backfill().catch((err) => {
  console.error("Backfill failed:", err);
  process.exit(1);
});
