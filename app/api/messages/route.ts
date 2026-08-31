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
        senderId: authUser.id,
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
          senderId: authUser.id,
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
    const since = searchParams.get("since");

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

      // Mark unread messages as read by current user
      const now = new Date();
      await Message.updateOne(
        { _id: threadId },
        {
          $set: {
            unreadByAdmin: hasAdminAccess ? false : thread.unreadByAdmin,
            unreadByUser: isOwner ? false : thread.unreadByUser,
          },
          $addToSet: {
            "messages.$[elem].readBy": { userId: authUser.id, readAt: now },
          },
        },
        {
          arrayFilters: [{ "elem.readBy.userId": { $ne: authUser.id } }],
        }
      );

      // Return updated thread
      const updatedThread = await Message.findById(threadId).lean();
      return NextResponse.json({ thread: updatedThread });
    }

    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const skip = (page - 1) * limit;

    let filter: any = {};
    if (isAdmin(authUser.role)) {
      if (since) {
        filter.updatedAt = { $gt: new Date(since) };
      }
    } else {
      filter.userId = authUser.id;
      if (since) {
        filter.updatedAt = { $gt: new Date(since) };
      }
    }

    const [threads, total] = await Promise.all([
      Message.find(filter).sort({ updatedAt: -1 }).skip(since ? 0 : skip).limit(since ? 100 : limit).lean(),
      Message.countDocuments(isAdmin(authUser.role) ? {} : { userId: authUser.id }),
    ]);

    // Add unread message count for each thread
    const threadsWithUnread = threads.map((thread) => {
      const unreadCount = thread.messages.filter((msg: any) => {
        const isOwnMessage = msg.senderId === authUser.id;
        if (isOwnMessage) return false;
        const hasRead = msg.readBy?.some((r: any) => r.userId === authUser.id);
        return !hasRead;
      }).length;
      return { ...thread, unreadCount };
    });

    return NextResponse.json({
      threads: threadsWithUnread,
      isAdmin: isAdmin(authUser.role),
      ...(since ? {} : {
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      }),
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
