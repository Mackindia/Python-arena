import Link from "next/link";
import LessonCard from "./LessonCard";

type LessonData = {
  slug: string;
  title: string;
  description: string;
  thumbnail: string;
  progress?: number;
  published: boolean;
};

type ClassLessonsLayoutProps = {
  subjectSlug: string;
  classSlug: string;
  class: {
    name: string;
  };
  subject: {
    name: string;
  };
  lessons: LessonData[];
};

export default function ClassLessonsLayout({
  subjectSlug,
  classSlug,
  class: classData,
  subject,
  lessons,
}: ClassLessonsLayoutProps) {
  const publishedLessons = lessons.filter((l) => l.published);
  const backPath = `/lms/${subjectSlug}`;

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-10 text-white sm:px-6 lg:px-10">
      <div className="mx-auto max-w-6xl">
        <Link href={backPath} className="text-sm text-cyan-300 transition hover:text-cyan-200">
          ← Back to {subject.name}
        </Link>

        <header className="mt-8 space-y-4 rounded-3xl border border-white/10 bg-slate-900/85 p-8 shadow-[0_16px_60px_rgba(2,6,23,0.45)]">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-slate-400">{subject.name}</p>
            <h1 className="mt-2 text-4xl font-bold leading-tight text-white sm:text-5xl">{classData.name}</h1>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <span className="inline-block h-2 w-2 rounded-full bg-cyan-400" />
            <p className="text-sm text-slate-400">
              {publishedLessons.length} {publishedLessons.length === 1 ? "lesson" : "lessons"} available
            </p>
          </div>
        </header>

        <section className="mt-12">
          {publishedLessons.length > 0 ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {publishedLessons.map((lesson) => (
                <LessonCard
                  key={lesson.slug}
                  subjectSlug={subjectSlug}
                  classSlug={classSlug}
                  lesson={lesson}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-3xl border border-dashed border-white/20 bg-slate-900/40 px-8 py-16 text-center">
              <svg
                className="mx-auto h-16 w-16 text-slate-500"
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
              <h3 className="mt-4 text-lg font-semibold text-slate-300">No lessons yet</h3>
              <p className="mt-2 text-sm text-slate-500">Lessons will appear here once they are published by instructors.</p>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
