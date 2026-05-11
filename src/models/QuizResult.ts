import mongoose from "mongoose";

const QuizAnswerSchema = new mongoose.Schema(
  {
    questionId: String,
    answer: String,
    correct: Boolean,
  },
  { _id: false },
);

const QuizResultSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    score: {
      type: Number,
      required: true,
    },
    accuracy: {
      type: Number,
      required: true,
    },
    attempts: {
      type: Number,
      default: 1,
    },
    chapter: {
      type: String,
      required: true,
    },
    answers: {
      type: [QuizAnswerSchema],
      default: [],
    },
    weakTopics: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  },
);

export default mongoose.models.QuizResult || mongoose.model("QuizResult", QuizResultSchema);