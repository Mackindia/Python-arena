import mongoose, { Schema } from "mongoose";

const BlockedUserSchema = new Schema(
  {
    userId: { type: String, required: true, unique: true, index: true },
    reason: { type: String, default: "" },
    blockedBy: { type: String, default: "" },
  },
  { timestamps: true },
);

export default mongoose.models.BlockedUser || mongoose.model("BlockedUser", BlockedUserSchema);
