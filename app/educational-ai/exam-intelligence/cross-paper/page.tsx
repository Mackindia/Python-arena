"use client";

import { useEffect, useState } from "react";
import {
  listSolvedPapers,
  analyzeCrossPaper,
  type EducationalBookRecord,
} from "@/lib/educational-ai";

export default function CrossPaperAnalysisPage() {
  const [papers, setPapers] = useState<any[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    listSolvedPapers()
      .then((res) => setPapers(res.papers || []))
      .catch(() => {});
  }, []);

  function toggle(id: string) {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  async function handleAnalyze() {
    if (selected.length < 2) {
      setError("Select at least 2 papers to compare.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const result = await analyzeCrossPaper({ paper_ids: selected });
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Analysis failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
      <h2 className="text-2xl font-semibold">Cross-Paper Analysis</h2>
      <p className="mt-1 text-sm text-slate-400">
        Compare 2–20 saved papers to find common questions, topic frequency, difficulty consistency, and repeat predictions.
      </p>

      {papers.length === 0 ? (
        <p className="mt-4 text-sm text-slate-500 italic">
          No saved papers found. Solve or generate some papers first.
        </p>
      ) : (
        <>
          <div className="mt-4 max-h-64 overflow-y-auto rounded-xl border border-white/10 bg-slate-950/50 p-3">
            {papers.map((p) => (
              <label
                key={p.paper_id}
                className="flex items-center gap-3 rounded-lg px-2 py-1.5 text-sm hover:bg-white/5 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={selected.includes(p.paper_id)}
                  onChange={() => toggle(p.paper_id)}
                  className="rounded"
                />
                <span className="text-white">{p.paper_id}</span>
                <span className="text-xs text-slate-500">
                  {p.class_level} · {p.subject} · {p.source}
                </span>
              </label>
            ))}
          </div>

          <button
            onClick={handleAnalyze}
            disabled={loading || selected.length < 2}
            className="mt-4 rounded-xl bg-violet-400 px-4 py-2.5 font-semibold text-slate-950 disabled:opacity-70"
          >
            {loading ? "Analyzing..." : `Compare ${selected.length} Papers`}
          </button>
        </>
      )}

      {error && <p className="mt-3 text-sm text-rose-300">{error}</p>}

      {data && (
        <div className="mt-6 space-y-6">
          {/* Common Questions */}
          {data.common_questions?.length > 0 && (
            <div className="rounded-xl border border-white/10 bg-slate-900/70 p-4">
              <h3 className="text-lg font-semibold text-violet-200">Common Questions</h3>
              <div className="mt-3 space-y-2">
                {data.common_questions.map((q: any, i: number) => (
                  <div key={i} className="rounded-lg bg-slate-950/50 p-3 text-sm">
                    <p className="text-slate-200">{q.question}</p>
                    <div className="mt-1 flex gap-2 text-xs text-slate-400">
                      <span>{q.marks} marks</span>
                      <span>·</span>
                      <span>Appeared in {q.appeared_in} papers</span>
                      {q.similarity != null && (
                        <>
                          <span>·</span>
                          <span>{(q.similarity * 100).toFixed(0)}% match</span>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Topic Frequency */}
          {data.topic_frequency && Object.keys(data.topic_frequency).length > 0 && (
            <div className="rounded-xl border border-white/10 bg-slate-900/70 p-4">
              <h3 className="text-lg font-semibold text-violet-200">Topic Frequency</h3>
              <div className="mt-3 space-y-1">
                {Object.entries(data.topic_frequency)
                  .sort(([, a]: any, [, b]: any) => (b.count || 0) - (a.count || 0))
                  .map(([topic, info]: any) => (
                    <div key={topic} className="flex items-center gap-3 text-sm">
                      <span className="flex-1 text-slate-200">{topic}</span>
                      <span className="text-violet-300">{info.count}x</span>
                      {info.total_marks != null && (
                        <span className="text-xs text-slate-500">{info.total_marks} marks avg</span>
                      )}
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Difficulty Consistency */}
          {data.difficulty_consistency && (
            <div className="rounded-xl border border-white/10 bg-slate-900/70 p-4">
              <h3 className="text-lg font-semibold text-violet-200">Difficulty Consistency</h3>
              <pre className="mt-2 text-xs text-slate-400 whitespace-pre-wrap">
                {JSON.stringify(data.difficulty_consistency, null, 2)}
              </pre>
            </div>
          )}

          {/* Repeat Prediction */}
          {data.repeat_prediction && (
            <div className="rounded-xl border border-amber-400/20 bg-amber-400/5 p-4">
              <h3 className="text-lg font-semibold text-amber-300">Repeat Prediction</h3>
              <pre className="mt-2 text-xs text-slate-400 whitespace-pre-wrap">
                {JSON.stringify(data.repeat_prediction, null, 2)}
              </pre>
            </div>
          )}

          {/* Study Plan */}
          {data.study_plan && (
            <div className="rounded-xl border border-emerald-400/20 bg-emerald-400/5 p-4">
              <h3 className="text-lg font-semibold text-emerald-300">Study Plan</h3>
              {data.study_plan.must_prepare?.length > 0 && (
                <div className="mt-2">
                  <p className="text-xs font-semibold text-emerald-300 mb-1">Must Prepare</p>
                  <ul className="list-disc space-y-0.5 pl-4 text-sm text-slate-300">
                    {data.study_plan.must_prepare.map((t: string, i: number) => (
                      <li key={i}>{t}</li>
                    ))}
                  </ul>
                </div>
              )}
              {data.study_plan.should_prepare?.length > 0 && (
                <div className="mt-2">
                  <p className="text-xs font-semibold text-amber-300 mb-1">Should Prepare</p>
                  <ul className="list-disc space-y-0.5 pl-4 text-sm text-slate-300">
                    {data.study_plan.should_prepare.map((t: string, i: number) => (
                      <li key={i}>{t}</li>
                    ))}
                  </ul>
                </div>
              )}
              {data.study_plan.low_priority?.length > 0 && (
                <div className="mt-2">
                  <p className="text-xs font-semibold text-slate-400 mb-1">Low Priority</p>
                  <ul className="list-disc space-y-0.5 pl-4 text-sm text-slate-400">
                    {data.study_plan.low_priority.map((t: string, i: number) => (
                      <li key={i}>{t}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Chapter Importance */}
          {data.chapter_importance?.length > 0 && (
            <div className="rounded-xl border border-white/10 bg-slate-900/70 p-4">
              <h3 className="text-lg font-semibold text-violet-200">Chapter Importance</h3>
              <div className="mt-3 space-y-1">
                {data.chapter_importance.map((c: any, i: number) => (
                  <div key={i} className="flex items-center gap-3 text-sm">
                    <span className="w-6 text-right text-slate-500">{i + 1}.</span>
                    <span className="flex-1 text-slate-200">{c.chapter || c.topic}</span>
                    {c.importance_score != null && (
                      <span className="text-violet-300 font-mono text-xs">{c.importance_score}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
