import mongoose, { Schema, Types } from "mongoose";

function toSlug(text: string) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

const ChapterSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, trim: true },
    order: { type: Number, default: 0 },
  },
  { _id: false },
);

const CourseSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, index: true },
    description: { type: String, default: "" },
    subject: { type: String, required: true, trim: true, index: true },
    subjectSlug: { type: String, default: "", trim: true, index: true },
    classLevel: { type: String, required: true, trim: true, index: true },
    classSlug: { type: String, default: "", trim: true, index: true },
    category: { type: String, default: "" },
    difficulty: {
      type: String,
      enum: ["beginner", "intermediate", "advanced"],
      default: "beginner",
    },
    thumbnail: { type: String, default: "" },
    chapters: { type: [ChapterSchema], default: [] },
    status: {
      type: String,
      enum: ["draft", "published", "archived"],
      default: "draft",
      index: true,
    },
    createdBy: { type: String, default: "" },
    updatedBy: { type: String, default: "" },
  },
  { timestamps: true },
);

CourseSchema.pre("validate", function () {
  if (!this.slug && this.title) {
    this.slug = toSlug(this.title);
  }

  if (Array.isArray(this.chapters)) {
    this.chapters = this.chapters.map((chapter: { title: string; slug?: string; order?: number }, index: number) => ({
      title: chapter.title,
      slug: chapter.slug?.trim() || toSlug(chapter.title),
      order: chapter.order ?? index,
    }));
  }
});

CourseSchema.index({ title: "text", description: "text", subject: "text", category: "text" });

export type CourseDocument = {
  _id: Types.ObjectId;
  title: string;
  slug: string;
  description: string;
  subject: string;
  classLevel: string;
  category: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  thumbnail: string;
  status: "draft" | "published" | "archived";
};

export default mongoose.models.Course || mongoose.model("Course", CourseSchema);
