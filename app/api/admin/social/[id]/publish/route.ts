import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { requireAdminApi } from "@/lib/admin-api";
import EventPost from "@/models/EventPost";
import { publishToInstagram } from "@/lib/instagram";

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
    if (post.status !== "approved") {
      return NextResponse.json(
        { message: `Cannot publish a post in status "${post.status}" — approve it first` },
        { status: 400 },
      );
    }

    post.status = "publishing";
    await post.save();

    const result = await publishToInstagram({
      imageUrl: post.imageUrl,
      caption: post.caption,
    });

    if (result.ok) {
      post.status = "published";
      post.igMediaId = result.mediaId;
      post.igPermalink = result.permalink;
      post.publishedAt = new Date();
      post.error = "";
      await post.save();
      return NextResponse.json({ post });
    }

    if (result.error.includes("not configured")) {
      post.status = "approved";
      await post.save();
      return NextResponse.json(
        { message: "Instagram not configured", post, error: result.error },
        { status: 503 },
      );
    }

    post.status = "failed";
    post.error = result.error;
    post.attempts += 1;
    await post.save();
    return NextResponse.json(
      { message: "Publish failed", post, error: result.error },
      { status: 502 },
    );
  } catch (error) {
    return NextResponse.json(
      { message: "Failed to publish post", error: error instanceof Error ? error.message : "Unknown" },
      { status: 500 },
    );
  }
}
