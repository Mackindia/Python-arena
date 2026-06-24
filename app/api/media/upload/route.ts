import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { connectDB } from "@/lib/mongodb";
import { Media } from "@/src/models/Media";
import cloudinary from "@/src/lib/cloudinary";

const MAX_TOTAL_STORAGE = 20 * 1024 * 1024; // 20MB Total

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

    if (currentTotalSize + file.size > MAX_TOTAL_STORAGE) {
      return NextResponse.json({ 
        error: `Storage limit exceeded. You have used ${(currentTotalSize / (1024 * 1024)).toFixed(2)}MB of your 20MB limit.` 
      }, { status: 400 });
    }

    // Convert file to Buffer for Cloudinary
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Determine resource type for Cloudinary
    let resourceType: "image" | "video" | "raw" = "raw";
    let fileType = "other";
    
    if (file.type.startsWith("image/")) {
      resourceType = "image";
      fileType = "image";
    } else if (file.type.startsWith("audio/")) {
      resourceType = "video"; // Cloudinary treats audio as video type
      fileType = "audio";
    } else if (file.type.startsWith("video/")) {
      resourceType = "video";
      fileType = "video";
    }

    // Upload to Cloudinary using a Promise wrapper for the stream
    const uploadResult = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          resource_type: resourceType,
          folder: `student_uploads/${userId}`,
          public_id: file.name.split('.')[0] + "_" + Date.now(),
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      uploadStream.end(buffer);
    }) as any;

    // Save to MongoDB
    const media = await Media.create({
      userId,
      fileName: file.name,
      fileUrl: uploadResult.secure_url, // Permanent HTTPS link
      fileType,
      fileSize: file.size,
    });

    return NextResponse.json({ 
      success: true, 
      media 
    }, { status: 201 });

  } catch (error: any) {
    console.error("Cloudinary upload error:", error);
    return NextResponse.json({ error: "Upload failed: " + error.message }, { status: 500 });
  }
}
