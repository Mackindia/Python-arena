import mongoose, { InferSchemaType, Model, Schema, Types } from "mongoose";
import { commonSchemaOptions, toSlug } from "./shared";

const LessonSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, trim: true },
    contentType: {
      type: String,
      enum: ["notes", "cbse-pdf", "mixed"],
      default: "notes",
      index: true,
    },
    subject: { type: Schema.Types.ObjectId, ref: "Subject", required: true, index: true },
    class: { type: Schema.Types.ObjectId, ref: "Class", required: true, index: true },
    description: { type: String, default: "", trim: true },
    content: { type: String, default: "" },
    pdfUrl: { type: String, default: "", trim: true },
    thumbnailUrl: { type: String, default: "", trim: true },
    pdfTextExtraction: {
      status: {
        type: String,
        enum: ["pending", "succeeded", "failed", "skipped"],
        default: "pending",
      },
      sourceUrl: { type: String, default: "", trim: true },
      pageCount: { type: Number, default: 0 },
      extractedAt: { type: Date },
      contentLength: { type: Number, default: 0 },
      error: { type: String, default: "", trim: true },
    },
    thumbnail: { type: String, default: "", trim: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    published: { type: Boolean, default: false, index: true },
  },
  commonSchemaOptions,
);

LessonSchema.pre("validate", function () {
  if (!this.slug && this.title) {
    this.slug = toSlug(this.title);
  }
});

LessonSchema.index({ class: 1, slug: 1 }, { unique: true });
LessonSchema.index({ subject: 1, class: 1, published: 1 });
LessonSchema.index({ subject: 1, class: 1, contentType: 1, published: 1 });
LessonSchema.index({ title: "text", description: "text", content: "text" });

export type LessonDocument = InferSchemaType<typeof LessonSchema> & {
  _id: Types.ObjectId;
};

const LessonModel =
  (mongoose.models.LmsLesson as Model<LessonDocument>) ||
  mongoose.model<LessonDocument>("LmsLesson", LessonSchema, "lessons");

export default LessonModel;
