import mongoose, { Schema, Types } from "mongoose";

const QuizSchema = new Schema(
  {
    courseId: { type: Schema.Types.ObjectId, ref: "Course", required: true, index: true },
    lessonId: { type: Schema.Types.ObjectId, ref: "Lesson", default: null, index: true },
    chapterSlug: { type: String, default: "", index: true },
    question: { type: String, required: true, trim: true },
    options: { type: [String], default: [], validate: [(v: string[]) => v.length >= 2, "At least two options required"] },
    answer: { type: Number, required: true, min: 0 },
    explanation: { type: String, default: "" },
    difficulty: {
      type: String,
      enum: ["easy", "medium", "hard"],
      default: "easy",
      index: true,
    },
    tags: { type: [String], default: [] },
    order: { type: Number, default: 0 },
    isPublished: { type: Boolean, default: false, index: true },
    createdBy: { type: String, default: "" },
    updatedBy: { type: String, default: "" },
  },
  { timestamps: true },
);

QuizSchema.index({ question: "text", explanation: "text", tags: "text", chapterSlug: "text" });

export type QuizDocument = {
  _id: Types.ObjectId;
  courseId: Types.ObjectId;
  question: string;
  options: string[];
  answer: number;
  explanation: string;
  difficulty: "easy" | "medium" | "hard";
  tags: string[];
};

export default mongoose.models.Quiz || mongoose.model("Quiz", QuizSchema);
