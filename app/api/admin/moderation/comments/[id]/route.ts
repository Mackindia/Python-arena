import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { requireAdminApi } from "@/lib/admin-api";
import Comment from "@/models/Comment";
import BlockedUser from "@/models/BlockedUser";

type RouteParams = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const access = await requireAdminApi();
    if (!access.ok) {
      return access.response;
    }

    const body = await request.json();
    await connectDB();
    const { id } = await params;

    const updated = await Comment.findByIdAndUpdate(
      id,
      {
        $set: {
          status: body.status ?? "approved",
          isSpam: Boolean(body.isSpam ?? false),
        },
      },
        { returnDocument: "after" },
    );

    if (!updated) {
      return NextResponse.json({ message: "Comment not found" }, { status: 404 });
    }

    if (body.blockUser && updated.userId) {
      await BlockedUser.findOneAndUpdate(
        { userId: updated.userId },
        { $set: { reason: body.reason ?? "Blocked by moderation", blockedBy: access.ctx.userId } },
        { upsert: true },
      );
    }

    return NextResponse.json({ message: "Moderation updated", comment: updated });
  } catch (error) {
    return NextResponse.json({ message: "Failed to moderate comment", error: error instanceof Error ? error.message : "Unknown" }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const access = await requireAdminApi();
    if (!access.ok) {
      return access.response;
    }

    await connectDB();
    const { id } = await params;

    const deleted = await Comment.findByIdAndDelete(id);
    if (!deleted) {
      return NextResponse.json({ message: "Comment not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Comment deleted" });
  } catch (error) {
    return NextResponse.json({ message: "Failed to delete comment", error: error instanceof Error ? error.message : "Unknown" }, { status: 500 });
  }
}
