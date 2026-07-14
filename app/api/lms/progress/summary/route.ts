import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { syncCurrentUser } from "@/lib/user-sync";
import { getUserProgressSummary } from "@/lib/lms-progress";
import { getCached } from "@/lib/redis";

export const runtime = "nodejs";

export async function GET() {
  try {
    const authUser = await currentUser();

    if (!authUser?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    await syncCurrentUser();

    const summary = await getCached(
      `progress:summary:${authUser.id}`,
      () => getUserProgressSummary(authUser.id),
      300 // cache for 5 minutes
    );

    return NextResponse.json({
      summary,
    });
  } catch (error) {
    return NextResponse.json(
      {
        message: "Failed to fetch progress summary",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
