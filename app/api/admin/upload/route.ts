import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin-api";
import { secureUploadToCloudinary } from "@/lib/upload-utils";
import { UploadFormSchema } from "@/src/validators";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const access = await requireAdminApi();
    if (!access.ok) {
      return access.response;
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ message: "No file found" }, { status: 400 });
    }

    const parsed = UploadFormSchema.safeParse({
      kind: formData.get("kind"),
      folder: formData.get("folder") ?? "python-arena",
    });

    if (!parsed.success) {
      return NextResponse.json(
        { message: "Validation failed", errors: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const upload = await secureUploadToCloudinary(file, parsed.data.kind, parsed.data.folder ?? "python-arena");

    return NextResponse.json({
      message: "Upload successful",
      upload,
    });
  } catch (error) {
    return NextResponse.json(
      {
        message: "Upload failed",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
