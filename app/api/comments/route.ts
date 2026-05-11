import { NextRequest, NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { connectDB } from "@/lib/mongodb";
import Comment from "@/models/Comment";
import BlockedUser from "@/models/BlockedUser";

export async function GET(request: NextRequest) {
  try {
    const lessonPath = request.nextUrl.searchParams.get("lessonPath");

    if (!lessonPath) {
      return NextResponse.json({ message: "lessonPath is required" }, { status: 400 });
    }

    await connectDB();

    const comments = await Comment.find({ lessonPath, status: "approved", isSpam: false })
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    return NextResponse.json({ comments });
  } catch (error) {
    return NextResponse.json({ message: "Failed to load comments", error: error instanceof Error ? error.message : "Unknown" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    if (!body.lessonPath || !body.message) {
      return NextResponse.json({ message: "lessonPath and message are required" }, { status: 400 });
    }

    await connectDB();

    const blocked = await BlockedUser.findOne({ userId }).lean();
    if (blocked) {
      return NextResponse.json({ message: "You are blocked from commenting" }, { status: 403 });
    }

    const clerkUser = await currentUser();

    const comment = await Comment.create({
      lessonPath: body.lessonPath,
      courseSlug: body.courseSlug ?? "",
      chapterSlug: body.chapterSlug ?? "",
      userId,
      userName: [clerkUser?.firstName, clerkUser?.lastName].filter(Boolean).join(" ") || clerkUser?.username || "Student",
      userEmail: clerkUser?.primaryEmailAddress?.emailAddress ?? "",
      message: String(body.message).slice(0, 1500),
      status: "approved",
    });

    return NextResponse.json({ message: "Comment posted", comment }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ message: "Failed to post comment", error: error instanceof Error ? error.message : "Unknown" }, { status: 500 });
  }
}
