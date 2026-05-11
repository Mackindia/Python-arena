import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { syncCurrentUser } from "@/lib/user-sync";
import { getProgressAnalytics } from "@/lib/lms-progress-enhanced";

export const runtime = "nodejs";

export async function GET() {
  try {
    const authUser = await currentUser();

    if (!authUser?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    await syncCurrentUser();

    const analytics = await getProgressAnalytics(authUser.id);

    return NextResponse.json({ analytics });
  } catch (error) {
    return NextResponse.json(
      {
        message: "Failed to fetch progress analytics",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
