import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Subject from "@/models/lms/Subject";
import ClassModel from "@/models/lms/Class";

export const runtime = "nodejs";

export async function GET() {
  try {
    await connectDB();
    const subjects = await Subject.find({})
      .select("_id slug name description")
      .sort({ name: 1 })
      .lean();

    return NextResponse.json({
      subjects: subjects.map((s) => {
        const item = s as { _id?: unknown; slug?: string; name?: string; description?: string };
        return {
          _id: String(item._id),
          slug: item.slug || "",
          name: item.name || "",
          description: item.description || "",
        };
      }),
    });
  } catch (error) {
    return NextResponse.json(
      { message: "Failed to fetch subjects", error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();
    const { name, description } = body;

    if (!name?.trim()) {
      return NextResponse.json({ message: "Name is required" }, { status: 400 });
    }

    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    const existing = await Subject.findOne({ slug });
    if (existing) {
      return NextResponse.json({ message: "Subject with this name already exists" }, { status: 409 });
    }

    const subject = await Subject.create({
      name: name.trim(),
      slug,
      description: description?.trim() || "",
    });

    return NextResponse.json({
      message: "Subject created",
      subject: { _id: String(subject._id), name: subject.name, slug: subject.slug, description: subject.description },
    }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { message: "Failed to create subject", error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();
    const { _id, name, description } = body;

    if (!_id) {
      return NextResponse.json({ message: "_id is required" }, { status: 400 });
    }

    const update: Record<string, string> = {};
    if (name?.trim()) {
      update.name = name.trim();
      update.slug = name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
    }
    if (description !== undefined) {
      update.description = description.trim();
    }

    const subject = await Subject.findByIdAndUpdate(_id, { $set: update }, { new: true }).lean();
    if (!subject) {
      return NextResponse.json({ message: "Subject not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Subject updated", subject });
  } catch (error) {
    return NextResponse.json(
      { message: "Failed to update subject", error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ message: "id query param is required" }, { status: 400 });
    }

    const subject = await Subject.findByIdAndDelete(id).lean();
    if (!subject) {
      return NextResponse.json({ message: "Subject not found" }, { status: 404 });
    }

    // Delete all classes under this subject
    await ClassModel.deleteMany({ subject: id });

    return NextResponse.json({ message: "Subject and its classes deleted" });
  } catch (error) {
    return NextResponse.json(
      { message: "Failed to delete subject", error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}
