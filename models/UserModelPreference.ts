import mongoose, { Schema, Document } from "mongoose";

export interface IUserModelPreference extends Document {
  userId: string;
  preferredProvider: string;
  maxCostPerRequest: number;
  speedPreference: "high" | "balanced" | "quality";
  fallbackModel: string;
}

const UserModelPreferenceSchema = new Schema<IUserModelPreference>({
  userId: { type: String, required: true, unique: true },
  preferredProvider: { type: String, default: "auto" },
  maxCostPerRequest: { type: Number, default: 0.1 },
  speedPreference: { type: String, enum: ["high", "balanced", "quality"], default: "balanced" },
  fallbackModel: { type: String, default: "gemini-2.5-flash" }
}, { timestamps: true });

export default mongoose.models.UserModelPreference || mongoose.model<IUserModelPreference>("UserModelPreference", UserModelPreferenceSchema);
