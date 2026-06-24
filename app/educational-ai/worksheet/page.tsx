"use client";

import { useState } from "react";
import { generateWorksheet, type EducationalBookRecord } from "@/lib/educational-ai";
import BookSelector from "@/src/components/educational-ai/BookSelector";

function MCQSection({ section }: { section: any }) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [showAnswers, setShowAnswers] = useState(false);

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-400 italic">{section.instructions}</p>
      {(section.questions || []).map((q: any, i: number) => (
        <div key={i} className="rounded-xl border border-white/10 bg-slate-950/70 p-4">
          <p className="font-medium text-white">{q.question_number} {q.question_text}</p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {Object.entries(q.options || {}).map(([key, val]) => {
              const isCorrect = showAnswers && key === q.correct_option;
              return (
                <label key={key} className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm cursor-pointer transition ${isCorrect ? "border-emerald-400 bg-emerald-400/10 text-emerald-300" : "border-white/10 text-slate-300 hover:border-white/30"}`}>
                  <input type="radio" name={`mcq-${i}`} className="accent-cyan-400" onChange={() => setAnswers((p) => ({ ...p, [i]: key }))} />
                  <span className="font-medium">{key})</span> {String(val)}
                </label>
              );
            })}
          </div>
          <div data-answer style={{ display: showAnswers ? "block" : "none" }} className="mt-2 text-xs text-emerald-400">
            Correct: <strong>{q.correct_option})</strong> {String(q.options?.[q.correct_option] || "")}
          </div>
        </div>
      ))}
      <button onClick={() => setShowAnswers(!showAnswers)} className="rounded-lg border border-emerald-400/30 bg-emerald-400/10 px-3 py-1.5 text-xs font-medium text-emerald-300">{showAnswers ? "Hide Answers" : "Show Answers"}</button>
    </div>
  );
}

function FillBlanksSection({ section }: { section: any }) {
  const [show, setShow] = useState(false);
  return (
    <div className="space-y-3">
      <p className="text-sm text-slate-400 italic">{section.instructions}</p>
      {(section.questions || []).map((q: any, i: number) => (
        <div key={i} className="rounded-xl border border-white/10 bg-slate-950/70 p-4">
          <p className="text-sm text-slate-200">{q.question_number} {q.question_text}</p>
          <div data-answer style={{ display: show ? "block" : "none" }} className="mt-1 text-xs text-emerald-400">
            Answer: <strong>{q.correct_answer}</strong>
          </div>
        </div>
      ))}
      <button onClick={() => setShow(!show)} className="rounded-lg border border-emerald-400/30 bg-emerald-400/10 px-3 py-1.5 text-xs font-medium text-emerald-300">{show ? "Hide Answers" : "Show Answers"}</button>
    </div>
  );
}

function MatchSection({ section }: { section: any }) {
  const [show, setShow] = useState(false);
  const colA = section.columns?.["Column A"] || [];
  const colB = section.columns?.["Column B"] || [];
  const matches = section.correct_matches || {};
  return (
    <div className="space-y-3">
      <p className="text-sm text-slate-400 italic">{section.instructions}</p>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-white/10 bg-slate-950/70 p-4">
          <p className="text-xs font-bold text-cyan-300 uppercase tracking-wider mb-2">Column A</p>
          {colA.map((item: string, i: number) => (
            <p key={i} className="text-sm text-slate-200 py-1 border-b border-white/5 last:border-0">{item}</p>
          ))}
        </div>
        <div className="rounded-xl border border-white/10 bg-slate-950/70 p-4">
          <p className="text-xs font-bold text-cyan-300 uppercase tracking-wider mb-2">Column B</p>
          {colB.map((item: string, i: number) => (
            <p key={i} className="text-sm text-slate-200 py-1 border-b border-white/5 last:border-0">{item}</p>
          ))}
        </div>
      </div>
      <div data-answer style={{ display: show ? "block" : "none" }} className="rounded-xl border border-emerald-400/20 bg-emerald-400/5 p-4">
        <p className="text-xs font-bold text-emerald-300 uppercase tracking-wider mb-2">Correct Matches</p>
        {Object.entries(matches).map(([key, val]) => {
          const aItem = colA[Number(key) - 1] || key;
          const bItem = colB.find((b: string) => b.startsWith(`${val})`)) || val;
          return <p key={key} className="text-sm text-slate-200 py-1">{aItem} <span className="text-emerald-400 font-bold">=</span> {bItem}</p>;
        })}
      </div>
      <button onClick={() => setShow(!show)} className="rounded-lg border border-emerald-400/30 bg-emerald-400/10 px-3 py-1.5 text-xs font-medium text-emerald-300">{show ? "Hide Answers" : "Show Answers"}</button>
    </div>
  );
}

function ShortAnswerSection({ section }: { section: any }) {
  const [show, setShow] = useState(false);
  return (
    <div className="space-y-3">
      <p className="text-sm text-slate-400 italic">{section.instructions}</p>
      {(section.questions || []).map((q: any, i: number) => (
        <div key={i} className="rounded-xl border border-white/10 bg-slate-950/70 p-4">
          <p className="font-medium text-white text-sm">{q.question_number} {q.question_text}</p>
          <div data-answer style={{ display: show ? "block" : "none" }} className="mt-2 rounded-lg bg-emerald-400/5 border border-emerald-400/20 p-3">
            <p className="text-xs font-bold text-emerald-300 mb-1">Expected Answer:</p>
            {(q.expected_answer_elements || [q.model_answer]).map((a: string, j: number) => (
              <p key={j} className="text-xs text-slate-300 leading-relaxed">{a}</p>
            ))}
          </div>
        </div>
      ))}
      <button onClick={() => setShow(!show)} className="rounded-lg border border-emerald-400/30 bg-emerald-400/10 px-3 py-1.5 text-xs font-medium text-emerald-300">{show ? "Hide Answers" : "Show Answers"}</button>
    </div>
  );
}

function LongAnswerSection({ section }: { section: any }) {
  const [show, setShow] = useState(false);
  return (
    <div className="space-y-3">
      <p className="text-sm text-slate-400 italic">{section.instructions}</p>
      {(section.questions || []).map((q: any, i: number) => (
        <div key={i} className="rounded-xl border border-white/10 bg-slate-950/70 p-4">
          <p className="font-medium text-white text-sm">{q.question_number} {q.question_text}</p>
          <div className="mt-2 rounded-lg border border-white/10 bg-slate-950/50 p-3 min-h-[80px]">
            <p className="text-xs text-slate-500 italic">Write your answer here...</p>
          </div>
          <div data-answer style={{ display: show ? "block" : "none" }} className="mt-2 rounded-lg bg-emerald-400/5 border border-emerald-400/20 p-3">
            <p className="text-xs font-bold text-emerald-300 mb-1">Model Answer:</p>
            {(q.expected_answer_elements || [q.model_answer]).map((a: string, j: number) => (
              <p key={j} className="text-xs text-slate-300 leading-relaxed">{a}</p>
            ))}
          </div>
        </div>
      ))}
      <button onClick={() => setShow(!show)} className="rounded-lg border border-emerald-400/30 bg-emerald-400/10 px-3 py-1.5 text-xs font-medium text-emerald-300">{show ? "Hide Answers" : "Show Answers"}</button>
    </div>
  );
}

function WorksheetRenderer({ data }: { data: any }) {
  const ws = data.worksheet || data;
  const sections = ws.sections || [];

  const sectionRenderers: Record<string, React.FC<{ section: any }>> = {
    "MCQs": MCQSection,
    "Fill in the Blanks": FillBlanksSection,
    "Match the Following": MatchSection,
    "Short Answer Questions": ShortAnswerSection,
    "Long Answer Questions": LongAnswerSection,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-2xl border-2 border-cyan-600 bg-cyan-950/40 p-6 text-center">
        <h2 className="text-2xl font-black text-cyan-200">{ws.worksheet_title || ws.title || "Worksheet"}</h2>
        <div className="mt-3 flex flex-wrap justify-center gap-3 text-sm text-slate-300">
          <span className="rounded-full bg-white/10 px-3 py-1">Class {ws.class || ws.class_level}</span>
          <span className="rounded-full bg-white/10 px-3 py-1">{ws.subject}</span>
          <span className="rounded-full bg-white/10 px-3 py-1">{ws.topic}</span>
        </div>
      </div>

      {/* Learning Focus */}
      {ws.learning_focus?.length ? (
        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
          <p className="text-xs font-bold text-cyan-300 uppercase tracking-wider mb-2">Learning Focus</p>
          <div className="flex flex-wrap gap-2">
            {ws.learning_focus.map((f: string, i: number) => (
              <span key={i} className="rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1 text-xs font-medium text-cyan-200">{f}</span>
            ))}
          </div>
        </div>
      ) : null}

      {/* Learning Objectives */}
      {ws.learning_objectives?.length ? (
        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
          <p className="text-xs font-bold text-emerald-300 uppercase tracking-wider mb-2">Learning Objectives</p>
          <ul className="space-y-1">
            {ws.learning_objectives.map((o: string, i: number) => (
              <li key={i} className="flex items-start gap-2 text-sm text-slate-200">
                <span className="text-emerald-400 mt-0.5">&#10003;</span> {o}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {/* Sections */}
      {sections.map((section: any, i: number) => {
        const Renderer = sectionRenderers[section.type] || MCQSection;
        const sectionColors: Record<string, string> = {
          "MCQs": "border-blue-400/30",
          "Fill in the Blanks": "border-amber-400/30",
          "Match the Following": "border-purple-400/30",
          "Short Answer Questions": "border-emerald-400/30",
          "Long Answer Questions": "border-rose-400/30",
        };
        const sectionBg: Record<string, string> = {
          "MCQs": "bg-blue-400/5",
          "Fill in the Blanks": "bg-amber-400/5",
          "Match the Following": "bg-purple-400/5",
          "Short Answer Questions": "bg-emerald-400/5",
          "Long Answer Questions": "bg-rose-400/5",
        };
        return (
          <div key={i} className={`rounded-2xl border-2 ${sectionColors[section.type] || "border-white/10"} ${sectionBg[section.type] || "bg-white/5"} p-5`}>
            <h3 className="text-lg font-bold text-white mb-2">{section.title || section.type}</h3>
            <Renderer section={section} />
          </div>
        );
      })}
    </div>
  );
}

export default function EducationalAIWorksheetPage() {
  const [classLevel, setClassLevel] = useState("");
  const [subject, setSubject] = useState("");
  const [topic, setTopic] = useState("");
  const [bookId, setBookId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [worksheet, setWorksheet] = useState<any>(null);

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
      const data = await generateWorksheet({ class_level: classLevel, subject, topic, book_id: bookId || undefined });
      setWorksheet(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate worksheet");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="rounded-2xl border border-white/10 bg-white/5 p-6" id="worksheet-section">
      <h2 className="text-2xl font-semibold">Generate Worksheet</h2>
      <p className="mt-1 text-sm text-slate-400">Select your uploaded book, enter a topic, and get a printable worksheet with answers.</p>

      <form className="mt-4 grid gap-4 sm:grid-cols-3" onSubmit={onGenerate}>
        <BookSelector selectedBookId={bookId} onSelectBook={handleSelectBook} />
        <input value={classLevel} onChange={(e) => setClassLevel(e.target.value)} className="rounded-xl border border-white/10 bg-slate-950 px-3 py-2.5" placeholder="Class (auto-filled)" />
        <input value={subject} onChange={(e) => setSubject(e.target.value)} className="rounded-xl border border-white/10 bg-slate-950 px-3 py-2.5" placeholder="Subject (auto-filled)" />
        <input value={topic} onChange={(e) => setTopic(e.target.value)} className="rounded-xl border border-white/10 bg-slate-950 px-3 py-2.5" placeholder="Topic" required />
        <button disabled={loading} className="sm:col-span-3 rounded-xl bg-cyan-400 px-4 py-2.5 font-semibold text-slate-950 disabled:opacity-70">{loading ? "Generating worksheet..." : "Generate Worksheet"}</button>
      </form>

      {error ? <p className="mt-4 text-sm text-rose-300">{error}</p> : null}

      {worksheet ? (
        <div className="mt-6 space-y-4">
          <div className="flex gap-3 print:hidden">
            <button
              onClick={() => {
                // Show all answers before printing
                document.querySelectorAll("[data-answer]").forEach((el) => {
                  (el as HTMLElement).style.display = "block";
                });
                setTimeout(() => window.print(), 100);
              }}
              className="rounded-lg border border-cyan-400/30 bg-cyan-400/10 px-4 py-2 text-sm font-medium text-cyan-200 hover:bg-cyan-400/20"
            >
              Print / Save PDF
            </button>
            <button onClick={() => navigator.clipboard.writeText(JSON.stringify(worksheet, null, 2))} className="rounded-lg border border-white/10 px-4 py-2 text-sm text-slate-300 hover:bg-white/5">Copy JSON</button>
          </div>
          <p className="text-xs text-slate-500 italic print:hidden">Tip: All answers are auto-shown when you click Print. Use &quot;Save as PDF&quot; in the print dialog.</p>
          <div id="worksheet-printable">
            <WorksheetRenderer data={worksheet} />
          </div>
        </div>
      ) : null}
    </section>
  );
}
