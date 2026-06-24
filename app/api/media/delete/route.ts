import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { connectDB } from "@/lib/mongodb";
import { Media } from "@/src/models/Media";
import cloudinary from "@/src/lib/cloudinary";

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

    // Delete from Cloudinary
    // Extract public_id from URL
    // URL looks like: https://res.cloudinary.com/cloudname/image/upload/v123/student_uploads/userid/filename.jpg
    try {
      const urlParts = asset.fileUrl.split("/");
      const fileNameWithExt = urlParts[urlParts.length - 1];
      const publicIdWithFolder = `student_uploads/${userId}/${fileNameWithExt.split(".")[0]}`;
      
      let resourceType: "image" | "video" | "raw" = "raw";
      if (asset.fileType === "image") resourceType = "image";
      else if (asset.fileType === "audio" || asset.fileType === "video") resourceType = "video";

      await cloudinary.uploader.destroy(publicIdWithFolder, { resource_type: resourceType });
    } catch (err) {
      console.error("Cloudinary delete failed:", err);
      // We continue deleting from DB anyway
    }

    // Delete from DB
    await Media.deleteOne({ _id: assetId });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    console.error("Delete asset error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
