import { NextResponse } from "next/server";
import { connectDB } from "../../../lib/mongodb";
import Timetable from "../../../models/Timetable";
import Settings from "../../../models/Settings";
import User from "../../../models/User";
import { auth } from "@clerk/nextjs/server";
import { cookies } from "next/headers";

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

/** Return every calendar date between startDate and endDate (inclusive, YYYY-MM-DD) */
function getDateRange(startDate: string, endDate: string) {
  const dates: Array<{ date: string; dayName: string }> = [];
  const start = new Date(startDate + "T00:00:00Z");
  const end = new Date(endDate + "T00:00:00Z");
  if (isNaN(start.getTime()) || isNaN(end.getTime())) return dates;

  const cur = new Date(start);
  while (cur <= end) {
    dates.push({
      date: cur.toISOString().split("T")[0],
      dayName: DAY_NAMES[cur.getUTCDay()],
    });
    cur.setUTCDate(cur.getUTCDate() + 1);
  }
  return dates;
}

export async function GET() {
  try {
    await connectDB();

    // Auth: identify current user
    let user: any = null;
    const { userId } = await auth();
    if (userId) {
      user = await User.findOne({ clerkId: userId }).lean();
    } else {
      const cookieStore = await cookies();
      const localUserId = cookieStore.get("local_user_id")?.value;
      if (localUserId) {
        user = await User.findById(localUserId).lean();
      }
    }

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Load active window settings
    const settingsDoc = await Settings.findOne({ key: "online_class_window" }).lean();
    const settings: any = settingsDoc ? (settingsDoc as any).value : {};

    if (!settings.isActive) {
      return NextResponse.json({ active: false, message: "Online class window is not active.", dates: [] });
    }

    if (!settings.startDate || !settings.endDate) {
      return NextResponse.json({ active: false, message: "No date range configured.", dates: [] });
    }

    const dateRange = getDateRange(settings.startDate, settings.endDate);
    if (dateRange.length === 0) {
      return NextResponse.json({ active: false, message: "Invalid date range.", dates: [] });
    }

    const role: string = user.role || "student";

    // Build per-date schedule
    const schedule = await Promise.all(
      dateRange.map(async ({ date, dayName }) => {
        let timetable: any[] = [];

        if (role === "teacher") {
          const teacherId = (user as any).teacher_id || (user as any).username;
          const docs = await Timetable.find({ day: dayName, teacher_id: teacherId })
            .sort({ period_no: 1 })
            .lean();
          timetable = JSON.parse(JSON.stringify(docs));
        } else if (role === "admin") {
          // Admin sees everything for this day
          const docs = await Timetable.find({ day: dayName }).sort({ class: 1, section: 1, period_no: 1 }).lean();
          timetable = JSON.parse(JSON.stringify(docs));
        } else {
          // student
          const rawClass = (user as any).class || (user as any).studentClass || "";
          const normalizedClass = rawClass.replace(/class\s+/i, "").trim();
          const section = (user as any).section || "A";
          const docs = await Timetable.find({
            day: dayName,
            class: new RegExp(`^${normalizedClass}$`, "i"),
            section: new RegExp(`^${section}$`, "i"),
          })
            .sort({ period_no: 1 })
            .lean();
          timetable = JSON.parse(JSON.stringify(docs));
        }

        return { date, dayName, timetable };
      })
    );

    return NextResponse.json({
      active: true,
      startDate: settings.startDate,
      endDate: settings.endDate,
      role,
      dates: schedule,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
