import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { connectDB } from "../../../../lib/mongodb";
import Timetable from "../../../../models/Timetable";
import User from "../../../../models/User";
import { auth } from "@clerk/nextjs/server";
import { cookies } from "next/headers";
import { parseCellToSessions, parseOnlineClassTimetableCsv } from "../../../../lib/onlineClassTimetableParser";

function groupFromSubject(subject: string): string {
  const token = String(subject || "")
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
  return token || "MAIN";
}

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
    if (cls) query.class = new RegExp(`^${String(cls).trim()}$`, "i");
    if (section) query.section = new RegExp(`^${String(section).trim()}$`, "i");
    if (day) query.day = new RegExp(`^${String(day).trim()}$`, "i");

    let timetable = await Timetable.find(query).sort({ period_no: 1 }).lean();

    // If DB has no rows for this class/section/day, seed preview from CSV source-of-truth.
    if (timetable.length === 0 && cls && section && day) {
      const csvPath = path.join(process.cwd(), "Online class TT 2026.csv");
      if (fs.existsSync(csvPath)) {
        const csvContent = fs.readFileSync(csvPath, "utf-8");
        const parsed = parseOnlineClassTimetableCsv(csvContent);

        const classValue = String(cls).trim().toLowerCase();
        const sectionValue = String(section).trim().toLowerCase();
        const dayValue = String(day).trim().toLowerCase();

        timetable = parsed
          .filter((entry) => (
            String(entry.class).trim().toLowerCase() === classValue &&
            String(entry.section).trim().toLowerCase() === sectionValue &&
            String(entry.day).trim().toLowerCase() === dayValue
          ))
          .sort((a, b) => a.period_no - b.period_no);
      }
    }

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

    // Insert updated periods; support parallel subjects in one period.
    const newEntries = [];
    for (const p of periods) {
      const periodNo = Number(p.period_no);
      if (!Number.isFinite(periodNo) || periodNo <= 0) continue;

      const incomingSessions = Array.isArray(p.sessions)
        ? p.sessions
            .map((s: any) => ({
              subject: String(s?.subject || "").trim(),
              teacher_id: String(s?.teacher_id || "").trim(),
              teacher_name: String(s?.teacher_name || "").trim(),
              group: String(s?.group || "").trim(),
            }))
            .filter((s: any) => s.subject && s.teacher_id)
        : [];

      if (incomingSessions.length > 0) {
        for (const session of incomingSessions) {
          newEntries.push({
            class: cls,
            section,
            group: session.group || (incomingSessions.length > 1 ? groupFromSubject(session.subject) : "MAIN"),
            day,
            period_no: periodNo,
            subject: session.subject,
            teacher_id: session.teacher_id,
            teacher_name: session.teacher_name || session.teacher_id,
          });
        }
        continue;
      }

      const subjectRaw = String(p.subject || "").trim();
      const singleTeacher = String(p.teacher_id || "").trim();
      if (!subjectRaw) continue;

      const parsedSessions = parseCellToSessions(subjectRaw);
      if (parsedSessions.length > 0) {
        for (const session of parsedSessions) {
          const teacherId = session.teacher_id === "UNASSIGNED" ? singleTeacher : session.teacher_id;
          if (!teacherId) continue;

          newEntries.push({
            class: cls,
            section,
            group: parsedSessions.length > 1 ? groupFromSubject(session.subject) : "MAIN",
            day,
            period_no: periodNo,
            subject: session.subject,
            teacher_id: teacherId,
            teacher_name: teacherId,
          });
        }
        continue;
      }

      if (singleTeacher) {
        newEntries.push({
          class: cls,
          section,
          group: "MAIN",
          day,
          period_no: periodNo,
          subject: subjectRaw,
          teacher_id: singleTeacher,
          teacher_name: p.teacher_name || singleTeacher,
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
