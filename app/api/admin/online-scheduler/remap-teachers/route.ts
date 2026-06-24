import { NextResponse } from "next/server";
import { connectDB } from "../../../../../lib/mongodb";
import Timetable from "../../../../../models/Timetable";
import User from "../../../../../models/User";
import { auth } from "@clerk/nextjs/server";
import { cookies } from "next/headers";

async function isAdmin() {
  await connectDB();
  const { userId } = await auth();
  if (userId) {
    const user = await User.findOne({ clerkId: userId });
    return user?.role === "admin" || user?.role === "super_admin";
  }

  const cookieStore = await cookies();
  const localUserId = cookieStore.get("local_user_id")?.value;
  if (localUserId) {
    const user = await User.findById(localUserId);
    return user?.role === "admin" || user?.role === "super_admin";
  }

  return false;
}

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export async function POST() {
  try {
    if (!(await isAdmin())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const teachers = await User.find({
      role: { $in: ["teacher"] },
      teacher_id: { $exists: true, $ne: "" },
      fullName: { $exists: true, $ne: "" },
    })
      .select("teacher_id fullName")
      .lean();

    let updatedRows = 0;
    let teacherCount = 0;

    for (const teacher of teachers) {
      const teacherId = String((teacher as any).teacher_id || "").trim();
      const teacherName = String((teacher as any).fullName || "").trim();
      if (!teacherId || !teacherName) continue;

      const result = await Timetable.updateMany(
        { teacher_id: new RegExp(`^${escapeRegex(teacherId)}$`, "i") },
        { $set: { teacher_name: teacherName } }
      );

      const modified = Number(result.modifiedCount || 0);
      if (modified > 0) {
        teacherCount += 1;
        updatedRows += modified;
      }
    }

    return NextResponse.json({ success: true, teacherCount, updatedRows });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
