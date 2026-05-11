"use client";

import { useState, useCallback } from "react";
import { markLessonComplete } from "@/lib/progress-utils";

interface LessonProgressTrackerProps {
  lessonSlug: string;
  lessonTitle: string;
  subjectSlug: string;
  classSlug: string;
  isCompleted: boolean;
  onComplete?: () => void;
}

export function LessonProgressTracker({
  lessonSlug,
  lessonTitle,
  subjectSlug,
  classSlug,
  isCompleted,
  onComplete,
}: LessonProgressTrackerProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [completed, setCompleted] = useState(isCompleted);

  const handleMarkComplete = useCallback(async () => {
    if (completed) return; // Already completed

    try {
      setLoading(true);
      setError(null);

      const result = await markLessonComplete(
        subjectSlug,
        classSlug,
        lessonSlug
      );

      if (result.success) {
        setCompleted(true);
        onComplete?.();
      } else {
        setError(result.error || "Failed to mark lesson complete");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [lessonSlug, subjectSlug, classSlug, completed, onComplete]);

  return (
    <div className="flex flex-col gap-3">
      {/* Completion Status Badge */}
      <div
        className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg border w-fit ${
          completed
            ? "border-green-500/30 bg-green-500/10"
            : "border-slate-700/50 bg-slate-800/30"
        }`}
      >
        {completed ? (
          <>
            <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
              <svg
                className="w-3 h-3 text-white"
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
            <span className="text-sm font-medium text-green-400">Completed</span>
          </>
        ) : (
          <>
            <div className="w-5 h-5 rounded-full border-2 border-slate-600" />
            <span className="text-sm font-medium text-slate-400">Not Completed</span>
          </>
        )}
      </div>

      {/* Mark Complete Button */}
      {!completed && (
        <button
          onClick={handleMarkComplete}
          disabled={loading}
          className="px-6 py-3 rounded-lg bg-gradient-to-r from-cyan-500 to-cyan-400 text-white font-medium text-sm hover:from-cyan-600 hover:to-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <svg
                className="w-4 h-4 animate-spin"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              Marking...
            </span>
          ) : (
            "Mark Lesson Complete"
          )}
        </button>
      )}

      {/* Error Message */}
      {error && (
        <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-3">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {/* Completion Info */}
      {completed && (
        <div className="text-xs text-slate-400 bg-slate-800/30 rounded-lg border border-slate-700/30 p-3">
          <p>✓ Great job! You've completed this lesson.</p>
        </div>
      )}
    </div>
  );
}
