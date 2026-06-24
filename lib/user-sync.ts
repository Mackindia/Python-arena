import { currentUser } from "@clerk/nextjs/server";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import Enrollment from "@/models/Enrollment";
import QuizResult from "@/models/QuizResult";
import { getUserProgressSummary } from "@/lib/lms-progress";

type ClerkMetadata = Record<string, unknown>;

function getString(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function getNumber(value: unknown, fallback = 0) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function getStringArray(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function buildProfile(clerkUser: Awaited<ReturnType<typeof currentUser>>) {
  if (!clerkUser) {
    return null;
  }

  const metadata = clerkUser.publicMetadata as ClerkMetadata;
  const email = clerkUser.primaryEmailAddress?.emailAddress ?? clerkUser.emailAddresses[0]?.emailAddress ?? "";
  const fullName = [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ").trim();

  return {
    clerkId: clerkUser.id,
    fullName: fullName || clerkUser.username || email.split("@")[0] || "Student",
    email,
    image: clerkUser.imageUrl,
    studentClass: getString(metadata.studentClass, "Class 11"),
    role: getString(metadata.role, "student"),
    enrolledCourses: getStringArray(metadata.enrolledCourses),
    completedLessons: getStringArray(metadata.completedLessons),
    savedLessons: getStringArray(metadata.savedLessons),
    recentLessons: getStringArray(metadata.recentLessons),
    watchHistory: getStringArray(metadata.watchHistory),
    lastOpenedChapter: getString(metadata.lastOpenedChapter, ""),
    streakDays: getNumber(metadata.streakDays, 0),
    progress: getNumber(metadata.progress, 0),
  };
}

export async function syncCurrentUser() {
  const clerkUser = await currentUser();

  if (!clerkUser) {
    return null;
  }

  const profile = buildProfile(clerkUser);

  if (!profile) {
    return null;
  }

  await connectDB();

  // Don't overwrite admin-managed fields from Clerk after the user exists.
  const profileWithoutManagedFields = {
    ...profile,
  };

  delete profileWithoutManagedFields.role;
  delete profileWithoutManagedFields.email;
  delete profileWithoutManagedFields.studentClass;

  const user = await User.findOneAndUpdate(
    { clerkId: profile.clerkId },
    {
      $set: profileWithoutManagedFields,
      // Only set admin-managed fields on first insert; later edits live in MongoDB.
      $setOnInsert: {
        role: profile.role,
        email: profile.email,
        studentClass: profile.studentClass,
      },
    },
    { returnDocument: "after", upsert: true, setDefaultsOnInsert: true },
  );

  return user;
}

export async function getDashboardData() {
  const user = await syncCurrentUser();

  if (!user) {
    return null;
  }

  const [enrollments, quizResults] = await Promise.all([
    Enrollment.find({ userId: user.clerkId }).sort({ updatedAt: -1 }).lean(),
    QuizResult.find({ userId: user.clerkId }).sort({ createdAt: -1 }).limit(5).lean(),
  ]);

  const progressSummary = await getUserProgressSummary(user.clerkId);

  return {
    user: user.toObject(),
    enrollments,
    quizResults,
    progressSummary,
  };
}