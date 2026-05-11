import mongoose, { InferSchemaType, Model, Schema, Types } from "mongoose";
import { commonSchemaOptions } from "./shared";

const QuizAttemptAnswerSchema = new Schema(
  {
    questionId: { type: String, required: true, trim: true },
    selectedIndex: { type: Number, required: true, min: 0 },
    isCorrect: { type: Boolean, required: true },
  },
  { _id: false },
);

const LmsQuizAttemptSchema = new Schema(
  {
    userId: { type: String, required: true, index: true },
    subject: { type: Schema.Types.ObjectId, ref: "Subject", required: true, index: true },
    class: { type: Schema.Types.ObjectId, ref: "Class", required: true, index: true },
    lesson: { type: Schema.Types.ObjectId, ref: "LmsLesson", required: true, index: true },
    quiz: { type: Schema.Types.ObjectId, ref: "LmsQuiz", required: true, index: true },
    score: { type: Number, required: true, min: 0 },
    total: { type: Number, required: true, min: 0 },
    accuracy: { type: Number, required: true, min: 0, max: 100 },
    passed: { type: Boolean, default: false, index: true },
    answers: { type: [QuizAttemptAnswerSchema], default: [] },
  },
  commonSchemaOptions,
);

LmsQuizAttemptSchema.index({ userId: 1, quiz: 1, createdAt: -1 });

export type LmsQuizAttemptDocument = InferSchemaType<typeof LmsQuizAttemptSchema> & {
  _id: Types.ObjectId;
};

const LmsQuizAttemptModel =
  (mongoose.models.LmsQuizAttempt as Model<LmsQuizAttemptDocument>) ||
  mongoose.model<LmsQuizAttemptDocument>("LmsQuizAttempt", LmsQuizAttemptSchema, "lms_quiz_attempts");

export default LmsQuizAttemptModel;
