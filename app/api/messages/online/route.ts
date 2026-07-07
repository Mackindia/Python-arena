import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Message from "@/src/models/Message";
import { auth } from "@clerk/nextjs/server";
import { cookies } from "next/headers";

const ADMIN_ROLES = ["super_admin", "admin"];

function isAdmin(role: string) {
  return ADMIN_ROLES.includes(role);
}

// Track online users in memory (resets on server restart)
const onlineUsers = new Map<string, { lastSeen: number; name: string; role: string }>();

function cleanStale() {
  const now = Date.now();
  for (const [id, data] of onlineUsers) {
    if (now - data.lastSeen > 30000) onlineUsers.delete(id);
  }
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

    cleanStale();
    onlineUsers.set(authUser.id, {
      lastSeen: Date.now(),
      name: authUser.name,
      role: authUser.role,
    });

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

    cleanStale();

    const { searchParams } = new URL(req.url);
    const threadId = searchParams.get("threadId");

    // If threadId provided, check if the OTHER person in the thread is online
    if (threadId) {
      await connectDB();
      const thread = await Message.findById(threadId).lean();
      if (!thread) {
        return NextResponse.json({ online: false });
      }

      // For admin: check if the user who started the thread is online
      // For regular user: check if any admin is online
      let targetUserId: string | null = null;
      if (isAdmin(authUser.role)) {
        targetUserId = thread.userId;
      } else {
        // Find any admin's id
        for (const [id, data] of onlineUsers) {
          if (isAdmin(data.role)) {
            targetUserId = id;
            break;
          }
        }
      }

      const isOnline = targetUserId ? onlineUsers.has(targetUserId) : false;
      return NextResponse.json({ online: isOnline });
    }

    // General online status - who is online
    const onlineList = Array.from(onlineUsers.entries()).map(([id, data]) => ({
      id,
      name: data.name,
      role: data.role,
      lastSeen: data.lastSeen,
    }));

    return NextResponse.json({ online: true, users: onlineList });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
