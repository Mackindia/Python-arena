import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { connectDB } from "@/lib/mongodb";
import { Media } from "@/src/models/Media";
import cloudinary from "@/src/lib/cloudinary";
import { isFileUploadSafe, sanitizeError } from "@/lib/security";

const MAX_TOTAL_STORAGE = 20 * 1024 * 1024;
const MAX_FILE_SIZE = 10 * 1024 * 1024;

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

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "File too large. Maximum size is 10MB." }, { status: 400 });
    }

    const fileCheck = isFileUploadSafe(file.name, file.type);
    if (!fileCheck.safe) {
      return NextResponse.json({ error: fileCheck.reason }, { status: 400 });
    }

    await connectDB();

    const userAssets = await Media.find({ userId });
    const currentTotalSize = userAssets.reduce((acc, asset) => acc + (asset.fileSize || 0), 0);

    if (currentTotalSize + file.size > MAX_TOTAL_STORAGE) {
      return NextResponse.json({
        error: `Storage limit exceeded. Used ${(currentTotalSize / (1024 * 1024)).toFixed(2)}MB of 20MB.`
      }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    let resourceType: "image" | "video" | "raw" = "raw";
    let fileType = "other";

    if (file.type.startsWith("image/")) {
      resourceType = "image";
      fileType = "image";
    } else if (file.type.startsWith("audio/")) {
      resourceType = "video";
      fileType = "audio";
    } else if (file.type.startsWith("video/")) {
      resourceType = "video";
      fileType = "video";
    }

    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_").substring(0, 100);

    const uploadResult = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          resource_type: resourceType,
          folder: `student_uploads/${userId}`,
          public_id: `${Date.now()}_${safeName.split('.')[0]}`,
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      uploadStream.end(buffer);
    }) as Record<string, unknown>;

    const media = await Media.create({
      userId,
      fileName: safeName,
      fileUrl: (uploadResult.secure_url as string) || "",
      fileType,
      fileSize: file.size,
    });

    return NextResponse.json({ success: true, media }, { status: 201 });
  } catch (error: unknown) {
    return NextResponse.json({ error: sanitizeError(error) }, { status: 500 });
  }
}
