"use client";

import { X } from "lucide-react";

export default function ModelDetailModal({ model, onClose, onRefresh }: { model: any; onClose: () => void; onRefresh: () => void }) {
  if (!model) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-2xl rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-white">{model.name}</h2>
            <p className="text-sm text-slate-400 capitalize">{model.provider} Engine</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-white/10 bg-black/20 p-4">
            <h3 className="text-xs font-semibold uppercase text-slate-500 mb-3">Intelligence Scores</h3>
            <ul className="space-y-2 text-sm">
              <li className="flex justify-between text-slate-300"><span>Reasoning:</span> <span className="font-semibold text-white">{model.reasoningScore}/10</span></li>
              <li className="flex justify-between text-slate-300"><span>Coding:</span> <span className="font-semibold text-white">{model.codingScore}/10</span></li>
              <li className="flex justify-between text-slate-300"><span>Architecture:</span> <span className="font-semibold text-white">{model.architectureScore}/10</span></li>
              <li className="flex justify-between text-slate-300"><span>Context length:</span> <span className="font-semibold text-white">{model.contextScore}/10</span></li>
            </ul>
          </div>

          <div className="rounded-xl border border-white/10 bg-black/20 p-4">
            <h3 className="text-xs font-semibold uppercase text-slate-500 mb-3">Operational Scores</h3>
            <ul className="space-y-2 text-sm">
              <li className="flex justify-between text-slate-300"><span>Speed/Latency:</span> <span className="font-semibold text-white">{model.speedScore}/10</span></li>
              <li className="flex justify-between text-slate-300"><span>Quota Efficiency:</span> <span className="font-semibold text-white">{model.quotaEfficiencyScore}/10</span></li>
              <li className="flex justify-between text-slate-300"><span>Status:</span> <span className={`font-semibold ${model.isActive ? 'text-emerald-400' : 'text-rose-400'}`}>{model.isActive ? "Active" : "Disabled"}</span></li>
            </ul>
          </div>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-white/10 bg-emerald-500/5 p-4">
            <h3 className="text-xs font-semibold uppercase text-emerald-400 mb-2">Best Use Cases</h3>
            <div className="flex flex-wrap gap-2">
              {model.bestUseCases.map((useCase: string) => (
                <span key={useCase} className="rounded-md bg-emerald-500/20 px-2 py-1 text-xs text-emerald-200">
                  {useCase}
                </span>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-white/10 bg-rose-500/5 p-4">
            <h3 className="text-xs font-semibold uppercase text-rose-400 mb-2">Worst Use Cases</h3>
            <div className="flex flex-wrap gap-2">
              {model.worstUseCases.map((useCase: string) => (
                <span key={useCase} className="rounded-md bg-rose-500/20 px-2 py-1 text-xs text-rose-200">
                  {useCase}
                </span>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
