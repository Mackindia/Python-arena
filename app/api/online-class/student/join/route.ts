import { NextResponse } from "next/server";
import { connectDB } from "../../../../../lib/mongodb";
import { auth } from "@clerk/nextjs/server";
import { cookies } from "next/headers";
import ActiveSession from "../../../../../models/ActiveSession";
import Attendance from "../../../../../models/Attendance";
import User from "../../../../../models/User";

export async function POST(req: Request) {
  try {
    await connectDB();

    const body = await req.json();
    const session = await ActiveSession.findById(body.sessionId);

    if (!session || !session.is_active) {
      return NextResponse.json({
        error: "Session not active",
      });
    }

    // Resolve student identification
    const { userId } = await auth();
    let studentId = userId || "";
    
    if (!studentId) {
      const cookieStore = await cookies();
      const localUserId = cookieStore.get("local_user_id")?.value;
      if (localUserId) {
        const user = await User.findById(localUserId);
        studentId = user?.username || user?._id.toString() || localUserId;
      }
    }

    if (studentId) {
      // Record attendance
      const todayStr = new Date().toISOString().split("T")[0];
      
      // Prevent duplicate attendance records for the same student on the same day/session
      const existingAttendance = await Attendance.findOne({
        student_id: studentId,
        subject: session.subject,
        period_no: session.period_no,
        date: todayStr,
      });

      if (!existingAttendance) {
        await Attendance.create({
          student_id: studentId,
          class: session.class,
          section: session.section,
          group: session.group || "MAIN",
          subject: session.subject,
          period_no: session.period_no,
          date: todayStr,
          join_time: new Date(),
        });
      }
    }

    return NextResponse.json({
      meet_link: session.meet_link,
    });
  } catch (error) {
    return NextResponse.json({
      error: "Failed to join",
    });
  }
}
