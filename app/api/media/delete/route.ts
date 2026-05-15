import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { connectDB } from "@/lib/mongodb";
import { Media } from "@/src/models/Media";
import { unlink } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";

export async function DELETE(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { assetId } = await req.json();
    if (!assetId) {
      return NextResponse.json({ error: "Asset ID required" }, { status: 400 });
    }

    await connectDB();

    const asset = await Media.findOne({ _id: assetId, userId });
    if (!asset) {
      return NextResponse.json({ error: "Asset not found" }, { status: 404 });
    }

    // Delete file from disk
    const filePath = join(process.cwd(), "public", asset.fileUrl);
    if (existsSync(filePath)) {
      await unlink(filePath);
    }

    // Delete from DB
    await Media.deleteOne({ _id: assetId });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    console.error("Delete asset error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
