import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { connectDB } from "@/lib/mongodb";
import { Media } from "@/src/models/Media";

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const assets = await Media.find({ userId }).sort({ createdAt: -1 }).lean();

    return NextResponse.json({ assets }, { status: 200 });
  } catch (error: any) {
    console.error("List assets error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
