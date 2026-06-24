import { NextResponse } from "next/server";
import { connectDB } from "../../../../lib/mongodb";
import Period from "../../../../models/Period";
import User from "../../../../models/User";
import { auth } from "@clerk/nextjs/server";
import { cookies } from "next/headers";

const DEFAULT_ONLINE_PERIODS = [
  { period_no: 1, start_time: "08:15", end_time: "09:00" },
  { period_no: 2, start_time: "09:15", end_time: "10:00" },
  { period_no: 3, start_time: "10:15", end_time: "11:00" },
  { period_no: 4, start_time: "11:15", end_time: "12:00" },
  { period_no: 5, start_time: "12:15", end_time: "13:00" },
  { period_no: 6, start_time: "13:15", end_time: "14:00" },
];

function matchesCanonical(periods: any[]) {
  if (!Array.isArray(periods) || periods.length < DEFAULT_ONLINE_PERIODS.length) return false;

  for (const expected of DEFAULT_ONLINE_PERIODS) {
    const found = periods.find((p: any) => Number(p.period_no) === expected.period_no);
    if (!found) return false;
    if (String(found.start_time || "") !== expected.start_time) return false;
    if (String(found.end_time || "") !== expected.end_time) return false;
  }

  return true;
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

export async function GET() {
  try {
    await connectDB();
    const periods = await Period.find({}).sort({ period_no: 1 }).lean();

    // Seed defaults when table is empty or stale timings are detected.
    const hasOnlyLegacyPlaceholder =
      periods.length > 0 &&
      periods.every((p: any) => String(p.start_time || "") === "08:00" && String(p.end_time || "") === "08:40");

    const shouldHealToCanonical = periods.length === 0 || hasOnlyLegacyPlaceholder || !matchesCanonical(periods);

    if (shouldHealToCanonical) {
      if (periods.length > 0) {
        await Period.deleteMany({});
      }
      const seeded = await Period.insertMany(DEFAULT_ONLINE_PERIODS);
      return NextResponse.json({ periods: seeded });
    }

    return NextResponse.json({ periods });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    if (!(await isAdmin())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const body = await req.json();
    const { periods } = body;

    if (!Array.isArray(periods)) {
      return NextResponse.json({ error: "Invalid periods data" }, { status: 400 });
    }

    // Replace all periods
    await Period.deleteMany({});
    
    const newEntries = periods.map((p: any, index: number) => ({
      period_no: index + 1, // enforce 1 to 7 ordering
      start_time: p.start_time,
      end_time: p.end_time
    }));

    await Period.insertMany(newEntries);

    return NextResponse.json({ success: true, periods: newEntries });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}
