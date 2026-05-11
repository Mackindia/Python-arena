import mongoose, { Schema } from "mongoose";

const CommentSchema = new Schema(
  {
    lessonPath: { type: String, required: true, index: true },
    courseSlug: { type: String, default: "", index: true },
    chapterSlug: { type: String, default: "", index: true },
    userId: { type: String, required: true, index: true },
    userName: { type: String, required: true },
    userEmail: { type: String, default: "" },
    message: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "approved",
      index: true,
    },
    isSpam: { type: Boolean, default: false, index: true },
  },
  { timestamps: true },
);

CommentSchema.index({ message: "text", lessonPath: "text" });

export default mongoose.models.Comment || mongoose.model("Comment", CommentSchema);
