"use client";

import { Eye } from "lucide-react";

export default function ModelRegistryTable({ models, onView }: { models: any[]; onView: (model: any) => void }) {
  if (models.length === 0) {
    return <p className="text-sm text-slate-500">No models found in the registry.</p>;
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-white/10">
      <table className="min-w-full text-left text-sm text-slate-300">
        <thead className="bg-slate-900/60 text-xs font-semibold uppercase tracking-wider text-slate-400">
          <tr>
            <th className="px-4 py-3">Model Name</th>
            <th className="px-4 py-3">Provider</th>
            <th className="px-4 py-3">Speed</th>
            <th className="px-4 py-3">Reasoning</th>
            <th className="px-4 py-3">Coding</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800">
          {models.map((model) => (
            <tr key={model._id} className="hover:bg-slate-800/30">
              <td className="px-4 py-3 font-medium text-white">{model.name}</td>
              <td className="px-4 py-3 capitalize">{model.provider}</td>
              <td className="px-4 py-3">{model.speedScore}/10</td>
              <td className="px-4 py-3">{model.reasoningScore}/10</td>
              <td className="px-4 py-3">{model.codingScore}/10</td>
              <td className="px-4 py-3">
                <span className={`inline-flex rounded-full px-2 py-1 text-[10px] font-semibold uppercase ${model.isActive ? "bg-emerald-400/10 text-emerald-400" : "bg-rose-400/10 text-rose-400"}`}>
                  {model.isActive ? "Active" : "Inactive"}
                </span>
              </td>
              <td className="px-4 py-3 text-right">
                <button
                  onClick={() => onView(model)}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-cyan-500/20 hover:text-cyan-300 transition"
                  title="View Details"
                >
                  <Eye className="h-4 w-4" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
