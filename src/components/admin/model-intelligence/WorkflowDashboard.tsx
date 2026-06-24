"use client";

import { Layers, Network, Activity, Cpu } from "lucide-react";

export default function WorkflowDashboard({ stats, loading }: { stats: any; loading: boolean }) {
  if (loading) return <p className="text-slate-400">Loading workflow orchestrator metrics...</p>;
  if (!stats) return <p className="text-rose-400">Failed to load metrics.</p>;

  return (
    <div className="space-y-6">
      {/* Top Stats */}
      <div className="grid gap-4 sm:grid-cols-4">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <div className="flex items-center gap-2 mb-2">
            <Network className="h-5 w-5 text-cyan-400" />
            <p className="text-sm font-semibold text-white">Generated Workflows</p>
          </div>
          <p className="text-3xl font-bold text-white">{stats.totalWorkflows}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <div className="flex items-center gap-2 mb-2">
            <Layers className="h-5 w-5 text-fuchsia-400" />
            <p className="text-sm font-semibold text-white">Avg Stages per DAG</p>
          </div>
          <p className="text-3xl font-bold text-white">{stats.avgStages}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <div className="flex items-center gap-2 mb-2">
            <Activity className="h-5 w-5 text-amber-400" />
            <p className="text-sm font-semibold text-white">Avg Complexity</p>
          </div>
          <p className="text-3xl font-bold text-white">{stats.avgComplexity} / 10</p>
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        {/* Top Models in DAGs */}
        <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
          <div className="flex items-center gap-2 mb-4">
            <Cpu className="h-5 w-5 text-emerald-400" />
            <h3 className="text-lg font-semibold text-white">Top Models in Orchestration</h3>
          </div>
          {stats.topModels?.length === 0 ? (
            <p className="text-sm text-slate-400">No workflow history.</p>
          ) : (
            <ul className="space-y-3 text-sm">
              {stats.topModels?.map((m: any) => (
                <li key={m._id} className="flex justify-between items-center bg-white/5 p-3 rounded-lg border border-white/5">
                  <span className="font-semibold text-white">{m._id}</span>
                  <span className="text-emerald-400 font-medium">{m.count} nodes</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Recent Workflows */}
        <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
          <div className="flex items-center gap-2 mb-4">
            <Network className="h-5 w-5 text-indigo-400" />
            <h3 className="text-lg font-semibold text-white">Recent DAG Generations</h3>
          </div>
          {stats.recentWorkflows?.length === 0 ? (
            <p className="text-sm text-slate-400">No workflow history.</p>
          ) : (
            <ul className="space-y-3 text-sm">
              {stats.recentWorkflows?.map((w: any) => (
                <li key={w._id} className="bg-white/5 p-3 rounded-lg border border-white/5">
                  <p className="text-xs text-slate-400 mb-2 truncate">"{w.promptPreview}"</p>
                  <div className="flex flex-wrap gap-2">
                    {w.stages.map((stage: any, idx: number) => (
                      <span key={idx} className="flex items-center gap-1 text-[10px] uppercase tracking-wider font-semibold text-indigo-200 bg-indigo-500/20 px-2 py-1 rounded">
                        {idx + 1}. {stage.stageName}
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
