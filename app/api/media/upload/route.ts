import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { connectDB } from "@/lib/mongodb";
import { Media } from "@/src/models/Media";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Connect to DB
    await connectDB();

    // Check total storage usage for this user
    const userAssets = await Media.find({ userId });
    const currentTotalSize = userAssets.reduce((acc, asset) => acc + (asset.fileSize || 0), 0);

    if (currentTotalSize + file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ 
        error: `Storage limit exceeded. You have used ${(currentTotalSize / (1024 * 1024)).toFixed(2)}MB of your 20MB limit.` 
      }, { status: 400 });
    }

    // Prepare file data
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Determine file type
    let fileType = "other";
    if (file.type.startsWith("image/")) fileType = "image";
    else if (file.type.startsWith("audio/")) fileType = "audio";
    else if (file.type.startsWith("video/")) fileType = "video";

    // Create unique filename to avoid overwrites
    const timestamp = Date.now();
    const safeName = file.name.replace(/[^a-z0-9.]/gi, "_").toLowerCase();
    const fileName = `${timestamp}_${safeName}`;
    
    // Define public path
    const relativeDir = `/uploads/${userId}`;
    const uploadDir = join(process.cwd(), "public", "uploads", userId);
    const filePath = join(uploadDir, fileName);
    const fileUrl = `${relativeDir}/${fileName}`;

    // Ensure directory exists
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    // Write file to disk
    await writeFile(filePath, buffer);

    // Save to MongoDB
    const media = await Media.create({
      userId,
      fileName: file.name,
      fileUrl,
      fileType,
      fileSize: file.size,
    });

    return NextResponse.json({ 
      success: true, 
      media 
    }, { status: 201 });

  } catch (error: any) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Internal server error: " + error.message }, { status: 500 });
  }
}
