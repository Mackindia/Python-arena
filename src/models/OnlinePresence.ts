import mongoose from "mongoose";

const OnlinePresenceSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      required: true,
    },
    lastSeen: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  { timestamps: true }
);

OnlinePresenceSchema.index({ lastSeen: 1 }, { expireAfterSeconds: 60 });

export default mongoose.models.OnlinePresence ||
  mongoose.model("OnlinePresence", OnlinePresenceSchema);
