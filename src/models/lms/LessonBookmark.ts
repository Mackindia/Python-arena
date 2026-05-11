import mongoose, { InferSchemaType, Model, Schema, Types } from "mongoose";
import { commonSchemaOptions } from "./shared";

const LessonBookmarkSchema = new Schema(
  {
    userId: { type: String, required: true, index: true },
    lesson: { type: Schema.Types.ObjectId, ref: "LmsLesson", required: true, index: true },
    subject: { type: Schema.Types.ObjectId, ref: "Subject", required: true, index: true },
    class: { type: Schema.Types.ObjectId, ref: "Class", required: true, index: true },
    // Denormalised slugs for fast URL construction without extra joins
    lessonSlug: { type: String, required: true, trim: true },
    subjectSlug: { type: String, required: true, trim: true },
    classSlug: { type: String, required: true, trim: true },
    // Snapshot of lesson metadata at bookmark time
    lessonTitle: { type: String, default: "", trim: true },
    lessonThumbnail: { type: String, default: "", trim: true },
    lessonDescription: { type: String, default: "", trim: true },
  },
  commonSchemaOptions,
);

// One bookmark per user+lesson
LessonBookmarkSchema.index({ userId: 1, lesson: 1 }, { unique: true });
// Ordered list for a user's saved lessons page
LessonBookmarkSchema.index({ userId: 1, createdAt: -1 });
// Filter by subject or class
LessonBookmarkSchema.index({ userId: 1, subject: 1, createdAt: -1 });

export type LessonBookmarkDocument = InferSchemaType<typeof LessonBookmarkSchema> & {
  _id: Types.ObjectId;
};

const LessonBookmarkModel =
  (mongoose.models.LmsLessonBookmark as Model<LessonBookmarkDocument>) ||
  mongoose.model<LessonBookmarkDocument>(
    "LmsLessonBookmark",
    LessonBookmarkSchema,
    "lms_lesson_bookmarks",
  );

export default LessonBookmarkModel;
