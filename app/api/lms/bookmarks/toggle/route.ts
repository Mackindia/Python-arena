import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { toggleLessonBookmark } from "@/lib/lms-bookmarks";

export const runtime = "nodejs";

/**
 * POST /api/lms/bookmarks/toggle
 * Body: { subject: string; class: string; lesson: string }
 */
export async function POST(request: NextRequest) {
  try {
    const authUser = await currentUser();
    if (!authUser?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const subject = (body?.subject ?? "").trim();
    const classSlug = (body?.class ?? "").trim();
    const lesson = (body?.lesson ?? "").trim();

    if (!subject || !classSlug || !lesson) {
      return NextResponse.json(
        { message: "subject, class and lesson are required" },
        { status: 400 },
      );
    }

    const result = await toggleLessonBookmark(authUser.id, subject, classSlug, lesson);

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const status = ["Subject not found", "Class not found", "Lesson not found"].includes(message)
      ? 404
      : 500;
    return NextResponse.json({ message }, { status });
  }
}
