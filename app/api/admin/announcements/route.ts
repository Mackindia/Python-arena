import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { requireAdminApi } from "@/lib/admin-api";
import Announcement from "@/models/Announcement";

export async function GET() {
  try {
    const access = await requireAdminApi();
    if (!access.ok) {
      return access.response;
    }

    await connectDB();
    const announcements = await Announcement.find().sort({ createdAt: -1 }).lean();
    return NextResponse.json({ announcements });
  } catch (error) {
    return NextResponse.json({ message: "Failed to fetch announcements", error: error instanceof Error ? error.message : "Unknown" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const access = await requireAdminApi();
    if (!access.ok) {
      return access.response;
    }

    const body = await request.json();
    if (!body.title || !body.message) {
      return NextResponse.json({ message: "title and message are required" }, { status: 400 });
    }

    await connectDB();
    const announcement = await Announcement.create({
      title: body.title,
      message: body.message,
      targetRoles: Array.isArray(body.targetRoles) && body.targetRoles.length ? body.targetRoles : ["student", "teacher", "admin"],
      level: body.level ?? "info",
      isActive: body.isActive ?? true,
      createdBy: access.ctx.userId,
    });

    return NextResponse.json({ message: "Announcement created", announcement }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ message: "Failed to create announcement", error: error instanceof Error ? error.message : "Unknown" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const access = await requireAdminApi();
    if (!access.ok) {
      return access.response;
    }

    const id = (request.nextUrl.searchParams.get("id") ?? "").trim();
    if (!id) {
      return NextResponse.json({ message: "id is required" }, { status: 400 });
    }

    await connectDB();
    const deleted = await Announcement.findByIdAndDelete(id).lean();

    if (!deleted) {
      return NextResponse.json({ message: "Announcement not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Announcement deleted" });
  } catch (error) {
    return NextResponse.json(
      {
        message: "Failed to delete announcement",
        error: error instanceof Error ? error.message : "Unknown",
      },
      { status: 500 },
    );
  }
}
