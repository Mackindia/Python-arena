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
    return user?.role === "admin";
  }

  const cookieStore = await cookies();
  const localUserId = cookieStore.get("local_user_id")?.value;
  if (localUserId) {
    const user = await User.findById(localUserId);
    return user?.role === "admin";
  }

  return false;
}

export async function POST(req: Request) {
  try {
    if (!(await isAdmin())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const body = await req.json();
    const { timetables } = body;

    if (!timetables || typeof timetables !== "object") {
      return NextResponse.json({ error: "Invalid timetables data" }, { status: 400 });
    }

    // 1. Wipe out existing timetable data to avoid duplicates/stale data
    await Timetable.deleteMany({});

    // 2. Format the new data
    const newTimetableEntries: any[] = [];

    // 'timetables' looks like: { "1a": [{ day: "Mon", period: 1, subject: "Math", teacher: "AR" }], "1b": [...] }
    for (const [classKey, schedule] of Object.entries(timetables)) {
      // Parse classKey (e.g. "1a" -> class "1", section "A")
      // Example: "10b" -> match[1]="10", match[2]="b"
      // If no match (e.g. "Nursery"), we just use the whole thing
      let cls = classKey;
      let section = "";
      
      const match = classKey.match(/^(\d+)([A-Za-z]+)$/);
      if (match) {
        cls = match[1];
        section = match[2].toUpperCase();
      }

      // Assert schedule is array
      if (Array.isArray(schedule)) {
        for (const slot of schedule) {
          if (slot.subject && slot.teacher) {
            // Some slots might have multiple teachers separated by commas
            const teachers = slot.teacher.split(',').map((t: string) => t.trim());
            
            for (const t of teachers) {
              newTimetableEntries.push({
                class: cls,
                section: section,
                group: "MAIN",
                day: slot.day, // 'Mon', 'Tue', etc.
                period_no: parseInt(slot.period),
                subject: slot.subject,
                teacher_id: t, // The shortcode, e.g. "AR"
                teacher_name: t,
              });
            }
          }
        }
      }
    }

    // 3. Insert all new entries
    if (newTimetableEntries.length > 0) {
      await Timetable.insertMany(newTimetableEntries);
    }

    return NextResponse.json({ success: true, count: newTimetableEntries.length });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
