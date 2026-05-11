import mongoose, { Schema, Types } from "mongoose";

function toSlug(text: string) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

const LessonSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, trim: true, index: true },
    content: { type: String, default: "" },
    courseId: { type: Schema.Types.ObjectId, ref: "Course", required: true, index: true },
    chapterSlug: { type: String, default: "", index: true },
    order: { type: Number, default: 0, index: true },
    state: {
      type: String,
      enum: ["draft", "published", "archived"],
      default: "draft",
      index: true,
    },
    tags: { type: [String], default: [] },
    createdBy: { type: String, default: "" },
    updatedBy: { type: String, default: "" },
  },
  { timestamps: true },
);

LessonSchema.index({ courseId: 1, slug: 1 }, { unique: true });

LessonSchema.pre("validate", function () {
  if (!this.slug && this.title) {
    this.slug = toSlug(this.title);
  }
});

LessonSchema.index({ title: "text", content: "text", chapterSlug: "text" });

export type LessonDocument = {
  _id: Types.ObjectId;
  title: string;
  slug: string;
  content: string;
  courseId: Types.ObjectId;
  chapterSlug: string;
  order: number;
  state: "draft" | "published" | "archived";
};

export default mongoose.models.Lesson || mongoose.model("Lesson", LessonSchema);
