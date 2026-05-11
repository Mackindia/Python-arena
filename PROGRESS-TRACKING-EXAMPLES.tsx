/**
 * Progress Tracking System - Practical Examples
 * 
 * This file demonstrates common patterns and use cases for the lesson
 * progress tracking system across the LMS application.
 */

// ============================================================================
// Example 1: Dashboard Page with Full Progress Overview
// ============================================================================

import { ProgressDashboard } from "@/src/components/learn/ProgressDashboard";

export function Example1_DashboardPage() {
  return (
    <main className="container py-8 px-4">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-white mb-2">Learning Dashboard</h1>
        <p className="text-slate-400">Track your progress across all subjects and classes</p>
      </div>

      <ProgressDashboard />
    </main>
  );
}

// ============================================================================
// Example 2: Lesson Viewer with Progress Tracking
// ============================================================================

"use client";

import { useState } from "react";
import { PDFViewer } from "@/src/components/learn/PDFViewer";
import { LessonProgressTracker } from "@/src/components/learn/LessonProgressTracker";
import { LessonNavigationSidebar } from "@/src/components/learn/LessonNavigationSidebar";

interface LessonViewerExampleProps {
  lessonSlug: string;
  subjectSlug: string;
  classSlug: string;
  pdfUrl: string;
  title: string;
  chapters: Array<{
    name: string;
    lessons: Array<{ slug: string; title: string }>;
  }>;
}

export function Example2_LessonViewer({
  lessonSlug,
  subjectSlug,
  classSlug,
  pdfUrl,
  title,
  chapters,
}: LessonViewerExampleProps) {
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 py-6">
      {/* Navigation Sidebar */}
      <aside className="lg:col-span-1">
        <LessonNavigationSidebar
          chapters={chapters}
          currentChapterName="Physics"
          currentLessonSlug={lessonSlug}
          basePath={`/learn/${subjectSlug}/${classSlug}`}
          classSlug={classSlug}
          subjectSlug={subjectSlug}
        />
      </aside>

      {/* Main Content */}
      <main className="lg:col-span-3 space-y-6">
        {/* PDF Viewer */}
        <div className="rounded-lg border border-slate-800 bg-slate-900 p-6">
          <PDFViewer pdfUrl={pdfUrl} title={title} height="70vh" />
        </div>

        {/* Progress Tracker */}
        <div className="rounded-lg border border-slate-800 bg-slate-900 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Lesson Progress</h3>
          <LessonProgressTracker
            key={refreshKey}
            lessonSlug={lessonSlug}
            lessonTitle={title}
            subjectSlug={subjectSlug}
            classSlug={classSlug}
            isCompleted={false}
            onComplete={() => {
              setRefreshKey((prev) => prev + 1);
            }}
          />
        </div>
      </main>
    </div>
  );
}

// ============================================================================
// Example 3: Class Overview with Progress List
// ============================================================================

"use client";

import Link from "next/link";
import { useClassProgress } from "@/src/hooks/useProgress";
import { formatProgressPercentage, getProgressColor } from "@/lib/progress-utils";

interface ClassOverviewProps {
  classSlug: string;
  subjectSlug: string;
}

export function Example3_ClassOverview({
  classSlug,
  subjectSlug,
}: ClassOverviewProps) {
  const { progress, loading, error } = useClassProgress(classSlug);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <p className="text-slate-400">Loading class progress...</p>
      </div>
    );
  }

  if (error || !progress) {
    return (
      <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-4">
        <p className="text-sm text-red-400">{error || "Failed to load progress"}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overall Class Stats */}
      <div className="rounded-lg border border-slate-800 bg-slate-900 p-6">
        <h1 className="text-3xl font-bold text-white mb-2">{progress.className}</h1>
        <p className="text-slate-400 mb-6">{progress.subjectSlug}</p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div>
            <p className="text-sm text-slate-400 mb-1">Completion</p>
            <p className="text-3xl font-bold text-cyan-400">{progress.percentage}%</p>
          </div>
          <div>
            <p className="text-sm text-slate-400 mb-1">Completed</p>
            <p className="text-3xl font-bold text-green-400">{progress.completedLessons}</p>
          </div>
          <div>
            <p className="text-sm text-slate-400 mb-1">Total Lessons</p>
            <p className="text-3xl font-bold text-white">{progress.totalLessons}</p>
          </div>
          <div>
            <p className="text-sm text-slate-400 mb-1">Remaining</p>
            <p className="text-3xl font-bold text-orange-400">
              {progress.totalLessons - progress.completedLessons}
            </p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="h-4 rounded-full bg-slate-800 overflow-hidden border border-slate-700/50">
            <div
              className="h-full bg-gradient-to-r from-cyan-500 to-cyan-400 transition-all duration-500"
              style={{ width: `${progress.percentage}%` }}
            />
          </div>
          <p className="text-xs text-slate-400">
            {progress.completedLessons} / {progress.totalLessons} lessons completed
          </p>
        </div>
      </div>

      {/* Lessons List */}
      <div className="rounded-lg border border-slate-800 bg-slate-900 p-6">
        <h2 className="text-xl font-semibold text-white mb-4">All Lessons</h2>

        <div className="space-y-2">
          {progress.lessons.map((lesson) => (
            <Link
              key={lesson.lessonId}
              href={`/learn/${subjectSlug}/${classSlug}/${lesson.lessonSlug}`}
              className={`block rounded-lg border px-4 py-3 transition-all ${
                lesson.completed
                  ? "border-green-500/30 bg-green-500/5 hover:bg-green-500/10"
                  : "border-slate-700/50 bg-slate-800/30 hover:bg-slate-800/50"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-white font-medium">{lesson.lessonTitle}</p>
                  {lesson.completedAt && (
                    <p className="text-xs text-slate-400 mt-1">
                      Completed: {new Date(lesson.completedAt).toLocaleDateString()}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <span
                    className={`text-sm font-bold ${
                      lesson.completed
                        ? "text-green-400"
                        : "text-slate-400"
                    }`}
                  >
                    {lesson.progress}%
                  </span>

                  {lesson.completed && (
                    <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                      <svg
                        className="w-4 h-4 text-white"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Example 4: Subject Progress with Class Breakdown
// ============================================================================

"use client";

import Link from "next/link";
import { useSubjectProgress } from "@/src/hooks/useProgress";

interface SubjectProgressProps {
  subjectSlug: string;
}

export function Example4_SubjectProgress({ subjectSlug }: SubjectProgressProps) {
  const { progress, loading } = useSubjectProgress(subjectSlug);

  if (loading) {
    return <div className="text-slate-400">Loading...</div>;
  }

  if (!progress) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Subject Header */}
      <div className="rounded-lg border border-slate-800 bg-slate-900 p-6">
        <h1 className="text-3xl font-bold text-white mb-2">{progress.subjectName}</h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <div>
            <p className="text-sm text-slate-400 mb-2">Overall Progress</p>
            <p className="text-4xl font-bold text-cyan-400">{progress.percentage}%</p>
            <p className="text-xs text-slate-500 mt-1">
              {progress.completedLessons} / {progress.totalLessons}
            </p>
          </div>

          <div>
            <p className="text-sm text-slate-400 mb-2">Classes</p>
            <p className="text-4xl font-bold text-blue-400">{progress.classes.length}</p>
          </div>

          {progress.lastActivityAt && (
            <div>
              <p className="text-sm text-slate-400 mb-2">Last Active</p>
              <p className="text-sm text-white">
                {new Date(progress.lastActivityAt).toLocaleDateString()}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Classes Grid */}
      <div>
        <h2 className="text-xl font-semibold text-white mb-4">Classes in {progress.subjectName}</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {progress.classes.map((cls) => (
            <Link
              key={cls.classSlug}
              href={`/learn/${subjectSlug}/${cls.classSlug}`}
              className="group rounded-lg border border-slate-700/50 bg-slate-800/30 p-6 hover:border-cyan-500/50 hover:bg-slate-800/50 transition-all"
            >
              <h3 className="text-lg font-semibold text-white mb-4 group-hover:text-cyan-400 transition-colors">
                {cls.className}
              </h3>

              <div className="space-y-3">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm text-slate-400">Progress</span>
                    <span className="text-sm font-bold text-cyan-400">
                      {cls.percentage}%
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-700 overflow-hidden">
                    <div
                      className="h-full bg-cyan-500 transition-all duration-300"
                      style={{ width: `${cls.percentage}%` }}
                    />
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Example 5: Analytics & Activity View
// ============================================================================

"use client";

import { useProgressAnalytics } from "@/src/hooks/useProgress";
import {
  calculateDailyAverageRate,
  getLongestStreak,
  getLastNDaysActivity,
} from "@/lib/progress-utils";

export function Example5_AnalyticsView() {
  const { analytics, loading } = useProgressAnalytics();

  if (loading || !analytics) {
    return <div className="text-slate-400">Loading analytics...</div>;
  }

  const dailyAverage = calculateDailyAverageRate(analytics.activityByDate);
  const streak = getLongestStreak(analytics.activityByDate);
  const last7Days = getLastNDaysActivity(analytics.activityByDate, 7);

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-lg border border-slate-800 bg-slate-900 p-6">
          <p className="text-sm text-slate-400 mb-2">Completion Rate</p>
          <p className="text-3xl font-bold text-cyan-400">
            {analytics.completionRatePercent}%
          </p>
        </div>

        <div className="rounded-lg border border-slate-800 bg-slate-900 p-6">
          <p className="text-sm text-slate-400 mb-2">Lessons/Week</p>
          <p className="text-3xl font-bold text-blue-400">
            {analytics.lessonsPerWeek}
          </p>
        </div>

        <div className="rounded-lg border border-slate-800 bg-slate-900 p-6">
          <p className="text-sm text-slate-400 mb-2">Daily Average</p>
          <p className="text-3xl font-bold text-green-400">
            {dailyAverage.toFixed(1)}
          </p>
        </div>

        <div className="rounded-lg border border-slate-800 bg-slate-900 p-6">
          <p className="text-sm text-slate-400 mb-2">Longest Streak</p>
          <p className="text-3xl font-bold text-orange-400">{streak} days</p>
        </div>
      </div>

      {/* Activity Chart */}
      <div className="rounded-lg border border-slate-800 bg-slate-900 p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Last 7 Days Activity</h3>

        <div className="space-y-3">
          {Object.entries(last7Days).map(([date, count]) => (
            <div key={date}>
              <div className="flex justify-between mb-1">
                <span className="text-sm text-slate-400">
                  {new Date(date).toLocaleDateString([], {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                  })}
                </span>
                <span className="text-sm font-bold text-cyan-400">{count} lessons</span>
              </div>
              <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-cyan-500 transition-all"
                  style={{ width: `${(count / Math.max(...Object.values(last7Days))) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Activity Details */}
      <div className="rounded-lg border border-slate-800 bg-slate-900 p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Summary</h3>

        <div className="space-y-3 text-sm text-slate-300">
          <p>
            ✓ You've completed <span className="font-bold text-cyan-400">{analytics.totalCompleted}</span> lessons
          </p>
          <p>
            ✓ You're viewing lessons at an average of{" "}
            <span className="font-bold text-blue-400">{dailyAverage.toFixed(1)}</span> per day
          </p>
          <p>
            ✓ Your longest streak is{" "}
            <span className="font-bold text-orange-400">{streak} days</span>
          </p>
          <p>
            ✓ Your completion rate is{" "}
            <span className="font-bold text-green-400">{analytics.completionRatePercent}%</span>
          </p>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Example 6: Quick Stats Widget for Sidebar
// ============================================================================

"use client";

import { useProgressDashboard } from "@/src/hooks/useProgress";

export function Example6_StatsWidget() {
  const { dashboard, loading } = useProgressDashboard();

  if (loading) {
    return (
      <div className="h-24 rounded-lg border border-slate-700/50 bg-slate-800/30 animate-pulse" />
    );
  }

  if (!dashboard) {
    return null;
  }

  return (
    <div className="rounded-lg border border-slate-800 bg-slate-900 p-4 space-y-3">
      <h3 className="text-sm font-semibold text-white">Your Progress</h3>

      <div>
        <div className="flex justify-between text-xs mb-1">
          <span className="text-slate-400">Overall</span>
          <span className="text-cyan-400 font-bold">{dashboard.overallPercentage}%</span>
        </div>
        <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden">
          <div
            className="h-full bg-cyan-500 transition-all duration-300"
            style={{ width: `${dashboard.overallPercentage}%` }}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-700/30">
        <div>
          <p className="text-xs text-slate-400">Completed</p>
          <p className="text-sm font-bold text-green-400">
            {dashboard.totalCompletedLessons}
          </p>
        </div>
        <div>
          <p className="text-xs text-slate-400">Streak</p>
          <p className="text-sm font-bold text-orange-400">
            {dashboard.streak} days
          </p>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Example 7: Milestone Badge Component
// ============================================================================

"use client";

import { getMilestones } from "@/lib/progress-utils";

interface MilestoneProps {
  completedLessons: number;
  totalLessons: number;
}

export function Example7_MilestoneBadges({
  completedLessons,
  totalLessons,
}: MilestoneProps) {
  const milestones = getMilestones(completedLessons, totalLessons);

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-white">Milestones</h3>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
        {milestones.map((milestone) => (
          <div
            key={milestone.name}
            className={`rounded-lg border p-3 text-center transition-all ${
              milestone.achieved
                ? "border-yellow-500/30 bg-yellow-500/10"
                : "border-slate-700/30 bg-slate-800/20 opacity-50"
            }`}
          >
            <span className="text-xl">{milestone.emoji}</span>
            <p className="text-xs font-medium text-white mt-1">
              {milestone.name}
            </p>
            <p className="text-xs text-slate-400">
              {milestone.completionPercentage}%
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// Example 8: Learning Summary
// ============================================================================

"use client";

import { useProgressDashboard } from "@/src/hooks/useProgress";
import { getSuggestedNextSteps } from "@/lib/progress-utils";

export function Example8_LearningSummary() {
  const { dashboard } = useProgressDashboard();

  if (!dashboard) return null;

  const nextSteps = getSuggestedNextSteps(
    dashboard.overallPercentage,
    dashboard.lastActivityAt,
    dashboard.streak
  );

  return (
    <div className="rounded-lg border border-slate-800 bg-gradient-to-br from-slate-900 to-slate-800/50 p-6 space-y-4">
      <h2 className="text-xl font-bold text-white">Your Learning Summary</h2>

      <div className="space-y-3">
        <div className="flex items-start gap-3">
          <div className="text-2xl">📚</div>
          <div>
            <p className="text-white font-medium">
              {dashboard.totalCompletedLessons} Lessons Completed
            </p>
            <p className="text-sm text-slate-400">
              {dashboard.overallPercentage}% of {dashboard.totalLessons} lessons done
            </p>
          </div>
        </div>

        {dashboard.streak > 0 && (
          <div className="flex items-start gap-3">
            <div className="text-2xl">🔥</div>
            <div>
              <p className="text-white font-medium">{dashboard.streak}-Day Streak</p>
              <p className="text-sm text-slate-400">Keep up the momentum!</p>
            </div>
          </div>
        )}

        <div className="flex items-start gap-3">
          <div className="text-2xl">⏰</div>
          <div>
            <p className="text-white font-medium">
              Est. Completion: {dashboard.stats.estimatedCompletion || "Almost there"}
            </p>
            <p className="text-sm text-slate-400">
              Continue at your current pace
            </p>
          </div>
        </div>
      </div>

      {nextSteps.length > 0 && (
        <div className="pt-4 border-t border-slate-700/30">
          <p className="text-sm font-medium text-white mb-2">Next Steps</p>
          <ul className="space-y-1">
            {nextSteps.slice(0, 2).map((step, i) => (
              <li key={i} className="text-sm text-slate-300 flex items-start gap-2">
                <span className="text-cyan-400 flex-shrink-0">→</span>
                <span>{step}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
