import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { requireAdminApi } from "@/lib/admin-api";
import { TimetableLock } from "@/src/models/Timetable";

export const runtime = "nodejs";

export async function GET() {
  try {
    const access = await requireAdminApi();
    if (!access.ok) {
      return access.response;
    }

    await connectDB();

    let lock = await TimetableLock.findOne({ key: "global" }).lean();
    if (!lock) {
      lock = await TimetableLock.create({ key: "global", isLocked: false });
    }

    return NextResponse.json({ isLocked: (lock as { isLocked?: boolean }).isLocked ?? false });
  } catch (error) {
    console.error("Error fetching timetable lock:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const access = await requireAdminApi();
    if (!access.ok) {
      return access.response;
    }

    const body = await request.json();
    const isLocked = Boolean(body.isLocked);

    await connectDB();

    const lock = await TimetableLock.findOneAndUpdate(
      { key: "global" },
      { isLocked, updatedAt: new Date() },
      { new: true, upsert: true }
    ).lean();

    return NextResponse.json({ isLocked: (lock as { isLocked?: boolean }).isLocked ?? false });
  } catch (error) {
    console.error("Error updating timetable lock:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal Server Error" },
      { status: 500 }
    );
  }
}
