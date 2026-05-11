"use client";

import Link from "next/link";

interface ClassCardProps {
  name: string;
  subject: string;
  classSlug: string;
  icon?: React.ReactNode;
  description?: string;
}

export default function ClassCard({
  name,
  subject,
  classSlug,
  icon,
  description = "Explore lessons and materials",
}: ClassCardProps) {
  return (
    <Link
      href={`/lms/${subject}/${classSlug}`}
      className="group rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900/80 to-slate-900/40 p-6 shadow-[0_16px_60px_rgba(2,6,23,0.25)] transition hover:border-cyan-400/50 hover:from-slate-900/95 hover:to-slate-900/60 hover:shadow-[0_20px_80px_rgba(6,182,212,0.15)]"
    >
      <div className="space-y-4">
        {/* Icon Container */}
        <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl border border-cyan-300/30 bg-cyan-400/10 transition group-hover:border-cyan-300/60 group-hover:bg-cyan-400/20">
          {icon ? (
            icon
          ) : (
            <svg
              className="h-8 w-8 text-cyan-300"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6.253v13m0-13C6.5 6.253 2 10.753 2 16.5S6.5 26.75 12 26.75s10-4.5 10-10.25S17.5 6.253 12 6.253z"
              />
            </svg>
          )}
        </div>

        {/* Content */}
        <div>
          <h3 className="text-xl font-bold text-white transition group-hover:text-cyan-200">
            {name}
          </h3>
          <p className="mt-2 text-sm text-slate-400 transition group-hover:text-slate-300">
            {description}
          </p>
        </div>

        {/* CTA */}
        <div className="flex items-center gap-2 pt-2 text-xs text-cyan-300 opacity-0 transition group-hover:opacity-100">
          <span>View lessons</span>
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </div>
    </Link>
  );
}
