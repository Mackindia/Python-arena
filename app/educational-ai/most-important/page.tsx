"use client";

import { useState } from "react";
import { getMostImportantQuestions } from "@/lib/educational-ai";

export default function MostImportantPage() {
  const [classLevel, setClassLevel] = useState("");
  const [subject, setSubject] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [data, setData] = useState<any>(null);

  async function handleAnalyze() {
    setLoading(true);
    setError("");
    try {
      const result = await getMostImportantQuestions({
        class_level: classLevel || undefined,
        subject: subject || undefined,
      });
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to analyze");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
      <h2 className="text-2xl font-semibold">Most Important Questions</h2>
      <p className="mt-1 text-sm text-slate-400">
        Analyze all saved papers to find the most frequently repeated and highest-weightage questions.
      </p>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <input
          value={classLevel}
          onChange={(e) => setClassLevel(e.target.value)}
          className="rounded-xl border border-white/10 bg-slate-950 px-3 py-2.5"
          placeholder="Class (e.g. 12)"
        />
        <input
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          className="rounded-xl border border-white/10 bg-slate-950 px-3 py-2.5"
          placeholder="Subject (e.g. Biology)"
        />
        <button
          onClick={handleAnalyze}
          disabled={loading}
          className="rounded-xl bg-emerald-400 px-4 py-2.5 font-semibold text-slate-950 disabled:opacity-70"
        >
          {loading ? "Analyzing..." : "Find Important Questions"}
        </button>
      </div>

      {error && <p className="mt-3 text-sm text-rose-300">{error}</p>}

      {data && (
        <div className="mt-6 space-y-6">
          <p className="text-sm text-slate-400">
            Based on <span className="text-white font-medium">{data.papers_analyzed}</span> saved paper(s)
          </p>

          {data.most_important_questions?.length > 0 ? (
            <div className="space-y-3">
              {data.most_important_questions.map((q: any, i: number) => (
                <div
                  key={i}
                  className="rounded-xl border border-white/10 bg-slate-900/70 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <p className="text-sm text-slate-200">
                        <span className="text-cyan-400 font-mono text-xs mr-2">#{i + 1}</span>
                        {q.question}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-400">
                        <span className="rounded bg-white/10 px-2 py-0.5">{q.marks} marks</span>
                        {q.chapter && (
                          <span className="rounded bg-white/10 px-2 py-0.5">{q.chapter}</span>
                        )}
                        <span className="rounded bg-white/10 px-2 py-0.5">{q.difficulty}</span>
                        <span className="rounded bg-emerald-400/20 px-2 py-0.5 text-emerald-300">
                          Appeared in {q.appeared_in} paper(s) ({q.frequency_pct}%)
                        </span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-lg font-bold text-emerald-400">{q.importance_score}</div>
                      <div className="text-[10px] text-slate-500">importance</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500 italic">
              {data.message || "No questions found. Solve some papers first."}
            </p>
          )}

          {data.topic_importance?.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-slate-300 mb-2">Topic Importance Ranking</h3>
              <div className="space-y-1">
                {data.topic_importance.map((t: any, i: number) => (
                  <div key={i} className="flex items-center gap-3 text-sm">
                    <span className="w-6 text-right text-slate-500">{i + 1}.</span>
                    <span className="flex-1 text-slate-200">{t.chapter || t.topic}</span>
                    {t.importance_score != null && (
                      <span className="text-emerald-400 font-mono text-xs">{t.importance_score}</span>
                    )}
                    {t.repeat_likelihood != null && (
                      <span className="text-amber-400 text-xs">repeat: {t.repeat_likelihood}%</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {data.repeat_prediction && Object.keys(data.repeat_prediction).length > 0 && (
            <div className="rounded-xl border border-amber-400/20 bg-amber-400/5 p-4">
              <h3 className="text-sm font-semibold text-amber-300 mb-2">Repeat Prediction</h3>
              <pre className="text-xs text-slate-400 whitespace-pre-wrap">
                {JSON.stringify(data.repeat_prediction, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
