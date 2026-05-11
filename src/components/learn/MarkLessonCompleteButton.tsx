"use client";

import { useState } from "react";

type MarkLessonCompleteButtonProps = {
  subjectSlug: string;
  classSlug: string;
  lessonSlug: string;
  initiallyCompleted?: boolean;
};

export default function MarkLessonCompleteButton({
  subjectSlug,
  classSlug,
  lessonSlug,
  initiallyCompleted = false,
}: MarkLessonCompleteButtonProps) {
  const [completed, setCompleted] = useState(initiallyCompleted);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleMarkComplete = async () => {
    if (completed || loading) {
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/lms/progress/complete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          subject: subjectSlug,
          class: classSlug,
          lesson: lessonSlug,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Failed to update progress");
        return;
      }

      setCompleted(true);
    } catch {
      setError("Failed to update progress");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={handleMarkComplete}
        disabled={loading || completed}
        className={[
          "inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold transition",
          completed
            ? "bg-emerald-400/30 text-emerald-100 cursor-default"
            : "bg-emerald-400 text-slate-950 hover:bg-emerald-300",
          loading ? "opacity-80" : "",
        ].join(" ")}
      >
        {completed ? "Completed" : loading ? "Saving..." : "Mark As Completed"}
      </button>

      {error ? <p className="text-xs text-rose-300">{error}</p> : null}
    </div>
  );
}
