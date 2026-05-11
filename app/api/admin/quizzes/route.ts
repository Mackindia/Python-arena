import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { requireAdminApi } from "@/lib/admin-api";
import Quiz from "@/models/Quiz";

export async function GET(request: NextRequest) {
  try {
    const access = await requireAdminApi();
    if (!access.ok) {
      return access.response;
    }

    const courseId = request.nextUrl.searchParams.get("courseId");

    await connectDB();
    const quizzes = await Quiz.find(courseId ? { courseId } : {})
      .sort({ updatedAt: -1 })
      .lean();

    return NextResponse.json({ quizzes });
  } catch (error) {
    return NextResponse.json({ message: "Failed to fetch quizzes", error: error instanceof Error ? error.message : "Unknown" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const access = await requireAdminApi();
    if (!access.ok) {
      return access.response;
    }

    const body = await request.json();

    if (!body.courseId || !body.question || !Array.isArray(body.options) || body.options.length < 2) {
      return NextResponse.json({ message: "courseId, question and at least 2 options are required" }, { status: 400 });
    }

    await connectDB();

    const quiz = await Quiz.create({
      courseId: body.courseId,
      lessonId: body.lessonId ?? null,
      chapterSlug: body.chapterSlug ?? "",
      question: body.question,
      options: body.options,
      answer: Number(body.answer ?? 0),
      explanation: body.explanation ?? "",
      difficulty: body.difficulty ?? "easy",
      tags: Array.isArray(body.tags) ? body.tags : [],
      order: Number(body.order ?? 0),
      isPublished: Boolean(body.isPublished ?? false),
      createdBy: access.ctx.userId,
      updatedBy: access.ctx.userId,
    });

    return NextResponse.json({ message: "Quiz created", quiz }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ message: "Failed to create quiz", error: error instanceof Error ? error.message : "Unknown" }, { status: 500 });
  }
}
