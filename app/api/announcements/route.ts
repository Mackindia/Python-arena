import { NextRequest, NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { connectDB } from "@/lib/mongodb";
import Announcement from "@/src/models/Announcement";
import { getCached } from "@/lib/redis";

export async function GET(req: NextRequest) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const studentClass = (user.publicMetadata.class as string || "none").trim();
    
    console.log(`📣 Fetching announcements for user ${user.username}. Class: "${studentClass}"`);
    
    const announcements = await getCached(
      `announcements:${studentClass}`,
      async () => {
        await connectDB();
        return Announcement.find({
          isActive: true,
          $or: [
            { targetClass: "All" },
            { targetClass: { $regex: new RegExp(`^${studentClass}$`, "i") } }
          ]
        }).sort({ createdAt: -1 }).limit(5).lean();
      },
      900 // cache for 15 minutes
    );

    console.log(`✅ Found ${announcements.length} matching notices.`);

    return NextResponse.json({ announcements }, { status: 200 });
  } catch (error: any) {
    console.error("Announcement fetch error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
