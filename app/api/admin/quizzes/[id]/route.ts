import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { requireAdminApi, requireSuperAdminApi } from "@/lib/admin-api";
import Quiz from "@/models/Quiz";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const access = await requireAdminApi();
    if (!access.ok) {
      return access.response;
    }

    await connectDB();
    const { id } = await params;
    const quiz = await Quiz.findById(id).lean();

    if (!quiz) {
      return NextResponse.json({ message: "Quiz not found" }, { status: 404 });
    }

    return NextResponse.json({ quiz });
  } catch (error) {
    return NextResponse.json({ message: "Failed to fetch quiz", error: error instanceof Error ? error.message : "Unknown" }, { status: 500 });
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

    const quiz = await Quiz.findByIdAndUpdate(
      id,
      {
        $set: {
          ...body,
          updatedBy: access.ctx.userId,
        },
      },
        { returnDocument: "after" },
    );

    if (!quiz) {
      return NextResponse.json({ message: "Quiz not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Quiz updated", quiz });
  } catch (error) {
    return NextResponse.json({ message: "Failed to update quiz", error: error instanceof Error ? error.message : "Unknown" }, { status: 500 });
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
    const quiz = await Quiz.findByIdAndDelete(id);

    if (!quiz) {
      return NextResponse.json({ message: "Quiz not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Quiz deleted" });
  } catch (error) {
    return NextResponse.json({ message: "Failed to delete quiz", error: error instanceof Error ? error.message : "Unknown" }, { status: 500 });
  }
}

