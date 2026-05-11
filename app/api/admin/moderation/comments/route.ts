import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { requireAdminApi } from "@/lib/admin-api";
import Comment from "@/models/Comment";

export async function GET(request: NextRequest) {
  try {
    const access = await requireAdminApi();
    if (!access.ok) {
      return access.response;
    }

    await connectDB();
    const status = request.nextUrl.searchParams.get("status")?.trim() ?? "all";
    const query = request.nextUrl.searchParams.get("query")?.trim() ?? "";
    const page = Math.max(1, Number(request.nextUrl.searchParams.get("page") ?? "1"));
    const pageSize = Math.min(100, Math.max(5, Number(request.nextUrl.searchParams.get("pageSize") ?? "20")));

    const filters: Record<string, unknown> = {};

    if (status !== "all") {
      filters.status = status;
    }

    if (query) {
      filters.$or = [
        { message: { $regex: query, $options: "i" } },
        { userName: { $regex: query, $options: "i" } },
        { userEmail: { $regex: query, $options: "i" } },
      ];
    }

    const [comments, total] = await Promise.all([
      Comment.find(filters)
        .sort({ createdAt: -1 })
        .skip((page - 1) * pageSize)
        .limit(pageSize)
        .lean(),
      Comment.countDocuments(filters),
    ]);

    return NextResponse.json({
      comments,
      pagination: {
        total,
        page,
        pageSize,
        totalPages: Math.max(1, Math.ceil(total / pageSize)),
      },
    });
  } catch (error) {
    return NextResponse.json({ message: "Failed to load moderation queue", error: error instanceof Error ? error.message : "Unknown" }, { status: 500 });
  }
}
