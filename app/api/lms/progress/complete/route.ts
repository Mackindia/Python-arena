import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { syncCurrentUser } from "@/lib/user-sync";
import { markLessonCompleted } from "@/lib/lms-progress";
import { ProgressCompleteSchema } from "@/src/validators";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const authUser = await currentUser();

    if (!authUser?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    await syncCurrentUser();

    const parsed = ProgressCompleteSchema.safeParse(await request.json());

    if (!parsed.success) {
      return NextResponse.json(
        { message: "Validation failed", errors: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const { subject, class: classSlug, lesson } = parsed.data;

    const result = await markLessonCompleted({
      userId: authUser.id,
      subjectSlug: subject,
      classSlug,
      lessonSlug: lesson,
    });

    return NextResponse.json({
      message: "Lesson marked as completed",
      ...result,
    });
  } catch (error) {
    return NextResponse.json(
      {
        message: "Failed to mark lesson completed",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
