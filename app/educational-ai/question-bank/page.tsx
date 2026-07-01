"use client";

import { useMemo, useState } from "react";
import { generateQuestionBank, type EducationalBookRecord } from "@/lib/educational-ai";
import BookSelector from "@/src/components/educational-ai/BookSelector";

export default function EducationalAIQuestionBankPage() {
  const [classLevel, setClassLevel] = useState("");
  const [subject, setSubject] = useState("");
  const [topic, setTopic] = useState("");
  const [bookId, setBookId] = useState("");
  const [count, setCount] = useState(30);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [payload, setPayload] = useState<any>(null);

  const grouped = useMemo(() => {
    const map: Record<string, any[]> = {};
    for (const q of payload?.questions || []) {
      const key = q.type || "other";
      map[key] = map[key] || [];
      map[key].push(q);
    }
    return map;
  }, [payload]);

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
      const data = await generateQuestionBank({ class_level: classLevel, subject, topic, count, book_id: bookId || undefined });
      setPayload(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate question bank");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
      <h2 className="text-2xl font-semibold">Generate Question Bank</h2>
      <p className="mt-1 text-sm text-slate-400">Select your uploaded book first, then enter a topic from that book.</p>
      <form className="mt-4 grid gap-4 sm:grid-cols-4" onSubmit={onGenerate}>
        <BookSelector selectedBookId={bookId} onSelectBook={handleSelectBook} />
        <input value={classLevel} onChange={(e) => setClassLevel(e.target.value)} className="rounded-xl border border-white/10 bg-slate-950 px-3 py-2.5" placeholder="Class (auto-filled)" />
        <input value={subject} onChange={(e) => setSubject(e.target.value)} className="rounded-xl border border-white/10 bg-slate-950 px-3 py-2.5" placeholder="Subject (auto-filled)" />
        <input value={topic} onChange={(e) => setTopic(e.target.value)} className="rounded-xl border border-white/10 bg-slate-950 px-3 py-2.5" placeholder="Topic (e.g. Computational Thinking)" required />
        <input type="number" min={10} max={500} value={count} onChange={(e) => setCount(Number(e.target.value))} className="rounded-xl border border-white/10 bg-slate-950 px-3 py-2.5" />
        <button disabled={loading} className="sm:col-span-4 rounded-xl bg-cyan-400 px-4 py-2.5 font-semibold text-slate-950 disabled:opacity-70">{loading ? "Generating..." : "Generate Question Bank"}</button>
      </form>

      {error ? <p className="mt-4 text-sm text-rose-300">{error}</p> : null}

      {Object.keys(grouped).length ? (
        <div className="mt-6 space-y-5">
          {Object.entries(grouped).map(([type, items]) => (
            <article key={type} className="rounded-xl border border-white/10 bg-slate-900/70 p-4">
              <h3 className="text-lg font-semibold text-cyan-200 capitalize">{type}</h3>
              <ul className="mt-3 list-decimal space-y-2 pl-5 text-sm text-slate-300">
                {items.map((q, idx) => <li key={idx}>{q.question}</li>)}
              </ul>
            </article>
          ))}
        </div>
      ) : null}
    </section>
  );
}
