"use client";

import { useEffect, useState } from "react";
import {
  listSolvedPapers,
  getSolvedPaper,
} from "@/lib/educational-ai";

export default function PatternAnalysisPage() {
  const [papers, setPapers] = useState<any[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    listSolvedPapers()
      .then((res) => setPapers(res.papers || []))
      .catch(() => {});
  }, []);

  async function handleAnalyze() {
    if (!selectedId) {
      setError("Select a paper to analyze.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const result = await getSolvedPaper(selectedId);
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Analysis failed");
    } finally {
      setLoading(false);
    }
  }

  const pattern = data?.pattern_analysis;

  return (
    <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
      <h2 className="text-2xl font-semibold">Pattern Analysis</h2>
      <p className="mt-1 text-sm text-slate-400">
        Analyze mark distribution, difficulty breakdown, Bloom&apos;s taxonomy, and study recommendations for any saved paper.
      </p>

      {papers.length === 0 ? (
        <p className="mt-4 text-sm text-slate-500 italic">
          No saved papers found. Solve or generate some papers first.
        </p>
      ) : (
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <select
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
            className="rounded-xl border border-white/10 bg-slate-950 px-3 py-2.5 text-sm"
          >
            <option value="">Select a saved paper...</option>
            {papers.map((p) => (
              <option key={p.paper_id} value={p.paper_id}>
                {p.paper_id} — {p.class_level} · {p.subject}
              </option>
            ))}
          </select>
          <button
            onClick={handleAnalyze}
            disabled={loading || !selectedId}
            className="rounded-xl bg-rose-400 px-4 py-2.5 font-semibold text-slate-950 disabled:opacity-70"
          >
            {loading ? "Analyzing..." : "Analyze Pattern"}
          </button>
        </div>
      )}

      {error && <p className="mt-3 text-sm text-rose-300">{error}</p>}

      {pattern && (
        <div className="mt-6 space-y-6">
          {/* Overview */}
          <div className="rounded-xl border border-white/10 bg-slate-900/70 p-4">
            <h3 className="text-lg font-semibold text-rose-200">Overview</h3>
            <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4 text-sm">
              <div>
                <span className="text-slate-400">Total Marks:</span>{" "}
                <span className="font-semibold text-white">{pattern.total_marks}</span>
              </div>
              <div>
                <span className="text-slate-400">Total Questions:</span>{" "}
                <span className="font-semibold text-white">{pattern.total_questions}</span>
              </div>
              <div>
                <span className="text-slate-400">Sections:</span>{" "}
                <span className="font-semibold text-white">{pattern.total_sections}</span>
              </div>
              <div>
                <span className="text-slate-400">Avg Marks/Q:</span>{" "}
                <span className="font-semibold text-white">{pattern.avg_marks_per_question}</span>
              </div>
            </div>
          </div>

          {/* Difficulty Distribution */}
          {pattern.difficulty_distribution && (
            <div className="rounded-xl border border-white/10 bg-slate-900/70 p-4">
              <h3 className="text-lg font-semibold text-rose-200">Difficulty Distribution</h3>
              <div className="mt-3 flex flex-wrap gap-4">
                {Object.entries(pattern.difficulty_distribution).map(([k, v]) => (
                  <div key={k} className="flex items-center gap-2">
                    <span className={`h-3 w-3 rounded-full ${
                      k === "Easy" ? "bg-emerald-400" : k === "Medium" ? "bg-amber-400" : "bg-rose-400"
                    }`} />
                    <span className="text-sm text-slate-300">{k}:</span>
                    <span className="text-sm font-semibold text-white">{String(v)}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Mark Distribution */}
          {pattern.mark_distribution && (
            <div className="rounded-xl border border-white/10 bg-slate-900/70 p-4">
              <h3 className="text-lg font-semibold text-rose-200">Mark Distribution</h3>
              <div className="mt-3 space-y-1">
                {Object.entries(pattern.mark_distribution).map(([marks, count]) => (
                  <div key={marks} className="flex items-center gap-3 text-sm">
                    <span className="w-16 text-slate-400">{marks} mark{marks !== "1" ? "s" : ""}</span>
                    <div className="flex-1 h-4 rounded bg-slate-950/50 overflow-hidden">
                      <div
                        className="h-full bg-rose-400/60 rounded"
                        style={{ width: `${Math.min((Number(count) / (pattern.total_questions || 1)) * 100, 100)}%` }}
                      />
                    </div>
                    <span className="w-8 text-right text-white font-mono text-xs">{String(count)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Bloom's Taxonomy */}
          {pattern.bloom_distribution && (
            <div className="rounded-xl border border-white/10 bg-slate-900/70 p-4">
              <h3 className="text-lg font-semibold text-rose-200">Bloom&apos;s Taxonomy</h3>
              <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {Object.entries(pattern.bloom_distribution).map(([level, pct]) => (
                  <div key={level} className="flex items-center gap-2 text-sm">
                    <span className="flex-1 text-slate-300">{level}</span>
                    <span className="font-mono text-white">{String(pct)}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* High Value Topics */}
          {pattern.high_value_topics?.length > 0 && (
            <div className="rounded-xl border border-emerald-400/20 bg-emerald-400/5 p-4">
              <h3 className="text-lg font-semibold text-emerald-300">High Value Topics</h3>
              <div className="mt-2 flex flex-wrap gap-2">
                {pattern.high_value_topics.map((t: string, i: number) => (
                  <span key={i} className="rounded-lg bg-emerald-400/10 px-3 py-1 text-sm text-emerald-200">
                    {t}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Repeat Candidates */}
          {pattern.repeat_candidates?.length > 0 && (
            <div className="rounded-xl border border-amber-400/20 bg-amber-400/5 p-4">
              <h3 className="text-lg font-semibold text-amber-300">Repeat Candidates</h3>
              <p className="mt-1 text-sm text-slate-400">
                {pattern.repeat_candidates.length} question(s) likely to repeat
              </p>
            </div>
          )}

          {/* LLM Analysis */}
          {pattern.analysis && (
            <div className="rounded-xl border border-white/10 bg-slate-900/70 p-4">
              <h3 className="text-lg font-semibold text-rose-200">Detailed Analysis</h3>
              <p className="mt-2 text-sm text-slate-300 whitespace-pre-wrap">{pattern.analysis}</p>
            </div>
          )}

          {/* Study Plan */}
          {pattern.study_plan && (
            <div className="rounded-xl border border-violet-400/20 bg-violet-400/5 p-4">
              <h3 className="text-lg font-semibold text-violet-300">Recommended Study Plan</h3>
              <p className="mt-2 text-sm text-slate-300 whitespace-pre-wrap">{pattern.study_plan}</p>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
