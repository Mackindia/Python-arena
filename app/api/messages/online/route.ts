import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Message from "@/src/models/Message";
import { auth } from "@clerk/nextjs/server";
import { cookies } from "next/headers";

// Track online users in memory (resets on server restart)
const ONLINE_STALE_MS = 120000;
const STAFF_ROLES = new Set(["super_admin"]);
const USER_ROLES = new Set(["student"]);

type OnlinePresence = { lastSeen: number; name: string; role: string };

const globalScope = globalThis as typeof globalThis & {
  __chatOnlineUsers?: Map<string, OnlinePresence>;
};

const onlineUsers: Map<string, OnlinePresence> =
  globalScope.__chatOnlineUsers ?? (globalScope.__chatOnlineUsers = new Map<string, OnlinePresence>());

function cleanStale() {
  const now = Date.now();
  for (const [id, data] of onlineUsers) {
    if (now - data.lastSeen > ONLINE_STALE_MS) onlineUsers.delete(id);
  }
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
    } catch {
      // Clerk may be unavailable in some local environments.
    }

    return null;
  } catch {
    return null;
  }
}

function canUseMessages(role: string) {
  return STAFF_ROLES.has(role) || USER_ROLES.has(role);
}

// POST - mark self as online
export async function POST(req: Request) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    if (!canUseMessages(authUser.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
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

    if (!canUseMessages(authUser.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
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

      // For staff roles: check if the user who started the thread is online.
      // For non-staff users: check if any staff member is online.
      let targetUserId: string | null = null;
      if (STAFF_ROLES.has(authUser.role)) {
        targetUserId = thread.userId;
      } else {
        // Find any available staff id
        for (const [id, data] of onlineUsers) {
          if (STAFF_ROLES.has(data.role)) {
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

    const staffOnline = onlineList.some((u) => STAFF_ROLES.has(u.role));
    return NextResponse.json({ online: staffOnline, users: onlineList });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
