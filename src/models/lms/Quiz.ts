import mongoose, { InferSchemaType, Model, Schema, Types } from "mongoose";
import { commonSchemaOptions } from "./shared";

const QuizQuestionSchema = new Schema(
  {
    prompt: { type: String, required: true, trim: true },
    options: {
      type: [String],
      required: true,
      validate: [(value: string[]) => value.length >= 2, "Each question must have at least 2 options"],
    },
    correctIndex: { type: Number, required: true, min: 0 },
    explanation: { type: String, default: "", trim: true },
    order: { type: Number, default: 0 },
  },
  { _id: true },
);

const LmsQuizSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    subject: { type: Schema.Types.ObjectId, ref: "Subject", required: true, index: true },
    class: { type: Schema.Types.ObjectId, ref: "Class", required: true, index: true },
    lesson: { type: Schema.Types.ObjectId, ref: "LmsLesson", required: true, unique: true, index: true },
    instructions: { type: String, default: "", trim: true },
    passingPercent: { type: Number, default: 60, min: 0, max: 100 },
    isPublished: { type: Boolean, default: false, index: true },
    questions: { type: [QuizQuestionSchema], default: [] },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", default: null, index: true },
  },
  commonSchemaOptions,
);

LmsQuizSchema.index({ subject: 1, class: 1, lesson: 1, isPublished: 1 });

export type LmsQuizDocument = InferSchemaType<typeof LmsQuizSchema> & {
  _id: Types.ObjectId;
};

const LmsQuizModel =
  (mongoose.models.LmsQuiz as Model<LmsQuizDocument>) ||
  mongoose.model<LmsQuizDocument>("LmsQuiz", LmsQuizSchema, "lms_quizzes");

export default LmsQuizModel;
