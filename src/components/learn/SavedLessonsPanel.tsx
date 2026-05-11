"use client";

import Link from "next/link";
import Image from "next/image";
import { useSavedLessons, type BookmarkedLesson } from "@/src/hooks/useBookmark";
import BookmarkButton from "./BookmarkButton";

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function CardSkeleton() {
  return (
    <div className="animate-pulse rounded-2xl border border-white/10 bg-slate-900/60 overflow-hidden">
      <div className="aspect-video w-full bg-white/5" />
      <div className="p-4 space-y-2">
        <div className="h-4 w-3/4 bg-white/10 rounded" />
        <div className="h-3 w-full bg-white/5 rounded" />
        <div className="h-3 w-2/3 bg-white/5 rounded" />
        <div className="flex gap-2 pt-1">
          <div className="h-5 w-16 bg-white/10 rounded-full" />
          <div className="h-5 w-16 bg-white/10 rounded-full" />
        </div>
      </div>
    </div>
  );
}

// ─── Lesson card ──────────────────────────────────────────────────────────────

function SavedLessonCard({
  bookmark,
  onRemoved,
}: {
  bookmark: BookmarkedLesson;
  onRemoved: () => void;
}) {
  const hasThumbnail = Boolean(bookmark.lessonThumbnail);

  return (
    <article className="group relative flex flex-col rounded-2xl border border-white/10 bg-slate-900/60 overflow-hidden transition-shadow hover:shadow-lg hover:shadow-black/40">
      {/* Thumbnail */}
      <Link
        href={bookmark.href}
        className="block aspect-video w-full bg-slate-800 overflow-hidden flex-shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-inset"
        tabIndex={0}
        aria-label={`Open ${bookmark.lessonTitle}`}
      >
        {hasThumbnail ? (
          <Image
            src={bookmark.lessonThumbnail}
            alt={bookmark.lessonTitle}
            width={480}
            height={270}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            unoptimized
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <span className="text-4xl select-none">📖</span>
          </div>
        )}
      </Link>

      {/* Remove bookmark button — top-right corner */}
      <div className="absolute top-2 right-2 z-10">
        <BookmarkButton
          subjectSlug={bookmark.subjectSlug}
          classSlug={bookmark.classSlug}
          lessonSlug={bookmark.lessonSlug}
          initialBookmarked
          size="sm"
          className="shadow shadow-black/40"
        />
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col gap-2 p-4">
        <Link href={bookmark.href} className="group/link focus-visible:outline-none">
          <h3 className="text-sm font-semibold text-white leading-snug line-clamp-2 group-hover/link:text-cyan-300 transition-colors">
            {bookmark.lessonTitle || "Untitled lesson"}
          </h3>
        </Link>

        {bookmark.lessonDescription && (
          <p className="text-xs text-slate-400 leading-relaxed line-clamp-2">
            {bookmark.lessonDescription}
          </p>
        )}

        {/* Subject / Class pills */}
        <div className="flex flex-wrap gap-1.5 mt-auto pt-1">
          <span className="inline-flex items-center rounded-full bg-cyan-500/10 px-2 py-0.5 text-[10px] font-medium text-cyan-400 border border-cyan-500/20 capitalize">
            {bookmark.subjectSlug.replace(/-/g, " ")}
          </span>
          <span className="inline-flex items-center rounded-full bg-slate-700/60 px-2 py-0.5 text-[10px] font-medium text-slate-300 capitalize">
            {bookmark.classSlug.replace(/-/g, " ")}
          </span>
        </div>

        <time
          dateTime={bookmark.savedAt}
          className="block text-[10px] text-slate-500"
        >
          Saved {new Date(bookmark.savedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
        </time>
      </div>
    </article>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-800 text-3xl">
        🔖
      </div>
      <div>
        <p className="text-base font-semibold text-white">No saved lessons yet</p>
        <p className="mt-1 text-sm text-slate-400">
          Bookmark any lesson to find it here later.
        </p>
      </div>
      <Link
        href="/lms"
        className="inline-flex items-center gap-1.5 rounded-xl bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-cyan-400 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
      >
        Browse lessons
      </Link>
    </div>
  );
}

// ─── Main panel ──────────────────────────────────────────────────────────────

export type SavedLessonsPanelProps = {
  /** Optional section title override */
  title?: string;
  /** Max initial cards visible before "Load more" */
  className?: string;
};

export default function SavedLessonsPanel({
  title = "Saved lessons",
  className = "",
}: SavedLessonsPanelProps) {
  const { bookmarks, total, hasMore, loading, error, loadMore, refetch } =
    useSavedLessons();

  return (
    <section className={["w-full", className].join(" ")}>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-bold text-white">{title}</h2>
          {!loading && total > 0 && (
            <span className="rounded-full bg-cyan-500/10 px-2.5 py-0.5 text-xs font-semibold text-cyan-400 border border-cyan-500/20">
              {total}
            </span>
          )}
        </div>

        {!loading && bookmarks.length > 0 && (
          <button
            type="button"
            onClick={refetch}
            className="text-xs text-slate-400 hover:text-white transition-colors"
          >
            Refresh
          </button>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="mb-6 flex items-center gap-3 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400">
          <span>{error}</span>
          <button
            type="button"
            onClick={refetch}
            className="ml-auto shrink-0 rounded-lg px-3 py-1 text-xs font-medium text-red-300 hover:bg-red-500/20 transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {/* Loading skeletons */}
      {loading && bookmarks.length === 0 && (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && bookmarks.length === 0 && <EmptyState />}

      {/* Grid */}
      {bookmarks.length > 0 && (
        <>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {bookmarks.map((bm) => (
              <SavedLessonCard
                key={bm.id}
                bookmark={bm}
                onRemoved={refetch}
              />
            ))}
          </div>

          {/* Load more */}
          {(hasMore || (loading && bookmarks.length > 0)) && (
            <div className="mt-8 flex justify-center">
              <button
                type="button"
                onClick={loadMore}
                disabled={loading}
                className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-slate-900/60 px-5 py-2.5 text-sm font-medium text-slate-300 hover:text-white hover:bg-white/10 transition-all disabled:opacity-60 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
              >
                {loading ? (
                  <>
                    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="32" strokeDashoffset="8" />
                    </svg>
                    Loading…
                  </>
                ) : (
                  "Load more"
                )}
              </button>
            </div>
          )}
        </>
      )}
    </section>
  );
}
