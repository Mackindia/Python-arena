"use client";

import { useState } from "react";
import { generateEducationalBloom, type EducationalBookRecord } from "@/lib/educational-ai";
import BookSelector from "@/src/components/educational-ai/BookSelector";

const LEVEL_COLORS: Record<string, string> = {
  Remember: "bg-blue-400/10 border-blue-400/30 text-blue-300",
  Understand: "bg-cyan-400/10 border-cyan-400/30 text-cyan-300",
  Apply: "bg-emerald-400/10 border-emerald-400/30 text-emerald-300",
  Analyze: "bg-amber-400/10 border-amber-400/30 text-amber-300",
  Evaluate: "bg-orange-400/10 border-orange-400/30 text-orange-300",
  Create: "bg-rose-400/10 border-rose-400/30 text-rose-300",
};

export default function BloomPage() {
  const [classLevel, setClassLevel] = useState("");
  const [subject, setSubject] = useState("");
  const [topic, setTopic] = useState("");
  const [bookId, setBookId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [data, setData] = useState<any>(null);

  function handleSelectBook(book: EducationalBookRecord) {
    setBookId(book.book_id);
    setClassLevel(book.class_level);
    setSubject(book.subject);
  }

  async function onGenerate(e: React.FormEvent) {
    e.preventDefault();
    if (!classLevel || !subject || !topic) {
      setError("Please select a book and enter a topic.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const result = await generateEducationalBloom({
        class_level: classLevel,
        subject,
        topic,
        book_id: bookId || undefined,
      });
      setData(result.bloom_analysis || result);
    } catch (err: any) {
      setError(err?.name === "AbortError" ? "Timed out." : err instanceof Error ? err.message : "Failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
      <h2 className="text-2xl font-semibold">Bloom&apos;s Taxonomy Analyzer</h2>
      <p className="mt-1 text-sm text-slate-400">Analyze topic coverage across all 6 cognitive levels with sample questions and activities.</p>

      <form className="mt-4 grid gap-4 sm:grid-cols-3" onSubmit={onGenerate}>
        <BookSelector selectedBookId={bookId} onSelectBook={handleSelectBook} />
        <input value={classLevel} onChange={(e) => setClassLevel(e.target.value)} className="rounded-xl border border-white/10 bg-slate-950 px-3 py-2.5" placeholder="Class (auto-filled)" />
        <input value={subject} onChange={(e) => setSubject(e.target.value)} className="rounded-xl border border-white/10 bg-slate-950 px-3 py-2.5" placeholder="Subject (auto-filled)" />
        <input value={topic} onChange={(e) => setTopic(e.target.value)} className="rounded-xl border border-white/10 bg-slate-950 px-3 py-2.5" placeholder="Topic" required />
        <button disabled={loading} className="sm:col-span-3 rounded-xl bg-cyan-400 px-4 py-2.5 font-semibold text-slate-950 disabled:opacity-70">{loading ? "Analyzing Bloom's levels..." : "Analyze Bloom's Taxonomy"}</button>
      </form>

      {error ? <p className="mt-4 text-sm text-rose-300">{error}</p> : null}

      {data ? (
        <div className="mt-6 space-y-5">
          {/* Coverage Map */}
          <div className="rounded-xl border border-white/10 bg-slate-900/70 p-5">
            <h4 className="font-semibold text-cyan-200">Coverage Map</h4>
            <div className="mt-3 grid gap-2 sm:grid-cols-3">
              {Object.entries(data.coverage_map || {}).map(([level, pct]) => (
                <div key={level} className={`rounded-lg border p-3 text-sm ${LEVEL_COLORS[level] || "border-white/10 bg-white/5"}`}>
                  <div className="font-medium">{level}</div>
                  <div className="mt-1 text-xs opacity-70">{String(pct)}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Bloom Levels Detail */}
          {(data.bloom_analysis || []).map((item: any, i: number) => (
            <div key={i} className={`rounded-xl border p-5 ${LEVEL_COLORS[item.level] || "border-white/10 bg-white/5"}`}>
              <h4 className="text-lg font-bold">{item.level}</h4>
              <p className="mt-1 text-sm opacity-80">{item.description}</p>

              <div className="mt-3 grid gap-3 lg:grid-cols-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider opacity-60">Sample Questions</p>
                  <ul className="mt-1 list-disc space-y-1 pl-4 text-sm">
                    {(item.sample_questions || []).map((q: string, j: number) => <li key={j}>{q}</li>)}
                  </ul>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider opacity-60">Activities</p>
                  <ul className="mt-1 list-disc space-y-1 pl-4 text-sm">
                    {(item.suggested_activities || []).map((a: string, j: number) => <li key={j}>{a}</li>)}
                  </ul>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider opacity-60">Assessment</p>
                  <p className="mt-1 text-sm">{item.assessment_strategy}</p>
                </div>
              </div>

              {item.key_verbs?.length ? (
                <div className="mt-3 flex flex-wrap gap-1">
                  {item.key_verbs.map((v: string, j: number) => (
                    <span key={j} className="rounded-full bg-white/10 px-2 py-0.5 text-xs">{v}</span>
                  ))}
                </div>
              ) : null}
            </div>
          ))}

          {/* Gap Analysis */}
          {data.gap_analysis?.length ? (
            <div className="rounded-xl border border-amber-400/20 bg-amber-400/5 p-5">
              <h4 className="font-semibold text-amber-300">Gap Analysis</h4>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-300">
                {data.gap_analysis.map((g: string, i: number) => <li key={i}>{g}</li>)}
              </ul>
            </div>
          ) : null}

          {/* Recommendations */}
          {data.recommendations?.length ? (
            <div className="rounded-xl border border-emerald-400/20 bg-emerald-400/5 p-5">
              <h4 className="font-semibold text-emerald-300">Recommendations</h4>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-300">
                {data.recommendations.map((r: string, i: number) => <li key={i}>{r}</li>)}
              </ul>
            </div>
          ) : null}

          {/* Overall Depth */}
          {data.overall_cognitive_depth ? (
            <div className="rounded-xl border border-white/10 bg-slate-900/70 p-4 text-center">
              <p className="text-xs uppercase tracking-wider text-slate-500">Overall Cognitive Depth</p>
              <p className="mt-2 text-lg font-bold text-cyan-200">{data.overall_cognitive_depth}</p>
            </div>
          ) : null}

          <div className="flex gap-3">
            <button onClick={() => navigator.clipboard.writeText(JSON.stringify(data, null, 2))} className="rounded-lg border border-white/10 px-3 py-2 text-sm">Copy JSON</button>
          </div>
        </div>
      ) : null}
    </section>
  );
}
