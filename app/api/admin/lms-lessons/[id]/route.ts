import mongoose from "mongoose";
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { requireAdminApi, requireSuperAdminApi } from "@/lib/admin-api";
import { deleteCloudinaryAssetByUrl } from "@/lib/cloudinary";
import Subject from "@/models/lms/Subject";
import ClassModel from "@/models/lms/Class";
import LessonModel from "@/models/lms/Lesson";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

type LessonUpdatePayload = {
  title?: string;
  slug?: string;
  description?: string;
  subject?: string;
  class?: string;
  published?: boolean;
};

type MutableLessonDoc = {
  title: string;
  slug: string;
  description: string;
  subject: mongoose.Types.ObjectId | string;
  class: mongoose.Types.ObjectId | string;
  published: boolean;
  save: () => Promise<unknown>;
};

function toSlug(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

async function resolveSubjectRef(subjectRef: string) {
  if (mongoose.Types.ObjectId.isValid(subjectRef)) {
    return Subject.findById(subjectRef).select("_id slug name").lean();
  }

  return Subject.findOne({ slug: subjectRef }).select("_id slug name").lean();
}

async function resolveClassRef(classRef: string, subjectId?: string) {
  if (mongoose.Types.ObjectId.isValid(classRef)) {
    return ClassModel.findById(classRef).select("_id slug name subject").lean();
  }

  return ClassModel.findOne(subjectId ? { slug: classRef, subject: subjectId } : { slug: classRef })
    .select("_id slug name subject")
    .lean();
}

function normalizeLesson(lesson: Record<string, unknown>) {
  const subject = lesson.subject as { _id?: unknown; name?: string; slug?: string } | undefined;
  const classItem = lesson.class as { _id?: unknown; name?: string; slug?: string } | undefined;
  const pdfTextExtraction = lesson.pdfTextExtraction as { status?: string } | undefined;

  return {
    id: String(lesson._id),
    title: String(lesson.title || ""),
    slug: String(lesson.slug || ""),
    description: String(lesson.description || ""),
    published: Boolean(lesson.published),
    createdAt: lesson.createdAt,
    updatedAt: lesson.updatedAt,
    pdfStatus: pdfTextExtraction?.status || "pending",
    pdfUrl: String(lesson.pdfUrl || ""),
    thumbnailUrl: String(lesson.thumbnailUrl || lesson.thumbnail || ""),
    subject: {
      id: subject?._id ? String(subject._id) : "",
      name: String(subject?.name || "Unknown"),
      slug: String(subject?.slug || ""),
    },
    class: {
      id: classItem?._id ? String(classItem._id) : "",
      name: String(classItem?.name || "Unknown"),
      slug: String(classItem?.slug || ""),
    },
  };
}

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const access = await requireAdminApi();
    if (!access.ok) {
      return access.response;
    }

    const { id } = await context.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ message: "Invalid lesson id" }, { status: 400 });
    }

    await connectDB();

    const lesson = await LessonModel.findById(id)
      .populate("subject", "_id name slug")
      .populate("class", "_id name slug")
      .lean();

    if (!lesson) {
      return NextResponse.json({ message: "Lesson not found" }, { status: 404 });
    }

    return NextResponse.json({ lesson: normalizeLesson(lesson as unknown as Record<string, unknown>) });
  } catch (error) {
    return NextResponse.json(
      {
        message: "Failed to fetch lesson",
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
      return NextResponse.json({ message: "Invalid lesson id" }, { status: 400 });
    }

    const body = (await request.json()) as LessonUpdatePayload;

    await connectDB();

    const lesson = await LessonModel.findById(id);
    if (!lesson) {
      return NextResponse.json({ message: "Lesson not found" }, { status: 404 });
    }

    const editableLesson = lesson as unknown as MutableLessonDoc;

    if (typeof body.title === "string") {
      const value = body.title.trim();
      if (value.length < 2) {
        return NextResponse.json({ message: "Title must be at least 2 characters" }, { status: 400 });
      }
      editableLesson.title = value;
    }

    if (typeof body.slug === "string") {
      const slug = toSlug(body.slug);
      if (!slug) {
        return NextResponse.json({ message: "Slug is invalid" }, { status: 400 });
      }
      editableLesson.slug = slug;
    }

    if (typeof body.description === "string") {
      editableLesson.description = body.description.trim();
    }

    let resolvedSubjectId = String(editableLesson.subject);
    if (typeof body.subject === "string" && body.subject.trim()) {
      const subjectRecord = await resolveSubjectRef(body.subject.trim());
      if (!subjectRecord?._id) {
        return NextResponse.json({ message: "Subject not found" }, { status: 400 });
      }
      resolvedSubjectId = String(subjectRecord._id);
      editableLesson.subject = new mongoose.Types.ObjectId(resolvedSubjectId);
    }

    if (typeof body.class === "string" && body.class.trim()) {
      const classRecord = await resolveClassRef(body.class.trim(), resolvedSubjectId);
      if (!classRecord?._id) {
        return NextResponse.json({ message: "Class not found" }, { status: 400 });
      }

      const classSubjectId = String((classRecord as { subject?: unknown }).subject || "");

      if (classSubjectId !== resolvedSubjectId) {
        return NextResponse.json({ message: "Selected class does not belong to selected subject" }, { status: 400 });
      }

      editableLesson.class = new mongoose.Types.ObjectId(String(classRecord._id));
    } else if (typeof body.subject === "string") {
      const existingClass = await ClassModel.findById(editableLesson.class).select("subject").lean();
      const existingClassSubject = String((existingClass as { subject?: unknown } | null)?.subject || "");
      if (existingClass && existingClassSubject !== resolvedSubjectId) {
        return NextResponse.json(
          { message: "Class no longer matches selected subject. Please select a class." },
          { status: 400 },
        );
      }
    }

    if (typeof body.published === "boolean") {
      editableLesson.published = body.published;
    }

    await editableLesson.save();

    const updatedLesson = await LessonModel.findById(id)
      .populate("subject", "_id name slug")
      .populate("class", "_id name slug")
      .lean();

    if (!updatedLesson) {
      return NextResponse.json({ message: "Lesson not found after update" }, { status: 404 });
    }

    return NextResponse.json({
      message: "Lesson updated successfully",
      lesson: normalizeLesson(updatedLesson as unknown as Record<string, unknown>),
    });
  } catch (error) {
    if (typeof error === "object" && error && "code" in error && (error as { code?: number }).code === 11000) {
      return NextResponse.json(
        { message: "A lesson with the same slug already exists in this class." },
        { status: 409 },
      );
    }

    return NextResponse.json(
      {
        message: "Failed to update lesson",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    const access = await requireSuperAdminApi();
    if (!access.ok) {
      return access.response;
    }

    const { id } = await context.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ message: "Invalid lesson id" }, { status: 400 });
    }

    await connectDB();

    const lesson = await LessonModel.findById(id).lean();
    if (!lesson) {
      return NextResponse.json({ message: "Lesson not found" }, { status: 404 });
    }

    const lessonAssets = lesson as {
      pdfUrl?: string;
      thumbnailUrl?: string;
      thumbnail?: string;
    };

    const cleanupTargets = [
      { label: "pdf", url: String(lessonAssets.pdfUrl || ""), hints: ["raw", "image"] as const },
      {
        label: "thumbnail",
        url: String(lessonAssets.thumbnailUrl || lessonAssets.thumbnail || ""),
        hints: ["image", "raw"] as const,
      },
    ].filter((item) => item.url);

    const cleanupErrors: string[] = [];

    for (const target of cleanupTargets) {
      const cleanupResult = await deleteCloudinaryAssetByUrl(target.url, [...target.hints]);
      if (!cleanupResult.ok) {
        cleanupErrors.push(`${target.label}: ${cleanupResult.error || "Cloudinary cleanup failed"}`);
      }
    }

    if (cleanupErrors.length > 0) {
      return NextResponse.json(
        {
          message: "Cloudinary cleanup failed. Lesson was not deleted.",
          errors: cleanupErrors,
        },
        { status: 502 },
      );
    }

    await LessonModel.deleteOne({ _id: id });

    return NextResponse.json({ message: "Lesson deleted successfully" });
  } catch (error) {
    return NextResponse.json(
      {
        message: "Failed to delete lesson",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
