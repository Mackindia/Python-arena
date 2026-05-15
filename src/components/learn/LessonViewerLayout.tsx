import Link from "next/link";
import LessonReadingPanel from "@/src/components/learn/LessonReadingPanel";
import MarkLessonCompleteButton from "@/src/components/learn/MarkLessonCompleteButton";
import LessonQuizModule from "@/src/components/learn/LessonQuizModule";

type LessonNavItem = {
  slug: string;
  title: string;
};

type LessonViewerLayoutProps = {
  subjectSlug: string;
  classSlug: string;
  lessonSlug: string;
  lesson: {
    title: string;
    description: string;
    content: string;
    pdfUrl: string;
    thumbnail: string;
  };
  completionState?: {
    completed: boolean;
    completedAt?: string | null;
  };
  previousLesson: LessonNavItem | null;
  nextLesson: LessonNavItem | null;
};

export default function LessonViewerLayout({
  subjectSlug,
  classSlug,
  lessonSlug,
  lesson,
  completionState,
  previousLesson,
  nextLesson,
}: LessonViewerLayoutProps) {
  const basePath = `/lms/${subjectSlug}/${classSlug}`;
  const inlinePdfUrl = `/api/pdf-view?url=${encodeURIComponent(lesson.pdfUrl)}`;
  const downloadPdfUrl = `/api/pdf-view?download=1&url=${encodeURIComponent(lesson.pdfUrl)}`;
  const newTabPdfViewerUrl = `/pdf/view?url=${encodeURIComponent(lesson.pdfUrl)}&title=${encodeURIComponent(lesson.title)}`;

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-10 text-white sm:px-6 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <Link href={basePath} className="text-sm text-cyan-300 transition hover:text-cyan-200">
          Back to lessons
        </Link>

        <div className="mt-5 grid gap-6 lg:grid-cols-[1fr_320px]">
          <section className="overflow-hidden rounded-3xl border border-white/10 bg-slate-900/85 shadow-[0_16px_60px_rgba(2,6,23,0.45)]">
            {lesson.thumbnail ? (
              <div className="relative h-44 w-full overflow-hidden border-b border-white/10 sm:h-56">
                <img src={lesson.thumbnail} alt={lesson.title} className="h-full w-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/10 to-transparent" />
              </div>
            ) : null}

            <div className="p-4 sm:p-6 lg:p-8">
              <header>
                <h1 className="text-2xl font-bold leading-tight text-white sm:text-3xl">{lesson.title}</h1>
                <p className="mt-3 text-sm leading-relaxed text-slate-300 sm:text-base">{lesson.description}</p>
              </header>

              <div className="mt-6 flex flex-wrap items-center gap-3">
                {lesson.pdfUrl && (
                  <>
                    <a
                      href={downloadPdfUrl}
                      download
                      className="inline-flex items-center justify-center rounded-xl bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300"
                    >
                      Download PDF
                    </a>
                    <a
                      href={newTabPdfViewerUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center justify-center rounded-xl border border-white/20 px-4 py-2 text-sm text-slate-200 transition hover:bg-white/10"
                    >
                      Open in new tab
                    </a>
                  </>
                )}

                <MarkLessonCompleteButton
                  subjectSlug={subjectSlug}
                  classSlug={classSlug}
                  lessonSlug={lessonSlug}
                  initiallyCompleted={Boolean(completionState?.completed)}
                />
              </div>

              <LessonReadingPanel
                title={lesson.title}
                pdfUrl={lesson.pdfUrl}
                content={lesson.content}
              />

              <LessonQuizModule
                subjectSlug={subjectSlug}
                classSlug={classSlug}
                lessonSlug={lessonSlug}
              />

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {previousLesson ? (
                  <Link
                    href={`${basePath}/${previousLesson.slug}`}
                    className="rounded-xl border border-white/15 bg-slate-800/60 px-4 py-3 text-sm text-slate-200 transition hover:bg-slate-800"
                  >
                    <span className="block text-xs uppercase tracking-[0.16em] text-slate-400">Previous lesson</span>
                    <span className="mt-1 block font-medium">{previousLesson.title}</span>
                  </Link>
                ) : (
                  <div className="rounded-xl border border-white/10 bg-slate-900/70 px-4 py-3 text-sm text-slate-500">
                    <span className="block text-xs uppercase tracking-[0.16em] text-slate-600">Previous lesson</span>
                    <span className="mt-1 block">No previous lesson</span>
                  </div>
                )}

                {nextLesson ? (
                  <Link
                    href={`${basePath}/${nextLesson.slug}`}
                    className="rounded-xl border border-cyan-300/30 bg-cyan-400/15 px-4 py-3 text-sm text-cyan-100 transition hover:bg-cyan-400/25"
                  >
                    <span className="block text-xs uppercase tracking-[0.16em] text-cyan-200/80">Next lesson</span>
                    <span className="mt-1 block font-medium">{nextLesson.title}</span>
                  </Link>
                ) : (
                  <div className="rounded-xl border border-white/10 bg-slate-900/70 px-4 py-3 text-sm text-slate-500">
                    <span className="block text-xs uppercase tracking-[0.16em] text-slate-600">Next lesson</span>
                    <span className="mt-1 block">No next lesson</span>
                  </div>
                )}
              </div>
            </div>
          </section>

          <aside className="rounded-3xl border border-white/10 bg-slate-900/80 p-5 shadow-[0_16px_60px_rgba(2,6,23,0.35)] lg:sticky lg:top-6 lg:self-start">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-cyan-200/80">Progress</p>
            <h2 className="mt-2 text-lg font-semibold text-white">Learning Tracker</h2>
            <p className="mt-2 text-sm text-slate-300">
              Progress-ready panel for completion checkpoints, quiz unlocks, and streak badges.
            </p>

            <div className="mt-5 rounded-xl border border-white/10 bg-slate-950/60 p-4">
              <div className="flex items-center justify-between text-xs text-slate-300">
                <span>Lesson progress</span>
                <span>0%</span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
                <div className="h-full w-0 bg-cyan-400" />
              </div>
              <ul className="mt-4 space-y-2 text-xs text-slate-400">
                <li className="rounded-lg border border-white/10 bg-slate-900/70 px-3 py-2">Read lesson overview</li>
                <li className="rounded-lg border border-white/10 bg-slate-900/70 px-3 py-2">Review embedded PDF</li>
                <li className="rounded-lg border border-white/10 bg-slate-900/70 px-3 py-2">Attempt practice quiz</li>
              </ul>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
