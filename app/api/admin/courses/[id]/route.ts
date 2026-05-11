import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { requireAdminApi } from "@/lib/admin-api";
import Course from "@/models/Course";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const access = await requireAdminApi();
    if (!access.ok) {
      return access.response;
    }

    await connectDB();
    const { id } = await params;
    const course = await Course.findById(id).lean();

    if (!course) {
      return NextResponse.json({ message: "Course not found" }, { status: 404 });
    }

    return NextResponse.json({ course });
  } catch (error) {
    return NextResponse.json({ message: "Failed to fetch course", error: error instanceof Error ? error.message : "Unknown" }, { status: 500 });
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

    const course = await Course.findByIdAndUpdate(
      id,
      {
        $set: {
          ...body,
          updatedBy: access.ctx.userId,
        },
      },
        { returnDocument: "after" },
    );

    if (!course) {
      return NextResponse.json({ message: "Course not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Course updated", course });
  } catch (error) {
    return NextResponse.json({ message: "Failed to update course", error: error instanceof Error ? error.message : "Unknown" }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const access = await requireAdminApi();
    if (!access.ok) {
      return access.response;
    }

    await connectDB();
    const { id } = await params;
    const course = await Course.findByIdAndDelete(id);

    if (!course) {
      return NextResponse.json({ message: "Course not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Course deleted" });
  } catch (error) {
    return NextResponse.json({ message: "Failed to delete course", error: error instanceof Error ? error.message : "Unknown" }, { status: 500 });
  }
}
