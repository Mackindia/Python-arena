import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Period from "@/models/Period";
import Teacher from "@/models/Teacher";
import Timetable from "@/models/Timetable";
import User from "@/models/User";
import { requireSuperAdminApi } from "@/lib/admin-api";
import { sanitizeError } from "@/lib/security";

export async function POST() {
  try {
    const auth = await requireSuperAdminApi();
    if (!auth.ok) return auth.response;

    await connectDB();

    await Period.deleteMany({});
    const periods = [];
    let startHour = 8;
    let startMin = 0;

    for (let i = 1; i <= 7; i++) {
      const endMin = startMin + 40;
      const h1 = startHour.toString().padStart(2, "0");
      const m1 = startMin.toString().padStart(2, "0");

      let endHourVal = startHour;
      let endMinVal = endMin;
      if (endMinVal >= 60) {
        endHourVal += Math.floor(endMinVal / 60);
        endMinVal = endMinVal % 60;
      }

      const h2 = endHourVal.toString().padStart(2, "0");
      const m2 = endMinVal.toString().padStart(2, "0");

      periods.push({
        period_no: i,
        start_time: `${h1}:${m1}`,
        end_time: `${h2}:${m2}`,
      });

      startMin += 40;
      if (startMin >= 60) {
        startHour += Math.floor(startMin / 60);
        startMin = startMin % 60;
      }
    }
    await Period.insertMany(periods);

    await Teacher.deleteMany({});

    const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const subjects = ["Math", "Science", "English", "History", "Computer Science", "Art", "Sports"];

    await Timetable.deleteMany({});
    const timetableEntries = [];
    for (const day of days) {
      for (let i = 1; i <= 7; i++) {
        timetableEntries.push({
          class: "6",
          section: "A",
          group: "MAIN",
          day,
          period_no: i,
          subject: subjects[i - 1],
          teacher_id: "system",
        });
      }
    }
    await Timetable.insertMany(timetableEntries);

    return NextResponse.json({
      message: "Seed successful",
      periods,
      timetableCount: timetableEntries.length,
    });
  } catch (error: unknown) {
    return NextResponse.json({ error: sanitizeError(error) }, { status: 500 });
  }
}
