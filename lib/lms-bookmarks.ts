import mongoose from "mongoose";
import { connectDB } from "@/lib/mongodb";
import Subject from "@/models/lms/Subject";
import ClassModel from "@/models/lms/Class";
import LessonModel from "@/models/lms/Lesson";
import LessonBookmarkModel, { type LessonBookmarkDocument } from "@/models/lms/LessonBookmark";

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

type BookmarkLookup = {
  userId: string;
  lesson?: mongoose.Types.ObjectId | string;
};

type BookmarkCreateInput = Omit<LessonBookmarkDocument, "_id">;

type ResolvedSubjectData = {
  _id: mongoose.Types.ObjectId | string;
  slug?: string;
  name?: string;
};

type ResolvedClassData = {
  _id: mongoose.Types.ObjectId | string;
  slug?: string;
  name?: string;
};

type ResolvedLessonData = {
  _id: mongoose.Types.ObjectId | string;
  slug?: string;
  title?: string;
  description?: string;
  thumbnail?: string;
  thumbnailUrl?: string;
};

type BookmarkLeanDoc = {
  _id?: unknown;
  lessonSlug?: string;
  subjectSlug?: string;
  classSlug?: string;
  lessonTitle?: string;
  lessonThumbnail?: string;
  lessonDescription?: string;
  createdAt?: Date | string;
};

// ─── Internal helpers ─────────────────────────────────────────────────────────

async function resolveLesson(subjectSlug: string, classSlug: string, lessonSlug: string) {
  await connectDB();

  const subject = await Subject.findOne({ slug: subjectSlug })
    .select("_id slug name")
    .lean();
  if (!subject?._id) throw new Error("Subject not found");

  const subjectData = subject as ResolvedSubjectData;

  const classRecord = await ClassModel.findOne({ slug: classSlug, subject: subjectData._id })
    .select("_id slug name")
    .lean();
  if (!classRecord?._id) throw new Error("Class not found");

  const classData = classRecord as ResolvedClassData;

  const lesson = await LessonModel.findOne({
    slug: lessonSlug,
    subject: subjectData._id,
    class: classData._id,
    published: true,
  })
    .select("_id slug title description thumbnail thumbnailUrl")
    .lean();
  if (!lesson?._id) throw new Error("Lesson not found");

  const lessonData = lesson as ResolvedLessonData;

  return { subject: subjectData, classRecord: classData, lesson: lessonData };
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
  } as BookmarkLookup).lean();

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
  } as BookmarkCreateInput);

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

  const count = await LessonBookmarkModel.countDocuments({ userId, lesson: lesson._id } as BookmarkLookup);
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
    LessonBookmarkModel.find({ userId } as BookmarkLookup)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(safeLimit)
      .select("lessonSlug subjectSlug classSlug lessonTitle lessonThumbnail lessonDescription createdAt")
      .lean(),
    LessonBookmarkModel.countDocuments({ userId } as BookmarkLookup),
  ]);

  const bookmarks: BookmarkedLesson[] = docs.map((doc) => {
    const bookmark = doc as BookmarkLeanDoc;
    const lessonSlug = bookmark.lessonSlug || "";
    const subjectSlug = bookmark.subjectSlug || "";
    const classSlug = bookmark.classSlug || "";

    return {
      id: String(bookmark._id),
      lessonSlug,
      subjectSlug,
      classSlug,
      lessonTitle: bookmark.lessonTitle || "",
      lessonThumbnail: bookmark.lessonThumbnail || "",
      lessonDescription: bookmark.lessonDescription || "",
      href: `/lms/${subjectSlug}/${classSlug}/${lessonSlug}`,
      savedAt: bookmark.createdAt instanceof Date
        ? bookmark.createdAt.toISOString()
        : String(bookmark.createdAt || ""),
    };
  });

  return { bookmarks, total };
}
