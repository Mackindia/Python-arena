import { NextResponse } from "next/server";
import { connectDB } from "../../../../lib/mongodb";
import Settings from "../../../../models/Settings";
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
    await connectDB();
    const settingsDoc = await Settings.findOne({ key: "online_class_window" }).lean();
    const settings = settingsDoc ? settingsDoc.value : { isActive: false, startDate: "", endDate: "" };
    return NextResponse.json({ settings });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    if (!(await isAdmin())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    await connectDB();
    
    await Settings.updateOne(
      { key: "online_class_window" },
      { $set: { value: body } },
      { upsert: true }
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
