"use client";

import type { ClassOption, SubjectOption } from "@/src/hooks/useSearch";

// ─── Types ─────────────────────────────────────────────────────────────────

type SearchFiltersProps = {
  subjects: SubjectOption[];
  classes: ClassOption[];
  selectedSubject: string;
  selectedClass: string;
  loadingClasses: boolean;
  onSubjectChange: (slug: string) => void;
  onClassChange: (slug: string) => void;
  onReset: () => void;
};

// ─── Component ─────────────────────────────────────────────────────────────

export function SearchFilters({
  subjects,
  classes,
  selectedSubject,
  selectedClass,
  loadingClasses,
  onSubjectChange,
  onClassChange,
  onReset,
}: SearchFiltersProps) {
  const hasActiveFilters = selectedSubject || selectedClass;

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Subject dropdown */}
      <div className="relative">
        <select
          value={selectedSubject}
          onChange={(e) => {
            onSubjectChange(e.target.value);
            onClassChange(""); // reset class when subject changes
          }}
          className="h-9 appearance-none rounded-lg border border-white/10 bg-slate-800/70 pl-3 pr-8 text-sm text-slate-200 outline-none focus:border-cyan-500/60 focus:ring-1 focus:ring-cyan-500/30 transition cursor-pointer"
          aria-label="Filter by subject"
        >
          <option value="">All Subjects</option>
          {subjects.map((s) => (
            <option key={s.slug} value={s.slug}>
              {s.name}
            </option>
          ))}
        </select>
        {/* Arrow icon */}
        <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400">
          <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
            <path
              fillRule="evenodd"
              d="M5.23 7.21a.75.75 0 011.06.02L10 11.17l3.71-3.94a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
              clipRule="evenodd"
            />
          </svg>
        </span>
      </div>

      {/* Class dropdown – hidden when no subject and no classes loaded */}
      <div className="relative">
        <select
          value={selectedClass}
          onChange={(e) => onClassChange(e.target.value)}
          disabled={loadingClasses || classes.length === 0}
          className="h-9 appearance-none rounded-lg border border-white/10 bg-slate-800/70 pl-3 pr-8 text-sm text-slate-200 outline-none focus:border-cyan-500/60 focus:ring-1 focus:ring-cyan-500/30 transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          aria-label="Filter by class"
        >
          <option value="">
            {loadingClasses ? "Loading…" : classes.length === 0 ? "No classes" : "All Classes"}
          </option>
          {classes.map((c) => (
            <option key={`${c.subject ?? selectedSubject ?? "all"}-${c.slug}`} value={c.slug}>
              {c.name}
            </option>
          ))}
        </select>
        <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400">
          <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
            <path
              fillRule="evenodd"
              d="M5.23 7.21a.75.75 0 011.06.02L10 11.17l3.71-3.94a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
              clipRule="evenodd"
            />
          </svg>
        </span>
      </div>

      {/* Clear filters button */}
      {hasActiveFilters && (
        <button
          onClick={onReset}
          className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-white/10 bg-slate-800/50 px-3 text-sm text-slate-300 transition hover:border-red-500/40 hover:bg-red-500/10 hover:text-red-300"
          aria-label="Clear all filters"
        >
          <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
            <path
              fillRule="evenodd"
              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
          Clear filters
        </button>
      )}
    </div>
  );
}
