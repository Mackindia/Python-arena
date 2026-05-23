import { NextResponse } from "next/server";
import { connectDB } from "../../../../lib/mongodb";
import Timetable from "../../../../models/Timetable";
import User from "../../../../models/User";
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

export async function GET(req: Request) {
  try {
    if (!(await isAdmin())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const cls = searchParams.get("class");
    const section = searchParams.get("section");
    const day = searchParams.get("day");

    await connectDB();

    const query: any = {};
    if (cls) query.class = cls;
    if (section) query.section = section;
    if (day) query.day = day;

    const timetable = await Timetable.find(query).sort({ period_no: 1 }).lean();
    return NextResponse.json({ timetable });
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
    const { class: cls, section, day, periods } = body;

    if (!cls || !section || !day || !Array.isArray(periods)) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Delete existing entries for this class/section/day
    await Timetable.deleteMany({ class: cls, section, day });

    // Insert the new updated periods
    const newEntries = [];
    for (const p of periods) {
      if (p.subject && p.teacher_id) {
        newEntries.push({
          class: cls,
          section,
          group: "MAIN",
          day,
          period_no: p.period_no,
          subject: p.subject,
          teacher_id: p.teacher_id,
          teacher_name: p.teacher_name || "",
        });
      }
    }

    if (newEntries.length > 0) {
      await Timetable.insertMany(newEntries);
    }

    return NextResponse.json({ success: true, count: newEntries.length });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
