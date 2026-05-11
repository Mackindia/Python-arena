import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { getLessonQuizAttempts } from "@/lib/lms-quiz-attempts";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const authUser = await currentUser();
    if (!authUser?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const sp = request.nextUrl.searchParams;
    const subject = (sp.get("subject") ?? "").trim();
    const classSlug = (sp.get("class") ?? "").trim();
    const lesson = (sp.get("lesson") ?? "").trim();
    const limitRaw = parseInt(sp.get("limit") ?? "10", 10);
    const limit = Number.isFinite(limitRaw) ? Math.min(Math.max(1, limitRaw), 50) : 10;

    if (!subject || !classSlug || !lesson) {
      return NextResponse.json(
        { message: "subject, class and lesson are required" },
        { status: 400 },
      );
    }

    const attempts = await getLessonQuizAttempts(authUser.id, subject, classSlug, lesson, limit);

    return NextResponse.json({ attempts });
  } catch (error) {
    return NextResponse.json(
      {
        message: "Failed to fetch quiz attempts",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
