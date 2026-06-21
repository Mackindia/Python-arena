"use client";

import { useState } from "react";
import { generateEducationalLessonPlan, type EducationalBookRecord } from "@/lib/educational-ai";
import BookSelector from "@/src/components/educational-ai/BookSelector";

export default function LessonPlanPage() {
  const [classLevel, setClassLevel] = useState("");
  const [subject, setSubject] = useState("");
  const [topic, setTopic] = useState("");
  const [bookId, setBookId] = useState("");
  const [duration, setDuration] = useState(45);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [plan, setPlan] = useState<any>(null);

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
      const data = await generateEducationalLessonPlan({
        class_level: classLevel,
        subject,
        topic,
        duration_minutes: duration,
        book_id: bookId || undefined,
      });
      setPlan(data.lesson_plan || data);
    } catch (err: any) {
      setError(err?.name === "AbortError" ? "Timed out. Try a shorter topic." : err instanceof Error ? err.message : "Failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
      <h2 className="text-2xl font-semibold">Lesson Plan Generator</h2>
      <p className="mt-1 text-sm text-slate-400">Generate a ready-to-teach lesson plan with objectives, activities, and assessment.</p>

      <form className="mt-4 grid gap-4 sm:grid-cols-3" onSubmit={onGenerate}>
        <BookSelector selectedBookId={bookId} onSelectBook={handleSelectBook} />
        <input value={classLevel} onChange={(e) => setClassLevel(e.target.value)} className="rounded-xl border border-white/10 bg-slate-950 px-3 py-2.5" placeholder="Class (auto-filled)" />
        <input value={subject} onChange={(e) => setSubject(e.target.value)} className="rounded-xl border border-white/10 bg-slate-950 px-3 py-2.5" placeholder="Subject (auto-filled)" />
        <input value={topic} onChange={(e) => setTopic(e.target.value)} className="rounded-xl border border-white/10 bg-slate-950 px-3 py-2.5" placeholder="Topic" required />
        <label className="space-y-1 text-sm">
          <span className="text-slate-400">Duration (min)</span>
          <input type="number" min={10} max={180} value={duration} onChange={(e) => setDuration(Number(e.target.value))} className="w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2.5" />
        </label>
        <button disabled={loading} className="sm:col-span-3 rounded-xl bg-cyan-400 px-4 py-2.5 font-semibold text-slate-950 disabled:opacity-70">{loading ? "Generating lesson plan..." : "Generate Lesson Plan"}</button>
      </form>

      {error ? <p className="mt-4 text-sm text-rose-300">{error}</p> : null}

      {plan ? (
        <div className="mt-6 space-y-5">
          <div className="rounded-xl border border-cyan-400/20 bg-cyan-400/5 p-5">
            <h3 className="text-xl font-bold text-cyan-200">{plan.title}</h3>
            <p className="mt-1 text-sm text-slate-400">{plan.subject} | Class {plan.class_level} | {plan.duration_minutes} min</p>
          </div>

          <div className="rounded-xl border border-white/10 bg-slate-900/70 p-5">
            <h4 className="font-semibold text-emerald-300">Learning Objectives</h4>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-300">
              {(plan.learning_objectives || []).map((item: string, i: number) => <li key={i}>{item}</li>)}
            </ul>
          </div>

          {plan.prerequisites?.length ? (
            <div className="rounded-xl border border-white/10 bg-slate-900/70 p-5">
              <h4 className="font-semibold text-emerald-300">Prerequisites</h4>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-300">
                {plan.prerequisites.map((item: string, i: number) => <li key={i}>{item}</li>)}
              </ul>
            </div>
          ) : null}

          <div className="rounded-xl border border-white/10 bg-slate-900/70 p-5">
            <h4 className="font-semibold text-amber-300">Lesson Structure</h4>
            <div className="mt-3 space-y-4">
              {(plan.lesson_structure || []).map((phase: any, i: number) => (
                <div key={i} className="rounded-lg border border-white/10 bg-slate-950/70 p-4">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-cyan-200">{phase.phase}</span>
                    <span className="text-xs text-slate-500">{phase.duration_minutes} min</span>
                  </div>
                  <p className="mt-2 text-sm text-slate-300"><span className="text-slate-500">Teacher:</span> {phase.description}</p>
                  <p className="mt-1 text-sm text-slate-300"><span className="text-slate-500">Students:</span> {phase.student_activity}</p>
                  <p className="mt-1 text-xs text-slate-500">Strategy: {phase.teaching_strategy}</p>
                </div>
              ))}
            </div>
          </div>

          {plan.key_vocab?.length ? (
            <div className="rounded-xl border border-white/10 bg-slate-900/70 p-5">
              <h4 className="font-semibold text-emerald-300">Key Vocabulary</h4>
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                {plan.key_vocab.map((v: any, i: number) => (
                  <div key={i} className="rounded-lg bg-slate-950/70 p-3 text-sm">
                    <span className="font-medium text-white">{v.term}</span>
                    <span className="ml-2 text-slate-400">— {v.definition}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-white/10 bg-slate-900/70 p-4">
              <h4 className="font-semibold text-emerald-300 text-sm">Formative Assessment</h4>
              <p className="mt-2 text-sm text-slate-300">{plan.formative_assessment}</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-slate-900/70 p-4">
              <h4 className="font-semibold text-emerald-300 text-sm">Homework</h4>
              <p className="mt-2 text-sm text-slate-300">{plan.homework}</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-slate-900/70 p-4">
              <h4 className="font-semibold text-emerald-300 text-sm">Real-World Connection</h4>
              <p className="mt-2 text-sm text-slate-300">{plan.real_world_connection}</p>
            </div>
          </div>

          <div className="flex gap-3">
            <button onClick={() => navigator.clipboard.writeText(JSON.stringify(plan, null, 2))} className="rounded-lg border border-white/10 px-3 py-2 text-sm">Copy JSON</button>
            <button onClick={() => window.print()} className="rounded-lg border border-white/10 px-3 py-2 text-sm">Print</button>
          </div>
        </div>
      ) : null}
    </section>
  );
}
