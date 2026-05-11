import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import CbsePdfCard from "@/src/components/learn/CbsePdfCard";
import { connectDB } from "@/src/lib/mongodb";
import LessonModel from "@/src/models/lms/Lesson";
import SubjectModel from "@/src/models/lms/Subject";
import ClassModel from "@/src/models/lms/Class";

type Params = { subject: string; class: string };

function formatLabel(value: string) {
  if (value.toLowerCase() === "ai") return "AI";
  return value
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

async function fetchPdfLessons(subject: string, classSlug: string) {
  try {
    await connectDB();

    const subjectDoc = await SubjectModel.findOne({ slug: subject }).select("_id").lean();
    if (!subjectDoc) return null;

    const classDoc = await ClassModel.findOne({ slug: classSlug, subject: subjectDoc._id })
      .select("_id")
      .lean();
    if (!classDoc) return null;

    const lessons = await LessonModel.find({
      subject: subjectDoc._id,
      class: classDoc._id,
      published: true,
      pdfUrl: { $ne: "" },
    })
      .select("title slug description pdfUrl thumbnailUrl thumbnail")
      .sort({ createdAt: 1 })
      .lean();

    return lessons.map((l) => ({
      title: l.title,
      slug: l.slug,
      description: l.description ?? "",
      pdfUrl: l.pdfUrl ?? "",
      thumbnailUrl: (l.thumbnailUrl || l.thumbnail) ?? "",
    }));
  } catch (error) {
    console.error("[cbse-pdf page]", error);
    return [];
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
  const lessons = await fetchPdfLessons(subject, classSlug);

  if (lessons === null) {
    notFound();
  }

  const prettySubject = formatLabel(subject);
  const prettyClass = formatLabel(classSlug);

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

        {/* Cards grid */}
        <section className="mt-10">
          {lessons.length === 0 ? (
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
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {lessons.map((lesson) => (
                <CbsePdfCard
                  key={lesson.slug}
                  title={lesson.title}
                  description={lesson.description}
                  thumbnailUrl={lesson.thumbnailUrl}
                  pdfUrl={lesson.pdfUrl}
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
