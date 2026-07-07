"use client";

import { useEffect, useState } from "react";
import {
  listSolvedPapers,
  deleteSolvedPaper,
  exportPaper,
} from "@/lib/educational-ai";

export default function SavedPapersPage() {
  const [papers, setPapers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filterClass, setFilterClass] = useState("");
  const [filterSubject, setFilterSubject] = useState("");

  async function loadPapers() {
    setLoading(true);
    try {
      const res = await listSolvedPapers({
        class_level: filterClass || undefined,
        subject: filterSubject || undefined,
      });
      setPapers(res.papers || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load papers");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPapers();
  }, []);

  async function handleDelete(paperId: string) {
    if (!confirm("Delete this paper?")) return;
    try {
      await deleteSolvedPaper(paperId);
      setPapers((prev) => prev.filter((p) => p.paper_id !== paperId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
    }
  }

  async function handleExport(paperId: string, format: "pdf" | "docx" | "txt") {
    try {
      await exportPaper({ paper_id: paperId, format });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Export failed");
    }
  }

  const classes = [...new Set(papers.map((p) => p.class_level).filter(Boolean))];
  const subjects = [...new Set(papers.map((p) => p.subject).filter(Boolean))];

  return (
    <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
      <h2 className="text-2xl font-semibold">Saved Papers</h2>
      <p className="mt-1 text-sm text-slate-400">
        View, filter, export, and manage all your saved solved papers.
      </p>

      {/* Filters */}
      <div className="mt-4 grid gap-3 sm:grid-cols-4">
        <select
          value={filterClass}
          onChange={(e) => setFilterClass(e.target.value)}
          className="rounded-xl border border-white/10 bg-slate-950 px-3 py-2.5 text-sm"
        >
          <option value="">All Classes</option>
          {classes.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <select
          value={filterSubject}
          onChange={(e) => setFilterSubject(e.target.value)}
          className="rounded-xl border border-white/10 bg-slate-950 px-3 py-2.5 text-sm"
        >
          <option value="">All Subjects</option>
          {subjects.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <button
          onClick={loadPapers}
          disabled={loading}
          className="rounded-xl bg-slate-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-600 disabled:opacity-70"
        >
          {loading ? "Loading..." : "Apply Filters"}
        </button>
        <button
          onClick={() => { setFilterClass(""); setFilterSubject(""); setTimeout(loadPapers, 0); }}
          className="rounded-xl border border-white/10 px-4 py-2.5 text-sm text-slate-300 hover:border-cyan-400/40"
        >
          Clear
        </button>
      </div>

      {error && <p className="mt-3 text-sm text-rose-300">{error}</p>}

      {/* Paper List */}
      {papers.length === 0 ? (
        <p className="mt-6 text-sm text-slate-500 italic text-center py-8">
          No saved papers found. Solve or generate some papers first.
        </p>
      ) : (
        <div className="mt-6 space-y-3">
          {papers.map((p) => (
            <div
              key={p.paper_id}
              className="rounded-xl border border-white/10 bg-slate-900/70 p-4"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-white truncate">{p.paper_id}</p>
                  <div className="mt-1 flex flex-wrap gap-2 text-xs text-slate-400">
                    {p.class_level && <span className="rounded bg-white/10 px-2 py-0.5">{p.class_level}</span>}
                    {p.subject && <span className="rounded bg-white/10 px-2 py-0.5">{p.subject}</span>}
                    {p.source && <span className="rounded bg-white/10 px-2 py-0.5">{p.source}</span>}
                    {p.saved_at && (
                      <span className="text-slate-500">
                        {new Date(p.saved_at).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex shrink-0 gap-2">
                  <button
                    onClick={() => handleExport(p.paper_id, "pdf")}
                    className="rounded-lg border border-white/10 px-2 py-1 text-xs hover:border-cyan-400/40"
                  >
                    PDF
                  </button>
                  <button
                    onClick={() => handleExport(p.paper_id, "docx")}
                    className="rounded-lg border border-white/10 px-2 py-1 text-xs hover:border-cyan-400/40"
                  >
                    DOCX
                  </button>
                  <button
                    onClick={() => handleExport(p.paper_id, "txt")}
                    className="rounded-lg border border-white/10 px-2 py-1 text-xs hover:border-cyan-400/40"
                  >
                    TXT
                  </button>
                  <button
                    onClick={() => handleDelete(p.paper_id)}
                    className="rounded-lg border border-rose-400/30 px-2 py-1 text-xs text-rose-300 hover:border-rose-400/60 hover:bg-rose-400/10"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <p className="mt-4 text-xs text-slate-500 text-center">
        Showing {papers.length} paper(s)
      </p>
    </section>
  );
}
