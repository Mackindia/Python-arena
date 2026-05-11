import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/src/lib/mongodb";
import LessonModel from "@/src/models/lms/Lesson";
import SubjectModel from "@/src/models/lms/Subject";
import ClassModel from "@/src/models/lms/Class";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const subject = request.nextUrl.searchParams.get("subject")?.trim();
  const classSlug = request.nextUrl.searchParams.get("class")?.trim();

  if (!subject || !classSlug) {
    return NextResponse.json(
      { error: "Missing required query params: subject, class" },
      { status: 400 },
    );
  }

  try {
    await connectDB();

    // Resolve subject document by slug
    const subjectDoc = await SubjectModel.findOne({ slug: subject }).select("_id").lean();
    if (!subjectDoc) {
      return NextResponse.json({ lessons: [] });
    }

    // Resolve class document by slug scoped to the subject
    const classDoc = await ClassModel.findOne({ slug: classSlug, subject: subjectDoc._id })
      .select("_id")
      .lean();
    if (!classDoc) {
      return NextResponse.json({ lessons: [] });
    }

    const lessons = await LessonModel.find({
      subject: subjectDoc._id,
      class: classDoc._id,
      published: true,
      pdfUrl: { $ne: "" },
    })
      .select("title slug description pdfUrl thumbnailUrl thumbnail")
      .sort({ createdAt: 1 })
      .lean();

    const data = lessons.map((l) => {
      const lesson = l as {
        title?: string;
        slug?: string;
        description?: string;
        pdfUrl?: string;
        thumbnailUrl?: string;
        thumbnail?: string;
      };

      return {
        title: lesson.title || "",
        slug: lesson.slug || "",
        description: lesson.description || "",
        pdfUrl: lesson.pdfUrl || "",
        thumbnailUrl: lesson.thumbnailUrl || lesson.thumbnail || "",
      };
    });

    return NextResponse.json({ lessons: data });
  } catch (error) {
    console.error("[cbse-pdf API]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
