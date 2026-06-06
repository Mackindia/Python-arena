"use client";

import { useMemo, useState } from "react";
import {
  generateEducationalMcq,
  generateEducationalNotes,
  generateEducationalQuestionBank,
  generateEducationalWorksheet,
  listEducationalBooks,
  searchEducationalGlobal,
  searchEducationalKnowledge,
  uploadEducationalBook,
  type EducationalBookRecord,
} from "@/lib/educational-ai";

const SUBJECTS = ["Artificial Intelligence", "Python", "Computer Science"];

function Card({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return (
    <section className="rounded-3xl border border-white/10 bg-slate-900/80 p-6 shadow-[0_18px_70px_rgba(2,6,23,0.35)] backdrop-blur">
      <div className="mb-5">
        <h2 className="text-xl font-bold text-white">{title}</h2>
        <p className="mt-1 text-sm text-slate-400">{description}</p>
      </div>
      {children}
    </section>
  );
}

function JsonPreview({ value }: { value: unknown }) {
  const formatted = useMemo(() => {
    if (!value) return "";
    try {
      return JSON.stringify(value, null, 2);
    } catch {
      return String(value);
    }
  }, [value]);

  if (!formatted) return null;
  return <pre className="max-h-[520px] overflow-auto rounded-2xl border border-white/10 bg-slate-950/90 p-4 text-xs leading-relaxed text-slate-200">{formatted}</pre>;
}

export default function EducationalIntelligenceDashboard() {
  const [books, setBooks] = useState<EducationalBookRecord[]>([]);
  const [status, setStatus] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<unknown>(null);

  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [bookName, setBookName] = useState("");
  const [classLevel, setClassLevel] = useState("11");
  const [subject, setSubject] = useState("Python");

  const [query, setQuery] = useState("Variables");
  const [chapter, setChapter] = useState("");
  const [selectedBookId, setSelectedBookId] = useState("");

  const [topic, setTopic] = useState("Variables");
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("medium");
  const [count, setCount] = useState(10);

  async function refreshBooks() {
    setLoading(true);
    setStatus("Loading book registry...");
    try {
      const data = await listEducationalBooks();
      setBooks(data);
      setStatus(`Loaded ${data.length} books.`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Failed to load books");
    } finally {
      setLoading(false);
    }
  }

  async function handleUpload() {
    if (!uploadFile) {
      setStatus("Select a PDF first.");
      return;
    }

    const form = new FormData();
    form.append("file", uploadFile);
    form.append("book_name", bookName);
    form.append("class_level", classLevel);
    form.append("subject", subject);
    if (selectedBookId) form.append("book_id", selectedBookId);

    setLoading(true);
    setStatus("Uploading and indexing PDF...");
    try {
      const data = await uploadEducationalBook(form);
      setResult(data);
      setStatus(`Indexed ${data.book_id} with ${data.chunks} chunks.`);
      await refreshBooks();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Upload failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleSearch(global = false) {
    setLoading(true);
    setStatus(global ? "Running global search..." : "Running subject-aware search...");
    try {
      const data = global
        ? await searchEducationalGlobal(query)
        : await searchEducationalKnowledge({
            class_level: classLevel,
            subject,
            query,
            chapter: chapter || undefined,
            book_id: selectedBookId || undefined,
            k: 10,
          });
      setResult(data);
      setStatus(global ? "Global search complete." : "Search complete.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Search failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleGenerate(kind: "notes" | "mcq" | "bank" | "worksheet") {
    setLoading(true);
    setStatus(`Generating ${kind}...`);
    try {
      const payload = {
        class_level: classLevel,
        subject,
        topic,
        book_id: selectedBookId || undefined,
      };

      const data =
        kind === "notes"
          ? await generateEducationalNotes(payload)
          : kind === "mcq"
            ? await generateEducationalMcq({ ...payload, difficulty, count })
            : kind === "bank"
              ? await generateEducationalQuestionBank({ ...payload, count: Math.max(50, count * 10) })
              : await generateEducationalWorksheet(payload);

      setResult(data);
      setStatus(`${kind} generation complete.`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Generation failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(34,197,94,0.12),_transparent_30%),linear-gradient(180deg,#020617_0%,#0f172a_45%,#111827_100%)] px-4 py-8 text-white sm:px-6 lg:px-10">
      <div className="mx-auto max-w-7xl space-y-8">
        <header className="overflow-hidden rounded-[2rem] border border-emerald-400/20 bg-slate-950/70 p-8 shadow-[0_24px_100px_rgba(2,6,23,0.5)]">
          <div className="grid gap-8 lg:grid-cols-[1.35fr_0.65fr] lg:items-end">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-emerald-300">Educational Intelligence Engine</p>
              <h1 className="mt-3 text-4xl font-black leading-tight sm:text-5xl">Search, generate, and validate knowledge across multiple books.</h1>
              <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-300 sm:text-base">
                Upload AI, Python, and Computer Science books once. Then search by class, subject, topic, or chapter and generate notes, MCQs, question banks, and worksheets from grounded textbook context.
              </p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/5 p-4 text-sm text-slate-300">
              <div className="grid grid-cols-2 gap-3 text-center">
                <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-4">
                  <div className="text-xs uppercase tracking-[0.2em] text-slate-500">Subjects</div>
                  <div className="mt-2 text-2xl font-bold text-emerald-300">3+</div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-4">
                  <div className="text-xs uppercase tracking-[0.2em] text-slate-500">Scale</div>
                  <div className="mt-2 text-2xl font-bold text-cyan-300">10k+</div>
                </div>
              </div>
              <p className="mt-4 text-xs leading-6 text-slate-400">Uses the FastAPI educational backend at <span className="text-slate-200">NEXT_PUBLIC_EDUCATIONAL_AI_API_URL</span> or <span className="text-slate-200">http://localhost:8000</span>.</p>
            </div>
          </div>
        </header>

        <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
          <Card title="Upload Books" description="Index a textbook PDF once and store it with subject and chapter metadata.">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-2 text-sm">
                <span className="text-slate-300">Book name</span>
                <input value={bookName} onChange={(e) => setBookName(e.target.value)} className="w-full rounded-xl border border-white/10 bg-slate-950/90 px-3 py-2.5 text-sm text-white outline-none placeholder:text-slate-600" placeholder="Class 11 Python Handbook" />
              </label>
              <label className="space-y-2 text-sm">
                <span className="text-slate-300">Book id</span>
                <input value={selectedBookId} onChange={(e) => setSelectedBookId(e.target.value)} className="w-full rounded-xl border border-white/10 bg-slate-950/90 px-3 py-2.5 text-sm text-white outline-none placeholder:text-slate-600" placeholder="python_class11" />
              </label>
              <label className="space-y-2 text-sm">
                <span className="text-slate-300">Class level</span>
                <input value={classLevel} onChange={(e) => setClassLevel(e.target.value)} className="w-full rounded-xl border border-white/10 bg-slate-950/90 px-3 py-2.5 text-sm text-white outline-none" />
              </label>
              <label className="space-y-2 text-sm">
                <span className="text-slate-300">Subject</span>
                <select value={subject} onChange={(e) => setSubject(e.target.value)} className="w-full rounded-xl border border-white/10 bg-slate-950/90 px-3 py-2.5 text-sm text-white outline-none">
                  {SUBJECTS.map((item) => <option key={item}>{item}</option>)}
                </select>
              </label>
            </div>
            <label className="mt-4 block space-y-2 text-sm">
              <span className="text-slate-300">PDF file</span>
              <input type="file" accept="application/pdf" onChange={(e) => setUploadFile(e.target.files?.[0] || null)} className="block w-full rounded-xl border border-dashed border-white/15 bg-slate-950/80 px-3 py-2.5 text-sm text-slate-300 file:mr-4 file:rounded-lg file:border-0 file:bg-emerald-400 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-slate-950" />
            </label>
            <div className="mt-4 flex flex-wrap gap-3">
              <button disabled={loading} onClick={handleUpload} className="rounded-xl bg-emerald-400 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-70">Upload & Index</button>
              <button disabled={loading} onClick={refreshBooks} className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-70">Refresh Library</button>
            </div>
          </Card>

          <Card title="Search Knowledge" description="Locate the best chapter automatically from class, subject, and topic.">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-2 text-sm sm:col-span-2">
                <span className="text-slate-300">Topic / query</span>
                <input value={query} onChange={(e) => setQuery(e.target.value)} className="w-full rounded-xl border border-white/10 bg-slate-950/90 px-3 py-2.5 text-sm text-white outline-none" placeholder="Variables, Generative AI, Loops..." />
              </label>
              <label className="space-y-2 text-sm">
                <span className="text-slate-300">Chapter filter</span>
                <input value={chapter} onChange={(e) => setChapter(e.target.value)} className="w-full rounded-xl border border-white/10 bg-slate-950/90 px-3 py-2.5 text-sm text-white outline-none" placeholder="optional" />
              </label>
              <label className="space-y-2 text-sm">
                <span className="text-slate-300">Subject</span>
                <select value={subject} onChange={(e) => setSubject(e.target.value)} className="w-full rounded-xl border border-white/10 bg-slate-950/90 px-3 py-2.5 text-sm text-white outline-none">
                  {SUBJECTS.map((item) => <option key={item}>{item}</option>)}
                </select>
              </label>
            </div>
            <div className="mt-4 flex flex-wrap gap-3">
              <button disabled={loading} onClick={() => handleSearch(false)} className="rounded-xl bg-cyan-400 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-70">Search Subject</button>
              <button disabled={loading} onClick={() => handleSearch(true)} className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-70">Global Search</button>
            </div>
          </Card>
        </div>

        <Card title="Generate Content" description="Produce grounded notes and assessment content from retrieved context.">
          <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-2 text-sm">
                <span className="text-slate-300">Class level</span>
                <input value={classLevel} onChange={(e) => setClassLevel(e.target.value)} className="w-full rounded-xl border border-white/10 bg-slate-950/90 px-3 py-2.5 text-sm text-white outline-none" />
              </label>
              <label className="space-y-2 text-sm">
                <span className="text-slate-300">Subject</span>
                <select value={subject} onChange={(e) => setSubject(e.target.value)} className="w-full rounded-xl border border-white/10 bg-slate-950/90 px-3 py-2.5 text-sm text-white outline-none">
                  {SUBJECTS.map((item) => <option key={item}>{item}</option>)}
                </select>
              </label>
              <label className="space-y-2 text-sm sm:col-span-2">
                <span className="text-slate-300">Topic</span>
                <input value={topic} onChange={(e) => setTopic(e.target.value)} className="w-full rounded-xl border border-white/10 bg-slate-950/90 px-3 py-2.5 text-sm text-white outline-none" placeholder="Variables" />
              </label>
              <label className="space-y-2 text-sm">
                <span className="text-slate-300">Difficulty</span>
                <select value={difficulty} onChange={(e) => setDifficulty(e.target.value as typeof difficulty)} className="w-full rounded-xl border border-white/10 bg-slate-950/90 px-3 py-2.5 text-sm text-white outline-none">
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </label>
              <label className="space-y-2 text-sm">
                <span className="text-slate-300">MCQ count</span>
                <input type="number" min={1} max={20} value={count} onChange={(e) => setCount(Number(e.target.value))} className="w-full rounded-xl border border-white/10 bg-slate-950/90 px-3 py-2.5 text-sm text-white outline-none" />
              </label>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-2">
              <button disabled={loading} onClick={() => handleGenerate("notes")} className="rounded-2xl border border-emerald-400/30 bg-emerald-400/10 px-4 py-4 text-sm font-semibold text-emerald-200 transition hover:bg-emerald-400/15">Notes</button>
              <button disabled={loading} onClick={() => handleGenerate("mcq")} className="rounded-2xl border border-cyan-400/30 bg-cyan-400/10 px-4 py-4 text-sm font-semibold text-cyan-200 transition hover:bg-cyan-400/15">MCQs</button>
              <button disabled={loading} onClick={() => handleGenerate("bank")} className="rounded-2xl border border-violet-400/30 bg-violet-400/10 px-4 py-4 text-sm font-semibold text-violet-200 transition hover:bg-violet-400/15">Question Bank</button>
              <button disabled={loading} onClick={() => handleGenerate("worksheet")} className="rounded-2xl border border-amber-400/30 bg-amber-400/10 px-4 py-4 text-sm font-semibold text-amber-200 transition hover:bg-amber-400/15">Worksheet</button>
            </div>
          </div>
        </Card>

        <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
          <Card title="Book Library" description="Books indexed into the educational registry.">
            <div className="max-h-[420px] space-y-3 overflow-auto pr-1">
              {books.length > 0 ? books.map((book) => (
                <div key={book.book_id} className="rounded-2xl border border-white/10 bg-slate-950/70 p-4 text-sm text-slate-300">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-semibold text-white">{book.book_name}</div>
                      <div className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-500">{book.subject} · Class {book.class_level}</div>
                    </div>
                    <div className="rounded-full border border-white/10 px-2 py-1 text-xs text-slate-400">{book.chunk_count} chunks</div>
                  </div>
                  <div className="mt-3 text-xs text-slate-500">{book.book_id}</div>
                </div>
              )) : <p className="text-sm text-slate-500">No books indexed yet. Upload a PDF to start building the library.</p>}
            </div>
          </Card>

          <Card title="Latest Output" description="Structured JSON returned by search and generation endpoints.">
            {status ? <div className="mb-4 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-300">{status}</div> : null}
            <JsonPreview value={result} />
          </Card>
        </div>
      </div>
    </div>
  );
}
