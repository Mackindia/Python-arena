import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { connectDB } from "../../../../lib/mongodb";
import User from "../../../../models/User";

export async function POST(req: Request) {
  try {
    await connectDB();
    const { username, password } = await req.json();

    const user = await User.findOne({ username });
    if (!user || user.password !== password) {
      return NextResponse.json({ error: "Invalid username or password" }, { status: 401 });
    }

    if (user.is_active === false) {
      return NextResponse.json({ error: "User account is inactive" }, { status: 403 });
    }

    const cookieStore = await cookies();
    cookieStore.set("local_user_id", user._id.toString(), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7, // 1 week
      path: "/",
    });

    return NextResponse.json({ success: true, user: { id: user._id, fullName: user.fullName || user.username, role: user.role } });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
