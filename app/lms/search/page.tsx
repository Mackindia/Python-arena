import { Suspense } from "react";
import type { Metadata } from "next";
import { LessonSearchPageClient } from "@/src/components/learn/LessonSearchPageClient";

// ─── Metadata ───────────────────────────────────────────────────────────────

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}): Promise<Metadata> {
  const sp = await searchParams;
  const q = (sp.q ?? "").trim();

  return {
    title: q ? `Search: "${q}" · Python Arena` : "Search Lessons · Python Arena",
    description: "Search across Python Arena lessons by title, subject, class, or lesson content.",
  };
}

// ─── Page ───────────────────────────────────────────────────────────────────

export default async function LmsSearchPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  const sp = await searchParams;

  const initialQuery   = (sp.q       ?? "").slice(0, 200);
  const initialSubject = (sp.subject ?? "").slice(0, 120);
  const initialClass   = (sp.class   ?? "").slice(0, 120);
  const initialPage    = Math.max(1, parseInt(sp.page ?? "1", 10) || 1);

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-400/80">
            Lesson Search
          </p>
          <h1 className="mt-1 text-3xl font-bold text-white sm:text-4xl">
            Find Any Lesson
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-400 sm:text-base">
            Search by title, subject, class, or lesson content — including extracted PDF text.
          </p>
        </div>

        {/* Search UI — wrapped in Suspense for useSearchParams */}
        <Suspense fallback={<SearchFallback />}>
          <LessonSearchPageClient
            initialQuery={initialQuery}
            initialSubject={initialSubject}
            initialClass={initialClass}
            initialPage={initialPage}
          />
        </Suspense>
      </div>
    </main>
  );
}

// ─── Fallback ───────────────────────────────────────────────────────────────

function SearchFallback() {
  return (
    <div className="space-y-8">
      {/* Input skeleton */}
      <div className="h-12 w-full animate-pulse rounded-xl bg-slate-800/70" />
      {/* Filter row skeleton */}
      <div className="flex gap-3">
        <div className="h-9 w-36 animate-pulse rounded-lg bg-slate-800/70" />
        <div className="h-9 w-36 animate-pulse rounded-lg bg-slate-800/70" />
      </div>
      {/* Card grid skeleton */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="overflow-hidden rounded-2xl border border-white/10 bg-slate-900/60 animate-pulse">
            <div className="h-28 bg-slate-800/70" />
            <div className="space-y-2.5 p-4">
              <div className="h-5 w-1/2 rounded bg-slate-700/60" />
              <div className="h-4 w-3/4 rounded bg-slate-700/50" />
              <div className="h-3 w-full rounded bg-slate-700/40" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
