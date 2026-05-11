import { connectDB } from "@/lib/mongodb";
import Subject from "@/models/lms/Subject";
import ClassModel from "@/models/lms/Class";
import LessonModel from "@/models/lms/Lesson";
import LessonBookmarkModel from "@/models/lms/LessonBookmark";

// ─── Types ────────────────────────────────────────────────────────────────────

export type BookmarkedLesson = {
  id: string;
  lessonSlug: string;
  subjectSlug: string;
  classSlug: string;
  lessonTitle: string;
  lessonThumbnail: string;
  lessonDescription: string;
  href: string;
  savedAt: string;
};

export type ToggleBookmarkResult = {
  bookmarked: boolean;
  message: string;
};

export type GetBookmarksResult = {
  bookmarks: BookmarkedLesson[];
  total: number;
};

// ─── Internal helpers ─────────────────────────────────────────────────────────

async function resolveLesson(subjectSlug: string, classSlug: string, lessonSlug: string) {
  await connectDB();

  const subject = await Subject.findOne({ slug: subjectSlug })
    .select("_id slug name")
    .lean();
  if (!subject?._id) throw new Error("Subject not found");

  const classRecord = await ClassModel.findOne({ slug: classSlug, subject: subject._id })
    .select("_id slug name")
    .lean();
  if (!classRecord?._id) throw new Error("Class not found");

  const lesson = await LessonModel.findOne({
    slug: lessonSlug,
    subject: subject._id,
    class: classRecord._id,
    published: true,
  })
    .select("_id slug title description thumbnail thumbnailUrl")
    .lean();
  if (!lesson?._id) throw new Error("Lesson not found");

  return { subject, classRecord, lesson };
}

// ─── Service functions ────────────────────────────────────────────────────────

/**
 * Toggle a bookmark for a lesson. Returns whether it is now bookmarked.
 */
export async function toggleLessonBookmark(
  userId: string,
  subjectSlug: string,
  classSlug: string,
  lessonSlug: string,
): Promise<ToggleBookmarkResult> {
  const { subject, classRecord, lesson } = await resolveLesson(subjectSlug, classSlug, lessonSlug);

  const existing = await LessonBookmarkModel.findOne({
    userId,
    lesson: lesson._id,
  }).lean();

  if (existing) {
    await LessonBookmarkModel.deleteOne({ _id: existing._id });
    return { bookmarked: false, message: "Lesson removed from saved" };
  }

  await LessonBookmarkModel.create({
    userId,
    lesson: lesson._id,
    subject: subject._id,
    class: classRecord._id,
    lessonSlug: lesson.slug,
    subjectSlug: subject.slug,
    classSlug: classRecord.slug,
    lessonTitle: lesson.title ?? "",
    lessonThumbnail: (lesson.thumbnail || lesson.thumbnailUrl) ?? "",
    lessonDescription: lesson.description ?? "",
  });

  return { bookmarked: true, message: "Lesson saved" };
}

/**
 * Check whether a specific lesson is bookmarked by a user.
 */
export async function isLessonBookmarked(
  userId: string,
  subjectSlug: string,
  classSlug: string,
  lessonSlug: string,
): Promise<boolean> {
  await connectDB();

  const subject = await Subject.findOne({ slug: subjectSlug }).select("_id").lean();
  if (!subject?._id) return false;

  const classRecord = await ClassModel.findOne({ slug: classSlug, subject: subject._id })
    .select("_id")
    .lean();
  if (!classRecord?._id) return false;

  const lesson = await LessonModel.findOne({
    slug: lessonSlug,
    subject: subject._id,
    class: classRecord._id,
  })
    .select("_id")
    .lean();
  if (!lesson?._id) return false;

  const count = await LessonBookmarkModel.countDocuments({ userId, lesson: lesson._id });
  return count > 0;
}

/**
 * Return a paginated list of a user's saved lessons, newest first.
 */
export async function getUserBookmarks(
  userId: string,
  page = 1,
  limit = 20,
): Promise<GetBookmarksResult> {
  await connectDB();

  const safePage = Math.max(1, page);
  const safeLimit = Math.min(Math.max(1, limit), 50);
  const skip = (safePage - 1) * safeLimit;

  const [docs, total] = await Promise.all([
    LessonBookmarkModel.find({ userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(safeLimit)
      .select("lessonSlug subjectSlug classSlug lessonTitle lessonThumbnail lessonDescription createdAt")
      .lean(),
    LessonBookmarkModel.countDocuments({ userId }),
  ]);

  const bookmarks: BookmarkedLesson[] = docs.map((doc) => ({
    id: String(doc._id),
    lessonSlug: doc.lessonSlug,
    subjectSlug: doc.subjectSlug,
    classSlug: doc.classSlug,
    lessonTitle: doc.lessonTitle,
    lessonThumbnail: doc.lessonThumbnail,
    lessonDescription: doc.lessonDescription,
    href: `/lms/${doc.subjectSlug}/${doc.classSlug}/${doc.lessonSlug}`,
    savedAt: doc.createdAt instanceof Date
      ? doc.createdAt.toISOString()
      : String(doc.createdAt),
  }));

  return { bookmarks, total };
}
