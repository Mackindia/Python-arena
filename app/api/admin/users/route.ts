import { NextResponse } from "next/server";
import { connectDB } from "../../../../lib/mongodb";
import User from "../../../../models/User";
import Timetable from "../../../../models/Timetable";
import { auth } from "@clerk/nextjs/server";
import { cookies } from "next/headers";

function normalizeTeacherId(raw: unknown): string {
  if (typeof raw !== "string") return "";
  return raw.trim().toUpperCase();
}

function isValidTeacherId(value: string): boolean {
  return /^[A-Z0-9]{2,6}$/.test(value);
}

// Helper to verify if request is from an admin
async function isAdmin() {
  await connectDB();
  
  // Check Clerk session first
  const { userId } = await auth();
  if (userId) {
    const user = await User.findOne({ clerkId: userId });
    return user?.role === "admin" || user?.role === "super_admin";
  }

  // Check local session cookie
  const cookieStore = await cookies();
  const localUserId = cookieStore.get("local_user_id")?.value;
  if (localUserId) {
    const user = await User.findById(localUserId);
    return user?.role === "admin" || user?.role === "super_admin";
  }

  return false;
}

export async function GET(request: Request) {
  try {
    if (!(await isAdmin())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    // Check for status filter
    const { searchParams } = new URL(request.url);
    const statusFilter = searchParams.get("status");

    let query: Record<string, any> = {};
    if (statusFilter && ["pending", "approved", "rejected"].includes(statusFilter)) {
      query.status = statusFilter;
    }

    const users = await User.find(query).sort({ createdAt: -1 }).lean();
    return NextResponse.json({ users });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    if (!(await isAdmin())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const body = await req.json();

    const { fullName, username, password, role, class: cls, section, group, meet_link, is_active } = body;
    const normalizedTeacherId = role === "teacher" ? normalizeTeacherId(body.teacher_id) : "";

    if (!fullName || !username || !password || !role) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (role === "teacher") {
      if (!normalizedTeacherId) {
        return NextResponse.json({ error: "Teacher ID is required for teacher role" }, { status: 400 });
      }

      if (!isValidTeacherId(normalizedTeacherId)) {
        return NextResponse.json(
          { error: "Teacher ID must be 2-6 chars: A-Z or 0-9 only" },
          { status: 400 }
        );
      }

      const existingTeacherId = await User.findOne({ teacher_id: normalizedTeacherId });
      if (existingTeacherId) {
        return NextResponse.json({ error: "Teacher ID already exists" }, { status: 400 });
      }
    }

    // Check if username already exists in MongoDB
    const existing = await User.findOne({ username });
    if (existing) {
      return NextResponse.json({ error: "Username already exists in Database" }, { status: 400 });
    }

    let clerkId = "";
    
    // --- CLERK SYNC LOGIC ---
    // Try to create the user in Clerk so they can log in via the Social Login component immediately
    try {
      // Use dynamic import or available clerkClient instance
      const { clerkClient } = await import("@clerk/nextjs/server");
      
      // Depending on the Clerk version, clerkClient might be a function or an object
      const client = typeof clerkClient === 'function' ? await clerkClient() : clerkClient;
      
      const nameParts = fullName ? fullName.split(" ") : ["User"];
      const firstName = nameParts[0];
      const lastName = nameParts.length > 1 ? nameParts.slice(1).join(" ") : undefined;

      const newClerkUser = await client.users.createUser({
        firstName: firstName,
        lastName: lastName,
        username: username,
        emailAddress: [`${username}@doonscholars.com`], // Changed .internal to .com as Clerk often rejects invalid TLDs
        password: password,
        publicMetadata: { role: role },
        skipPasswordChecks: true
      });
      
      clerkId = newClerkUser.id;
    } catch (clerkError: any) {
      console.error("Clerk Sync Error:", JSON.stringify(clerkError, null, 2));
      
      // Extract the exact field that failed and the detailed message
      const errDetail = clerkError.errors?.[0];
      const paramName = errDetail?.meta?.paramName || "Unknown Field";
      const message = errDetail?.message || clerkError.message || "No specific error message";
      
      return NextResponse.json({ 
        error: `Failed to create user in Clerk Security: [${paramName}] ${message}` 
      }, { status: 400 });
    }
    // --- END CLERK SYNC LOGIC ---

    const newUser = await User.create({
      clerkId: clerkId,
      fullName,
      username,
      password,
      role,
      class: cls,
      studentClass: cls,
      section,
      group: group || "MAIN",
      meet_link,
      teacher_id: normalizedTeacherId, // Links to timetable shortcode
      is_active: is_active !== undefined ? is_active : true,
    });

    // Auto-map timetable rows created from CSV initials once a teacher account is created.
    if (role === "teacher" && normalizedTeacherId) {
      await Timetable.updateMany(
        { teacher_id: new RegExp(`^${normalizedTeacherId}$`, "i") },
        { $set: { teacher_name: fullName } }
      );
    }

    return NextResponse.json({ success: true, user: newUser });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
