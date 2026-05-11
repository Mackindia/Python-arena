"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useSearch, useFilterOptions, type LessonSearchItem } from "@/src/hooks/useSearch";
import { SearchFilters } from "@/src/components/learn/SearchFilters";

// ─── Helpers ───────────────────────────────────────────────────────────────

function truncate(text: string, max = 120): string {
  if (!text || text.length <= max) return text;
  return text.slice(0, max).trimEnd() + "…";
}

// ─── Skeleton loader ───────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-slate-900/60 animate-pulse">
      <div className="h-28 bg-slate-800/70" />
      <div className="space-y-2.5 p-4">
        <div className="flex gap-2">
          <div className="h-5 w-20 rounded-full bg-slate-700/60" />
          <div className="h-5 w-16 rounded-full bg-slate-700/60" />
        </div>
        <div className="h-4 w-3/4 rounded bg-slate-700/60" />
        <div className="h-3 w-full rounded bg-slate-700/40" />
        <div className="h-3 w-4/5 rounded bg-slate-700/40" />
      </div>
    </div>
  );
}

// ─── Result card ───────────────────────────────────────────────────────────

function LessonResultCard({ lesson }: { lesson: LessonSearchItem }) {
  return (
    <Link
      href={lesson.href}
      className="group flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-slate-900/60 shadow-md transition hover:border-cyan-400/40 hover:shadow-[0_8px_32px_rgba(6,182,212,0.08)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500"
    >
      {/* Thumbnail */}
      <div className="relative h-28 w-full shrink-0 overflow-hidden bg-slate-800">
        {lesson.thumbnail ? (
          <>
            <img
              src={lesson.thumbnail}
              alt={lesson.title}
              className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-slate-950/50" />
          </>
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-700/50 to-slate-800/80">
            <svg
              className="h-10 w-10 text-slate-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
              />
            </svg>
          </div>
        )}

        {/* PDF badge */}
        {lesson.pdfUrl && (
          <span className="absolute right-2 top-2 rounded-full bg-cyan-500/90 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-white shadow">
            PDF
          </span>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col gap-2 p-4">
        {/* Tags */}
        <div className="flex flex-wrap gap-1.5">
          <span className="rounded-full border border-white/10 bg-slate-800/60 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            {lesson.subject.name}
          </span>
          <span className="rounded-full border border-white/10 bg-slate-800/60 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            {lesson.class.name}
          </span>
        </div>

        {/* Title */}
        <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-white transition group-hover:text-cyan-300 sm:text-base">
          {lesson.title}
        </h3>

        {/* Description */}
        <p className="mt-auto text-xs leading-relaxed text-slate-400 sm:text-sm">
          {lesson.description ? truncate(lesson.description) : "No description available."}
        </p>
      </div>
    </Link>
  );
}

// ─── Pagination ────────────────────────────────────────────────────────────

function Pagination({
  page,
  total,
  limit,
  hasMore,
  onPageChange,
}: {
  page: number;
  total: number;
  limit: number;
  hasMore: boolean;
  onPageChange: (p: number) => void;
}) {
  const totalPages = Math.ceil(total / limit);
  if (totalPages <= 1) return null;

  return (
    <nav
      className="mt-8 flex items-center justify-center gap-2"
      aria-label="Search result pages"
    >
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
        className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-slate-800/60 text-slate-300 transition hover:border-cyan-500/40 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
        aria-label="Previous page"
      >
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      {Array.from({ length: totalPages }, (_, i) => i + 1)
        .filter((p) => Math.abs(p - page) <= 2 || p === 1 || p === totalPages)
        .reduce<(number | "…")[]>((acc, p, idx, arr) => {
          if (idx > 0 && (p as number) - (arr[idx - 1] as number) > 1) acc.push("…");
          acc.push(p);
          return acc;
        }, [])
        .map((p, i) =>
          p === "…" ? (
            <span key={`ellipsis-${i}`} className="px-1 text-slate-500">
              …
            </span>
          ) : (
            <button
              key={p}
              onClick={() => onPageChange(p as number)}
              aria-current={p === page ? "page" : undefined}
              className={`h-9 min-w-[36px] rounded-lg border px-2.5 text-sm font-medium transition ${
                p === page
                  ? "border-cyan-500/60 bg-cyan-500/15 text-cyan-300"
                  : "border-white/10 bg-slate-800/60 text-slate-300 hover:border-cyan-500/40 hover:text-white"
              }`}
            >
              {p}
            </button>
          )
        )}

      <button
        onClick={() => onPageChange(page + 1)}
        disabled={!hasMore}
        className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-slate-800/60 text-slate-300 transition hover:border-cyan-500/40 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
        aria-label="Next page"
      >
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </nav>
  );
}

// ─── Main component ─────────────────────────────────────────────────────────

type Props = {
  /** Initial values from URL searchParams (server-rendered) */
  initialQuery?: string;
  initialSubject?: string;
  initialClass?: string;
  initialPage?: number;
};

export function LessonSearchPageClient({
  initialQuery = "",
  initialSubject = "",
  initialClass = "",
  initialPage = 1,
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [query, setQuery] = useState(initialQuery);
  const [subject, setSubject] = useState(initialSubject);
  const [cls, setCls] = useState(initialClass);
  const [page, setPage] = useState(initialPage);

  const { subjects, classes, loadingClasses } = useFilterOptions(subject);

  const { data, loading, error } = useSearch({
    query,
    subject,
    class: cls,
    page,
  });

  // ── Sync state → URL (pushes a new history entry only on real changes) ──
  useEffect(() => {
    const sp = new URLSearchParams(searchParams.toString());

    if (query.trim()) sp.set("q", query.trim()); else sp.delete("q");
    if (subject)       sp.set("subject", subject); else sp.delete("subject");
    if (cls)           sp.set("class", cls);       else sp.delete("class");
    if (page > 1)      sp.set("page", String(page)); else sp.delete("page");

    const newUrl = `/lms/search${sp.size ? `?${sp.toString()}` : ""}`;
    const currentUrl = `${window.location.pathname}${window.location.search}`;

    if (newUrl !== currentUrl) {
      router.replace(newUrl, { scroll: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, subject, cls, page]);

  // ── Reset page to 1 when filters/query change ─────────────────────────
  const handleQueryChange = useCallback((q: string) => {
    setQuery(q);
    setPage(1);
  }, []);

  const handleSubjectChange = useCallback((s: string) => {
    setSubject(s);
    setCls("");
    setPage(1);
  }, []);

  const handleClassChange = useCallback((c: string) => {
    setCls(c);
    setPage(1);
  }, []);

  const handleReset = useCallback(() => {
    setSubject("");
    setCls("");
    setPage(1);
  }, []);

  // ── Derived state ──────────────────────────────────────────────────────
  const isIdle = !query.trim() && !subject && !cls;
  const showSkeletons = loading && !data;
  const showResults = !loading && data && data.items.length > 0;
  const showEmpty = !loading && data && data.items.length === 0;

  return (
    <div className="space-y-8">
      {/* ── Search box ────────────────────────────────────────────────── */}
      <div className="space-y-4">
        {/* Input */}
        <div className="relative">
          <div className="pointer-events-none absolute inset-y-0 left-4 flex items-center">
            <svg
              className="h-5 w-5 text-slate-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z"
              />
            </svg>
          </div>

          <input
            type="search"
            value={query}
            onChange={(e) => handleQueryChange(e.target.value)}
            placeholder="Search lessons by title, topic, or content…"
            autoFocus
            className="h-12 w-full rounded-xl border border-white/10 bg-slate-800/70 pl-12 pr-4 text-base text-slate-100 placeholder:text-slate-500 outline-none focus:border-cyan-500/60 focus:ring-2 focus:ring-cyan-500/20 transition sm:text-lg"
            aria-label="Search lessons"
          />

          {/* Clear query */}
          {query && (
            <button
              onClick={() => handleQueryChange("")}
              className="absolute inset-y-0 right-3 flex items-center text-slate-400 hover:text-white transition"
              aria-label="Clear search"
            >
              <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          )}
        </div>

        {/* Filter row */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <SearchFilters
            subjects={subjects}
            classes={classes}
            selectedSubject={subject}
            selectedClass={cls}
            loadingClasses={loadingClasses}
            onSubjectChange={handleSubjectChange}
            onClassChange={handleClassChange}
            onReset={handleReset}
          />

          {/* Result count / hint */}
          <p className="text-xs text-slate-500">
            {loading && "Searching…"}
            {!loading && data && `${data.meta.total} ${data.meta.total === 1 ? "lesson" : "lessons"} found`}
            {!loading && isIdle && "Type at least 2 characters or choose a filter"}
          </p>
        </div>
      </div>

      {/* ── Error ─────────────────────────────────────────────────────── */}
      {error && (
        <div className="rounded-xl border border-rose-500/20 bg-rose-500/5 px-4 py-3 text-sm text-rose-300">
          {error}
        </div>
      )}

      {/* ── Idle state ────────────────────────────────────────────────── */}
      {isIdle && !loading && (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <svg
            className="h-12 w-12 text-slate-700"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z"
            />
          </svg>
          <p className="text-base text-slate-400">Search across all lessons, subjects, and classes</p>
          <p className="text-sm text-slate-600">
            Try: <span className="text-slate-400">variables</span>,{" "}
            <span className="text-slate-400">functions</span>,{" "}
            <span className="text-slate-400">class 11</span>
          </p>
        </div>
      )}

      {/* ── Skeleton grid ─────────────────────────────────────────────── */}
      {showSkeletons && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      )}

      {/* ── Results ───────────────────────────────────────────────────── */}
      {showResults && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {data.items.map((lesson) => (
              <LessonResultCard key={lesson.id} lesson={lesson} />
            ))}
          </div>

          <Pagination
            page={data.meta.page}
            total={data.meta.total}
            limit={data.meta.limit}
            hasMore={data.meta.hasMore}
            onPageChange={setPage}
          />
        </>
      )}

      {/* ── Empty state ───────────────────────────────────────────────── */}
      {showEmpty && (
        <div className="rounded-2xl border border-dashed border-white/15 bg-slate-900/40 px-6 py-12 text-center">
          <p className="text-base text-slate-400">No lessons matched your search.</p>
          <p className="mt-1 text-sm text-slate-600">Try different keywords or clear the filters.</p>
          <button
            onClick={() => { handleQueryChange(""); handleReset(); }}
            className="mt-4 inline-flex h-9 items-center gap-2 rounded-lg border border-white/10 bg-slate-800/60 px-4 text-sm text-slate-300 transition hover:border-cyan-500/30 hover:text-white"
          >
            Clear search
          </button>
        </div>
      )}
    </div>
  );
}
