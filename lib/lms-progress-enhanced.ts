import { connectDB } from "@/lib/mongodb";
import mongoose from "mongoose";
import User from "@/models/User";
import Subject from "@/models/lms/Subject";
import ClassModel from "@/models/lms/Class";
import LessonModel from "@/models/lms/Lesson";
import LessonProgressModel from "@/models/lms/LessonProgress";

type SubjectLeanData = {
  _id: mongoose.Types.ObjectId | string;
  slug?: string;
  name?: string;
  description?: string;
};

type ClassLeanData = {
  _id: mongoose.Types.ObjectId | string;
  slug?: string;
  name?: string;
  subject?: mongoose.Types.ObjectId | string;
};

type LessonLeanData = {
  _id: mongoose.Types.ObjectId | string;
  slug?: string;
  title?: string;
};

type ProgressLeanData = {
  lesson?: mongoose.Types.ObjectId | string;
  completed?: boolean;
  completedAt?: Date | null;
  lastViewedAt?: Date | null;
};

type LastActivityLeanData = {
  lastViewedAt?: Date | null;
};

// ============================================================================
// Enhanced Progress Types & Utilities
// ============================================================================

export type LessonProgressItem = {
  lessonId: string;
  lessonSlug: string;
  lessonTitle: string;
  completed: boolean;
  completedAt: string | null;
  lastViewedAt: string | null;
  progress: number;
};

export type ClassProgress = {
  classId: string;
  classSlug: string;
  className: string;
  subjectId: string;
  subjectSlug: string;
  completedLessons: number;
  totalLessons: number;
  percentage: number;
  lessons: LessonProgressItem[];
  lastActivityAt: string | null;
};

export type SubjectProgress = {
  subjectId: string;
  subjectSlug: string;
  subjectName: string;
  completedLessons: number;
  totalLessons: number;
  percentage: number;
  classes: Array<{
    classId: string;
    classSlug: string;
    className: string;
    percentage: number;
  }>;
  lastActivityAt: string | null;
};

export type UserProgressDashboard = {
  userId: string;
  totalCompletedLessons: number;
  totalLessons: number;
  overallPercentage: number;
  streak: number; // Days in a row
  lastActivityAt: string | null;
  subjects: SubjectProgress[];
  recentActivity: Array<{
    lessonTitle: string;
    completedAt: string;
  }>;
  stats: {
    averageCompletionRate: number;
    fasterThanAverage: boolean;
    estimatedCompletion: string | null;
  };
};

// ============================================================================
// Class Progress Calculation
// ============================================================================

export async function getClassProgress(
  userId: string,
  classSlug: string
): Promise<ClassProgress> {
  await connectDB();

  const classRecord = await ClassModel.findOne({ slug: classSlug })
    .select("_id slug name subject")
    .lean();

  if (!classRecord?._id) {
    throw new Error("Class not found");
  }

  const classData = classRecord as ClassLeanData;

  const subject = await Subject.findOne({ _id: classData.subject })
    .select("_id slug name")
    .lean();

  if (!subject?._id) {
    throw new Error("Subject not found");
  }

  const subjectData = subject as SubjectLeanData;

  const lessons = await LessonModel.find({
    class: classData._id,
    published: true,
  })
    .select("_id slug title")
    .sort({ createdAt: 1 })
    .lean();

  const progressRecords = await LessonProgressModel.find({
    userId,
    class: classData._id,
  })
    .select("lesson completed completedAt lastViewedAt")
    .lean();

  const progressItems = progressRecords as ProgressLeanData[];

  const progressMap = new Map(
    progressItems.map((progress) => {
      return [String(progress.lesson), progress];
    })
  );

  const lessonProgresses = lessons.map((lesson) => {
    const lessonData = lesson as LessonLeanData;
    const progress = progressMap.get(String(lessonData._id));
    return {
      lessonId: String(lessonData._id),
      lessonSlug: lessonData.slug || "",
      lessonTitle: lessonData.title || "",
      completed: progress?.completed ?? false,
      completedAt: progress?.completedAt?.toISOString() ?? null,
      lastViewedAt: progress?.lastViewedAt?.toISOString() ?? null,
      progress: progress?.completed ? 100 : 0,
    };
  });

  const completedCount = lessonProgresses.filter((l) => l.completed).length;
  const lastActivity = progressItems
    .filter((p) => p.lastViewedAt)
    .sort((a, b) => (b.lastViewedAt?.getTime() || 0) - (a.lastViewedAt?.getTime() || 0))[0];

  return {
    classId: String(classData._id),
    classSlug: classData.slug || "",
    className: classData.name || "",
    subjectId: String(subjectData._id),
    subjectSlug: subjectData.slug || "",
    completedLessons: completedCount,
    totalLessons: lessons.length,
    percentage:
      lessons.length > 0 ? Math.round((completedCount / lessons.length) * 100) : 0,
    lessons: lessonProgresses,
    lastActivityAt: lastActivity?.lastViewedAt?.toISOString() ?? null,
  };
}

// ============================================================================
// Subject Progress Calculation
// ============================================================================

export async function getSubjectProgress(
  userId: string,
  subjectSlug: string
): Promise<SubjectProgress> {
  await connectDB();

  const subject = await Subject.findOne({ slug: subjectSlug })
    .select("_id slug name")
    .lean();

  if (!subject?._id) {
    throw new Error("Subject not found");
  }

  const subjectData = subject as SubjectLeanData;

  const classes = await ClassModel.find({ subject: subjectData._id })
    .select("_id slug name")
    .lean();

  const classProgresses = await Promise.all(
    classes.map(async (cls) => {
      const classData = cls as ClassLeanData;
      const progress = await getClassProgress(userId, classData.slug || "");
      return {
        classId: progress.classId,
        classSlug: progress.classSlug,
        className: progress.className,
        percentage: progress.percentage,
      };
    })
  );

  const lessons = await LessonModel.find({
    subject: subjectData._id,
    published: true,
  })
    .select("_id")
    .lean();

  const completed = await LessonProgressModel.countDocuments({
    userId,
    subject: subjectData._id,
    completed: true,
  });

  const lastActivityRecord = await LessonProgressModel.findOne({
    userId,
    subject: subjectData._id,
  })
    .sort({ lastViewedAt: -1 })
    .select("lastViewedAt")
    .lean();

  const lastActivity = lastActivityRecord as LastActivityLeanData | null;

  return {
    subjectId: String(subjectData._id),
    subjectSlug: subjectData.slug || "",
    subjectName: subjectData.name || "",
    completedLessons: completed,
    totalLessons: lessons.length,
    percentage:
      lessons.length > 0 ? Math.round((completed / lessons.length) * 100) : 0,
    classes: classProgresses,
    lastActivityAt: lastActivity?.lastViewedAt?.toISOString() ?? null,
  };
}

// ============================================================================
// User Progress Dashboard
// ============================================================================

export async function getUserProgressDashboard(
  userId: string
): Promise<UserProgressDashboard> {
  await connectDB();

  const [subjects, totalProgress, recentLessons, userRecord] = await Promise.all([
    Subject.find({}).select("_id slug name").lean(),
    LessonProgressModel.countDocuments({ userId, completed: true }),
    LessonProgressModel.find({ userId, completed: true })
      .select("lesson completedAt")
      .sort({ completedAt: -1 })
      .limit(10)
      .populate({
        path: "lesson",
        select: "title",
      })
      .lean(),
    User.findOne({ clerkId: userId }).select("progress completedLessons").lean(),
  ]);

  const totalLessons = await LessonModel.countDocuments({ published: true });

  const subjectProgresses = await Promise.all(
    subjects.map((subject) => {
      const subjectData = subject as SubjectLeanData;
      return getSubjectProgress(userId, subjectData.slug || "");
    })
  );

  const lastActivityRecord = await LessonProgressModel.findOne({ userId })
    .sort({ lastViewedAt: -1 })
    .select("lastViewedAt")
    .lean();

  const lastActivity = lastActivityRecord as LastActivityLeanData | null;

  // Calculate streak (simple: check if active in last 7 days)
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const recentActivityCount = await LessonProgressModel.countDocuments({
    userId,
    lastViewedAt: { $gte: sevenDaysAgo },
  });

  return {
    userId,
    totalCompletedLessons: totalProgress,
    totalLessons,
    overallPercentage:
      totalLessons > 0 ? Math.round((totalProgress / totalLessons) * 100) : 0,
    streak: recentActivityCount > 0 ? Math.min(recentActivityCount, 7) : 0,
    lastActivityAt: lastActivity?.lastViewedAt?.toISOString() ?? null,
    subjects: subjectProgresses,
    recentActivity: recentLessons
      .map((item: any) => ({
        lessonTitle: item.lesson?.title || "Unknown",
        completedAt: item.completedAt?.toISOString() || new Date().toISOString(),
      })),
    stats: {
      averageCompletionRate: 
        subjectProgresses.length > 0
          ? Math.round(
              subjectProgresses.reduce((sum, s) => sum + s.percentage, 0) /
                subjectProgresses.length
            )
          : 0,
      fasterThanAverage: totalProgress > Math.floor(totalLessons * 0.5),
      estimatedCompletion: estimateCompletionDate(
        totalProgress,
        totalLessons,
        lastActivity?.lastViewedAt
      ),
    },
  };
}

// ============================================================================
// Progress Analytics
// ============================================================================

export async function getProgressAnalytics(userId: string) {
  await connectDB();

  const allProgressRecords = await LessonProgressModel.find({ userId }).lean();
  const allProgress = allProgressRecords as ProgressLeanData[];
  const completedProgress = allProgress.filter((p) => p.completed);

  // Group by date
  const byDate = new Map<string, number>();
  completedProgress.forEach((p) => {
    if (p.completedAt) {
      const date = new Date(p.completedAt).toISOString().split("T")[0];
      byDate.set(date, (byDate.get(date) || 0) + 1);
    }
  });

  // Calculate velocity (lessons per week)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const recentCompleted = completedProgress.filter(
    (p) => p.completedAt && new Date(p.completedAt) >= thirtyDaysAgo
  ).length;

  const velocity = Math.round(recentCompleted / 4.28); // weeks per month

  return {
    totalCompleted: completedProgress.length,
    totalViewed: allProgress.length,
    completionRatePercent: Math.round(
      (completedProgress.length / allProgress.length) * 100
    ),
    lessonsPerWeek: velocity,
    activityByDate: Object.fromEntries(
      Array.from(byDate.entries()).sort((a, b) =>
        a[0].localeCompare(b[0])
      )
    ),
  };
}

// ============================================================================
// Helper Functions
// ============================================================================

function estimateCompletionDate(
  completed: number,
  total: number,
  lastActivity?: Date | null
): string | null {
  if (completed === total || !lastActivity) {
    return null;
  }

  const remaining = total - completed;
  
  // Estimate: average of 1 lesson per 2 days (adjust as needed)
  const daysPerLesson = 2;
  const daysToComplete = remaining * daysPerLesson;

  const estimatedDate = new Date(lastActivity);
  estimatedDate.setDate(estimatedDate.getDate() + daysToComplete);

  return estimatedDate.toISOString().split("T")[0];
}

export function calculateCompletionPercentage(
  completed: number,
  total: number
): number {
  if (total <= 0) return 0;
  return Math.round((completed / total) * 100);
}
