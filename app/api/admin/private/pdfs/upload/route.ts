import { NextRequest, NextResponse } from "next/server";
import { requireSuperAdminApi } from "@/lib/admin-api";
import { uploadFileToCloudinary } from "@/lib/cloudinary";
import { validateUploadFile } from "@/lib/upload-utils";

export const runtime = "nodejs";

function sanitizeFileName(fileName: string) {
  const base = fileName.replace(/[^a-zA-Z0-9._-]+/g, "_").replace(/^_+|_+$/g, "");
  return base || `private_pdf_${Date.now()}.pdf`;
}

function hasPdfHeader(file: File) {
  return file.slice(0, 5).text().then((value) => value === "%PDF-");
}

async function hasPdfEofMarker(file: File) {
  const tailSize = Math.min(file.size, 4096);
  const tailText = await file.slice(file.size - tailSize, file.size).text();
  return tailText.includes("%%EOF");
}

export async function POST(request: NextRequest) {
  const access = await requireSuperAdminApi();
  if (!access.ok) {
    return access.response;
  }

  try {
    const contentType = (request.headers.get("content-type") || "").toLowerCase();
    if (!contentType.includes("multipart/form-data")) {
      return NextResponse.json(
        { error: "Invalid upload request. Expected multipart/form-data." },
        { status: 415 },
      );
    }

    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No PDF file found." }, { status: 400 });
    }

    const validation = validateUploadFile(file, "pdf");
    if (!validation.valid) {
      return NextResponse.json({ error: validation.message || "PDF validation failed." }, { status: 400 });
    }

    if (!(await hasPdfHeader(file))) {
      return NextResponse.json({ error: "Uploaded file is not a valid PDF." }, { status: 400 });
    }

    if (!(await hasPdfEofMarker(file))) {
      return NextResponse.json(
        { error: "Uploaded PDF appears incomplete. Please re-export or re-upload the file." },
        { status: 400 },
      );
    }

    const fileName = sanitizeFileName(file.name || "document.pdf");

    const upload = await uploadFileToCloudinary(file, {
      folder: "private/pdfs/pdf",
      resource_type: "raw",
      public_id: fileName.replace(/\.pdf$/i, ""),
    });

    return NextResponse.json({
      message: "Upload successful",
      upload: {
        url: upload.secure_url,
        publicId: upload.public_id,
        size: upload.bytes,
        originalName: fileName,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Upload failed",
      },
      { status: 500 },
    );
  }
}
