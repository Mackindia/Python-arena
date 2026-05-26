import { NextResponse } from "next/server";
import { connectDB } from "../../../../../lib/mongodb";
import User from "../../../../../models/User";
import { auth } from "@clerk/nextjs/server";
import { cookies } from "next/headers";
import { requireSuperAdminApi } from "@/lib/admin-api";

async function isAdmin() {
  await connectDB();
  const { userId } = await auth();
  
  if (userId) {
    const user = await User.findOne({ clerkId: userId });
    // Hardcode abhishekr474@gmail.com as super_admin
    if (user?.email?.toLowerCase() === "abhishekr474@gmail.com") return true;
    return user?.role === "admin" || user?.role === "super_admin";
  }

  const cookieStore = await cookies();
  const localUserId = cookieStore.get("local_user_id")?.value;
  if (localUserId) {
    const user = await User.findById(localUserId);
    if (user?.email?.toLowerCase() === "abhishekr474@gmail.com") return true;
    return user?.role === "admin" || user?.role === "super_admin";
  }

  return false;
}

type RouteParams = {
  params: Promise<{ id: string }>;
};

export async function PUT(req: Request, { params }: RouteParams) {
  try {
    if (!(await isAdmin())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    await connectDB();
    const body = await req.json();

    const { fullName, username, password, role, class: cls, section, group, meet_link, is_active } = body;

    const user = await User.findById(id);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check username uniqueness if modified
    if (username && username !== user.username) {
      const existing = await User.findOne({ username });
      if (existing) {
        return NextResponse.json({ error: "Username already exists" }, { status: 400 });
      }
    }

    user.fullName = fullName || user.fullName;
    if (username) user.username = username;
    if (password) user.password = password;
    user.role = role || user.role;
    user.class = cls;
    user.studentClass = cls;
    user.section = section;
    user.group = group || "MAIN";
    user.meet_link = meet_link;
    user.teacher_id = body.teacher_id; // Add teacher_id update
    if (is_active !== undefined) user.is_active = is_active;

    await user.save();

    return NextResponse.json({ success: true, user });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: RouteParams) {
  try {
    const access = await requireSuperAdminApi();
    if (!access.ok) {
      return access.response;
    }

    const { id } = await params;
    await connectDB();

    const user = await User.findByIdAndDelete(id);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}