import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import Subject from "@/models/lms/Subject";
import ClassModel from "@/models/lms/Class";
import LessonModel from "@/models/lms/Lesson";
import LessonProgressModel from "@/models/lms/LessonProgress";

type SubjectLeanData = {
  _id: unknown;
  slug?: string;
  name?: string;
};

type ClassLeanData = {
  _id: unknown;
  slug?: string;
  name?: string;
  subject?: unknown;
};

type LessonLeanData = {
  _id: unknown;
  slug?: string;
  title?: string;
};

type ProgressLeanData = {
  _id?: unknown;
  completedAt?: Date | null;
};

export type CompletionItem = {
  id: string;
  slug: string;
  name: string;
  completedLessons: number;
  totalLessons: number;
  percent: number;
};

export type ProgressSummary = {
  totalCompletedLessons: number;
  totalLessons: number;
  overallPercent: number;
  byClass: CompletionItem[];
  bySubject: CompletionItem[];
};

type CompleteLessonInput = {
  userId: string;
  subjectSlug: string;
  classSlug: string;
  lessonSlug: string;
};

function toPercent(completed: number, total: number) {
  if (total <= 0) {
    return 0;
  }

  return Math.round((completed / total) * 100);
}

function indexById<T extends { id: string }>(items: T[]) {
  return new Map(items.map((item) => [item.id, item]));
}

export async function getUserProgressSummary(userId: string): Promise<ProgressSummary> {
  await connectDB();

  const [classes, subjects, totalsByClassRaw, totalsBySubjectRaw, completedByClassRaw, completedBySubjectRaw] = await Promise.all([
    ClassModel.find({}).select("_id slug name").lean(),
    Subject.find({}).select("_id slug name").lean(),
    LessonModel.aggregate([{ $match: { published: true } }, { $group: { _id: "$class", total: { $sum: 1 } } }]),
    LessonModel.aggregate([{ $match: { published: true } }, { $group: { _id: "$subject", total: { $sum: 1 } } }]),
    LessonProgressModel.aggregate([
      { $match: { userId, completed: true } },
      { $group: { _id: "$class", completed: { $sum: 1 } } },
    ]),
    LessonProgressModel.aggregate([
      { $match: { userId, completed: true } },
      { $group: { _id: "$subject", completed: { $sum: 1 } } },
    ]),
  ]);

  const totalsByClass = new Map(totalsByClassRaw.map((row) => [String(row._id), Number(row.total || 0)]));
  const totalsBySubject = new Map(totalsBySubjectRaw.map((row) => [String(row._id), Number(row.total || 0)]));
  const completedByClass = new Map(completedByClassRaw.map((row) => [String(row._id), Number(row.completed || 0)]));
  const completedBySubject = new Map(completedBySubjectRaw.map((row) => [String(row._id), Number(row.completed || 0)]));

  const byClass: CompletionItem[] = classes
    .map((item) => {
      const classItem = item as ClassLeanData;
      const id = String(classItem._id);
      const totalLessons = totalsByClass.get(id) || 0;
      const completedLessons = completedByClass.get(id) || 0;

      return {
        id,
        slug: classItem.slug || "",
        name: classItem.name || "",
        completedLessons,
        totalLessons,
        percent: toPercent(completedLessons, totalLessons),
      };
    })
    .filter((item) => item.totalLessons > 0)
    .sort((a, b) => b.percent - a.percent || a.name.localeCompare(b.name));

  const bySubject: CompletionItem[] = subjects
    .map((item) => {
      const subjectItem = item as SubjectLeanData;
      const id = String(subjectItem._id);
      const totalLessons = totalsBySubject.get(id) || 0;
      const completedLessons = completedBySubject.get(id) || 0;

      return {
        id,
        slug: subjectItem.slug || "",
        name: subjectItem.name || "",
        completedLessons,
        totalLessons,
        percent: toPercent(completedLessons, totalLessons),
      };
    })
    .filter((item) => item.totalLessons > 0)
    .sort((a, b) => b.percent - a.percent || a.name.localeCompare(b.name));

  const totalLessons = bySubject.reduce((acc, item) => acc + item.totalLessons, 0);
  const totalCompletedLessons = bySubject.reduce((acc, item) => acc + item.completedLessons, 0);

  return {
    totalCompletedLessons,
    totalLessons,
    overallPercent: toPercent(totalCompletedLessons, totalLessons),
    byClass,
    bySubject,
  };
}

export async function markLessonCompleted(input: CompleteLessonInput) {
  await connectDB();

  const [subject, classRecord] = await Promise.all([
    Subject.findOne({ slug: input.subjectSlug }).select("_id name slug").lean(),
    ClassModel.findOne({ slug: input.classSlug }).select("_id name slug subject").lean(),
  ]);

  if (!subject?._id) {
    throw new Error("Subject not found");
  }

  const subjectData = subject as SubjectLeanData;

  if (!classRecord?._id) {
    throw new Error("Class not found");
  }

  const classData = classRecord as ClassLeanData;

  if (String(classData.subject) !== String(subjectData._id)) {
    throw new Error("Class does not belong to subject");
  }

  const lesson = await LessonModel.findOne({
    slug: input.lessonSlug,
    class: classData._id,
    subject: subjectData._id,
    published: true,
  })
    .select("_id title slug")
    .lean();

  if (!lesson?._id) {
    throw new Error("Lesson not found");
  }

  const lessonData = lesson as LessonLeanData;

  const now = new Date();

  await LessonProgressModel.updateOne(
    {
      userId: input.userId,
      lesson: String(lessonData._id),
    },
    {
      $set: {
        userId: input.userId,
        lesson: String(lessonData._id),
        subject: String(subjectData._id),
        class: String(classData._id),
        completed: true,
        completedAt: now,
        lastViewedAt: now,
      },
    },
    { upsert: true },
  );

  await User.updateOne(
    { clerkId: input.userId },
    {
      $addToSet: {
        completedLessons: lessonData.title,
      },
      $push: {
        recentLessons: {
          $each: [lessonData.title],
          $slice: -20,
        },
      },
    },
  );

  const progressSummary = await getUserProgressSummary(input.userId);

  await User.updateOne(
    { clerkId: input.userId },
    {
      $set: {
        progress: progressSummary.overallPercent,
      },
    },
  );

  return {
    lesson: {
      id: String(lessonData._id),
      slug: lessonData.slug || "",
      title: lessonData.title || "",
    },
    progressSummary,
  };
}

export async function getLessonCompletionState(
  userId: string,
  subjectSlug: string,
  classSlug: string,
  lessonSlug: string,
) {
  await connectDB();

  const subject = await Subject.findOne({ slug: subjectSlug }).select("_id").lean();
  if (!subject?._id) {
    return { completed: false };
  }

  const classRecord = await ClassModel.findOne({ slug: classSlug, subject: subject._id }).select("_id").lean();
  if (!classRecord?._id) {
    return { completed: false };
  }

  const lesson = await LessonModel.findOne({ slug: lessonSlug, class: classRecord._id, published: true }).select("_id").lean();
  if (!lesson?._id) {
    return { completed: false };
  }

  const progress = await LessonProgressModel.findOne({
    userId,
    lesson: lesson._id,
    completed: true,
  })
    .select("_id completed completedAt")
    .lean();

  const progressData = progress as ProgressLeanData | null;

  return {
    completed: Boolean(progressData?._id),
    completedAt: progressData?.completedAt ?? null,
  };
}
