import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { requireAdminApi } from "@/lib/admin-api";
import Course from "@/models/Course";

export async function PATCH(request: NextRequest) {
  try {
    const access = await requireAdminApi();
    if (!access.ok) {
      return access.response;
    }

    const body = await request.json();
    if (!body.courseId || !Array.isArray(body.chapters)) {
      return NextResponse.json({ message: "courseId and chapters are required" }, { status: 400 });
    }

    await connectDB();

    const chapters = body.chapters.map((chapter: { title: string; slug: string }, index: number) => ({
      ...chapter,
      order: index,
    }));

    const course = await Course.findByIdAndUpdate(
      body.courseId,
      { $set: { chapters, updatedBy: access.ctx.userId } },
        { returnDocument: "after" },
    );

    if (!course) {
      return NextResponse.json({ message: "Course not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Chapter order updated", course });
  } catch (error) {
    return NextResponse.json({ message: "Failed to reorder chapters", error: error instanceof Error ? error.message : "Unknown" }, { status: 500 });
  }
}
