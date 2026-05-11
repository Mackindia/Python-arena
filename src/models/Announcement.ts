import mongoose, { Schema } from "mongoose";

const AnnouncementSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    targetRoles: { type: [String], default: ["student", "teacher", "admin"] },
    level: { type: String, enum: ["info", "warning", "exam"], default: "info" },
    isActive: { type: Boolean, default: true },
    createdBy: { type: String, default: "" },
  },
  { timestamps: true },
);

AnnouncementSchema.index({ title: "text", message: "text" });

export default mongoose.models.Announcement || mongoose.model("Announcement", AnnouncementSchema);
