"use client";

import { useState } from "react";
import Link from "next/link";
import { useProgressDashboard } from "@/src/hooks/useProgress";
import type { SubjectProgress } from "@/lib/lms-progress-enhanced";

export function ProgressDashboard() {
  const { dashboard, loading, error } = useProgressDashboard();
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-cyan-400 border-t-transparent mb-4"></div>
          <p className="text-slate-400">Loading progress...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-4">
        <p className="text-sm text-red-400">Error: {error}</p>
      </div>
    );
  }

  if (!dashboard) {
    return null;
  }

  const selectedSubjectData = selectedSubject
    ? dashboard.subjects.find((s) => s.subjectSlug === selectedSubject)
    : null;

  return (
    <div className="space-y-8">
      {/* Overall Stats */}
      <div className="rounded-lg border border-slate-800 bg-slate-900 p-6">
        <h2 className="text-xl font-semibold text-white mb-6">Overall Progress</h2>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          {/* Completion Percentage */}
          <div className="rounded-lg bg-slate-800/50 p-4 border border-slate-700/50">
            <p className="text-sm text-slate-400 mb-2">Completion Rate</p>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-cyan-400">
                {dashboard.overallPercentage}%
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-2">
              {dashboard.totalCompletedLessons} of {dashboard.totalLessons} lessons
            </p>
          </div>

          {/* Streak */}
          <div className="rounded-lg bg-slate-800/50 p-4 border border-slate-700/50">
            <p className="text-sm text-slate-400 mb-2">Activity Streak</p>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-orange-400">
                {dashboard.streak}
              </span>
              <span className="text-sm text-slate-500">days</span>
            </div>
          </div>

          {/* Avg Completion Rate */}
          <div className="rounded-lg bg-slate-800/50 p-4 border border-slate-700/50">
            <p className="text-sm text-slate-400 mb-2">Avg. Speed</p>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-blue-400">
                {dashboard.stats.averageCompletionRate}%
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-2">
              {dashboard.stats.fasterThanAverage ? "Above average" : "Below average"}
            </p>
          </div>

          {/* Est. Completion */}
          <div className="rounded-lg bg-slate-800/50 p-4 border border-slate-700/50">
            <p className="text-sm text-slate-400 mb-2">Est. Completion</p>
            <p className="text-sm font-semibold text-green-400">
              {dashboard.stats.estimatedCompletion || "Completed"}
            </p>
            {dashboard.lastActivityAt && (
              <p className="text-xs text-slate-500 mt-2">
                Last active: {new Date(dashboard.lastActivityAt).toLocaleDateString()}
              </p>
            )}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-slate-400">Total Progress</span>
            <span className="text-slate-400">
              {dashboard.totalCompletedLessons} / {dashboard.totalLessons}
            </span>
          </div>
          <div className="h-3 rounded-full bg-slate-800/50 overflow-hidden border border-slate-700/50">
            <div
              className="h-full bg-gradient-to-r from-cyan-500 to-cyan-400 rounded-full transition-all duration-500"
              style={{
                width: `${dashboard.overallPercentage}%`,
              }}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Subjects List */}
        <div className="lg:col-span-1">
          <h3 className="text-lg font-semibold text-white mb-4">Subjects</h3>
          <div className="space-y-2">
            {dashboard.subjects.map((subject) => (
              <button
                key={subject.subjectSlug}
                onClick={() => setSelectedSubject(subject.subjectSlug)}
                className={`w-full text-left rounded-lg border p-4 transition-all ${
                  selectedSubject === subject.subjectSlug
                    ? "border-cyan-500/50 bg-cyan-500/10"
                    : "border-slate-700/50 bg-slate-800/30 hover:border-slate-600/50"
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h4 className="font-medium text-white">{subject.subjectName}</h4>
                  <span className="text-sm font-bold text-cyan-400">
                    {subject.percentage}%
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  {subject.completedLessons} / {subject.totalLessons}
                </p>
                <div className="mt-2 h-1.5 rounded-full bg-slate-800/50 overflow-hidden">
                  <div
                    className="h-full bg-cyan-500 transition-all duration-300"
                    style={{ width: `${subject.percentage}%` }}
                  />
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Subject Details */}
        <div className="lg:col-span-2">
          {selectedSubjectData ? (
            <SubjectDetailCard subject={selectedSubjectData} />
          ) : (
            <div className="rounded-lg border border-slate-700/50 bg-slate-800/20 p-8 text-center">
              <p className="text-slate-400">Select a subject to view details</p>
            </div>
          )}
        </div>
      </div>

      {/* Recent Activity */}
      {dashboard.recentActivity.length > 0 && (
        <div className="rounded-lg border border-slate-800 bg-slate-900 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Recent Activity</h3>
          <div className="space-y-2">
            {dashboard.recentActivity.slice(0, 5).map((activity, i) => (
              <div
                key={i}
                className="flex items-center justify-between rounded-lg border border-slate-700/30 bg-slate-800/20 px-4 py-3"
              >
                <span className="text-sm text-white">{activity.lessonTitle}</span>
                <span className="text-xs text-slate-500">
                  {new Date(activity.completedAt).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Subject Detail Card Component
// ============================================================================

function SubjectDetailCard({ subject }: { subject: SubjectProgress }) {
  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-slate-800 bg-slate-900 p-6">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-white">{subject.subjectName}</h3>
            <p className="text-sm text-slate-400 mt-1">
              {subject.completedLessons} of {subject.totalLessons} lessons completed
            </p>
          </div>
          <div className="text-3xl font-bold text-cyan-400">{subject.percentage}%</div>
        </div>

        <div className="space-y-2 mb-6">
          <div className="flex justify-between text-sm">
            <span className="text-slate-400">Progress</span>
            <span className="text-slate-400">
              {subject.completedLessons} / {subject.totalLessons}
            </span>
          </div>
          <div className="h-3 rounded-full bg-slate-800/50 overflow-hidden border border-slate-700/50">
            <div
              className="h-full bg-gradient-to-r from-cyan-500 to-cyan-400 rounded-full transition-all duration-500"
              style={{ width: `${subject.percentage}%` }}
            />
          </div>
        </div>

        {subject.lastActivityAt && (
          <p className="text-xs text-slate-500">
            Last activity: {new Date(subject.lastActivityAt).toLocaleDateString()}
          </p>
        )}
      </div>

      {/* Classes in Subject */}
      <div>
        <h4 className="text-sm font-semibold text-white mb-3">Classes</h4>
        <div className="space-y-2">
          {subject.classes.map((cls) => (
            <Link
              key={cls.classSlug}
              href={`/learn/${subject.subjectSlug}/${cls.classSlug}`}
              className="block rounded-lg border border-slate-700/50 bg-slate-800/30 p-4 hover:border-cyan-500/50 hover:bg-slate-800/50 transition-all"
            >
              <div className="flex items-center justify-between mb-2">
                <h5 className="font-medium text-white">{cls.className}</h5>
                <span className="text-sm font-bold text-cyan-400">
                  {cls.percentage}%
                </span>
              </div>
              <div className="h-1.5 rounded-full bg-slate-700/50 overflow-hidden">
                <div
                  className="h-full bg-cyan-500 transition-all duration-300"
                  style={{ width: `${cls.percentage}%` }}
                />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
