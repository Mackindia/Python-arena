"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { useSearch, useFilterOptions } from "@/src/hooks/useSearch";
import { SearchFilters } from "@/src/components/learn/SearchFilters";

function truncate(value: string, max = 120) {
  if (!value || value.length <= max) return value;
  return `${value.slice(0, max).trimEnd()}…`;
}

export default function LessonSearchSection() {
  const [query, setQuery]     = useState("");
  const [subject, setSubject] = useState("");
  const [cls, setCls]         = useState("");

  const { subjects, classes, loadingClasses } = useFilterOptions(subject);

  const { data, loading, error } = useSearch({
    query,
    subject,
    class: cls,
    page: 1,
    limit: 9,
  });

  const handleSubjectChange = useCallback((s: string) => {
    setSubject(s);
    setCls("");
  }, []);

  const searchUrl = `/lms/search${query.trim() ? `?q=${encodeURIComponent(query.trim())}` : ""}${subject ? `${query.trim() ? "&" : "?"}subject=${subject}` : ""}${cls ? `&class=${cls}` : ""}`;

  return (
    <section className="mt-12 rounded-3xl border border-white/10 bg-slate-900/75 p-5 shadow-[0_16px_60px_rgba(2,6,23,0.35)] sm:p-7">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-200/90">Lesson Search</p>
          <h2 className="mt-1 text-2xl font-bold text-white sm:text-3xl">Find Lessons Instantly</h2>
          <p className="mt-2 max-w-2xl text-sm text-slate-300 sm:text-base">
            Search across lesson title, subject, class, and extracted PDF content.
          </p>
        </div>
        <Link
          href="/lms/search"
          className="shrink-0 self-start rounded-lg border border-white/10 bg-slate-800/60 px-3 py-1.5 text-xs text-slate-300 transition hover:border-cyan-500/40 hover:text-white"
        >
          Advanced search ↗
        </Link>
      </div>

      {/* Search input */}
      <div className="relative mt-5">
        <div className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center">
          <svg className="h-4 w-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z" />
          </svg>
        </div>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Try: variables, class 11, python, ai…"
          className="h-10 w-full rounded-xl border border-white/10 bg-slate-950/80 pl-9 pr-4 text-sm text-slate-100 placeholder:text-slate-500 outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 transition sm:text-base"
        />
        {query && (
          <button
            onClick={() => setQuery("")}
            className="absolute inset-y-0 right-3 flex items-center text-slate-500 hover:text-white transition"
            aria-label="Clear"
          >
            <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        )}
      </div>

      {/* Filters + count row */}
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <SearchFilters
          subjects={subjects}
          classes={classes}
          selectedSubject={subject}
          selectedClass={cls}
          loadingClasses={loadingClasses}
          onSubjectChange={handleSubjectChange}
          onClassChange={setCls}
          onReset={() => { setSubject(""); setCls(""); }}
        />
        <p className="text-xs text-slate-500">
          {loading && "Searching…"}
          {!loading && data && `${data.meta.total} ${data.meta.total === 1 ? "lesson" : "lessons"} found`}
          {!loading && !data && !error && "Type at least 2 characters or pick a filter"}
        </p>
      </div>

      {/* Error */}
      {error && <p className="mt-4 text-sm text-rose-300">{error}</p>}

      {/* Results */}
      {data && (
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.items.length > 0 ? (
            data.items.map((lesson) => (
              <Link
                key={lesson.id}
                href={lesson.href}
                className="group overflow-hidden rounded-2xl border border-white/10 bg-slate-950/70 transition hover:border-cyan-400/50"
              >
                <div className="h-28 w-full overflow-hidden bg-slate-800">
                  {lesson.thumbnail ? (
                    <img
                      src={lesson.thumbnail}
                      alt={lesson.title}
                      className="h-full w-full object-cover transition group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-slate-800/50 text-xs text-slate-600">
                      No thumbnail
                    </div>
                  )}
                </div>

                <div className="space-y-2 p-4">
                  <div className="flex flex-wrap gap-1.5 text-[10px] uppercase tracking-[0.12em] text-slate-400">
                    <span className="rounded-full border border-white/10 px-2 py-0.5">{lesson.subject.name}</span>
                    <span className="rounded-full border border-white/10 px-2 py-0.5">{lesson.class.name}</span>
                  </div>
                  <h3 className="line-clamp-2 text-sm font-semibold text-white transition group-hover:text-cyan-300 sm:text-base">
                    {lesson.title}
                  </h3>
                  <p className="text-xs leading-relaxed text-slate-400 sm:text-sm">
                    {lesson.description ? truncate(lesson.description) : "No description available."}
                  </p>
                </div>
              </Link>
            ))
          ) : (
            <div className="col-span-full rounded-2xl border border-dashed border-white/20 bg-slate-950/50 px-4 py-8 text-center text-sm text-slate-400">
              No lessons found. Try different keywords or{" "}
              <button
                onClick={() => { setQuery(""); setSubject(""); setCls(""); }}
                className="text-cyan-400 underline underline-offset-2 hover:no-underline"
              >
                clear filters
              </button>.
            </div>
          )}
        </div>
      )}

      {/* "More results" link */}
      {data && data.meta.hasMore && (
        <div className="mt-5 text-center">
          <Link
            href={searchUrl}
            className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-slate-800/60 px-4 py-2 text-sm text-slate-300 transition hover:border-cyan-500/40 hover:text-white"
          >
            View all {data.meta.total} results ↗
          </Link>
        </div>
      )}
    </section>
  );
}
