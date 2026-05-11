import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { getUserBookmarks, isLessonBookmarked } from "@/lib/lms-bookmarks";

export const runtime = "nodejs";

/**
 * GET /api/lms/bookmarks
 * Returns paginated saved lessons for the authenticated user.
 *
 * Query params:
 *   page  – page number (default 1)
 *   limit – items per page, max 50 (default 20)
 *   check – lessonSlug to check single bookmark status
 *   subject, class – required when check is provided
 */
export async function GET(request: NextRequest) {
  try {
    const authUser = await currentUser();
    if (!authUser?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const sp = request.nextUrl.searchParams;
    const check = (sp.get("check") ?? "").trim();

    // ── Single bookmark status check ─────────────────────────────────────
    if (check) {
      const subject = (sp.get("subject") ?? "").trim();
      const classSlug = (sp.get("class") ?? "").trim();

      if (!subject || !classSlug) {
        return NextResponse.json(
          { message: "subject and class are required when using check" },
          { status: 400 },
        );
      }

      const bookmarked = await isLessonBookmarked(authUser.id, subject, classSlug, check);
      return NextResponse.json({ bookmarked });
    }

    // ── Paginated list ────────────────────────────────────────────────────
    const pageRaw = parseInt(sp.get("page") ?? "1", 10);
    const limitRaw = parseInt(sp.get("limit") ?? "20", 10);
    const page = Number.isFinite(pageRaw) ? Math.max(1, pageRaw) : 1;
    const limit = Number.isFinite(limitRaw) ? Math.min(Math.max(1, limitRaw), 50) : 20;

    const result = await getUserBookmarks(authUser.id, page, limit);

    return NextResponse.json({
      ...result,
      page,
      limit,
      hasMore: page * limit < result.total,
    });
  } catch (error) {
    return NextResponse.json(
      {
        message: "Failed to fetch bookmarks",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
