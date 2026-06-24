import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { requireAdminApi, requireSuperAdminApi } from "@/lib/admin-api";
import Lesson from "@/models/Lesson";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const access = await requireAdminApi();
    if (!access.ok) {
      return access.response;
    }

    await connectDB();
    const { id } = await params;
    const lesson = await Lesson.findById(id).lean();

    if (!lesson) {
      return NextResponse.json({ message: "Lesson not found" }, { status: 404 });
    }

    return NextResponse.json({ lesson });
  } catch (error) {
    return NextResponse.json({ message: "Failed to fetch lesson", error: error instanceof Error ? error.message : "Unknown" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const access = await requireAdminApi();
    if (!access.ok) {
      return access.response;
    }

    const body = await request.json();
    await connectDB();
    const { id } = await params;

    const lesson = await Lesson.findByIdAndUpdate(
      id,
      {
        $set: {
          ...body,
          updatedBy: access.ctx.userId,
        },
      },
        { returnDocument: "after" },
    );

    if (!lesson) {
      return NextResponse.json({ message: "Lesson not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Lesson updated", lesson });
  } catch (error) {
    return NextResponse.json({ message: "Failed to update lesson", error: error instanceof Error ? error.message : "Unknown" }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const access = await requireSuperAdminApi();
    if (!access.ok) {
      return access.response;
    }

    await connectDB();
    const { id } = await params;
    const lesson = await Lesson.findByIdAndDelete(id);

    if (!lesson) {
      return NextResponse.json({ message: "Lesson not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Lesson deleted" });
  } catch (error) {
    return NextResponse.json({ message: "Failed to delete lesson", error: error instanceof Error ? error.message : "Unknown" }, { status: 500 });
  }
}

