import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/src/lib/mongodb";
import LessonModel from "@/src/models/lms/Lesson";
import SubjectModel from "@/src/models/lms/Subject";
import ClassModel from "@/src/models/lms/Class";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const subject = request.nextUrl.searchParams.get("subject") ?? "";
  const classSlug = request.nextUrl.searchParams.get("class") ?? "";

  await connectDB();

  // Step 1: Find subject
  const subjectDoc = await SubjectModel.findOne({ slug: subject })
    .select("_id name slug")
    .lean() as { _id: unknown; name?: string; slug?: string } | null;

  if (!subjectDoc) {
    return NextResponse.json({
      ok: false,
      step: "subject",
      message: `No subject found with slug: "${subject}"`,
      allSubjects: await SubjectModel.find().select("name slug").lean(),
    });
  }

  // Step 2: Find class
  const classDoc = await ClassModel.findOne({
    slug: classSlug,
    subject: subjectDoc._id,
  })
    .select("_id name slug subject")
    .lean() as { _id: unknown; name?: string; slug?: string; subject?: unknown } | null;

  if (!classDoc) {
    const allClasses = await ClassModel.find({ subject: subjectDoc._id })
      .select("name slug")
      .lean();
    return NextResponse.json({
      ok: false,
      step: "class",
      message: `No class found with slug: "${classSlug}" under subject "${subject}"`,
      subjectFound: { id: String(subjectDoc._id), name: subjectDoc.name, slug: subjectDoc.slug },
      allClassesForSubject: allClasses,
    });
  }

  // Step 3: Count ALL lessons for this class (no filters)
  const totalLessons = await LessonModel.countDocuments({
    subject: subjectDoc._id,
    class: classDoc._id,
  });

  const publishedLessons = await LessonModel.countDocuments({
    subject: subjectDoc._id,
    class: classDoc._id,
    published: true,
  });

  const pdfLessons = await LessonModel.countDocuments({
    subject: subjectDoc._id,
    class: classDoc._id,
    published: true,
    pdfUrl: { $exists: true, $ne: "" },
  });

  // Step 4: Get ALL lessons with full detail
  const allLessons = await LessonModel.find({
    subject: subjectDoc._id,
    class: classDoc._id,
  })
    .select("title slug published pdfUrl contentType content createdAt")
    .lean();

  return NextResponse.json({
    ok: true,
    query: { subject, classSlug },
    subjectFound: { id: String(subjectDoc._id), name: subjectDoc.name, slug: subjectDoc.slug },
    classFound: { id: String(classDoc._id), name: classDoc.name, slug: classDoc.slug },
    counts: { total: totalLessons, published: publishedLessons, withPdf: pdfLessons },
    lessons: allLessons.map((l) => {
      const lesson = l as {
        _id?: unknown;
        title?: string;
        slug?: string;
        published?: boolean;
        pdfUrl?: string;
        contentType?: string;
        content?: string;
        createdAt?: unknown;
      };
      return {
        id: String(lesson._id),
        title: lesson.title,
        slug: lesson.slug,
        published: lesson.published,
        hasPdfUrl: Boolean(lesson.pdfUrl),
        pdfUrlPreview: lesson.pdfUrl ? lesson.pdfUrl.substring(0, 60) + "..." : "(empty)",
        contentType: lesson.contentType,
        hasContent: Boolean(lesson.content?.trim()),
        createdAt: lesson.createdAt,
      };
    }),
  });
}
