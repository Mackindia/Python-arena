import { NextResponse } from "next/server";
import { connectDB } from "../../../../../lib/mongodb";
import { auth } from "@clerk/nextjs/server";
import { cookies } from "next/headers";
import ActiveSession from "../../../../../models/ActiveSession";
import User from "../../../../../models/User";

export async function POST(req: Request) {
  try {
    await connectDB();

    const body = await req.json();
    const { userId } = await auth();

    let teacherId: string | null = null;
    if (userId) {
      const user = await User.findOne({ clerkId: userId });
      teacherId = user?.teacher_id || user?.username || user?.clerkId || (user?._id ? String(user._id) : null);
    } else {
      const cookieStore = await cookies();
      const localUserId = cookieStore.get("local_user_id")?.value;
      if (localUserId) {
        const user = await User.findById(localUserId);
        teacherId = user?.teacher_id || user?.username || user?.clerkId || (user?._id ? String(user._id) : null);
      }
    }

    if (!teacherId) {
      teacherId = body.teacher_id || body.teacherId || null;
    }

    // Deactivate the session
    await ActiveSession.updateMany(
      { 
        class: body.class, 
        section: body.section, 
        group: body.group || "MAIN",
        subject: body.subject, 
        period_no: body.periodNo !== undefined ? body.periodNo : body.period_no,
        ...(teacherId ? { teacher_id: teacherId } : {}),
      },
      { $set: { is_active: false } }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to end class" });
  }
}
