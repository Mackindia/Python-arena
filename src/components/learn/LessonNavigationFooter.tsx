"use client";

import Link from "next/link";

type LessonNavItem = {
  slug: string;
  title: string;
};

type LessonNavigationFooterProps = {
  previousLesson: LessonNavItem | null;
  nextLesson: LessonNavItem | null;
  basePath: string;
};

export default function LessonNavigationFooter({
  previousLesson,
  nextLesson,
  basePath,
}: LessonNavigationFooterProps) {
  return (
    <nav className="mt-8 border-t border-white/10 pt-8">
      <div className="grid gap-4 sm:grid-cols-2">
        {/* Previous Lesson */}
        {previousLesson ? (
          <Link
            href={`${basePath}/${previousLesson.slug}`}
            className="group relative overflow-hidden rounded-2xl border border-white/15 bg-slate-800/50 px-6 py-4 transition hover:bg-slate-800 hover:border-white/25"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-white/5 to-transparent opacity-0 transition group-hover:opacity-100" />
            <div className="relative">
              <span className="block text-xs font-semibold uppercase tracking-[0.16em] text-slate-400 group-hover:text-slate-300">
                ← Previous lesson
              </span>
              <span className="mt-2 block text-base font-semibold text-white line-clamp-2 group-hover:text-slate-100">
                {previousLesson.title}
              </span>
            </div>
          </Link>
        ) : (
          <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-slate-900/50 px-6 py-4 text-slate-500">
            <span className="flex-shrink-0 text-lg">←</span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em]">Previous lesson</p>
              <p className="mt-1 text-sm">This is the first lesson</p>
            </div>
          </div>
        )}

        {/* Next Lesson */}
        {nextLesson ? (
          <Link
            href={`${basePath}/${nextLesson.slug}`}
            className="group relative overflow-hidden rounded-2xl border border-cyan-400/30 bg-cyan-400/10 px-6 py-4 transition hover:bg-cyan-400/15 hover:border-cyan-400/50"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-400/10 via-cyan-400/5 to-transparent opacity-0 transition group-hover:opacity-100" />
            <div className="relative">
              <span className="block text-xs font-semibold uppercase tracking-[0.16em] text-cyan-200/70 group-hover:text-cyan-100">
                Next lesson →
              </span>
              <span className="mt-2 block text-base font-semibold text-cyan-50 line-clamp-2 group-hover:text-white">
                {nextLesson.title}
              </span>
            </div>
          </Link>
        ) : (
          <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-slate-900/50 px-6 py-4 text-slate-500">
            <span className="flex-shrink-0 text-lg">→</span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em]">Next lesson</p>
              <p className="mt-1 text-sm">You've completed all lessons!</p>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
