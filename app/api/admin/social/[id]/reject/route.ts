import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { requireAdminApi } from "@/lib/admin-api";
import EventPost from "@/models/EventPost";

export const runtime = "nodejs";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const access = await requireAdminApi();
    if (!access.ok) {
      return access.response;
    }

    const { id } = await params;
    await connectDB();
    const post = await EventPost.findById(id);
    if (!post) {
      return NextResponse.json({ message: "Post not found" }, { status: 404 });
    }
    if (post.status !== "pending_review") {
      return NextResponse.json(
        { message: `Cannot reject a post in status "${post.status}"` },
        { status: 400 },
      );
    }

    post.status = "draft";
    post.error = "";
    await post.save();

    return NextResponse.json({ post });
  } catch (error) {
    return NextResponse.json(
      { message: "Failed to reject post", error: error instanceof Error ? error.message : "Unknown" },
      { status: 500 },
    );
  }
}
