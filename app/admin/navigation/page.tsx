"use client";

import { useState, useEffect, useCallback } from "react";

interface Subject {
  _id: string;
  name: string;
  slug: string;
  description: string;
}

interface ClassItem {
  _id: string;
  name: string;
  slug: string;
  subject: string;
}

export default function NavigationManager() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Subject form
  const [subjectName, setSubjectName] = useState("");
  const [subjectDesc, setSubjectDesc] = useState("");
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);

  // Class form
  const [className, setClassName] = useState("");
  const [classSubjectId, setClassSubjectId] = useState("");
  const [editingClass, setEditingClass] = useState<ClassItem | null>(null);

  const fetchAll = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const [subRes, clsRes] = await Promise.all([
        fetch("/api/lms/subjects", { cache: "no-store" }),
        fetch("/api/lms/classes", { cache: "no-store" }),
      ]);
      const subData = await subRes.json();
      const clsData = await clsRes.json();
      setSubjects(subData.subjects || []);
      setClasses(clsData.classes || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  function flash(msg: string) {
    setSuccess(msg);
    setTimeout(() => setSuccess(""), 3000);
  }

  // ── Subject CRUD ──
  async function saveSubject(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    try {
      if (editingSubject) {
        const res = await fetch("/api/lms/subjects", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ _id: editingSubject._id, name: subjectName, description: subjectDesc }),
        });
        if (!res.ok) { const d = await res.json(); throw new Error(d.message); }
        flash("Subject updated");
      } else {
        const res = await fetch("/api/lms/subjects", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: subjectName, description: subjectDesc }),
        });
        if (!res.ok) { const d = await res.json(); throw new Error(d.message); }
        flash("Subject created");
      }
      setSubjectName(""); setSubjectDesc(""); setEditingSubject(null);
      fetchAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    }
  }

  async function deleteSubject(id: string) {
    if (!confirm("Delete this subject and ALL its classes?")) return;
    setError("");
    try {
      const res = await fetch(`/api/lms/subjects?id=${id}`, { method: "DELETE" });
      if (!res.ok) { const d = await res.json(); throw new Error(d.message); }
      flash("Subject deleted");
      fetchAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    }
  }

  // ── Class CRUD ──
  async function saveClass(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    try {
      if (editingClass) {
        const res = await fetch("/api/lms/classes", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ _id: editingClass._id, name: className, subjectId: classSubjectId }),
        });
        if (!res.ok) { const d = await res.json(); throw new Error(d.message); }
        flash("Class updated");
      } else {
        const res = await fetch("/api/lms/classes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: className, subjectId: classSubjectId }),
        });
        if (!res.ok) { const d = await res.json(); throw new Error(d.message); }
        flash("Class created");
      }
      setClassName(""); setClassSubjectId(""); setEditingClass(null);
      fetchAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    }
  }

  async function deleteClass(id: string) {
    if (!confirm("Delete this class?")) return;
    setError("");
    try {
      const res = await fetch(`/api/lms/classes?id=${id}`, { method: "DELETE" });
      if (!res.ok) { const d = await res.json(); throw new Error(d.message); }
      flash("Class deleted");
      fetchAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    }
  }

  if (loading) {
    return <div className="min-h-screen bg-slate-950 p-6 text-center text-cyan-400">Loading navigation data...</div>;
  }

  return (
    <div className="min-h-screen bg-slate-950 p-6">
      <div className="mx-auto max-w-5xl space-y-8">
        <header>
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-cyan-200/90">Learn Engine</p>
          <h1 className="mt-2 text-3xl font-bold text-white">Navigation Manager</h1>
          <p className="mt-2 text-sm text-slate-300">Add, edit, or remove subjects and classes. These appear on the /learn page.</p>
        </header>

        {error && <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">{error}</div>}
        {success && <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-300">{success}</div>}

        {/* ── Subjects ── */}
        <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <h2 className="text-xl font-semibold text-white">Subjects</h2>
          <p className="mt-1 text-sm text-slate-400">These are the top-level tracks (AI, Python, Computer Science, etc.)</p>

          <form onSubmit={saveSubject} className="mt-4 flex flex-wrap gap-3">
            <input
              value={subjectName}
              onChange={(e) => setSubjectName(e.target.value)}
              placeholder="Subject name (e.g. Computer Science)"
              className="flex-1 min-w-[200px] rounded-xl border border-white/10 bg-slate-950 px-4 py-2.5 text-sm text-white placeholder:text-slate-500"
              required
            />
            <input
              value={subjectDesc}
              onChange={(e) => setSubjectDesc(e.target.value)}
              placeholder="Description (optional)"
              className="flex-1 min-w-[200px] rounded-xl border border-white/10 bg-slate-950 px-4 py-2.5 text-sm text-white placeholder:text-slate-500"
            />
            <button type="submit" className="rounded-xl bg-cyan-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-cyan-400">
              {editingSubject ? "Update" : "Add Subject"}
            </button>
            {editingSubject && (
              <button type="button" onClick={() => { setEditingSubject(null); setSubjectName(""); setSubjectDesc(""); }} className="rounded-xl border border-white/10 px-4 py-2.5 text-sm text-slate-300 hover:bg-white/5">
                Cancel
              </button>
            )}
          </form>

          <div className="mt-5 space-y-2">
            {subjects.length === 0 && <p className="text-sm text-slate-500">No subjects yet.</p>}
            {subjects.map((sub) => {
              const subClasses = classes.filter((c) => c.subject === sub._id);
              return (
                <div key={sub._id} className="rounded-xl border border-white/10 bg-slate-900/60 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-medium text-white">{sub.name}</span>
                      <span className="ml-2 rounded-full border border-white/10 px-2 py-0.5 text-[10px] text-slate-400">{sub.slug}</span>
                      {sub.description && <span className="ml-2 text-xs text-slate-500">— {sub.description}</span>}
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => { setEditingSubject(sub); setSubjectName(sub.name); setSubjectDesc(sub.description); }} className="rounded-lg border border-white/10 px-3 py-1 text-xs text-slate-300 hover:bg-white/10">Edit</button>
                      <button onClick={() => deleteSubject(sub._id)} className="rounded-lg border border-red-400/20 px-3 py-1 text-xs text-red-400 hover:bg-red-400/10">Delete</button>
                    </div>
                  </div>
                  {subClasses.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {subClasses.map((cls) => (
                        <span key={cls._id} className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-2.5 py-1 text-xs text-cyan-300">{cls.name}</span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* ── Classes ── */}
        <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <h2 className="text-xl font-semibold text-white">Classes</h2>
          <p className="mt-1 text-sm text-slate-400">Add classes under any subject. These show as links on the /learn page.</p>

          <form onSubmit={saveClass} className="mt-4 flex flex-wrap gap-3">
            <select
              value={classSubjectId}
              onChange={(e) => setClassSubjectId(e.target.value)}
              className="min-w-[180px] rounded-xl border border-white/10 bg-slate-950 px-4 py-2.5 text-sm text-white"
              required
            >
              <option value="">Select subject</option>
              {subjects.map((s) => (
                <option key={s._id} value={s._id}>{s.name}</option>
              ))}
            </select>
            <input
              value={className}
              onChange={(e) => setClassName(e.target.value)}
              placeholder="Class name (e.g. Class 9)"
              className="flex-1 min-w-[200px] rounded-xl border border-white/10 bg-slate-950 px-4 py-2.5 text-sm text-white placeholder:text-slate-500"
              required
            />
            <button type="submit" className="rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-400">
              {editingClass ? "Update" : "Add Class"}
            </button>
            {editingClass && (
              <button type="button" onClick={() => { setEditingClass(null); setClassName(""); setClassSubjectId(""); }} className="rounded-xl border border-white/10 px-4 py-2.5 text-sm text-slate-300 hover:bg-white/5">
                Cancel
              </button>
            )}
          </form>

          <div className="mt-5 space-y-3">
            {subjects.map((sub) => {
              const subClasses = classes.filter((c) => c.subject === sub._id);
              if (subClasses.length === 0) return null;
              return (
                <div key={sub._id}>
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">{sub.name}</p>
                  <div className="space-y-1">
                    {subClasses.map((cls) => (
                      <div key={cls._id} className="flex items-center justify-between rounded-lg border border-white/5 bg-slate-950/50 px-4 py-2">
                        <div>
                          <span className="text-sm text-white">{cls.name}</span>
                          <span className="ml-2 text-[10px] text-slate-500">{cls.slug}</span>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => { setEditingClass(cls); setClassName(cls.name); setClassSubjectId(cls.subject); }} className="rounded-lg border border-white/10 px-3 py-1 text-xs text-slate-300 hover:bg-white/10">Edit</button>
                          <button onClick={() => deleteClass(cls._id)} className="rounded-lg border border-red-400/20 px-3 py-1 text-xs text-red-400 hover:bg-red-400/10">Delete</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
