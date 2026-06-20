"use client";

import { ShieldCheck, Database, GitMerge, FileCode, CheckSquare, Layers } from "lucide-react";

export default function ReviewGraphDashboard({ stats, loading }: { stats: any; loading: boolean }) {
  if (loading) return <p className="text-slate-400">Loading Review Graph metrics...</p>;
  if (!stats) return <p className="text-rose-400">Failed to load metrics.</p>;

  const icons: any = {
    "Security Review": ShieldCheck,
    "Architecture Review": Database,
    "Repository Review": GitMerge,
    "Code Quality Review": FileCode,
    "Scalability Review": Layers,
    "Performance Review": CheckSquare
  };

  return (
    <div className="space-y-6">
      {/* Top Stats */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5">
          <div className="flex items-center gap-2 mb-2">
            <CheckSquare className="h-5 w-5 text-emerald-400" />
            <p className="text-sm font-semibold text-white">Total Generated Plans</p>
          </div>
          <p className="text-3xl font-bold text-white">{stats.totalPlans}</p>
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        {/* Common Reviews */}
        <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
          <div className="flex items-center gap-2 mb-4">
            <Database className="h-5 w-5 text-cyan-400" />
            <h3 className="text-lg font-semibold text-white">Most Common Review Paths</h3>
          </div>
          {stats.commonReviews?.length === 0 ? (
            <p className="text-sm text-slate-400">No review graph history.</p>
          ) : (
            <ul className="space-y-3 text-sm">
              {stats.commonReviews?.map((r: any) => {
                const Icon = icons[r._id] || ShieldCheck;
                return (
                  <li key={r._id} className="flex justify-between items-center bg-white/5 p-3 rounded-lg border border-white/5">
                    <span className="flex items-center gap-2 font-semibold text-white">
                      <Icon className="h-4 w-4 text-slate-400" /> {r._id}
                    </span>
                    <span className="text-cyan-400 font-medium">{r.count} times routed</span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Recent Pipelines */}
        <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
          <div className="flex items-center gap-2 mb-4">
            <Layers className="h-5 w-5 text-fuchsia-400" />
            <h3 className="text-lg font-semibold text-white">Recent Visual Pipelines</h3>
          </div>
          {stats.recentPlans?.length === 0 ? (
            <p className="text-sm text-slate-400">No pipeline history.</p>
          ) : (
            <ul className="space-y-3 text-sm">
              {stats.recentPlans?.map((w: any) => (
                <li key={w._id} className="bg-white/5 p-4 rounded-lg border border-white/5">
                  <p className="text-xs text-slate-400 mb-3 truncate">"{w.promptPreview}"</p>
                  <div className="flex flex-wrap gap-2 items-center">
                    {w.reviews.map((rev: any, idx: number) => (
                      <span key={idx} className="flex items-center gap-1 text-[10px] uppercase tracking-wider font-semibold text-emerald-200 bg-emerald-500/20 px-2 py-1 rounded">
                        {idx + 1}. {rev.reviewType}
                      </span>
                    ))}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
