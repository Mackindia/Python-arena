import { NextRequest, NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { connectDB } from "@/lib/mongodb";
import Announcement from "@/src/models/Announcement";

export async function GET(req: NextRequest) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const studentClass = (user.publicMetadata.class as string || "none").trim();
    
    console.log(`📣 Fetching announcements for user ${user.username}. Class: "${studentClass}"`);
    
    await connectDB();

    // Find announcements that are:
    // 1. Active
    // 2. Target "All" OR Target the student's specific class (Case Insensitive)
    const announcements = await Announcement.find({
      isActive: true,
      $or: [
        { targetClass: "All" },
        { targetClass: { $regex: new RegExp(`^${studentClass}$`, "i") } }
      ]
    }).sort({ createdAt: -1 }).limit(5);

    console.log(`✅ Found ${announcements.length} matching notices.`);

    return NextResponse.json({ announcements }, { status: 200 });
  } catch (error: any) {
    console.error("Announcement fetch error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
