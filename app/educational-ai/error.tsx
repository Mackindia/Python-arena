"use client";

import { useEffect } from "react";

export default function EducationalAIError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Educational AI error:", error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur-xl">
          <div className="text-5xl mb-4">🤖</div>
          <h2 className="text-xl font-bold mb-2">AI Tool Error</h2>
          <p className="text-slate-400 mb-6">
            Failed to load AI tool. Make sure the AI backend is running on port 8000.
          </p>
          <button
            onClick={reset}
            className="rounded-lg bg-gradient-to-r from-indigo-500 to-blue-500 px-6 py-2 text-sm font-semibold text-white shadow-md transition-all hover:from-indigo-600 hover:to-blue-600"
          >
            Retry
          </button>
        </div>
      </div>
    </div>
  );
}
