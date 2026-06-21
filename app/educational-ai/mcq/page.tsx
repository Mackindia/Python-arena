"use client";

import { useMemo, useState } from "react";
import { generateMCQs, type EducationalBookRecord } from "@/lib/educational-ai";
import BookSelector from "@/src/components/educational-ai/BookSelector";

function downloadJSON(filename: string, payload: unknown) {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const href = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = href;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(href);
}

export default function EducationalAIMCQPage() {
  const [classLevel, setClassLevel] = useState("");
  const [subject, setSubject] = useState("");
  const [topic, setTopic] = useState("");
  const [bookId, setBookId] = useState("");
  const [difficulty, setDifficulty] = useState("medium");
  const [count, setCount] = useState(10);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [data, setData] = useState<any>(null);

  const questions = useMemo(() => data?.questions || [], [data]);

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
      const result = await generateMCQs({ class_level: classLevel, subject, topic, difficulty, count, book_id: bookId || undefined });
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate MCQs");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
      <h2 className="text-2xl font-semibold">Generate MCQs</h2>
      <p className="mt-1 text-sm text-slate-400">Select your uploaded book first, then enter a topic from that book.</p>
      <form className="mt-4 grid gap-4 sm:grid-cols-5" onSubmit={onGenerate}>
        <BookSelector selectedBookId={bookId} onSelectBook={handleSelectBook} />
        <input value={classLevel} onChange={(e) => setClassLevel(e.target.value)} className="rounded-xl border border-white/10 bg-slate-950 px-3 py-2.5" placeholder="Class (auto-filled)" />
        <input value={subject} onChange={(e) => setSubject(e.target.value)} className="rounded-xl border border-white/10 bg-slate-950 px-3 py-2.5" placeholder="Subject (auto-filled)" />
        <input value={topic} onChange={(e) => setTopic(e.target.value)} className="rounded-xl border border-white/10 bg-slate-950 px-3 py-2.5" placeholder="Topic (e.g. Computational Thinking)" required />
        <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)} className="rounded-xl border border-white/10 bg-slate-950 px-3 py-2.5"><option>easy</option><option>medium</option><option>hard</option></select>
        <input type="number" min={1} max={20} value={count} onChange={(e) => setCount(Number(e.target.value))} className="rounded-xl border border-white/10 bg-slate-950 px-3 py-2.5" />
        <button disabled={loading} className="sm:col-span-5 rounded-xl bg-cyan-400 px-4 py-2.5 font-semibold text-slate-950 disabled:opacity-70">{loading ? "Generating..." : "Generate MCQs"}</button>
      </form>

      {error ? <p className="mt-4 text-sm text-rose-300">{error}</p> : null}

      {questions.length ? (
        <div className="mt-5 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-300">{questions.length} questions generated</p>
            <button onClick={() => downloadJSON("mcqs.json", data)} className="rounded-lg border border-white/10 px-3 py-2 text-sm">Export JSON</button>
          </div>
          {questions.map((q: any, idx: number) => (
            <article key={idx} className="rounded-xl border border-white/10 bg-slate-900/70 p-4">
              <p className="font-medium text-white">{idx + 1}. {q.question}</p>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-300">
                {(q.options || []).map((opt: string, i: number) => <li key={i}>{opt}</li>)}
              </ul>
              <p className="mt-3 text-sm text-emerald-300">Answer: {q.answer}</p>
              <p className="mt-1 text-sm text-slate-300">Explanation: {q.explanation}</p>
            </article>
          ))}
        </div>
      ) : null}
    </section>
  );
}
