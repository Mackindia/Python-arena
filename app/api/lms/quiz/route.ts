import { NextRequest, NextResponse } from "next/server";
import { getPublicLessonQuiz } from "@/lib/lms-quiz";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const subject = (request.nextUrl.searchParams.get("subject") ?? "").trim();
    const classSlug = (request.nextUrl.searchParams.get("class") ?? "").trim();
    const lesson = (request.nextUrl.searchParams.get("lesson") ?? "").trim();

    if (!subject || !classSlug || !lesson) {
      return NextResponse.json({ message: "subject, class and lesson are required" }, { status: 400 });
    }

    const quiz = await getPublicLessonQuiz(subject, classSlug, lesson);

    return NextResponse.json({ quiz });
  } catch (error) {
    return NextResponse.json(
      {
        message: "Failed to fetch lesson quiz",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
