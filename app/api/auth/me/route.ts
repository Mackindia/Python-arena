import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { connectDB } from "../../../../lib/mongodb";
import User from "../../../../models/User";

import { auth } from "@clerk/nextjs/server";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const localUserId = cookieStore.get("local_user_id")?.value;

    let user = null;
    await connectDB();

    if (localUserId) {
      user = await User.findById(localUserId).lean();
    } else {
      const { userId } = await auth();
      if (userId) {
        user = await User.findOne({ clerkId: userId }).lean();
      }
    }

    if (!user) {
      return NextResponse.json({ user: null });
    }

    return NextResponse.json({
      user: {
        id: user._id,
        fullName: user.fullName || user.username,
        username: user.username,
        role: user.role,
        class: user.class || user.studentClass,
        section: user.section,
        meet_link: user.meet_link,
        isClerk: !!user.clerkId,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ user: null, error: error.message });
  }
}
