"use client";

import { useMemo } from "react";

type Checkpoint = {
  id: string;
  title: string;
  completed: boolean;
  icon?: string;
};

type ProgressTrackerProps = {
  lessonTitle: string;
  completionPercentage?: number;
  checkpoints?: Checkpoint[];
  isLessonCompleted?: boolean;
};

export default function ProgressTracker({
  lessonTitle,
  completionPercentage = 0,
  checkpoints = [
    { id: "overview", title: "Read overview", completed: false },
    { id: "pdf", title: "Review PDF", completed: false },
    { id: "quiz", title: "Complete quiz", completed: false },
  ],
  isLessonCompleted = false,
}: ProgressTrackerProps) {
  const completedCheckpoints = useMemo(() => {
    return checkpoints.filter((cp) => cp.completed).length;
  }, [checkpoints]);

  const checkpointProgress = Math.round((completedCheckpoints / checkpoints.length) * 100);

  return (
    <div className="space-y-4 rounded-2xl border border-white/10 bg-slate-900/80 p-5 shadow-[0_8px_32px_rgba(2,6,23,0.3)]">
      {/* Header */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-cyan-200/70">Learning Progress</p>
        <h3 className="mt-2 text-lg font-bold text-white line-clamp-2">{lessonTitle}</h3>
      </div>

      {/* Overall Progress */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-slate-300">Lesson progress</span>
          <span className="text-sm font-semibold text-cyan-400">{completionPercentage}%</span>
        </div>
        <div className="h-2.5 overflow-hidden rounded-full bg-slate-800">
          <div
            className="h-full bg-gradient-to-r from-cyan-400 to-blue-500 transition-all duration-500"
            style={{ width: `${completionPercentage}%` }}
          />
        </div>
      </div>

      {/* Lesson Status Badge */}
      {isLessonCompleted && (
        <div className="rounded-lg border border-emerald-400/30 bg-emerald-400/10 px-3 py-2">
          <p className="flex items-center gap-2 text-sm font-semibold text-emerald-200">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-400/20">✓</span>
            Lesson completed!
          </p>
        </div>
      )}

      {/* Checkpoints */}
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Checkpoints</p>

        <div className="space-y-1.5">
          {checkpoints.map((checkpoint) => (
            <div
              key={checkpoint.id}
              className={`flex items-center gap-3 rounded-lg border px-3 py-2.5 text-sm transition ${
                checkpoint.completed
                  ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-100"
                  : "border-white/10 bg-slate-950/50 text-slate-400"
              }`}
            >
              <div
                className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded border ${
                  checkpoint.completed
                    ? "border-emerald-400 bg-emerald-400"
                    : "border-white/20 bg-slate-800"
                }`}
              >
                {checkpoint.completed && <span className="text-xs font-bold text-slate-950">✓</span>}
                {!checkpoint.completed && <span className="text-xs text-slate-600">•</span>}
              </div>
              <span className="flex-1 font-medium">{checkpoint.title}</span>
            </div>
          ))}
        </div>

        {/* Checkpoint Summary */}
        <div className="mt-3 rounded-lg bg-slate-950/40 px-3 py-2">
          <p className="text-xs text-slate-400">
            <span className="font-semibold text-white">{completedCheckpoints}</span> of{" "}
            <span className="font-semibold text-white">{checkpoints.length}</span> checkpoints completed
          </p>
        </div>
      </div>

      {/* Next Steps */}
      {!isLessonCompleted && completedCheckpoints < checkpoints.length && (
        <div className="rounded-lg border border-cyan-400/20 bg-cyan-400/5 px-3 py-2">
          <p className="text-xs text-cyan-200">
            Complete the remaining checkpoints to mark this lesson as done.
          </p>
        </div>
      )}
    </div>
  );
}
