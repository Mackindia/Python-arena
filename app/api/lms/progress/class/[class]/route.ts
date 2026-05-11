import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { syncCurrentUser } from "@/lib/user-sync";
import { getClassProgress } from "@/lib/lms-progress-enhanced";

export const runtime = "nodejs";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ class: string }> }
) {
  try {
    const authUser = await currentUser();

    if (!authUser?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    await syncCurrentUser();

    const { class: classSlug } = await params;

    const progress = await getClassProgress(authUser.id, classSlug);

    return NextResponse.json({ progress });
  } catch (error) {
    return NextResponse.json(
      {
        message: "Failed to fetch class progress",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
