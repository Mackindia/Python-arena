import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { syncCurrentUser } from "@/lib/user-sync";
import { getSubjectProgress } from "@/lib/lms-progress-enhanced";

export const runtime = "nodejs";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ subject: string }> }
) {
  try {
    const authUser = await currentUser();

    if (!authUser?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    await syncCurrentUser();

    const { subject: subjectSlug } = await params;

    const progress = await getSubjectProgress(authUser.id, subjectSlug);

    return NextResponse.json({ progress });
  } catch (error) {
    return NextResponse.json(
      {
        message: "Failed to fetch subject progress",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
