import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import CbsePdfCard from "@/src/components/learn/CbsePdfCard";
import { connectDB } from "@/src/lib/mongodb";
import LessonModel from "@/src/models/lms/Lesson";
import SubjectModel from "@/src/models/lms/Subject";
import ClassModel from "@/src/models/lms/Class";
import CourseModel from "@/src/models/Course";

// Always fetch fresh data — never use Next.js static cache for lesson lists.
export const dynamic = "force-dynamic";

type Params = { subject: string; class: string };

type PdfItem = {
  title: string;
  slug: string;
  description: string;
  pdfUrl: string;
  thumbnailUrl: string;
  source: "lms" | "course";
};

function formatLabel(value: string) {
  if (value.toLowerCase() === "ai") return "AI";
  return value
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

async function fetchAllPdfContent(
  subjectSlug: string,
  classSlug: string,
): Promise<{ items: PdfItem[]; subjectName: string; className: string } | null> {
  try {
    await connectDB();

    const subjectDoc = await SubjectModel.findOne({ slug: subjectSlug })
      .select("_id name slug")
      .lean() as { _id: unknown; name?: string; slug?: string } | null;
    if (!subjectDoc) return null;

    const classDoc = await ClassModel.findOne({ slug: classSlug, subject: subjectDoc._id })
      .select("_id name slug")
      .lean() as { _id: unknown; name?: string; slug?: string } | null;
    if (!classDoc) return null;

    // ── Source 1: LMS lessons with pdfUrl (uploaded via /admin/lms or Content Editor "CBSE PDF") ──
    const lmsLessons = await LessonModel.find({
      subject: subjectDoc._id,
      class: classDoc._id,
      published: true,
      pdfUrl: { $exists: true, $ne: "" },
    })
      .select("title slug description pdfUrl thumbnailUrl thumbnail")
      .sort({ createdAt: 1 })
      .lean();

    const lmsItems: PdfItem[] = lmsLessons.map((l) => {
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
        description: lesson.description ?? "",
        pdfUrl: lesson.pdfUrl ?? "",
        thumbnailUrl: (lesson.thumbnailUrl || lesson.thumbnail) ?? "",
        source: "lms" as const,
      };
    });

    // ── Source 2: Courses for this subject/class (uploaded via Course Creator) ──
    const prettySubject = formatLabel(subjectSlug);
    const prettyClass = formatLabel(classSlug);

    const courses = await CourseModel.find({
      status: "published",
      $or: [
        { subjectSlug, classSlug },
        {
          subject: { $regex: `^${prettySubject}$`, $options: "i" },
          classLevel: { $regex: prettyClass, $options: "i" },
        },
      ],
    })
      .select("_id title slug description thumbnail")
      .sort({ updatedAt: -1 })
      .lean();

    const courseItems: PdfItem[] = courses.map((c) => {
      const course = c as {
        _id?: unknown;
        title?: string;
        slug?: string;
        description?: string;
        thumbnail?: string;
      };
      return {
        title: course.title || "",
        slug: course.slug || "",
        description: course.description ?? "",
        pdfUrl: "", // Courses don't have a direct pdfUrl
        thumbnailUrl: course.thumbnail ?? "",
        source: "course" as const,
      };
    });

    // Combine: LMS PDF lessons first, then Courses
    const allItems = [...lmsItems, ...courseItems];

    return {
      items: allItems,
      subjectName: String(subjectDoc.name || formatLabel(subjectSlug)),
      className: String(classDoc.name || formatLabel(classSlug)),
    };
  } catch (error) {
    console.error("[cbse-pdf page]", error);
    return null;
  }
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { subject, class: classSlug } = await params;
  const prettySubject = formatLabel(subject);
  const prettyClass = formatLabel(classSlug);
  return {
    title: `${prettySubject} ${prettyClass} CBSE PDFs | Python Arena`,
    description: `Browse CBSE PDF materials for ${prettySubject} ${prettyClass}.`,
    alternates: { canonical: `/learn/${subject}/${classSlug}/cbse-pdf` },
  };
}

export default async function CbsePdfPage({ params }: { params: Promise<Params> }) {
  const { subject, class: classSlug } = await params;
  const data = await fetchAllPdfContent(subject, classSlug);

  if (!data) {
    notFound();
  }

  const prettySubject = data.subjectName;
  const prettyClass = data.className;

  const pdfLessons = data.items.filter((item) => item.source === "lms");
  const courseEntries = data.items.filter((item) => item.source === "course");

  return (
    <main className="min-h-screen bg-black px-4 py-14 text-white sm:px-6 lg:px-10">
      <div className="mx-auto max-w-7xl">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-slate-400">
          <Link href="/learn" className="transition hover:text-cyan-300">
            Learn
          </Link>
          <span>/</span>
          <Link href={`/learn/${subject}`} className="transition hover:text-cyan-300">
            {prettySubject}
          </Link>
          <span>/</span>
          <Link href={`/learn/${subject}/${classSlug}`} className="transition hover:text-cyan-300">
            {prettyClass}
          </Link>
          <span>/</span>
          <span className="text-slate-200">CBSE PDF</span>
        </nav>

        {/* Header */}
        <div className="mt-6">
          <h1 className="text-3xl font-bold sm:text-4xl">
            {prettySubject} — {prettyClass}
          </h1>
          <p className="mt-2 text-slate-400">CBSE PDF study materials</p>
        </div>

        {/* Tab-style links */}
        <div className="mt-6 flex gap-3">
          <Link
            href={`/learn/${subject}/${classSlug}/course`}
            className="rounded-lg border border-white/10 px-4 py-2 text-sm text-slate-300 transition hover:border-cyan-400/40 hover:text-cyan-300"
          >
            Course
          </Link>
          <span className="rounded-lg border border-cyan-400/60 bg-cyan-500/10 px-4 py-2 text-sm font-semibold text-cyan-300">
            CBSE PDF
          </span>
        </div>

        {/* ── LMS PDF Lessons (uploaded with actual PDF files) ── */}
        {pdfLessons.length > 0 && (
          <section className="mt-10">
            <h2 className="mb-5 text-lg font-semibold text-slate-200">
              PDF Materials
            </h2>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {pdfLessons.map((lesson) => (
                <CbsePdfCard
                  key={lesson.slug}
                  title={lesson.title}
                  description={lesson.description}
                  thumbnailUrl={lesson.thumbnailUrl}
                  pdfUrl={lesson.pdfUrl}
                />
              ))}
            </div>
          </section>
        )}

        {/* ── Course-based content (uploaded via Course Creator) ── */}
        {courseEntries.length > 0 && (
          <section className={pdfLessons.length > 0 ? "mt-12" : "mt-10"}>
            <h2 className="mb-2 text-lg font-semibold text-slate-200">
              Course Materials
            </h2>
            <p className="mb-5 text-sm text-slate-400">
              These resources were added via the Course system. Open them in the Course viewer.
            </p>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {courseEntries.map((course) => (
                <Link
                  key={course.slug}
                  href={`/learn/${subject}/${classSlug}/course`}
                  className="flex flex-col gap-2 rounded-2xl border border-indigo-400/20 bg-slate-900 p-5 transition hover:border-indigo-400/50 hover:shadow-lg hover:shadow-indigo-900/10"
                >
                  <h3 className="font-semibold text-white">{course.title}</h3>
                  {course.description && (
                    <p className="line-clamp-2 text-sm text-slate-400">{course.description}</p>
                  )}
                  <span className="mt-auto inline-flex items-center gap-1 text-xs text-indigo-300">
                    <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                    Open in Course
                  </span>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* ── Empty state: no content from either system ── */}
        {pdfLessons.length === 0 && courseEntries.length === 0 && (
          <section className="mt-10">
            <div className="flex min-h-[240px] flex-col items-center justify-center rounded-2xl border border-white/10 bg-slate-950 text-center">
              <svg
                className="mb-4 h-12 w-12 text-slate-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <p className="text-slate-400">No PDFs available yet for this class.</p>
              <p className="mt-1 text-sm text-slate-600">Check back soon or browse the course.</p>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
