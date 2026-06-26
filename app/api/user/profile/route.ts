import { NextResponse } from "next/server";
import { connectDB } from "../../../../lib/mongodb";
import User from "../../../../models/User";
import { auth } from "@clerk/nextjs/server";
import { cookies } from "next/headers";

const VALID_CLASSES = ["6", "7", "8", "9", "10", "11", "12"];

export async function PUT(req: Request) {
  try {
    const cookieStore = await cookies();
    const localUserId = cookieStore.get("local_user_id")?.value;

    await connectDB();

    let user = null;

    if (localUserId) {
      user = await User.findById(localUserId);
    } else {
      const { userId } = await auth();
      if (userId) {
        user = await User.findOne({ clerkId: userId });
      }
    }

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    if (user.role !== "student") {
      return NextResponse.json(
        { error: "Only students can change their class from this page" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { class: newClass } = body;

    if (!newClass || !VALID_CLASSES.includes(newClass)) {
      return NextResponse.json(
        { error: `Invalid class. Must be one of: ${VALID_CLASSES.join(", ")}` },
        { status: 400 }
      );
    }

    const classValue = `Class ${newClass}`;
    user.class = classValue;
    user.studentClass = classValue;
    await user.save();

    return NextResponse.json({
      success: true,
      user: {
        id: user._id,
        fullName: user.fullName,
        class: user.class,
        studentClass: user.studentClass,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
