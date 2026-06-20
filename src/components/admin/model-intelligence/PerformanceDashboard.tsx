"use client";

import { AlertTriangle, TrendingUp, TrendingDown, Cpu, Zap, BrainCircuit, Code, RefreshCw } from "lucide-react";

export default function PerformanceDashboard({ stats, loading, onTune, isTuning }: { stats: any; loading: boolean; onTune: () => void; isTuning: boolean }) {
  if (loading) return <p className="text-slate-400">Loading performance metrics...</p>;
  if (!stats) return <p className="text-rose-400">Failed to load metrics.</p>;

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <button
          onClick={onTune}
          disabled={isTuning}
          className="flex items-center gap-2 rounded-xl bg-cyan-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-cyan-500 disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${isTuning ? "animate-spin" : ""}`} />
          {isTuning ? "Self-Tuning Registry..." : "Force Registry Self-Tune"}
        </button>
      </div>

      {/* Drift Alerts */}
      <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle className="h-5 w-5 text-amber-400" />
          <h3 className="text-lg font-semibold text-white">Recommendation Drift Alerts</h3>
        </div>
        {stats.driftAlerts?.length === 0 ? (
          <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-4 text-emerald-200 text-sm">
            No significant model degradation or drift detected in the last 7 days.
          </div>
        ) : (
          <ul className="space-y-3 text-sm">
            {stats.driftAlerts?.map((alert: any, idx: number) => (
              <li key={idx} className="flex justify-between items-center bg-white/5 p-3 rounded-lg border border-white/5">
                <span className="font-semibold text-white">{alert.model}</span>
                <div className="flex items-center gap-4">
                  <span className="text-slate-400">All-time: {alert.previousScore}</span>
                  <span className="text-slate-400">Recent: {alert.recentScore}</span>
                  <span className={`flex items-center gap-1 font-bold ${alert.status === 'improved' ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {alert.status === 'improved' ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                    {alert.driftValue > 0 ? "+" : ""}{alert.driftValue}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Leaderboards */}
      <h3 className="text-xl font-bold text-white mt-8 mb-4">Live Model Leaderboards</h3>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">

        {/* Reasoning */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <div className="flex items-center gap-2 mb-4">
            <BrainCircuit className="h-5 w-5 text-fuchsia-400" />
            <h4 className="font-semibold text-white">Reasoning</h4>
          </div>
          <ul className="space-y-2 text-sm">
            {stats.leaderboard?.reasoning?.map((m: any, i: number) => (
              <li key={m._id} className="flex justify-between">
                <span className="text-slate-300">{i + 1}. {m.name}</span>
                <span className="font-bold text-fuchsia-400">{m.reasoningScore}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Coding */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <div className="flex items-center gap-2 mb-4">
            <Code className="h-5 w-5 text-cyan-400" />
            <h4 className="font-semibold text-white">Coding</h4>
          </div>
          <ul className="space-y-2 text-sm">
            {stats.leaderboard?.coding?.map((m: any, i: number) => (
              <li key={m._id} className="flex justify-between">
                <span className="text-slate-300">{i + 1}. {m.name}</span>
                <span className="font-bold text-cyan-400">{m.codingScore}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Speed */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <div className="flex items-center gap-2 mb-4">
            <Zap className="h-5 w-5 text-amber-400" />
            <h4 className="font-semibold text-white">Speed</h4>
          </div>
          <ul className="space-y-2 text-sm">
            {stats.leaderboard?.speed?.map((m: any, i: number) => (
              <li key={m._id} className="flex justify-between">
                <span className="text-slate-300">{i + 1}. {m.name}</span>
                <span className="font-bold text-amber-400">{m.speedScore}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Quota */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <div className="flex items-center gap-2 mb-4">
            <Cpu className="h-5 w-5 text-emerald-400" />
            <h4 className="font-semibold text-white">Quota Efficiency</h4>
          </div>
          <ul className="space-y-2 text-sm">
            {stats.leaderboard?.quota?.map((m: any, i: number) => (
              <li key={m._id} className="flex justify-between">
                <span className="text-slate-300">{i + 1}. {m.name}</span>
                <span className="font-bold text-emerald-400">{m.quotaEfficiencyScore}</span>
              </li>
            ))}
          </ul>
        </div>

      </div>
    </div>
  );
}
