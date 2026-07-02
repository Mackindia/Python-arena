import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { connectDB } from "@/lib/mongodb";
import SubjectModel from "@/src/models/lms/Subject";
import ClassModel from "@/src/models/lms/Class";
import LessonModel from "@/src/models/lms/Lesson";

// Always fetch fresh data — lesson content changes frequently.
export const dynamic = "force-dynamic";

type Params = { subject: string; class: string };

type NotesData = {
  subjectName: string;
  className: string;
  lessons: Array<{
    id: string;
    title: string;
    slug: string;
    description: string;
    preview: string;
    createdAt: string;
  }>;
};

async function getNotesData(subjectSlug: string, classSlug: string): Promise<NotesData | null> {
  await connectDB();

  const subject = await SubjectModel.findOne({ slug: subjectSlug }).select("_id name").lean();
  if (!subject?._id) return null;

  const classDoc = await ClassModel.findOne({ slug: classSlug, subject: subject._id }).select("_id name").lean();
  if (!classDoc?._id) return null;

  const lessons = await LessonModel.find({
    subject: subject._id,
    class: classDoc._id,
    published: true,
    content: { $exists: true, $ne: "" },
  })
    .select("_id title slug description content createdAt")
    .sort({ createdAt: -1 })
    .lean();

  return {
    subjectName: String(subject.name || ""),
    className: String(classDoc.name || ""),
    lessons: lessons.map((lesson) => ({
      id: String(lesson._id),
      title: String(lesson.title || ""),
      slug: String(lesson.slug || ""),
      description: String(lesson.description || ""),
      preview: String((lesson.content || "").slice(0, 180)),
      createdAt: lesson.createdAt ? new Date(lesson.createdAt as string | number | Date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "",
    })),
  };
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { subject, class: classSlug } = await params;
  return {
    title: `Notes | ${subject} ${classSlug} | Python Arena`,
    description: "Browse lesson notes and markdown content.",
    alternates: { canonical: `/learn/${subject}/${classSlug}/notes` },
  };
}

export default async function NotesPage({ params }: { params: Promise<Params> }) {
  const { subject, class: classSlug } = await params;
  const data = await getNotesData(subject, classSlug);

  if (!data) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-black px-4 py-14 text-white sm:px-6 lg:px-10">
      <div className="mx-auto max-w-6xl">
        <Link href={`/learn/${subject}/${classSlug}`} className="text-sm text-cyan-300 hover:text-cyan-200">
          Back to {data.subjectName} {data.className}
        </Link>

        <h1 className="mt-4 text-3xl font-bold sm:text-4xl">Notes and Content</h1>
        <p className="mt-3 text-slate-300">
          Dynamic lesson content for {data.subjectName} {data.className}.
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.lessons.length ? (
            data.lessons.map((lesson) => (
              <Link
                key={lesson.id}
                href={`/learn/${subject}/${classSlug}/${lesson.slug}`}
                className="rounded-2xl border border-cyan-400/20 bg-slate-950 p-5 transition hover:border-cyan-300/40 hover:bg-slate-900"
              >
                <h2 className="text-lg font-semibold text-white">{lesson.title}</h2>
                {lesson.description ? (
                  <p className="mt-2 text-sm text-slate-300">{lesson.description}</p>
                ) : (
                  <p className="mt-2 line-clamp-3 text-sm text-slate-400">{lesson.preview}</p>
                )}
                <div className="mt-3 flex items-center justify-between">
                  <p className="text-xs text-cyan-300">Open lesson</p>
                  {lesson.createdAt && (
                    <p className="text-xs text-slate-500">{lesson.createdAt}</p>
                  )}
                </div>
              </Link>
            ))
          ) : (
            <div className="sm:col-span-2 lg:col-span-3 rounded-2xl border border-white/10 bg-slate-950 p-8 text-center text-slate-400">
              No notes content is published yet.
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
