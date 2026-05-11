import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { requireAdminApi } from "@/lib/admin-api";
import Resource from "@/models/Resource";

export async function GET() {
  try {
    const access = await requireAdminApi();
    if (!access.ok) {
      return access.response;
    }

    await connectDB();
    const resources = await Resource.find().sort({ createdAt: -1 }).lean();

    return NextResponse.json({ resources });
  } catch (error) {
    return NextResponse.json({ message: "Failed to fetch resources", error: error instanceof Error ? error.message : "Unknown" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const access = await requireAdminApi();
    if (!access.ok) {
      return access.response;
    }

    const body = await request.json();

    if (!body.title || !body.url) {
      return NextResponse.json({ message: "title and url are required" }, { status: 400 });
    }

    await connectDB();

    const resource = await Resource.create({
      title: body.title,
      kind: body.kind ?? "other",
      url: body.url,
      publicId: body.publicId ?? "",
      courseId: body.courseId ?? null,
      lessonId: body.lessonId ?? null,
      classLevel: body.classLevel ?? "",
      category: body.category ?? "",
      mimeType: body.mimeType ?? "",
      size: Number(body.size ?? 0),
      uploadedBy: access.ctx.userId,
    });

    return NextResponse.json({ message: "Resource saved", resource }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ message: "Failed to save resource", error: error instanceof Error ? error.message : "Unknown" }, { status: 500 });
  }
}
