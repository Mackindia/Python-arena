import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { requireAdminApi } from "@/lib/admin-api";
import EventPost from "@/models/EventPost";
import { deleteCloudinaryAssetByUrl } from "@/lib/cloudinary";

export const runtime = "nodejs";

const EDITABLE = ["draft", "pending_review", "approved", "failed"];

export async function PATCH(
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
    if (!EDITABLE.includes(post.status)) {
      return NextResponse.json(
        { message: `Cannot edit a post in status "${post.status}"` },
        { status: 400 },
      );
    }

    const body = await request.json().catch(() => ({}));
    if (typeof body.caption === "string") post.caption = body.caption;
    if (Array.isArray(body.hashtags)) {
      post.hashtags = body.hashtags.filter((h: unknown) => typeof h === "string");
    }
    await post.save();

    return NextResponse.json({ post });
  } catch (error) {
    return NextResponse.json(
      { message: "Failed to update post", error: error instanceof Error ? error.message : "Unknown" },
      { status: 500 },
    );
  }
}

export async function DELETE(
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
    if (post.status === "publishing") {
      return NextResponse.json(
        { message: "Cannot delete a post while it is publishing" },
        { status: 400 },
      );
    }

    if (post.imageUrl) {
      try {
        await deleteCloudinaryAssetByUrl(post.imageUrl, ["image"]);
      } catch {
        // orphan image is non-fatal; the queue record is still removed
      }
    }
    await post.deleteOne();

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { message: "Failed to delete post", error: error instanceof Error ? error.message : "Unknown" },
      { status: 500 },
    );
  }
}
