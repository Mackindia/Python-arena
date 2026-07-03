import { NextResponse } from "next/server";
import { requireSuperAdminApi } from "@/lib/admin-api";
import { connectDB } from "@/lib/mongodb";
import PrivatePdf from "@/src/models/PrivatePdf";

function derivePublicIdFromUrl(url: string) {
  try {
    const parsed = new URL(url);
    const marker = "/upload/";
    const markerIndex = parsed.pathname.indexOf(marker);

    if (markerIndex === -1) {
      return "";
    }

    const pathAfterUpload = decodeURIComponent(parsed.pathname.slice(markerIndex + marker.length));
    const withoutVersion = pathAfterUpload.replace(/^v\d+\//, "");
    return withoutVersion.replace(/\.[a-z0-9]+$/i, "");
  } catch {
    return "";
  }
}

export async function GET() {
  const access = await requireSuperAdminApi();

  if (!access.ok) {
    return access.response;
  }

  try {
    await connectDB();

    const pdfs = await PrivatePdf.find({ ownerId: access.userId }).sort({
      updatedAt: -1,
    });

    return NextResponse.json(pdfs);
  } catch (error) {
    console.error("Error fetching private PDFs:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const access = await requireSuperAdminApi();

  if (!access.ok) {
    return access.response;
  }

  try {
    await connectDB();

    const payload = await request.json();
    const uploadPayload = (payload && typeof payload === "object" && "upload" in payload)
      ? (payload.upload as Record<string, unknown>)
      : (payload as Record<string, unknown>);

    const url = String(uploadPayload?.url || uploadPayload?.secure_url || payload?.url || "").trim();
    const providedPublicId = String(uploadPayload?.publicId || uploadPayload?.public_id || payload?.publicId || "").trim();
    const publicId = providedPublicId || derivePublicIdFromUrl(url);
    const size = Number(uploadPayload?.size || uploadPayload?.bytes || payload?.size || 0);
    const title = String(payload?.title || uploadPayload?.originalName || payload?.fileName || "").trim();
    const fileName = String(payload?.fileName || uploadPayload?.originalName || "document.pdf").trim();

    if (!url || !publicId) {
      return NextResponse.json(
        { error: "Missing upload data (url/publicId)" },
        { status: 400 }
      );
    }

    const newPdf = await PrivatePdf.create({
      ownerId: access.userId,
      title: title || "Untitled PDF",
      fileName: fileName || "document.pdf",
      url,
      publicId,
      size: Number.isFinite(size) ? size : 0,
    });

    return NextResponse.json(newPdf, { status: 201 });
  } catch (error) {
    console.error("Error saving private PDF:", error);

    const message = error instanceof Error ? error.message : "Internal Server Error";

    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
