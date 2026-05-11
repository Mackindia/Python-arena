import { connectDB } from "@/lib/mongodb";
import Subject from "@/models/lms/Subject";
import ClassModel from "@/models/lms/Class";
import LessonModel from "@/models/lms/Lesson";
import LmsQuizAttemptModel from "@/models/lms/QuizAttempt";

export type QuizAttemptSummary = {
  id: string;
  score: number;
  total: number;
  accuracy: number;
  passed: boolean;
  createdAt: string;
};

/**
 * Returns the most recent quiz attempts (up to `limit`) for a specific user + lesson.
 */
export async function getLessonQuizAttempts(
  userId: string,
  subjectSlug: string,
  classSlug: string,
  lessonSlug: string,
  limit = 10,
): Promise<QuizAttemptSummary[]> {
  await connectDB();

  const subject = await Subject.findOne({ slug: subjectSlug }).select("_id").lean();
  if (!subject?._id) return [];

  const classRecord = await ClassModel.findOne({ slug: classSlug, subject: subject._id }).select("_id").lean();
  if (!classRecord?._id) return [];

  const lesson = await LessonModel.findOne({
    slug: lessonSlug,
    subject: subject._id,
    class: classRecord._id,
    published: true,
  })
    .select("_id")
    .lean();

  if (!lesson?._id) return [];

  const attempts = await LmsQuizAttemptModel.find({
    userId,
    lesson: lesson._id,
  })
    .sort({ createdAt: -1 })
    .limit(Math.min(limit, 50))
    .select("score total accuracy passed createdAt")
    .lean();

  return attempts.map((a) => ({
    id: String(a._id),
    score: a.score,
    total: a.total,
    accuracy: a.accuracy,
    passed: a.passed ?? false,
    createdAt: a.createdAt instanceof Date ? a.createdAt.toISOString() : String(a.createdAt),
  }));
}
