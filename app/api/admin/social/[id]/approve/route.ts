import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { requireAdminApi } from "@/lib/admin-api";
import EventPost from "@/models/EventPost";

export const runtime = "nodejs";

export async function POST(
  request: NextRequest,
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
    if (!["pending_review", "draft", "failed"].includes(post.status)) {
      return NextResponse.json(
        { message: `Cannot approve a post in status "${post.status}"` },
        { status: 400 },
      );
    }
    if (!post.imageUrl) {
      return NextResponse.json(
        { message: "This post has no image — regenerate it first" },
        { status: 400 },
      );
    }

    const body = await request.json().catch(() => ({}));
    if (typeof body.caption === "string") post.caption = body.caption;
    if (Array.isArray(body.hashtags)) {
      post.hashtags = body.hashtags.filter((h: unknown) => typeof h === "string");
    }

    post.status = "approved";
    post.error = "";
    await post.save();

    return NextResponse.json({ post });
  } catch (error) {
    return NextResponse.json(
      { message: "Failed to approve post", error: error instanceof Error ? error.message : "Unknown" },
      { status: 500 },
    );
  }
}
