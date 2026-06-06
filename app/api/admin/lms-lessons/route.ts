import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { requireAdminApi } from "@/lib/admin-api";
import { createLmsLesson } from "@/lib/lms-lessons";
import Subject from "@/models/lms/Subject";
import ClassModel from "@/models/lms/Class";
import LessonModel from "@/models/lms/Lesson";
import { LessonCreateSchema } from "@/src/validators";

export const runtime = "nodejs";

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
    const subjectSlug = (searchParams.get("subject") ?? "").trim();
    const classSlug = (searchParams.get("class") ?? "").trim();
    const publishedFilter = (searchParams.get("published") ?? "all").trim();
    const searchQuery = (searchParams.get("q") ?? "").trim();
    const page = Math.max(1, Number(searchParams.get("page") ?? 1) || 1);
    const limit = Math.min(50, Math.max(1, Number(searchParams.get("limit") ?? 10) || 10));

    const query: Record<string, unknown> = {};

    let subjectRecord: { _id: unknown } | null = null;
    if (subjectSlug) {
      subjectRecord = await Subject.findOne({ slug: subjectSlug }).select("_id").lean();
      if (!subjectRecord?._id) {
        return NextResponse.json({
          items: [],
          meta: {
            page,
            limit,
            total: 0,
            totalPages: 0,
            hasNextPage: false,
            hasPrevPage: page > 1,
          },
        });
      }
      query.subject = subjectRecord._id;
    }

    if (classSlug) {
      const classRecord = await ClassModel.findOne(
        subjectRecord?._id
          ? { slug: classSlug, subject: subjectRecord._id }
          : { slug: classSlug },
      )
        .select("_id")
        .lean();

      if (!classRecord?._id) {
        return NextResponse.json({
          items: [],
          meta: {
            page,
            limit,
            total: 0,
            totalPages: 0,
            hasNextPage: false,
            hasPrevPage: page > 1,
          },
        });
      }

      query.class = classRecord._id;
    }

    if (publishedFilter === "published") {
      query.published = true;
    } else if (publishedFilter === "draft") {
      query.published = false;
    }

    if (searchQuery) {
      query.title = { $regex: escapeRegex(searchQuery), $options: "i" };
    }

    const total = await LessonModel.countDocuments(query);
    const totalPages = total === 0 ? 0 : Math.ceil(total / limit);
    const skip = (page - 1) * limit;

    const lessons = await LessonModel.find(query)
      .populate("subject", "_id name slug")
      .populate("class", "_id name slug")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const items = lessons.map((lesson) => {
      const lessonItem = lesson as {
        _id?: unknown;
        title?: string;
        slug?: string;
        contentType?: "notes" | "cbse-pdf" | "mixed";
        description?: string;
        published?: boolean;
        createdAt?: unknown;
        updatedAt?: unknown;
        pdfTextExtraction?: { status?: string };
        pdfUrl?: string;
        thumbnailUrl?: string;
        thumbnail?: string;
        subject?: { _id?: unknown; name?: string; slug?: string };
        class?: { _id?: unknown; name?: string; slug?: string };
      };

      const subject = lessonItem.subject;
      const classItem = lessonItem.class;

      return {
        id: String(lessonItem._id),
        title: lessonItem.title || "",
        slug: lessonItem.slug || "",
        contentType: lessonItem.contentType || "notes",
        description: lessonItem.description || "",
        published: Boolean(lessonItem.published),
        createdAt: lessonItem.createdAt,
        updatedAt: lessonItem.updatedAt,
        pdfStatus: lessonItem.pdfTextExtraction?.status || "pending",
        pdfUrl: lessonItem.pdfUrl || "",
        thumbnailUrl: lessonItem.thumbnailUrl || lessonItem.thumbnail || "",
        subject: {
          id: subject?._id ? String(subject._id) : "",
          name: subject?.name || "Unknown",
          slug: subject?.slug || "",
        },
        class: {
          id: classItem?._id ? String(classItem._id) : "",
          name: classItem?.name || "Unknown",
          slug: classItem?.slug || "",
        },
      };
    });

    return NextResponse.json({
      items,
      meta: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        message: "Failed to fetch LMS lessons",
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

    const rawBody = await request.json();

    const parsed = LessonCreateSchema.safeParse({
      ...rawBody,
      createdBy: String(access.ctx.dbUser._id),
    });

    if (!parsed.success) {
      return NextResponse.json(
        {
          message: "Validation failed",
          errors: parsed.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    const classesList = parsed.data.classes && parsed.data.classes.length > 0
      ? parsed.data.classes
      : [parsed.data.class].filter(Boolean) as string[];

    if (classesList.length === 0) {
      return NextResponse.json(
        { message: "At least one class is required" },
        { status: 400 }
      );
    }

    const createdLessons = [];
    const errorsList: { class: string; error: string }[] = [];

    for (const classId of classesList) {
      try {
        const lesson = await createLmsLesson({
          title: parsed.data.title,
          slug: parsed.data.slug,
          contentType: parsed.data.contentType,
          subject: parsed.data.subject,
          class: classId,
          description: parsed.data.description,
          pdfUrl: parsed.data.pdfUrl,
          thumbnailUrl: parsed.data.thumbnailUrl,
          thumbnail: parsed.data.thumbnail,
          content: parsed.data.content,
          published: parsed.data.published,
          createdBy: parsed.data.createdBy,
        });
        createdLessons.push(lesson);
      } catch (err) {
        let msg = err instanceof Error ? err.message : "Unknown error";
        if (typeof err === "object" && err && "code" in err && (err as { code?: number }).code === 11000) {
          msg = "A lesson with the same slug already exists in this class.";
        }
        errorsList.push({ class: classId, error: msg });
      }
    }

    if (createdLessons.length === 0 && errorsList.length > 0) {
      const isDuplicate = errorsList.some(e => e.error.includes("already exists"));
      return NextResponse.json(
        {
          message: isDuplicate 
            ? "A lesson with the same slug already exists in the selected classes."
            : "Failed to create lessons in all selected classes",
          errors: errorsList.reduce((acc, curr) => {
            acc[curr.class] = [curr.error];
            return acc;
          }, {} as Record<string, string[]>),
        },
        { status: isDuplicate ? 409 : 500 },
      );
    }

    return NextResponse.json(
      {
        message: errorsList.length > 0
          ? `Lesson created in some classes. Errors in: ${errorsList.map(e => e.class).join(", ")}`
          : (classesList.length > 1 ? "Lessons created successfully in all classes" : "Lesson created successfully"),
        lesson: createdLessons[0],
        lessons: createdLessons,
        partialErrors: errorsList.length > 0 ? errorsList : undefined,
      },
      { status: 201 },
    );
  } catch (error) {
    return NextResponse.json(
      {
        message: "Failed to create lesson",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
