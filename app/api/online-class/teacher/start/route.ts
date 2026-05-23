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
    
    // Resolve teacher ID
    const { userId } = await auth();
    let teacherId = userId;
    
    // Always fetch the DB user to get the correct teacher_id (shortcode)
    let user = null;
    if (userId) {
      user = await User.findOne({ clerkId: userId });
    } else {
      const cookieStore = await cookies();
      const localUserId = cookieStore.get("local_user_id")?.value;
      if (localUserId) {
        user = await User.findById(localUserId);
      }
    }

    if (user) {
      teacherId = user.teacher_id || user.username || user.clerkId || user._id.toString();
    }

    if (!teacherId) {
      teacherId = body.teacher_id || body.teacherId || "teacher_dummy_123";
    }

    const session = await ActiveSession.create({
      class: body.class,
      section: body.section,
      group: body.group || "MAIN",
      subject: body.subject,
      teacher_id: teacherId,
      meet_link: body.meetLink || body.meet_link,
      period_no: body.periodNo || body.period_no,
      is_active: true,
    });

    return NextResponse.json({
      success: true,
      session,
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: "Failed to start class",
    });
  }
}
