import { NextResponse } from "next/server";
import { connectDB } from "../../../lib/mongodb";
import User from "../../../models/User";
import Timetable from "../../../models/Timetable";
import ActiveSession from "../../../models/ActiveSession";

export async function GET(req: Request) {
  try {
    await connectDB();
    
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const todayName = days[new Date().getDay()];

    const timetables = await Timetable.find({ day: todayName }).lean();
    const students = await User.find({ role: "student" }).lean();
    const activeSessions = await ActiveSession.find({}).lean();
    const teachers = await User.find({ role: "teacher" }).lean();

    return NextResponse.json({
      today: todayName,
      timetables: timetables,
      activeSessions: activeSessions,
      studentsCount: students.length,
      sampleStudents: students.slice(0, 5).map(s => ({
        username: s.username,
        class: s.class,
        studentClass: s.studentClass,
        section: s.section
      })),
      teachers: teachers.map(t => ({
        username: t.username,
        teacher_id: t.teacher_id
      }))
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message });
  }
}
