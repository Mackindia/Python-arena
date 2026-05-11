/**
 * Lesson Navigation System - Practical Usage Examples
 * 
 * Real-world implementations of the lesson navigation components
 * and utilities for LMS lesson pages.
 */

// ============================================================================
// Example 1: Basic Lesson Page with All Navigation Components
// ============================================================================
// app/lms/[subject]/[class]/[lesson]/page.tsx

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import LessonNavigationSidebar from "@/src/components/learn/LessonNavigationSidebar";
import LessonNavigationFooter from "@/src/components/learn/LessonNavigationFooter";
import ProgressTracker from "@/src/components/learn/ProgressTracker";
import LessonBreadcrumb from "@/src/components/learn/LessonBreadcrumb";
import {
  calculateOverallProgress,
  findLessonPosition,
  createDefaultCheckpoints,
  generateBreadcrumbs,
  type Chapter,
  type Checkpoint,
} from "@/src/lib/lesson-navigation";

// Mock data - replace with actual API calls
const mockChapters: Chapter[] = [
  {
    name: "Fundamentals",
    lessons: [
      { slug: "intro-to-python", title: "Introduction to Python", completed: true },
      { slug: "variables-types", title: "Variables and Data Types", completed: true },
      { slug: "operators", title: "Operators and Expressions", completed: false },
    ],
  },
  {
    name: "Control Flow",
    lessons: [
      { slug: "if-statements", title: "If Statements", completed: false },
      { slug: "loops", title: "Loops", completed: false },
      { slug: "break-continue", title: "Break and Continue", completed: false },
    ],
  },
];

export default function LessonPage({ params }: { params: Promise<any> }) {
  const [chapters, setChapters] = useState<Chapter[]>(mockChapters);
  const [checkpoints, setCheckpoints] = useState<Checkpoint[]>([]);
  const [completionPercentage, setCompletionPercentage] = useState(0);

  useEffect(() => {
    async function loadData() {
      const { subject, class: classSlug, lesson } = await params;

      // Fetch real chapters from API
      // const chapters = await fetch(`/api/chapters?class=${classSlug}`).then(r => r.json());

      // Calculate navigation data
      const position = findLessonPosition(chapters, lesson);
      const progress = calculateOverallProgress(chapters);

      // Create checkpoints for this lesson
      const pts = createDefaultCheckpoints({ hasPdf: true, hasQuiz: true });
      setCheckpoints(pts);
      setCompletionPercentage(progress.percentage);
    }

    loadData();
  }, [params]);

  const position = findLessonPosition(chapters, "operators"); // Current lesson

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8">
      <div className="mx-auto max-w-7xl">
        {/* Breadcrumb */}
        <LessonBreadcrumb
          items={generateBreadcrumbs(
            "Python",
            "python",
            "Class XI",
            "class-xi",
            position.chapterName,
            "Operators and Expressions"
          )}
        />

        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          {/* Main Content */}
          <article className="space-y-6">
            <h1 className="text-4xl font-bold text-white">Operators and Expressions</h1>
            <p className="text-slate-300">
              Learn about Python operators and how to write expressions.
            </p>

            {/* Content sections... */}

            {/* Navigation Footer */}
            <LessonNavigationFooter
              previousLesson={position.previous}
              nextLesson={position.next}
              basePath="/lms/python/class-xi"
            />
          </article>

          {/* Sidebar */}
          <aside className="space-y-4">
            {/* Navigation Sidebar */}
            <LessonNavigationSidebar
              chapters={chapters}
              currentChapterName={position.chapterName}
              currentLessonSlug="operators"
              basePath="/lms/python/class-xi"
              classSlug="class-xi"
              subjectSlug="python"
            />

            {/* Progress Tracker */}
            <ProgressTracker
              lessonTitle="Operators and Expressions"
              completionPercentage={completionPercentage}
              checkpoints={checkpoints}
              isLessonCompleted={false}
            />
          </aside>
        </div>
      </div>
    </main>
  );
}


// ============================================================================
// Example 2: Lesson Navigation Sidebar in Modal/Drawer
// ============================================================================
// components/LessonNavigationDrawer.tsx

"use client";

import { useState } from "react";
import LessonNavigationSidebar from "@/src/components/learn/LessonNavigationSidebar";
import type { Chapter } from "@/src/lib/lesson-navigation";

export default function LessonNavigationDrawer({
  chapters,
  currentLesson,
  basePath,
}: {
  chapters: Chapter[];
  currentLesson: string;
  basePath: string;
}) {
  const [isOpen, setIsOpen] = useState(false);

  // Find current chapter
  const currentChapter = chapters.find((ch) =>
    ch.lessons.some((l) => l.slug === currentLesson)
  );

  return (
    <>
      {/* Mobile Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 lg:hidden z-40 rounded-full bg-cyan-400 p-3 text-slate-950 shadow-lg"
      >
        📋
      </button>

      {/* Drawer */}
      {isOpen && (
        <div className="fixed inset-0 z-30 lg:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setIsOpen(false)}
          />

          {/* Drawer Content */}
          <div className="absolute inset-y-0 right-0 w-80 bg-slate-950 shadow-2xl overflow-y-auto">
            <div className="p-4">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-bold text-white">Lessons</h2>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-slate-400 hover:text-white"
                >
                  ✕
                </button>
              </div>

              <LessonNavigationSidebar
                chapters={chapters}
                currentChapterName={currentChapter?.name || ""}
                currentLessonSlug={currentLesson}
                basePath={basePath}
                classSlug="class-xi"
                subjectSlug="python"
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}


// ============================================================================
// Example 3: Progress Tracker with Dynamic Checkpoints
// ============================================================================
// components/LessonProgressWithState.tsx

"use client";

import { useState, useCallback } from "react";
import ProgressTracker from "@/src/components/learn/ProgressTracker";
import {
  createDefaultCheckpoints,
  updateCheckpoint,
  calculateLessonCompletion,
  type Checkpoint,
} from "@/src/lib/lesson-navigation";

export default function LessonProgressWithState({
  lessonTitle,
  hasPdf = true,
  hasQuiz = true,
}) {
  const [checkpoints, setCheckpoints] = useState<Checkpoint[]>(() =>
    createDefaultCheckpoints({ hasPdf, hasQuiz })
  );

  const handleCheckpointChange = useCallback((checkpointId: string) => {
    setCheckpoints((prev) => {
      const current = prev.find((cp) => cp.id === checkpointId);
      return updateCheckpoint(
        prev,
        checkpointId,
        !current?.completed
      );
    });
  }, []);

  const completionPercentage = calculateLessonCompletion(checkpoints);
  const isComplete = completionPercentage === 100;

  return (
    <>
      <ProgressTracker
        lessonTitle={lessonTitle}
        completionPercentage={completionPercentage}
        checkpoints={checkpoints}
        isLessonCompleted={isComplete}
      />

      {/* Debug Controls */}
      <div className="mt-4 space-y-2 text-xs">
        {checkpoints.map((cp) => (
          <button
            key={cp.id}
            onClick={() => handleCheckpointChange(cp.id)}
            className="block w-full rounded bg-slate-800 px-3 py-1 text-left text-slate-300 hover:bg-slate-700"
          >
            Toggle: {cp.title}
          </button>
        ))}
      </div>
    </>
  );
}


// ============================================================================
// Example 4: Search and Filter Lessons
// ============================================================================
// components/LessonSearch.tsx

"use client";

import { useState, useMemo } from "react";
import {
  filterLessonsByQuery,
  type Chapter,
} from "@/src/lib/lesson-navigation";

export default function LessonSearch({ chapters }: { chapters: Chapter[] }) {
  const [query, setQuery] = useState("");

  const results = useMemo(
    () => filterLessonsByQuery(chapters, query),
    [chapters, query]
  );

  return (
    <div className="space-y-4">
      {/* Search Input */}
      <input
        type="text"
        placeholder="Search lessons..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="w-full rounded-lg border border-white/10 bg-slate-900 px-4 py-2 text-white placeholder-slate-500 focus:border-cyan-400 focus:outline-none"
      />

      {/* Results */}
      <div className="space-y-2">
        {results.length > 0 ? (
          results.map((lesson) => (
            <a
              key={lesson.slug}
              href={`/lms/lessons/${lesson.slug}`}
              className="block rounded-lg border border-white/10 bg-slate-900/50 p-3 text-slate-200 hover:bg-slate-900 hover:border-cyan-400"
            >
              <p className="font-semibold">{lesson.title}</p>
              <p className="text-xs text-slate-400">{lesson.chapterName}</p>
            </a>
          ))
        ) : query ? (
          <p className="text-center text-slate-500">No lessons found</p>
        ) : null}
      </div>
    </div>
  );
}


// ============================================================================
// Example 5: Chapter Overview with All Lessons
// ============================================================================
// components/ChapterOverview.tsx

"use client";

import Link from "next/link";
import {
  calculateChapterProgress,
  type Chapter,
} from "@/src/lib/lesson-navigation";

export default function ChapterOverview({
  chapters,
  classSlug,
  subjectSlug,
}: {
  chapters: Chapter[];
  classSlug: string;
  subjectSlug: string;
}) {
  return (
    <div className="space-y-4">
      {chapters.map((chapter) => {
        const progress = calculateChapterProgress(chapter);

        return (
          <div
            key={chapter.name}
            className="rounded-lg border border-white/10 bg-slate-900 p-4"
          >
            {/* Chapter Header */}
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-semibold text-white">{chapter.name}</h3>
              <span className="text-xs text-slate-400">
                {progress.completed}/{progress.total}
              </span>
            </div>

            {/* Progress Bar */}
            <div className="mb-3 h-2 overflow-hidden rounded-full bg-slate-800">
              <div
                className="h-full bg-cyan-400 transition-all"
                style={{ width: `${progress.percentage}%` }}
              />
            </div>

            {/* Lessons */}
            <div className="space-y-1">
              {chapter.lessons.map((lesson) => (
                <Link
                  key={lesson.slug}
                  href={`/lms/${subjectSlug}/${classSlug}/${lesson.slug}`}
                  className="flex items-center gap-2 rounded px-3 py-2 text-sm text-slate-300 hover:bg-slate-800"
                >
                  {lesson.completed && (
                    <span className="text-cyan-400">✓</span>
                  )}
                  {!lesson.completed && (
                    <span className="h-2 w-2 rounded-full bg-slate-600" />
                  )}
                  <span>{lesson.title}</span>
                </Link>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}


// ============================================================================
// Example 6: Breadcrumb with Custom Styling
// ============================================================================
// components/CustomBreadcrumb.tsx

"use client";

import LessonBreadcrumb from "@/src/components/learn/LessonBreadcrumb";
import { generateBreadcrumbs, type BreadcrumbItem } from "@/src/lib/lesson-navigation";

export default function CustomBreadcrumb({
  subject,
  subjectSlug,
  classItem,
  classSlug,
  chapterName,
  lessonTitle,
}) {
  const breadcrumbs = generateBreadcrumbs(
    subject,
    subjectSlug,
    classItem,
    classSlug,
    chapterName,
    lessonTitle
  );

  return (
    <nav className="mb-6 flex items-center gap-2 border-l-4 border-cyan-400 pl-4">
      <LessonBreadcrumb items={breadcrumbs} />
    </nav>
  );
}


// ============================================================================
// Example 7: Data Validation and Error Handling
// ============================================================================
// hooks/useLessonNavigation.ts

"use client";

import { useEffect, useState } from "react";
import {
  validateLessonNavigation,
  type Chapter,
} from "@/src/lib/lesson-navigation";

export function useLessonNavigation(chapters: Chapter[]) {
  const [isValid, setIsValid] = useState(true);
  const [errors, setErrors] = useState<string[]>([]);

  useEffect(() => {
    const validation = validateLessonNavigation(chapters);
    setIsValid(validation.valid);
    setErrors(validation.errors);

    if (!validation.valid) {
      console.error("Navigation data validation failed:", validation.errors);
    }
  }, [chapters]);

  return { isValid, errors };
}


// ============================================================================
// Example 8: Progress Statistics Dashboard
// ============================================================================
// components/ProgressDashboard.tsx

"use client";

import {
  calculateOverallProgress,
  groupLessonsByCompletion,
  type Chapter,
} from "@/src/lib/lesson-navigation";

export default function ProgressDashboard({ chapters }: { chapters: Chapter[] }) {
  const progress = calculateOverallProgress(chapters);
  const grouped = groupLessonsByCompletion(chapters);

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {/* Overall Progress */}
      <div className="rounded-lg border border-white/10 bg-slate-900 p-4">
        <p className="text-xs text-slate-400">Overall Progress</p>
        <p className="mt-1 text-3xl font-bold text-cyan-400">{progress.percentage}%</p>
        <p className="text-xs text-slate-500">{progress.completed} of {progress.total}</p>
      </div>

      {/* Completed */}
      <div className="rounded-lg border border-emerald-400/30 bg-emerald-400/10 p-4">
        <p className="text-xs text-emerald-200">Completed</p>
        <p className="mt-1 text-3xl font-bold text-emerald-400">{grouped.completed.length}</p>
      </div>

      {/* In Progress */}
      <div className="rounded-lg border border-yellow-400/30 bg-yellow-400/10 p-4">
        <p className="text-xs text-yellow-200">In Progress</p>
        <p className="mt-1 text-3xl font-bold text-yellow-400">{grouped.inProgress.length}</p>
      </div>
    </div>
  );
}
