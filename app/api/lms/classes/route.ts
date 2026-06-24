import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Subject from "@/models/lms/Subject";
import ClassModel from "@/models/lms/Class";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const subjectSlug = (request.nextUrl.searchParams.get("subject") ?? "").trim();

    let subjectId: string | null = null;
    if (subjectSlug) {
      const subject = await Subject.findOne({ slug: subjectSlug }).select("_id").lean();
      if (!subject?._id) {
        return NextResponse.json({ classes: [] });
      }
      subjectId = String(subject._id);
    }

    const classes = await ClassModel.find(subjectId ? { subject: subjectId } : {})
      .select("_id slug name subject")
      .sort({ name: 1 })
      .lean();

    return NextResponse.json({
      classes: classes.map((item) => {
        const classItem = item as { _id?: unknown; slug?: string; name?: string; subject?: unknown };
        return {
          _id: String(classItem._id),
          slug: classItem.slug || "",
          name: classItem.name || "",
          subject: String(classItem.subject || ""),
        };
      }),
    });
  } catch (error) {
    return NextResponse.json(
      { message: "Failed to fetch classes", error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();
    const { name, subjectId } = body;

    if (!name?.trim()) {
      return NextResponse.json({ message: "Name is required" }, { status: 400 });
    }
    if (!subjectId) {
      return NextResponse.json({ message: "subjectId is required" }, { status: 400 });
    }

    const subject = await Subject.findById(subjectId).lean();
    if (!subject) {
      return NextResponse.json({ message: "Subject not found" }, { status: 404 });
    }

    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    const existing = await ClassModel.findOne({ subject: subjectId, slug });
    if (existing) {
      return NextResponse.json({ message: "Class already exists for this subject" }, { status: 409 });
    }

    const cls = await ClassModel.create({
      name: name.trim(),
      slug,
      subject: subjectId,
    });

    return NextResponse.json({
      message: "Class created",
      class: { _id: String(cls._id), name: cls.name, slug: cls.slug, subject: String(cls.subject) },
    }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { message: "Failed to create class", error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();
    const { _id, name, subjectId } = body;

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
    if (subjectId) {
      update.subject = subjectId;
    }

    const cls = await ClassModel.findByIdAndUpdate(_id, { $set: update }, { new: true }).lean();
    if (!cls) {
      return NextResponse.json({ message: "Class not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Class updated", class: cls });
  } catch (error) {
    return NextResponse.json(
      { message: "Failed to update class", error: error instanceof Error ? error.message : "Unknown error" },
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

    const cls = await ClassModel.findByIdAndDelete(id).lean();
    if (!cls) {
      return NextResponse.json({ message: "Class not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Class deleted" });
  } catch (error) {
    return NextResponse.json(
      { message: "Failed to delete class", error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}
