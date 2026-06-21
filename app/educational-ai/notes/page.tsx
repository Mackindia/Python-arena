"use client";

import { useState } from "react";
import { generateNotes, type EducationalBookRecord } from "@/lib/educational-ai";
import BookSelector from "@/src/components/educational-ai/BookSelector";

export default function EducationalAINotesPage() {
  const [classLevel, setClassLevel] = useState("");
  const [subject, setSubject] = useState("");
  const [topic, setTopic] = useState("");
  const [bookId, setBookId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notes, setNotes] = useState<any>(null);

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
      const data = await generateNotes({ class_level: classLevel, subject, topic, book_id: bookId || undefined });
      setNotes(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate notes");
    } finally {
      setLoading(false);
    }
  }

  function renderItem(item: any, idx: number) {
    if (typeof item === "string") return <li key={idx}>{item}</li>;
    if (item && typeof item === "object") {
      const text = item.heading || item.concept || item.title || item.point || item.text || JSON.stringify(item);
      const desc = item.description || item.detail || item.explanation || "";
      return (
        <li key={idx}>
          <span className="font-medium text-white">{text}</span>
          {desc && <span className="ml-2 text-slate-400">— {desc}</span>}
        </li>
      );
    }
    return <li key={idx}>{String(item)}</li>;
  }

  return (
    <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
      <h2 className="text-2xl font-semibold">Generate Notes</h2>
      <p className="mt-1 text-sm text-slate-400">Select your uploaded book first, then enter a topic from that book.</p>
      <form className="mt-4 grid gap-4 sm:grid-cols-3" onSubmit={onGenerate}>
        <BookSelector selectedBookId={bookId} onSelectBook={handleSelectBook} />
        <input value={classLevel} onChange={(e) => setClassLevel(e.target.value)} className="rounded-xl border border-white/10 bg-slate-950 px-3 py-2.5" placeholder="Class (auto-filled)" />
        <input value={subject} onChange={(e) => setSubject(e.target.value)} className="rounded-xl border border-white/10 bg-slate-950 px-3 py-2.5" placeholder="Subject (auto-filled)" />
        <input value={topic} onChange={(e) => setTopic(e.target.value)} className="rounded-xl border border-white/10 bg-slate-950 px-3 py-2.5" placeholder="Topic (e.g. Patterns in Mathematics)" required />
        <button disabled={loading} className="sm:col-span-3 rounded-xl bg-cyan-400 px-4 py-2.5 font-semibold text-slate-950 disabled:opacity-70">{loading ? "Generating..." : "Generate Notes"}</button>
      </form>

      <div className="mt-4 flex gap-3">
        <button onClick={() => navigator.clipboard.writeText(JSON.stringify(notes || {}, null, 2))} className="rounded-lg border border-white/10 px-3 py-2 text-sm">Copy</button>
        <button onClick={() => window.print()} className="rounded-lg border border-white/10 px-3 py-2 text-sm">Print</button>
      </div>

      {error ? <p className="mt-4 text-sm text-rose-300">{error}</p> : null}
      {notes ? (
        <article className="mt-5 rounded-xl border border-white/10 bg-slate-900/70 p-5">
          <h3 className="text-xl font-semibold text-cyan-200">{notes.title || "Notes"}</h3>
          <p className="mt-3 text-sm text-slate-200">{notes.summary}</p>

          <div className="mt-5 grid gap-5 lg:grid-cols-2">
            <div>
              <h4 className="font-semibold text-emerald-300">Key Concepts</h4>
              <ul className="mt-2 list-disc space-y-2 pl-5 text-sm text-slate-300">
                {(notes.key_concepts || []).map((item: any, idx: number) => renderItem(item, idx))}
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-emerald-300">Important Points</h4>
              <ul className="mt-2 list-disc space-y-2 pl-5 text-sm text-slate-300">
                {(notes.important_points || []).map((item: any, idx: number) => renderItem(item, idx))}
              </ul>
            </div>
          </div>

          {notes.real_world_analogies?.length ? (
            <div className="mt-5 rounded-xl border border-amber-400/20 bg-amber-400/5 p-4">
              <h4 className="font-semibold text-amber-300">Real-World Analogies</h4>
              <ul className="mt-2 list-disc space-y-2 pl-5 text-sm text-slate-300">
                {(notes.real_world_analogies || []).map((item: any, idx: number) => renderItem(item, idx))}
              </ul>
            </div>
          ) : null}

          <div className="mt-5">
            <h4 className="font-semibold text-emerald-300">Revision Notes</h4>
            <ul className="mt-2 list-disc space-y-2 pl-5 text-sm text-slate-300">
              {(notes.revision_notes || []).map((item: any, idx: number) => renderItem(item, idx))}
            </ul>
          </div>
        </article>
      ) : null}
    </section>
  );
}
