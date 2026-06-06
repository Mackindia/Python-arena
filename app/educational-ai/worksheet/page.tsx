"use client";

import { useState } from "react";
import { generateWorksheet } from "@/src/services/educationalAI";

export default function EducationalAIWorksheetPage() {
  const [classLevel, setClassLevel] = useState("11");
  const [subject, setSubject] = useState("Python");
  const [topic, setTopic] = useState("Variables");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [worksheet, setWorksheet] = useState<any>(null);

  async function onGenerate(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const data = await generateWorksheet({ classLevel, subject, topic });
      setWorksheet(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate worksheet");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
      <h2 className="text-2xl font-semibold">Generate Worksheet</h2>
      <form className="mt-4 grid gap-4 sm:grid-cols-3" onSubmit={onGenerate}>
        <input value={classLevel} onChange={(e) => setClassLevel(e.target.value)} className="rounded-xl border border-white/10 bg-slate-950 px-3 py-2.5" placeholder="Class" />
        <input value={subject} onChange={(e) => setSubject(e.target.value)} className="rounded-xl border border-white/10 bg-slate-950 px-3 py-2.5" placeholder="Subject" />
        <input value={topic} onChange={(e) => setTopic(e.target.value)} className="rounded-xl border border-white/10 bg-slate-950 px-3 py-2.5" placeholder="Topic" />
        <button disabled={loading} className="sm:col-span-3 rounded-xl bg-cyan-400 px-4 py-2.5 font-semibold text-slate-950 disabled:opacity-70">{loading ? "Generating..." : "Generate Worksheet"}</button>
      </form>
      {error ? <p className="mt-4 text-sm text-rose-300">{error}</p> : null}

      {worksheet ? (
        <article className="mt-6 rounded-xl border border-white/10 bg-slate-900/70 p-4">
          <div className="mb-3 flex gap-2">
            <button onClick={() => window.print()} className="rounded-lg border border-white/10 px-3 py-2 text-sm">Print</button>
            <button onClick={() => navigator.clipboard.writeText(JSON.stringify(worksheet, null, 2))} className="rounded-lg border border-white/10 px-3 py-2 text-sm">Copy JSON</button>
          </div>
          <pre className="max-h-[520px] overflow-auto text-xs text-slate-200">{JSON.stringify(worksheet, null, 2)}</pre>
        </article>
      ) : null}
    </section>
  );
}
