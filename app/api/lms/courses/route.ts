import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Course from "@/models/Course";

export const runtime = "nodejs";

function slugToLabel(slug: string) {
  if (slug.toLowerCase() === "ai") return "AI";
  if (slug.toLowerCase() === "computer-science") return "Computer Science";
  return slug
    .split("-")
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join(" ");
}

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const subjectSlug = (request.nextUrl.searchParams.get("subject") ?? "").trim();
    const classSlug = (request.nextUrl.searchParams.get("class") ?? "").trim();
    const showAll = request.nextUrl.searchParams.get("all") === "true";

    const query: Record<string, unknown> = {};
    const andFilters: Record<string, unknown>[] = [];

    if (subjectSlug) {
      const label = slugToLabel(subjectSlug);
      andFilters.push({
        $or: [
          { subjectSlug },
          { subject: { $regex: `^${label}$`, $options: "i" } },
        ],
      });
    }

    if (classSlug) {
      const label = slugToLabel(classSlug);
      andFilters.push({
        $or: [
          { classSlug },
          { classLevel: { $regex: label, $options: "i" } },
        ],
      });
    }

    if (!showAll) {
      query.status = "published";
    }

    if (andFilters.length) {
      query.$and = andFilters;
    }

    const courses = await Course.find(query)
      .select("title slug description subject classLevel difficulty thumbnail status chapters")
      .sort({ updatedAt: -1 })
      .lean();

    return NextResponse.json({ courses });
  } catch (error) {
    return NextResponse.json(
      { message: "Failed to fetch courses", error: error instanceof Error ? error.message : "Unknown" },
      { status: 500 },
    );
  }
}
