import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { requireAdminApi } from "@/lib/admin-api";
import Lesson from "@/models/Lesson";

export async function GET(request: NextRequest) {
  try {
    const access = await requireAdminApi();
    if (!access.ok) {
      return access.response;
    }

    const courseId = request.nextUrl.searchParams.get("courseId");

    await connectDB();
    const lessons = await Lesson.find(courseId ? { courseId } : {})
      .sort({ courseId: 1, order: 1, updatedAt: -1 })
      .lean();

    return NextResponse.json({ lessons });
  } catch (error) {
    return NextResponse.json({ message: "Failed to fetch lessons", error: error instanceof Error ? error.message : "Unknown" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const access = await requireAdminApi();
    if (!access.ok) {
      return access.response;
    }

    const body = await request.json();

    if (!body.title || !body.courseId) {
      return NextResponse.json({ message: "title and courseId are required" }, { status: 400 });
    }

    await connectDB();

    const lesson = await Lesson.create({
      title: body.title,
      slug: body.slug,
      content: body.content ?? "",
      courseId: body.courseId,
      chapterSlug: body.chapterSlug ?? "",
      order: Number(body.order ?? 0),
      state: body.state ?? "draft",
      tags: Array.isArray(body.tags) ? body.tags : [],
      createdBy: access.ctx.userId,
      updatedBy: access.ctx.userId,
    });

    return NextResponse.json({ message: "Lesson created", lesson }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ message: "Failed to create lesson", error: error instanceof Error ? error.message : "Unknown" }, { status: 500 });
  }
}
