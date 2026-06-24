"use client";

import { useState } from "react";
import { uploadBook } from "@/src/services/educationalAI";

export default function EducationalAIUploadPage() {
  const [bookName, setBookName] = useState("");
  const [classLevel, setClassLevel] = useState("11");
  const [subject, setSubject] = useState("Python");
  const [bookId, setBookId] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<any>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) {
      setError("Please select a PDF file.");
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);
    try {
      const data = await uploadBook({ file, bookName, classLevel, subject, bookId });
      setResult(data);
    } catch (err: any) {
      if (err?.name === "AbortError") {
        setError("Upload timed out. The file may be too large — try a smaller PDF.");
      } else {
        setError(err instanceof Error ? err.message : "Upload failed");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
      <h2 className="text-2xl font-semibold">Upload Books</h2>
      <p className="mt-1 text-sm text-slate-300">Upload textbook PDFs and index them once for permanent retrieval.</p>

      <form className="mt-5 grid gap-4 sm:grid-cols-2" onSubmit={onSubmit}>
        <input value={bookName} onChange={(e) => setBookName(e.target.value)} className="rounded-xl border border-white/10 bg-slate-950 px-3 py-2.5" placeholder="Book Name" required />
        <input value={bookId} onChange={(e) => setBookId(e.target.value)} className="rounded-xl border border-white/10 bg-slate-950 px-3 py-2.5" placeholder="Book ID (optional)" />
        <input value={classLevel} onChange={(e) => setClassLevel(e.target.value)} className="rounded-xl border border-white/10 bg-slate-950 px-3 py-2.5" placeholder="Class Level" required />
        <input value={subject} onChange={(e) => setSubject(e.target.value)} className="rounded-xl border border-white/10 bg-slate-950 px-3 py-2.5" placeholder="Subject" list="subjects" required />
        <datalist id="subjects"><option>Artificial Intelligence</option><option>Python</option><option>Computer Science</option></datalist>
        <input type="file" accept="application/pdf" onChange={(e) => setFile(e.target.files?.[0] || null)} className="sm:col-span-2 rounded-xl border border-dashed border-white/20 bg-slate-950 px-3 py-2.5 text-sm" required />
        <button disabled={loading} className="sm:col-span-2 rounded-xl bg-cyan-400 px-4 py-2.5 font-semibold text-slate-950 disabled:opacity-70">{loading ? "Uploading & indexing (may take 1-2 min for large PDFs)..." : "Upload & Index"}</button>
      </form>

      {error ? <p className="mt-4 text-sm text-rose-300">{error}</p> : null}
      {result ? (
        <article className="mt-5 rounded-xl border border-emerald-400/30 bg-emerald-400/10 p-4 text-sm text-emerald-100">
          <p className="font-semibold">Upload successful</p>
          <p className="mt-2">Book ID: {result.book_id}</p>
          <p>Chunks indexed: {result.chunks}</p>
          <p>Status: {String(result.success)}</p>
        </article>
      ) : null}
    </section>
  );
}
