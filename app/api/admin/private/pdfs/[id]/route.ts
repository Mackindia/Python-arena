import { NextResponse } from "next/server";
import { requireSuperAdminApi } from "@/lib/admin-api";
import { connectDB } from "@/lib/mongodb";
import PrivatePdf from "@/src/models/PrivatePdf";
import { deleteCloudinaryAssetByUrl } from "@/lib/cloudinary";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const access = await requireSuperAdminApi();

  if (!access.ok) {
    return access.response;
  }

  try {
    await connectDB();

    const { id } = await params;

    const pdf = await PrivatePdf.findOne({
      _id: id,
      ownerId: access.userId,
    });

    if (!pdf) {
      return NextResponse.json(
        { error: "PDF not found" },
        { status: 404 }
      );
    }

    if (pdf.url) {
      try {
        await deleteCloudinaryAssetByUrl(pdf.url, ["raw"]);
      } catch (cloudError) {
        console.error("Cloudinary deletion error:", cloudError);
      }
    }

    await PrivatePdf.findByIdAndDelete(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting private PDF:", error);

    const message = error instanceof Error ? error.message : "Internal Server Error";

    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
