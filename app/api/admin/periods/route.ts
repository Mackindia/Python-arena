import { NextResponse } from "next/server";
import { connectDB } from "../../../../lib/mongodb";
import Period from "../../../../models/Period";
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

export async function GET() {
  try {
    await connectDB();
    const periods = await Period.find({}).sort({ period_no: 1 }).lean();
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
