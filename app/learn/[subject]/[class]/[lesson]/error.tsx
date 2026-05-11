"use client";

type LessonErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function LessonError({ error, reset }: LessonErrorProps) {
  return (
    <main className="min-h-screen bg-black px-4 py-14 text-white sm:px-6 lg:px-10">
      <div className="mx-auto max-w-2xl rounded-2xl border border-red-400/30 bg-slate-950 p-6">
        <h1 className="text-2xl font-bold text-red-300">Unable to load this lesson</h1>
        <p className="mt-3 text-sm text-slate-300">
          Lesson content or resources failed to load.
        </p>
        <p className="mt-3 text-xs text-slate-400">{error.message}</p>
        <button
          onClick={reset}
          className="mt-6 rounded-lg bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-cyan-300"
        >
          Try again
        </button>
      </div>
    </main>
  );
}
