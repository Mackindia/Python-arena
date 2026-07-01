import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Message from "@/src/models/Message";
import { auth } from "@clerk/nextjs/server";
import { cookies } from "next/headers";

const ADMIN_ROLES = ["super_admin", "admin"];

function isAdmin(role: string) {
  return ADMIN_ROLES.includes(role);
}

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
          name: user.fullName || user.username || "User",
          role: user.role || "student",
        };
      }
    }

    try {
      const { userId } = await auth();
      if (userId) {
        const User = (await import("@/src/models/User")).default;
        const user = await User.findOne({ clerkId: userId }).lean();
        if (user) {
          return {
            id: String(user._id),
            name: user.fullName || user.username || "User",
            role: user.role || "student",
          };
        }
      }
    } catch {}

    return null;
  } catch {
    return null;
  }
}

export async function POST(req: Request) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await req.json();
    const { threadId, subject, text } = body;

    if (!text || !text.trim()) {
      return NextResponse.json({ error: "Message text is required" }, { status: 400 });
    }

    await connectDB();

    if (threadId) {
      const thread = await Message.findById(threadId);
      if (!thread) {
        return NextResponse.json({ error: "Thread not found" }, { status: 404 });
      }

      const isOwner = thread.userId === authUser.id;
      const hasAdminAccess = isAdmin(authUser.role);
      if (!isOwner && !hasAdminAccess) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
      }

      thread.messages.push({
        sender: authUser.name,
        senderRole: authUser.role,
        text: text.trim(),
        createdAt: new Date(),
      });

      if (hasAdminAccess) {
        thread.unreadByUser = true;
        thread.status = "replied";
      } else {
        thread.unreadByAdmin = true;
      }

      await thread.save();
      return NextResponse.json({ success: true, thread });
    }

    const thread = await Message.create({
      userId: authUser.id,
      userName: authUser.name,
      userRole: authUser.role,
      subject: subject || "General",
      messages: [
        {
          sender: authUser.name,
          senderRole: authUser.role,
          text: text.trim(),
          createdAt: new Date(),
        },
      ],
      status: "open",
      unreadByAdmin: true,
      unreadByUser: false,
    });

    return NextResponse.json({ success: true, thread }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    await connectDB();
    const { searchParams } = new URL(req.url);
    const threadId = searchParams.get("threadId");

    if (threadId) {
      const thread = await Message.findById(threadId).lean();
      if (!thread) {
        return NextResponse.json({ error: "Thread not found" }, { status: 404 });
      }

      const isOwner = thread.userId === authUser.id;
      const hasAdminAccess = isAdmin(authUser.role);
      if (!isOwner && !hasAdminAccess) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
      }

      if (hasAdminAccess) {
        await Message.findByIdAndUpdate(threadId, { unreadByAdmin: false });
      } else if (isOwner) {
        await Message.findByIdAndUpdate(threadId, { unreadByUser: false });
      }

      return NextResponse.json({ thread });
    }

    if (isAdmin(authUser.role)) {
      const threads = await Message.find().sort({ updatedAt: -1 }).lean();
      return NextResponse.json({ threads, isAdmin: true });
    }

    const threads = await Message.find({ userId: authUser.id })
      .sort({ updatedAt: -1 })
      .lean();
    return NextResponse.json({ threads, isAdmin: false });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
