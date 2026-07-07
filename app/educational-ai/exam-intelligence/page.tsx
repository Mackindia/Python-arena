"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { listSolvedPapers } from "@/lib/educational-ai";

const features = [
  {
    href: "/educational-ai/question-paper",
    title: "Solve Question Paper",
    desc: "Upload a question paper (PDF/image) and get solved answers with mark-wise breakdown.",
    icon: "📝",
    color: "cyan",
  },
  {
    href: "/educational-ai/paper-generator",
    title: "Paper Generator",
    desc: "Generate new question papers matching CBSE or custom section patterns.",
    icon: "📋",
    color: "emerald",
  },
  {
    href: "/educational-ai/most-important",
    title: "Most Important Questions",
    desc: "Find the most repeated and highest-weightage questions across all saved papers.",
    icon: "⭐",
    color: "amber",
  },
  {
    href: "/educational-ai/exam-intelligence/cross-paper",
    title: "Cross-Paper Analysis",
    desc: "Compare multiple papers to find common questions, topic frequency, and repeat predictions.",
    icon: "📊",
    color: "violet",
  },
  {
    href: "/educational-ai/exam-intelligence/pattern",
    title: "Pattern Analysis",
    desc: "Analyze mark distribution, difficulty breakdown, and Bloom's taxonomy for any saved paper.",
    icon: "🔍",
    color: "rose",
  },
  {
    href: "/educational-ai/exam-intelligence/papers",
    title: "Saved Papers",
    desc: "View, manage, and export all your saved solved papers.",
    icon: "📁",
    color: "slate",
  },
];

const colorMap: Record<string, string> = {
  cyan: "border-cyan-400/30 hover:border-cyan-400/60 hover:bg-cyan-400/5",
  emerald: "border-emerald-400/30 hover:border-emerald-400/60 hover:bg-emerald-400/5",
  amber: "border-amber-400/30 hover:border-amber-400/60 hover:bg-amber-400/5",
  violet: "border-violet-400/30 hover:border-violet-400/60 hover:bg-violet-400/5",
  rose: "border-rose-400/30 hover:border-rose-400/60 hover:bg-rose-400/5",
  slate: "border-slate-400/30 hover:border-slate-400/60 hover:bg-slate-400/5",
};

const iconBg: Record<string, string> = {
  cyan: "bg-cyan-400/10 text-cyan-300",
  emerald: "bg-emerald-400/10 text-emerald-300",
  amber: "bg-amber-400/10 text-amber-300",
  violet: "bg-violet-400/10 text-violet-300",
  rose: "bg-rose-400/10 text-rose-300",
  slate: "bg-slate-400/10 text-slate-300",
};

export default function ExamIntelligencePage() {
  const [stats, setStats] = useState<{ total: number; classes: string[]; subjects: string[] } | null>(null);

  useEffect(() => {
    listSolvedPapers()
      .then((res) => {
        const papers = res.papers || [];
        const classes = [...new Set(papers.map((p: any) => p.class_level).filter(Boolean) as string[])];
        const subjects = [...new Set(papers.map((p: any) => p.subject).filter(Boolean) as string[])];
        setStats({ total: papers.length, classes, subjects });
      })
      .catch(() => {});
  }, []);

  return (
    <section className="space-y-6">
      {/* Stats Bar */}
      {stats && stats.total > 0 && (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <div className="flex flex-wrap items-center gap-6 text-sm">
            <div>
              <span className="text-slate-400">Saved Papers:</span>{" "}
              <span className="font-semibold text-white">{stats.total}</span>
            </div>
            {stats.classes.length > 0 && (
              <div>
                <span className="text-slate-400">Classes:</span>{" "}
                <span className="text-white">{stats.classes.join(", ")}</span>
              </div>
            )}
            {stats.subjects.length > 0 && (
              <div>
                <span className="text-slate-400">Subjects:</span>{" "}
                <span className="text-white">{stats.subjects.join(", ")}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Feature Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {features.map((f) => (
          <Link
            key={f.href}
            href={f.href}
            className={`group rounded-2xl border bg-white/5 p-5 transition ${colorMap[f.color]}`}
          >
            <div className="flex items-start gap-3">
              <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-lg ${iconBg[f.color]}`}>
                {f.icon}
              </span>
              <div className="min-w-0">
                <h2 className="text-lg font-semibold text-white group-hover:text-cyan-100">
                  {f.title}
                </h2>
                <p className="mt-1 text-sm text-slate-400">{f.desc}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
