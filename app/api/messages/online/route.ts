import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Message from "@/src/models/Message";
import OnlinePresence from "@/src/models/OnlinePresence";
import { auth } from "@clerk/nextjs/server";
import { cookies } from "next/headers";

const ADMIN_ROLES = ["super_admin", "admin"];

function isAdmin(role: string) {
  return ADMIN_ROLES.includes(role);
}

async function getAuthUser() {
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

  return null;
}

// POST - mark self as online
export async function POST(req: Request) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    await connectDB();
    await OnlinePresence.findOneAndUpdate(
      { userId: authUser.id },
      {
        userId: authUser.id,
        name: authUser.name,
        role: authUser.role,
        lastSeen: new Date(),
      },
      { upsert: true }
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// GET - get online users (with optional thread context)
export async function GET(req: Request) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    await connectDB();

    const { searchParams } = new URL(req.url);
    const threadId = searchParams.get("threadId");

    // If threadId provided, check if the OTHER person in the thread is online
    if (threadId) {
      const thread = await Message.findById(threadId).lean();
      if (!thread) {
        return NextResponse.json({ online: false });
      }

      let targetUserId: string | null = null;
      if (isAdmin(authUser.role)) {
        targetUserId = thread.userId;
      } else {
        const adminOnline = await OnlinePresence.findOne({
          role: { $in: ADMIN_ROLES },
          lastSeen: { $gt: new Date(Date.now() - 30000) },
        }).lean();
        if (adminOnline) {
          targetUserId = adminOnline.userId;
        }
      }

      if (!targetUserId) {
        return NextResponse.json({ online: false });
      }

      const presence = await OnlinePresence.findOne({
        userId: targetUserId,
        lastSeen: { $gt: new Date(Date.now() - 30000) },
      }).lean();

      return NextResponse.json({ online: !!presence });
    }

    // General online status
    const thirtySecsAgo = new Date(Date.now() - 30000);
    const onlineUsers = await OnlinePresence.find({
      lastSeen: { $gt: thirtySecsAgo },
    }).lean();

    const users = onlineUsers.map((u) => ({
      id: u.userId,
      name: u.name,
      role: u.role,
      lastSeen: u.lastSeen.getTime(),
    }));

    return NextResponse.json({ online: true, users });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
