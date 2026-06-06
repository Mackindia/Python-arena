"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/educational-ai/search", label: "Knowledge Search" },
  { href: "/educational-ai/notes", label: "Generate Notes" },
  { href: "/educational-ai/mcq", label: "Generate MCQs" },
  { href: "/educational-ai/question-bank", label: "Question Bank" },
  { href: "/educational-ai/worksheet", label: "Worksheet" },
  { href: "/educational-ai/library", label: "Book Library" },
  { href: "/educational-ai/upload", label: "Upload Books" },
];

export default function EducationalAIModuleLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-8 text-white sm:px-6 lg:px-10">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="rounded-[2rem] border border-white/10 bg-white/5 p-6 shadow-[0_18px_60px_rgba(2,6,23,0.45)]">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-300">Educational AI</p>
          <h1 className="mt-2 text-3xl font-bold sm:text-4xl">Python Arena Educational Intelligence</h1>
          <p className="mt-2 text-sm text-slate-300 sm:text-base">
            Search knowledge and generate notes, MCQs, worksheets, and question banks from indexed textbooks.
          </p>
        </header>

        <nav className="grid gap-2 rounded-2xl border border-white/10 bg-white/5 p-3 sm:grid-cols-2 lg:grid-cols-4">
          {links.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={
                  active
                    ? "rounded-xl border border-cyan-300/60 bg-cyan-400/20 px-3 py-2 text-sm font-semibold text-cyan-100"
                    : "rounded-xl border border-white/10 bg-slate-900/70 px-3 py-2 text-sm text-slate-300 transition hover:border-cyan-400/40 hover:text-cyan-100"
                }
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {children}
      </div>
    </div>
  );
}
