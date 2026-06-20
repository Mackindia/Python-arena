"use client";

import { CheckCircle2, AlertTriangle, Activity, Target } from "lucide-react";

export default function ValidationDashboard({ stats, loading }: { stats: any; loading: boolean }) {
  if (loading) {
    return <p className="text-slate-400">Loading validation telemetry...</p>;
  }

  if (!stats) {
    return <p className="text-rose-400">Failed to load validation metrics.</p>;
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-4">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <div className="flex items-center gap-2 mb-2">
            <Target className="h-5 w-5 text-cyan-400" />
            <p className="text-sm font-semibold text-white">Accuracy Rate</p>
          </div>
          <p className="text-3xl font-bold text-white">{stats.accuracyRate}%</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <div className="flex items-center gap-2 mb-2">
            <Activity className="h-5 w-5 text-fuchsia-400" />
            <p className="text-sm font-semibold text-white">Evaluated Prompts</p>
          </div>
          <p className="text-3xl font-bold text-white">{stats.totalEvaluated}</p>
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5">
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle2 className="h-5 w-5 text-emerald-400" />
            <h3 className="text-lg font-semibold text-emerald-100">Most Successful Models</h3>
          </div>
          {stats.mostSuccessfulModels?.length === 0 ? (
            <p className="text-sm text-slate-400">Not enough data to calculate.</p>
          ) : (
            <ul className="space-y-3 text-sm">
              {stats.mostSuccessfulModels?.map((m: any) => (
                <li key={m._id} className="flex justify-between items-center bg-black/20 p-3 rounded-lg border border-white/5">
                  <span className="font-semibold text-white">{m._id}</span>
                  <div className="text-right">
                    <span className="block text-emerald-400 font-bold">{Math.round(m.avgRating * 10) / 10} / 5</span>
                    <span className="text-xs text-slate-500">{m.usageCount} evaluations</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-2xl border border-rose-500/20 bg-rose-500/5 p-5">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="h-5 w-5 text-rose-400" />
            <h3 className="text-lg font-semibold text-rose-100">Least Successful Models</h3>
          </div>
          {stats.leastSuccessfulModels?.length === 0 ? (
            <p className="text-sm text-slate-400">Not enough data to calculate.</p>
          ) : (
            <ul className="space-y-3 text-sm">
              {stats.leastSuccessfulModels?.map((m: any) => (
                <li key={m._id} className="flex justify-between items-center bg-black/20 p-3 rounded-lg border border-white/5">
                  <span className="font-semibold text-white">{m._id}</span>
                  <div className="text-right">
                    <span className="block text-rose-400 font-bold">{Math.round(m.avgRating * 10) / 10} / 5</span>
                    <span className="text-xs text-slate-500">{m.usageCount} evaluations</span>
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
