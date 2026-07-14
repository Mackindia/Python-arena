import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";

export async function GET() {
  try {
    const authUser = await currentUser();

    if (!authUser?.id) {
      return NextResponse.json({ status: "unauthenticated" }, { status: 401 });
    }

    await connectDB();

    const user = await User.findOne({ clerkId: authUser.id }).select("status role").lean();

    if (!user) {
      return NextResponse.json({ status: "not_found" }, { status: 404 });
    }

    // Admins are always approved
    if (user.role === "admin" || user.role === "super_admin") {
      return NextResponse.json({ status: "approved" });
    }

    return NextResponse.json({ status: user.status || "pending" });
  } catch (error) {
    return NextResponse.json({ status: "error" }, { status: 500 });
  }
}
