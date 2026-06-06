"use client";

import { useState } from "react";
import { searchTopic } from "@/src/services/educationalAI";

export default function EducationalAISearchPage() {
  const [form, setForm] = useState({ classLevel: "11", subject: "Python", query: "Variables", chapter: "", bookId: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<any>(null);

  async function onSearch(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const data = await searchTopic({
        classLevel: form.classLevel,
        subject: form.subject,
        query: form.query,
        chapter: form.chapter,
        bookId: form.bookId,
        k: 10,
      });
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Search failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
      <h2 className="text-2xl font-semibold">Knowledge Search</h2>
      <p className="mt-1 text-sm text-slate-300">Find chapter context automatically by class, subject, and topic.</p>

      <form className="mt-5 grid gap-4 sm:grid-cols-2" onSubmit={onSearch}>
        <input value={form.classLevel} onChange={(e) => setForm((p) => ({ ...p, classLevel: e.target.value }))} className="rounded-xl border border-white/10 bg-slate-950 px-3 py-2.5" placeholder="Class" />
        <input value={form.subject} onChange={(e) => setForm((p) => ({ ...p, subject: e.target.value }))} className="rounded-xl border border-white/10 bg-slate-950 px-3 py-2.5" placeholder="Subject" list="subjects" />
        <datalist id="subjects">
          <option>Artificial Intelligence</option>
          <option>Python</option>
          <option>Computer Science</option>
        </datalist>
        <input value={form.query} onChange={(e) => setForm((p) => ({ ...p, query: e.target.value }))} className="sm:col-span-2 rounded-xl border border-white/10 bg-slate-950 px-3 py-2.5" placeholder="Topic" />
        <input value={form.chapter} onChange={(e) => setForm((p) => ({ ...p, chapter: e.target.value }))} className="rounded-xl border border-white/10 bg-slate-950 px-3 py-2.5" placeholder="Chapter (optional)" />
        <input value={form.bookId} onChange={(e) => setForm((p) => ({ ...p, bookId: e.target.value }))} className="rounded-xl border border-white/10 bg-slate-950 px-3 py-2.5" placeholder="Book ID (optional)" />
        <button disabled={loading} className="sm:col-span-2 rounded-xl bg-cyan-400 px-4 py-2.5 font-semibold text-slate-950 disabled:opacity-70">{loading ? "Searching..." : "Search"}</button>
      </form>

      {error ? <p className="mt-4 text-sm text-rose-300">{error}</p> : null}

      {result?.results?.length ? (
        <div className="mt-6 space-y-3">
          {result.results.map((item: any, idx: number) => (
            <article key={`${item.book_id}-${item.page}-${idx}`} className="rounded-xl border border-white/10 bg-slate-900/70 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-semibold text-cyan-200">{item.book_name} • {item.chapter}</p>
                <p className="text-xs text-slate-400">Score: {typeof item.rerank_score === "number" ? item.rerank_score.toFixed(3) : "N/A"}</p>
              </div>
              <p className="mt-2 text-xs text-slate-400">Class {item.class_level} • Page {item.page}</p>
              <p className="mt-2 text-sm text-slate-200">{item.snippet || "No snippet available."}</p>
            </article>
          ))}
        </div>
      ) : result ? <p className="mt-4 text-sm text-slate-400">No results found.</p> : null}
    </section>
  );
}
