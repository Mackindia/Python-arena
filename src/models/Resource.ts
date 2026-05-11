import mongoose, { Schema } from "mongoose";

const ResourceSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    kind: {
      type: String,
      enum: ["pdf", "worksheet", "image", "assignment", "thumbnail", "other"],
      default: "other",
      index: true,
    },
    url: { type: String, required: true },
    publicId: { type: String, default: "" },
    courseId: { type: Schema.Types.ObjectId, ref: "Course", default: null, index: true },
    lessonId: { type: Schema.Types.ObjectId, ref: "Lesson", default: null, index: true },
    classLevel: { type: String, default: "", index: true },
    category: { type: String, default: "", index: true },
    mimeType: { type: String, default: "" },
    size: { type: Number, default: 0 },
    uploadedBy: { type: String, default: "" },
  },
  { timestamps: true },
);

ResourceSchema.index({ title: "text", category: "text", classLevel: "text", kind: "text" });

export default mongoose.models.Resource || mongoose.model("Resource", ResourceSchema);
