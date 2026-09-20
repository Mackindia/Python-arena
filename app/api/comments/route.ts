import { NextRequest, NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { connectDB } from "@/lib/mongodb";
import Comment from "@/models/Comment";
import BlockedUser from "@/models/BlockedUser";
import { cookies } from "next/headers";

async function getAuthUser() {
  try {
    const cookieStore = await cookies();
    const localUserId = cookieStore.get("local_user_id")?.value;

    await connectDB();

    if (localUserId) {
      const User = (await import("@/src/models/User")).default;
      const user = await User.findById(localUserId).lean();
      if (user) {
        return {
          id: String(user._id),
          name: user.fullName || user.username || "Student",
          email: user.email || "",
        };
      }
    }

    try {
      const { userId } = await auth();
      if (userId) {
        const clerkUser = await currentUser();
        const User = (await import("@/src/models/User")).default;
        const user = await User.findOne({ clerkId: userId }).lean();
        if (user) {
          return {
            id: String(user._id),
            name: user.fullName || user.username || "Student",
            email: user.email || "",
          };
        }
        return {
          id: userId,
          name: [clerkUser?.firstName, clerkUser?.lastName].filter(Boolean).join(" ") || clerkUser?.username || "Student",
          email: clerkUser?.primaryEmailAddress?.emailAddress || "",
        };
      }
    } catch {}

    return null;
  } catch {
    return null;
  }
}

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
    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    if (!body.lessonPath || !body.message) {
      return NextResponse.json({ message: "lessonPath and message are required" }, { status: 400 });
    }

    await connectDB();

    const blocked = await BlockedUser.findOne({ userId: authUser.id }).lean();
    if (blocked) {
      return NextResponse.json({ message: "You are blocked from commenting" }, { status: 403 });
    }

    const comment = await Comment.create({
      lessonPath: body.lessonPath,
      courseSlug: body.courseSlug ?? "",
      chapterSlug: body.chapterSlug ?? "",
      userId: authUser.id,
      userName: authUser.name,
      userEmail: authUser.email,
      message: String(body.message).slice(0, 1500),
      status: "approved",
    });

    return NextResponse.json({ message: "Comment posted", comment }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ message: "Failed to post comment", error: error instanceof Error ? error.message : "Unknown" }, { status: 500 });
  }
}
