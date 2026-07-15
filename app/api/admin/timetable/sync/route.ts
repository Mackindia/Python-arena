import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { connectDB } from "../../../../../lib/mongodb";
import Timetable from "../../../../../models/Timetable";
import User from "../../../../../models/User";
import { auth } from "@clerk/nextjs/server";
import { cookies } from "next/headers";
import { isTimetableLocked } from "../../../../../lib/timetable-lock";
import {
  buildTimetablePreviewToken,
  normalizeTimetablesObject,
  parseOnlineClassTimetableCsv,
} from "../../../../../lib/onlineClassTimetableParser";

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

export async function POST(req: Request) {
  try {
    if (!(await isAdmin())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // FIX 1: Check if timetable is locked
    const lockStatus = await isTimetableLocked();
    if (lockStatus.locked) {
      return NextResponse.json(
        { error: lockStatus.error, locked: true },
        { status: 403 }
      );
    }

    await connectDB();
    const body = await req.json();
    const { timetables } = body;
    const providedToken = typeof body.previewToken === "string" ? body.previewToken : "";

    if (body.approved !== true) {
      return NextResponse.json(
        { error: "Admin approval is required before syncing the timetable." },
        { status: 400 }
      );
    }

    let newTimetableEntries: any[] = [];

    const csvPath = path.join(process.cwd(), "Online class TT 2026.csv");
    const hasLocalCsv = fs.existsSync(csvPath);

    if (hasLocalCsv) {
      const csvContent = fs.readFileSync(csvPath, "utf-8");
      newTimetableEntries = parseOnlineClassTimetableCsv(csvContent);
    } else if (timetables && typeof timetables === "object") {
      newTimetableEntries = normalizeTimetablesObject(timetables as Record<string, unknown>);
    } else {
      return NextResponse.json(
        {
          error: "No source timetable found. Upload Online class TT 2026.csv or provide timetables payload.",
        },
        { status: 400 }
      );
    }

    const expectedToken = buildTimetablePreviewToken(newTimetableEntries);
    if (!providedToken || providedToken !== expectedToken) {
      return NextResponse.json(
        { error: "Preview is required before syncing. Load the preview first, then approve deployment." },
        { status: 400 }
      );
    }

    // 1. Wipe out existing timetable data to avoid duplicates/stale data
    await Timetable.deleteMany({});

    // 3. Insert all new entries
    if (newTimetableEntries.length > 0) {
      await Timetable.insertMany(newTimetableEntries);
    }

    return NextResponse.json({
      success: true,
      source: hasLocalCsv ? "Online class TT 2026.csv" : "timetables payload",
      count: newTimetableEntries.length,
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}
