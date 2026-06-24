import mongoose, { Schema, Document } from "mongoose";

export interface IResetRequest extends Document {
  username: string;
  studentName?: string;
  status: "pending" | "approved" | "rejected";
  createdAt: Date;
}

const ResetRequestSchema = new Schema<IResetRequest>({
  username: {
    type: String,
    required: true,
  },
  studentName: {
    type: String,
    required: false,
  },
  status: {
    type: String,
    enum: ["pending", "approved", "rejected"],
    default: "pending",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export const ResetRequest = mongoose.models.ResetRequest || mongoose.model<IResetRequest>("ResetRequest", ResetRequestSchema);
