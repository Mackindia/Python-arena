"use client";

import { useState } from "react";
import { generateNotes } from "@/src/services/educationalAI";

export default function EducationalAINotesPage() {
  const [classLevel, setClassLevel] = useState("11");
  const [subject, setSubject] = useState("Python");
  const [topic, setTopic] = useState("Variables");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notes, setNotes] = useState<any>(null);

  async function onGenerate(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const data = await generateNotes({ classLevel, subject, topic });
      setNotes(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate notes");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
      <h2 className="text-2xl font-semibold">Generate Notes</h2>
      <form className="mt-4 grid gap-4 sm:grid-cols-3" onSubmit={onGenerate}>
        <input value={classLevel} onChange={(e) => setClassLevel(e.target.value)} className="rounded-xl border border-white/10 bg-slate-950 px-3 py-2.5" placeholder="Class" />
        <input value={subject} onChange={(e) => setSubject(e.target.value)} className="rounded-xl border border-white/10 bg-slate-950 px-3 py-2.5" placeholder="Subject" list="subjects" />
        <input value={topic} onChange={(e) => setTopic(e.target.value)} className="rounded-xl border border-white/10 bg-slate-950 px-3 py-2.5" placeholder="Topic" />
        <button disabled={loading} className="sm:col-span-3 rounded-xl bg-cyan-400 px-4 py-2.5 font-semibold text-slate-950 disabled:opacity-70">{loading ? "Generating..." : "Generate Notes"}</button>
      </form>
      <datalist id="subjects"><option>Artificial Intelligence</option><option>Python</option><option>Computer Science</option></datalist>

      <div className="mt-4 flex gap-3">
        <button onClick={() => navigator.clipboard.writeText(JSON.stringify(notes || {}, null, 2))} className="rounded-lg border border-white/10 px-3 py-2 text-sm">Copy</button>
        <button onClick={() => window.print()} className="rounded-lg border border-white/10 px-3 py-2 text-sm">Print</button>
      </div>

      {error ? <p className="mt-4 text-sm text-rose-300">{error}</p> : null}
      {notes ? (
        <article className="mt-5 rounded-xl border border-white/10 bg-slate-900/70 p-5">
          <h3 className="text-xl font-semibold text-cyan-200">{notes.title}</h3>
          <p className="mt-3 text-sm text-slate-200">{notes.summary}</p>

          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <div>
              <h4 className="font-semibold">Key Concepts</h4>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-300">
                {(notes.key_concepts || []).map((item: any, idx: number) => (
                  <li key={idx}>{item.heading || item}</li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-semibold">Important Points</h4>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-300">
                {(notes.important_points || []).map((item: string, idx: number) => <li key={idx}>{item}</li>)}
              </ul>
            </div>
          </div>

          <div className="mt-4">
            <h4 className="font-semibold">Revision Notes</h4>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-300">
              {(notes.revision_notes || []).map((item: string, idx: number) => <li key={idx}>{item}</li>)}
            </ul>
          </div>
        </article>
      ) : null}
    </section>
  );
}
