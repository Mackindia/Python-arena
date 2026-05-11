import { NextRequest, NextResponse } from "next/server";
import { searchLmsLessons } from "@/lib/lms-lesson-search";
import { LessonSearchQuerySchema } from "@/src/validators";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const sp = request.nextUrl.searchParams;
    const parsed = LessonSearchQuerySchema.safeParse({
      q: sp.get("q") ?? undefined,
      subject: sp.get("subject") ?? undefined,
      class: sp.get("class") ?? undefined,
      page: sp.get("page") ?? undefined,
      limit: sp.get("limit") ?? undefined,
    });

    if (!parsed.success) {
      return NextResponse.json(
        { message: "Invalid query parameters", errors: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const { q: query, subject: subjectSlug, class: classSlug, page, limit } = parsed.data;

    const results = await searchLmsLessons({
      query,
      subjectSlug,
      classSlug,
      page,
      limit,
    });

    return NextResponse.json(results);
  } catch (error) {
    return NextResponse.json(
      {
        message: "Failed to search lessons",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
