import mongoose from "mongoose";
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { requireAdminApi } from "@/lib/admin-api";
import PracticeResourceModel from "@/models/practice/PracticeResource";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

function toSlug(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const access = await requireAdminApi();
    if (!access.ok) {
      return access.response;
    }

    const { id } = await context.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ message: "Invalid resource id" }, { status: 400 });
    }

    await connectDB();

    const resource = await PracticeResourceModel.findById(id)
      .populate("subject", "_id name slug")
      .populate("class", "_id name slug")
      .lean();

    if (!resource) {
      return NextResponse.json({ message: "Practice resource not found" }, { status: 404 });
    }

    return NextResponse.json({ item: resource });
  } catch (error) {
    return NextResponse.json(
      {
        message: "Failed to fetch practice resource",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const access = await requireAdminApi();
    if (!access.ok) {
      return access.response;
    }

    const { id } = await context.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ message: "Invalid resource id" }, { status: 400 });
    }

    await connectDB();

    const body = await request.json();
    const update: Record<string, unknown> = {};

    if (typeof body.title === "string") {
      const title = body.title.trim();
      if (title.length < 3) {
        return NextResponse.json({ message: "Title must be at least 3 characters" }, { status: 400 });
      }
      update.title = title;
      update.slug = toSlug(title);
    }

    if (typeof body.description === "string") {
      update.description = body.description.trim();
    }

    if (typeof body.published === "boolean") {
      update.published = body.published;
    }

    const allowedTypes = new Set(["question-paper", "sample-paper", "important-pdf", "worksheet", "other"]);
    if (typeof body.resourceType === "string") {
      if (!allowedTypes.has(body.resourceType)) {
        return NextResponse.json({ message: "Invalid resourceType" }, { status: 400 });
      }
      update.resourceType = body.resourceType;
    }

    const updated = await PracticeResourceModel.findByIdAndUpdate(id, { $set: update }, { new: true })
      .populate("subject", "_id name slug")
      .populate("class", "_id name slug")
      .lean();

    if (!updated) {
      return NextResponse.json({ message: "Practice resource not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Practice resource updated", item: updated });
  } catch (error) {
    if (typeof error === "object" && error && "code" in error && (error as { code?: number }).code === 11000) {
      return NextResponse.json(
        { message: "A resource with similar title already exists for this class" },
        { status: 409 },
      );
    }

    return NextResponse.json(
      {
        message: "Failed to update practice resource",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    const access = await requireAdminApi();
    if (!access.ok) {
      return access.response;
    }

    const { id } = await context.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ message: "Invalid resource id" }, { status: 400 });
    }

    await connectDB();

    const deleted = await PracticeResourceModel.findByIdAndDelete(id).lean();
    if (!deleted) {
      return NextResponse.json({ message: "Practice resource not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Practice resource deleted" });
  } catch (error) {
    return NextResponse.json(
      {
        message: "Failed to delete practice resource",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
