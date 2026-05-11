"use client";

import { useBookmark } from "@/src/hooks/useBookmark";

// ─── Bookmark SVG icons ───────────────────────────────────────────────────────

function BookmarkOutlineIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
    </svg>
  );
}

function BookmarkFilledIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
    </svg>
  );
}

function SpinnerIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <circle
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="3"
        strokeDasharray="32"
        strokeDashoffset="8"
      />
    </svg>
  );
}

// ─── Types ────────────────────────────────────────────────────────────────────

export type BookmarkButtonProps = {
  subjectSlug: string;
  classSlug: string;
  lessonSlug: string;
  /** Pre-resolved server-side state — avoids flicker on first render */
  initialBookmarked?: boolean;
  size?: "sm" | "md" | "lg";
  /** Show label text next to the icon */
  showLabel?: boolean;
  className?: string;
};

const sizeClasses = {
  sm: "h-7 w-7 p-1.5",
  md: "h-9 w-9 p-2",
  lg: "h-11 w-11 p-2.5",
} as const;

const iconSizeClasses = {
  sm: "h-4 w-4",
  md: "h-5 w-5",
  lg: "h-6 w-6",
} as const;

// ─── Component ────────────────────────────────────────────────────────────────

export default function BookmarkButton({
  subjectSlug,
  classSlug,
  lessonSlug,
  initialBookmarked = false,
  size = "md",
  showLabel = false,
  className = "",
}: BookmarkButtonProps) {
  const { bookmarked, toggling, error, toggle } = useBookmark({
    subjectSlug,
    classSlug,
    lessonSlug,
    initialBookmarked,
  });

  const label = bookmarked ? "Saved" : "Save lesson";
  const title = error || label;

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={toggling}
      aria-label={label}
      aria-pressed={bookmarked}
      title={title}
      className={[
        "inline-flex items-center gap-1.5 rounded-xl transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950",
        "disabled:opacity-60 disabled:cursor-not-allowed",
        bookmarked
          ? "text-cyan-400 hover:text-cyan-300 bg-cyan-400/10 hover:bg-cyan-400/20"
          : "text-slate-400 hover:text-white bg-white/5 hover:bg-white/10",
        showLabel ? `px-3 py-1.5 rounded-lg ${sizeClasses[size].replace(/h-\S+ w-\S+/, "")}` : sizeClasses[size],
        className,
      ].join(" ")}
    >
      {toggling ? (
        <SpinnerIcon className={`${iconSizeClasses[size]} animate-spin`} />
      ) : bookmarked ? (
        <BookmarkFilledIcon className={iconSizeClasses[size]} />
      ) : (
        <BookmarkOutlineIcon className={iconSizeClasses[size]} />
      )}
      {showLabel && (
        <span className="text-sm font-medium leading-none">{label}</span>
      )}
    </button>
  );
}
