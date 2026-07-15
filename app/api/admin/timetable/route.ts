import { NextResponse } from "next/server";
import { connectDB } from "../../../../lib/mongodb";
import Timetable from "../../../../models/Timetable";
import User from "../../../../models/User";
import { isTimetableLocked } from "../../../../lib/timetable-lock";

export async function GET() {
  try {
    await connectDB();
    const timetable = await Timetable.find({}).sort({ class: 1, section: 1, day: 1, period_no: 1 });
    return NextResponse.json({ success: true, timetable });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    // FIX 1: Check if timetable is locked
    const lockStatus = await isTimetableLocked();
    if (lockStatus.locked) {
      return NextResponse.json(
        { success: false, error: lockStatus.error, locked: true },
        { status: 403 }
      );
    }

    await connectDB();
    const body = await req.json();
    const { class: className, section, group, day, period_no, subject, teacher_id, teacher_name } = body;

    const slotGroup = group || "MAIN";

    if (!className || !section || !day || !period_no || !subject || !teacher_id || !teacher_name) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
    }

    // 1. Clash Check: Is this teacher already occupied at this day and period?
    const teacherClash = await Timetable.findOne({
      teacher_id,
      day,
      period_no: Number(period_no)
    });

    if (teacherClash) {
      return NextResponse.json({
        success: false,
        error: `Teacher is already occupied in Class ${teacherClash.class}-${teacherClash.section} (${teacherClash.group}) for Period ${period_no} on ${day}.`
      }, { status: 400 });
    }

    // 2. Clash Check: Is this class and section already scheduled at this day and period?
    // If scheduling MAIN: clashes with any existing schedule for this period.
    // If scheduling elective (AI/FP/FL): clashes with MAIN or the same elective group.
    const classClashes = await Timetable.find({
      class: className,
      section,
      day,
      period_no: Number(period_no)
    });

    const isClash = classClashes.some(existingSlot => {
      if (slotGroup === "MAIN" || existingSlot.group === "MAIN") {
        return true; // MAIN conflicts with everything
      }
      return existingSlot.group === slotGroup; // Same elective group conflicts
    });

    if (isClash) {
      const clashReason = classClashes.map(s => `${s.subject} (${s.group})`).join(", ");
      return NextResponse.json({
        success: false,
        error: `Class ${className}-${section} already has ${clashReason} scheduled for Period ${period_no} on ${day}.`
      }, { status: 400 });
    }

    // Create entry
    const newEntry = await Timetable.create({
      class: className,
      section,
      group: slotGroup,
      day,
      period_no: Number(period_no),
      subject,
      teacher_id,
      teacher_name
    });

    return NextResponse.json({ success: true, entry: newEntry });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
