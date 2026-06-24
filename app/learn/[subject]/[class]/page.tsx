import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import CbsePdfCard from "@/src/components/learn/CbsePdfCard";
import SearchBar from "@/src/components/learn/SearchBar";
import { searchSuggestions } from "@/src/constants/search";
import { connectDB } from "@/lib/mongodb";
import SubjectModel from "@/src/models/lms/Subject";
import ClassModel from "@/src/models/lms/Class";
import LessonModel from "@/src/models/lms/Lesson";
import CourseModel from "@/src/models/Course";

// Always fetch fresh data — content changes when lessons are published.
export const dynamic = "force-dynamic";

type Params = { subject: string; class: string };

function formatLabel(value: string) {
  if (value.toLowerCase() === "ai") return "AI";
  return value
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

type NoteItem = {
  id: string;
  title: string;
  slug: string;
  description: string;
  preview: string;
};

type PdfItem = {
  title: string;
  slug: string;
  description: string;
  pdfUrl: string;
  thumbnailUrl: string;
};

type CourseItem = {
  id: string;
  title: string;
  slug: string;
  description: string;
  difficulty: string;
  chapterCount: number;
  thumbnail: string;
};

async function getClassContent(subjectSlug: string, classSlug: string) {
  await connectDB();

  const subject = await SubjectModel.findOne({ slug: subjectSlug })
    .select("_id name slug")
    .lean() as { _id: unknown; name?: string; slug?: string } | null;
  if (!subject?._id) return null;

  const classDoc = await ClassModel.findOne({ slug: classSlug, subject: subject._id })
    .select("_id name slug")
    .lean() as { _id: unknown; name?: string; slug?: string } | null;
  if (!classDoc?._id) return null;

  // ── Notes: lessons with text content ──
  const notesRaw = await LessonModel.find({
    subject: subject._id,
    class: classDoc._id,
    published: true,
    content: { $exists: true, $ne: "" },
  })
    .select("_id title slug description content")
    .sort({ createdAt: -1 })
    .lean();

  const notes: NoteItem[] = notesRaw.map((l) => ({
    id: String(l._id),
    title: String(l.title || ""),
    slug: String(l.slug || ""),
    description: String(l.description || ""),
    preview: String(l.content || "").slice(0, 120).trim(),
  }));

  // ── PDFs: lessons with pdfUrl ──
  const pdfRaw = await LessonModel.find({
    subject: subject._id,
    class: classDoc._id,
    published: true,
    pdfUrl: { $exists: true, $ne: "" },
  })
    .select("title slug description pdfUrl thumbnailUrl thumbnail")
    .sort({ createdAt: 1 })
    .lean();

  const pdfs: PdfItem[] = pdfRaw.map((l) => {
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
    };
  });

  // ── Courses: structured course entries ──
  const prettySubject = formatLabel(subjectSlug);
  const prettyClass = formatLabel(classSlug);

  const coursesRaw = await CourseModel.find({
    status: "published",
    $or: [
      { subjectSlug, classSlug },
      {
        subject: { $regex: `^${prettySubject}$`, $options: "i" },
        classLevel: { $regex: prettyClass, $options: "i" },
      },
    ],
  })
    .select("_id title slug description difficulty chapters thumbnail")
    .sort({ updatedAt: -1 })
    .lean();

  const courses: CourseItem[] = coursesRaw.map((c) => {
    const course = c as {
      _id?: unknown;
      title?: string;
      slug?: string;
      description?: string;
      difficulty?: string;
      chapters?: unknown[];
      thumbnail?: string;
    };
    return {
      id: String(course._id),
      title: course.title || "",
      slug: course.slug || "",
      description: course.description ?? "",
      difficulty: course.difficulty ?? "beginner",
      chapterCount: Array.isArray(course.chapters) ? course.chapters.length : 0,
      thumbnail: course.thumbnail ?? "",
    };
  });

  return {
    subjectName: String(subject.name || formatLabel(subjectSlug)),
    className: String(classDoc.name || formatLabel(classSlug)),
    notes,
    pdfs,
    courses,
  };
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { subject, class: classSlug } = await params;
  const prettySubject = formatLabel(subject);
  const prettyClass = formatLabel(classSlug);
  return {
    title: `${prettySubject} ${prettyClass} | Python Arena`,
    description: `Browse notes, PDFs, and learning resources for ${prettySubject} ${prettyClass}.`,
    alternates: { canonical: `/learn/${subject}/${classSlug}` },
  };
}

export default async function ClassPage({ params }: { params: Promise<Params> }) {
  const { subject, class: classSlug } = await params;
  const data = await getClassContent(subject, classSlug);

  if (!data) {
    notFound();
  }

  const totalItems = data.notes.length + data.pdfs.length + data.courses.length;

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
            {data.subjectName}
          </Link>
          <span>/</span>
          <span className="text-slate-200">{data.className}</span>
        </nav>

        {/* Header */}
        <div className="mt-6">
          <h1 className="text-3xl font-bold sm:text-4xl">
            {data.subjectName} — {data.className}
          </h1>
          <p className="mt-2 text-slate-400">
            {totalItems > 0
              ? `${totalItems} resource${totalItems !== 1 ? "s" : ""} available`
              : "Content coming soon"}
          </p>
        </div>

        {/* Search */}
        <div className="mt-6">
          <SearchBar placeholders={searchSuggestions} />
        </div>

        {/* ─────────── PDF Section ─────────── */}
        <section className="mt-10">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/15">
              <svg className="h-4 w-4 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">PDF Materials</h2>
              <p className="text-xs text-slate-400">
                {data.pdfs.length + data.courses.length} item{data.pdfs.length + data.courses.length !== 1 ? "s" : ""}
              </p>
            </div>
          </div>

          {data.pdfs.length > 0 ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {data.pdfs.map((pdf) => (
                <CbsePdfCard
                  key={pdf.slug}
                  title={pdf.title}
                  description={pdf.description}
                  thumbnailUrl={pdf.thumbnailUrl}
                  pdfUrl={pdf.pdfUrl}
                />
              ))}
            </div>
          ) : data.courses.length === 0 ? (
            <div className="rounded-xl border border-white/10 bg-slate-950 px-5 py-8 text-center text-sm text-slate-500">
              No PDF materials uploaded yet.
            </div>
          ) : null}

          {/* Course entries shown as linked cards in the PDF section */}
          {data.courses.length > 0 && (
            <div className={data.pdfs.length > 0 ? "mt-5" : ""}>
              {data.pdfs.length > 0 && (
                <p className="mb-3 text-xs font-medium uppercase tracking-wide text-slate-500">
                  Course Materials
                </p>
              )}
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {data.courses.map((course) => (
                  <Link
                    key={course.id}
                    href={`/learn/${subject}/${classSlug}/course`}
                    className="flex flex-col gap-2 rounded-xl border border-indigo-400/20 bg-slate-900 p-4 transition hover:border-indigo-400/50 hover:shadow-lg hover:shadow-indigo-900/10"
                  >
                    <h3 className="font-semibold text-white">{course.title}</h3>
                    {course.description && (
                      <p className="line-clamp-2 text-sm text-slate-400">{course.description}</p>
                    )}
                    <div className="mt-auto flex items-center justify-between text-xs text-slate-500">
                      <span>{course.chapterCount} modules</span>
                      <span className="inline-flex items-center gap-1 text-indigo-300">
                        Open →
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* ─────────── Notes Section ─────────── */}
        <section className="mt-12">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-500/15">
              <svg className="h-4 w-4 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Notes</h2>
              <p className="text-xs text-slate-400">
                {data.notes.length} item{data.notes.length !== 1 ? "s" : ""}
              </p>
            </div>
          </div>

          {data.notes.length > 0 ? (
            <div className="space-y-3">
              {data.notes.map((note) => (
                <Link
                  key={note.id}
                  href={`/lms/${subject}/${classSlug}/${note.slug}`}
                  className="group block rounded-xl border border-white/10 bg-slate-950 p-4 transition hover:border-cyan-400/30 hover:shadow-lg hover:shadow-cyan-900/10"
                >
                  <h3 className="font-semibold text-white group-hover:text-cyan-200">{note.title}</h3>
                  {note.description ? (
                    <p className="mt-1 text-sm text-slate-400">{note.description}</p>
                  ) : note.preview ? (
                    <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-slate-500">
                      {note.preview}…
                    </p>
                  ) : null}
                </Link>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-white/10 bg-slate-950 px-5 py-8 text-center text-sm text-slate-500">
              No notes published yet.
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
