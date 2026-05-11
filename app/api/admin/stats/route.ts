import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { requireAdminApi } from "@/lib/admin-api";
import User from "@/models/User";
import Course from "@/models/Course";
import Lesson from "@/models/Lesson";
import Quiz from "@/models/Quiz";
import Resource from "@/models/Resource";

export async function GET() {
  try {
    const access = await requireAdminApi();
    if (!access.ok) {
      return access.response;
    }

    await connectDB();

    const [
      totalUsers,
      activeStudents,
      totalCourses,
      totalLessons,
      totalQuizzes,
      totalUploads,
      recentUsers,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: "student" }),
      Course.countDocuments(),
      Lesson.countDocuments(),
      Quiz.countDocuments(),
      Resource.countDocuments(),
      User.find().sort({ createdAt: -1 }).limit(6).select("fullName email role studentClass createdAt").lean(),
    ]);

    return NextResponse.json({
      stats: {
        totalUsers,
        activeStudents,
        totalCourses,
        totalLessons,
        totalQuizzes,
        totalUploads,
      },
      recentUsers,
    });
  } catch (error) {
    return NextResponse.json(
      {
        message: "Failed to load admin stats",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
