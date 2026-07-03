import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/mongodb";
import { requireAdminApi } from "@/lib/admin-api";
import SubjectModel from "@/models/lms/Subject";
import ClassModel from "@/models/lms/Class";
import PracticeResourceModel from "@/models/practice/PracticeResource";

export const runtime = "nodejs";

function toSlug(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export async function GET(request: NextRequest) {
  try {
    const access = await requireAdminApi();
    if (!access.ok) {
      return access.response;
    }

    await connectDB();

    const searchParams = request.nextUrl.searchParams;
    const subjectId = (searchParams.get("subjectId") ?? "").trim();
    const classId = (searchParams.get("classId") ?? "").trim();
    const publishedFilter = (searchParams.get("published") ?? "all").trim();
    const searchQuery = (searchParams.get("q") ?? "").trim();

    const query: Record<string, unknown> = {};

    if (subjectId && mongoose.Types.ObjectId.isValid(subjectId)) {
      query.subject = new mongoose.Types.ObjectId(subjectId);
    }

    if (classId && mongoose.Types.ObjectId.isValid(classId)) {
      query.class = new mongoose.Types.ObjectId(classId);
    }

    if (publishedFilter === "published") {
      query.published = true;
    } else if (publishedFilter === "draft") {
      query.published = false;
    }

    if (searchQuery) {
      query.title = { $regex: escapeRegex(searchQuery), $options: "i" };
    }

    const resources = await PracticeResourceModel.find(query)
      .populate("subject", "_id name slug")
      .populate("class", "_id name slug")
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({
      items: resources.map((resource) => {
        const item = resource as {
          _id?: unknown;
          title?: string;
          slug?: string;
          description?: string;
          resourceType?: string;
          fileUrl?: string;
          published?: boolean;
          createdAt?: string | Date;
          updatedAt?: string | Date;
          subject?: { _id?: unknown; name?: string; slug?: string };
          class?: { _id?: unknown; name?: string; slug?: string };
        };

        return {
          id: String(item._id),
          title: item.title || "",
          slug: item.slug || "",
          description: item.description || "",
          resourceType: item.resourceType || "question-paper",
          fileUrl: item.fileUrl || "",
          published: Boolean(item.published),
          createdAt: item.createdAt || null,
          updatedAt: item.updatedAt || null,
          subject: {
            id: item.subject?._id ? String(item.subject._id) : "",
            name: item.subject?.name || "Unknown",
            slug: item.subject?.slug || "",
          },
          class: {
            id: item.class?._id ? String(item.class._id) : "",
            name: item.class?.name || "Unknown",
            slug: item.class?.slug || "",
          },
        };
      }),
    });
  } catch (error) {
    return NextResponse.json(
      {
        message: "Failed to fetch practice resources",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const access = await requireAdminApi();
    if (!access.ok) {
      return access.response;
    }

    if (!access.ctx.dbUser?._id) {
      return NextResponse.json(
        { message: "Admin user profile is not synced in MongoDB" },
        { status: 400 },
      );
    }

    await connectDB();

    const body = await request.json();
    const title = String(body.title || "").trim();
    const description = String(body.description || "").trim();
    const subjectId = String(body.subjectId || "").trim();
    const classId = String(body.classId || "").trim();
    const fileUrl = String(body.fileUrl || "").trim();
    const resourceType = String(body.resourceType || "question-paper").trim();
    const published = Boolean(body.published);

    if (title.length < 3) {
      return NextResponse.json({ message: "Title must be at least 3 characters" }, { status: 400 });
    }

    if (!mongoose.Types.ObjectId.isValid(subjectId) || !mongoose.Types.ObjectId.isValid(classId)) {
      return NextResponse.json({ message: "Valid subject and class are required" }, { status: 400 });
    }

    if (!fileUrl) {
      return NextResponse.json({ message: "PDF fileUrl is required" }, { status: 400 });
    }

    const allowedTypes = new Set(["question-paper", "sample-paper", "important-pdf", "worksheet", "other"]);
    if (!allowedTypes.has(resourceType)) {
      return NextResponse.json({ message: "Invalid resourceType" }, { status: 400 });
    }

    const subject = await SubjectModel.findById(subjectId).select("_id").lean();
    if (!subject?._id) {
      return NextResponse.json({ message: "Subject not found" }, { status: 404 });
    }

    const classDoc = await ClassModel.findById(classId).select("_id subject").lean();
    if (!classDoc?._id) {
      return NextResponse.json({ message: "Class not found" }, { status: 404 });
    }

    if (String((classDoc as { subject?: unknown }).subject || "") !== subjectId) {
      return NextResponse.json({ message: "Selected class does not belong to selected subject" }, { status: 400 });
    }

    const created = await PracticeResourceModel.create({
      title,
      slug: toSlug(title),
      description,
      resourceType,
      subject: new mongoose.Types.ObjectId(subjectId),
      class: new mongoose.Types.ObjectId(classId),
      fileUrl,
      createdBy: access.ctx.dbUser._id,
      published,
    });

    return NextResponse.json(
      {
        message: "Practice resource created",
        item: {
          id: String(created._id),
          title: created.title,
          slug: created.slug,
          resourceType: created.resourceType,
          fileUrl: created.fileUrl,
          published: created.published,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    if (typeof error === "object" && error && "code" in error && (error as { code?: number }).code === 11000) {
      return NextResponse.json(
        { message: "A resource with similar title already exists for this class" },
        { status: 409 },
      );
    }

    return NextResponse.json(
      {
        message: "Failed to create practice resource",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
