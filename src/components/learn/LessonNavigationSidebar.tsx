"use client";

import Link from "next/link";
import { useMemo } from "react";

type Lesson = {
  slug: string;
  title: string;
  completed?: boolean;
  progress?: number;
};

type Chapter = {
  name: string;
  lessons: Lesson[];
};

type LessonNavigationSidebarProps = {
  chapters: Chapter[];
  currentChapterName: string;
  currentLessonSlug: string;
  basePath: string;
  classSlug: string;
  subjectSlug: string;
};

export default function LessonNavigationSidebar({
  chapters,
  currentChapterName,
  currentLessonSlug,
  basePath,
  classSlug,
  subjectSlug,
}: LessonNavigationSidebarProps) {
  const stats = useMemo(() => {
    const totalLessons = chapters.reduce((sum, ch) => sum + ch.lessons.length, 0);
    const completedLessons = chapters.reduce(
      (sum, ch) => sum + ch.lessons.filter((l) => l.completed).length,
      0
    );
    const overallProgress = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

    return { totalLessons, completedLessons, overallProgress };
  }, [chapters]);

  const currentChapter = chapters.find((ch) => ch.name === currentChapterName);

  return (
    <aside className="sticky top-6 h-fit space-y-4">
      {/* Overall Progress Card */}
      <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-4 shadow-[0_8px_32px_rgba(2,6,23,0.3)]">
        <div className="space-y-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-cyan-200/70">Course Progress</p>
            <h3 className="mt-1 text-lg font-bold text-white">{stats.overallProgress}%</h3>
            <p className="text-xs text-slate-400">
              {stats.completedLessons} of {stats.totalLessons} lessons
            </p>
          </div>

          <div className="h-2 overflow-hidden rounded-full bg-slate-800">
            <div
              className="h-full bg-gradient-to-r from-cyan-400 to-blue-500 transition-all duration-500"
              style={{ width: `${stats.overallProgress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Chapters and Lessons */}
      <div className="space-y-2 rounded-2xl border border-white/10 bg-slate-900/60 p-3 shadow-[0_8px_32px_rgba(2,6,23,0.2)]">
        <p className="px-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Chapters</p>

        <nav className="space-y-1">
          {chapters.map((chapter) => {
            const isCurrentChapter = chapter.name === currentChapterName;
            const chapterLessons = chapter.lessons;
            const completedInChapter = chapterLessons.filter((l) => l.completed).length;
            const chapterProgress = Math.round((completedInChapter / chapterLessons.length) * 100);

            return (
              <div key={chapter.name}>
                {/* Chapter Header */}
                <div
                  className={`rounded-lg px-3 py-2 transition ${
                    isCurrentChapter
                      ? "bg-cyan-400/20 text-cyan-100"
                      : "text-slate-300 hover:bg-white/5"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">{chapter.name}</p>
                      <p className="text-xs text-slate-400">
                        {completedInChapter}/{chapterLessons.length}
                      </p>
                    </div>
                    <div className="h-1.5 w-12 overflow-hidden rounded-full bg-slate-800">
                      <div
                        className="h-full bg-cyan-400 transition-all"
                        style={{ width: `${chapterProgress}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Lessons in Chapter */}
                {isCurrentChapter && (
                  <div className="mt-1 space-y-0.5 border-l-2 border-cyan-400/30 py-1 pl-3">
                    {chapterLessons.map((lesson) => {
                      const isCurrentLesson = lesson.slug === currentLessonSlug;

                      return (
                        <Link
                          key={lesson.slug}
                          href={`${basePath}/${lesson.slug}`}
                          className={`block rounded-lg px-3 py-2 text-sm transition ${
                            isCurrentLesson
                              ? "bg-cyan-400/25 font-semibold text-cyan-100 ring-1 ring-cyan-400/50"
                              : "text-slate-400 hover:bg-white/10 hover:text-slate-200"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            {lesson.completed && (
                              <span className="flex-shrink-0 text-cyan-400">✓</span>
                            )}
                            <span className="truncate">{lesson.title}</span>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </div>

      {/* Quick Stats */}
      <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-3 text-xs text-slate-400">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span>Lessons completed:</span>
            <span className="font-semibold text-white">{stats.completedLessons}</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Remaining:</span>
            <span className="font-semibold text-white">{stats.totalLessons - stats.completedLessons}</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
