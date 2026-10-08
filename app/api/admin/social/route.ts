import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { requireAdminApi } from "@/lib/admin-api";
import EventPost, { POST_STATUSES } from "@/models/EventPost";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const access = await requireAdminApi();
    if (!access.ok) {
      return access.response;
    }

    const status = request.nextUrl.searchParams.get("status");
    const filter =
      status && (POST_STATUSES as readonly string[]).includes(status) ? { status } : {};

    await connectDB();
    const posts = await EventPost.find(filter).sort({ createdAt: -1 }).limit(100).lean();

    return NextResponse.json({ posts });
  } catch (error) {
    return NextResponse.json(
      { message: "Failed to fetch posts", error: error instanceof Error ? error.message : "Unknown" },
      { status: 500 },
    );
  }
}
