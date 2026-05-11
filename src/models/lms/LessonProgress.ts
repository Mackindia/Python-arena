import mongoose, { InferSchemaType, Model, Schema, Types } from "mongoose";
import { commonSchemaOptions } from "./shared";

const LessonProgressSchema = new Schema(
  {
    userId: { type: String, required: true, index: true },
    lesson: { type: Schema.Types.ObjectId, ref: "LmsLesson", required: true, index: true },
    subject: { type: Schema.Types.ObjectId, ref: "Subject", required: true, index: true },
    class: { type: Schema.Types.ObjectId, ref: "Class", required: true, index: true },
    completed: { type: Boolean, default: false, index: true },
    completedAt: { type: Date, default: null },
    lastViewedAt: { type: Date, default: null },
  },
  commonSchemaOptions,
);

LessonProgressSchema.index({ userId: 1, lesson: 1 }, { unique: true });
LessonProgressSchema.index({ userId: 1, class: 1, completed: 1 });
LessonProgressSchema.index({ userId: 1, subject: 1, completed: 1 });

export type LessonProgressDocument = InferSchemaType<typeof LessonProgressSchema> & {
  _id: Types.ObjectId;
};

const LessonProgressModel =
  (mongoose.models.LmsLessonProgress as Model<LessonProgressDocument>) ||
  mongoose.model<LessonProgressDocument>("LmsLessonProgress", LessonProgressSchema, "lesson_progress");

export default LessonProgressModel;
