"use client";

import { useMemo, useRef, useState } from "react";
import {
  solveQuestionPaperUpload,
  solveQuestionPaperTopic,
  saveSolvedPaper,
  exportPaperInline,
  type EducationalBookRecord,
} from "@/lib/educational-ai";
import BookSelector from "@/src/components/educational-ai/BookSelector";

export default function QuestionPaperSolverPage() {
  const [classLevel, setClassLevel] = useState("");
  const [subject, setSubject] = useState("");
  const [topic, setTopic] = useState("");
  const [bookId, setBookId] = useState("");
  const [totalMarks, setTotalMarks] = useState(80);
  const [mode, setMode] = useState<"upload" | "topic">("upload");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [data, setData] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  function handleSelectBook(book: EducationalBookRecord) {
    setBookId(book.book_id);
    setClassLevel(book.class_level);
    setSubject(book.subject);
  }

  async function onSolve(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (mode === "upload" && !file) {
      setError("Please select a question paper file (PDF or image).");
      return;
    }
    if (mode === "topic" && (!classLevel || !subject || !topic)) {
      setError("Please select a book and enter a topic.");
      return;
    }

    setLoading(true);
    try {
      let result;
      if (mode === "upload") {
        const formData = new FormData();
        formData.append("file", file!);
        formData.append("class_level", classLevel || "Class 10");
        formData.append("subject", subject || "General");
        formData.append("topic", topic || "General");
        if (bookId) formData.append("book_id", bookId);
        formData.append("total_marks", String(totalMarks));
        result = await solveQuestionPaperUpload(formData);
      } else {
        result = await solveQuestionPaperTopic({
          class_level: classLevel,
          subject,
          topic,
          book_id: bookId || undefined,
          total_marks: totalMarks,
        });
      }
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to solve paper");
    } finally {
      setLoading(false);
    }
  }

  const grouped = useMemo(() => {
    const map: Record<string, any[]> = {};
    for (const q of data?.solved_questions || []) {
      const key = q.section || "All";
      map[key] = map[key] || [];
      map[key].push(q);
    }
    return map;
  }, [data]);

  const pattern = data?.pattern_analysis;

  return (
    <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
      <h2 className="text-2xl font-semibold">Question Paper Solver</h2>
      <p className="mt-1 text-sm text-slate-400">
        Upload a question paper (PDF or image) or generate from a topic — get solved answers with mark-wise breakdown.
      </p>

      {/* Mode Toggle */}
      <div className="mt-4 flex gap-2">
        <button
          type="button"
          onClick={() => setMode("upload")}
          className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
            mode === "upload"
              ? "bg-cyan-400 text-slate-950"
              : "border border-white/10 bg-slate-900/70 text-slate-300 hover:border-cyan-400/40"
          }`}
        >
          Upload Paper
        </button>
        <button
          type="button"
          onClick={() => setMode("topic")}
          className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
            mode === "topic"
              ? "bg-cyan-400 text-slate-950"
              : "border border-white/10 bg-slate-900/70 text-slate-300 hover:border-cyan-400/40"
          }`}
        >
          From Topic
        </button>
      </div>

      {/* Form */}
      <form className="mt-4 grid gap-4 sm:grid-cols-3" onSubmit={onSolve}>
        {mode === "upload" ? (
          <>
            <div className="sm:col-span-3">
              <label className="block text-sm text-slate-400 mb-1">
                Question Paper (PDF, PNG, JPG)
              </label>
              <input
                ref={fileRef}
                type="file"
                accept=".pdf,.png,.jpg,.jpeg,.bmp,.tiff,.webp"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2.5 text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-cyan-400/20 file:px-3 file:py-1 file:text-sm file:text-cyan-200"
              />
              {file && (
                <p className="mt-1 text-xs text-slate-500">
                  {file.name} ({(file.size / 1024).toFixed(1)} KB)
                </p>
              )}
            </div>
            <BookSelector selectedBookId={bookId} onSelectBook={handleSelectBook} />
            <input
              value={classLevel}
              onChange={(e) => setClassLevel(e.target.value)}
              className="rounded-xl border border-white/10 bg-slate-950 px-3 py-2.5"
              placeholder="Class (auto-filled)"
            />
            <input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="rounded-xl border border-white/10 bg-slate-950 px-3 py-2.5"
              placeholder="Subject (auto-filled)"
            />
          </>
        ) : (
          <>
            <BookSelector selectedBookId={bookId} onSelectBook={handleSelectBook} />
            <input
              value={classLevel}
              onChange={(e) => setClassLevel(e.target.value)}
              className="rounded-xl border border-white/10 bg-slate-950 px-3 py-2.5"
              placeholder="Class (auto-filled)"
            />
            <input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="rounded-xl border border-white/10 bg-slate-950 px-3 py-2.5"
              placeholder="Subject (auto-filled)"
            />
            <input
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="rounded-xl border border-white/10 bg-slate-950 px-3 py-2.5"
              placeholder="Topic (e.g. Photosynthesis)"
              required
            />
          </>
        )}

        <input
          type="number"
          min={10}
          max={200}
          value={totalMarks}
          onChange={(e) => setTotalMarks(Number(e.target.value))}
          className="rounded-xl border border-white/10 bg-slate-950 px-3 py-2.5"
          placeholder="Total Marks"
        />

        <button
          disabled={loading}
          className="sm:col-span-3 rounded-xl bg-cyan-400 px-4 py-2.5 font-semibold text-slate-950 disabled:opacity-70"
        >
          {loading ? "Solving Paper..." : "Solve Question Paper"}
        </button>
      </form>

      {error && <p className="mt-4 text-sm text-rose-300">{error}</p>}

      {/* Results */}
      {data && (
        <div className="mt-6 space-y-6">
          {/* Pattern Analysis Summary */}
          {pattern && (
            <div className="rounded-xl border border-white/10 bg-slate-900/70 p-4">
              <h3 className="text-lg font-semibold text-cyan-200">Pattern Analysis</h3>
              <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4 text-sm">
                <div>
                  <span className="text-slate-400">Total Marks:</span>{" "}
                  <span className="font-semibold">{pattern.total_marks}</span>
                </div>
                <div>
                  <span className="text-slate-400">Questions:</span>{" "}
                  <span className="font-semibold">{data.solved_questions?.length || 0}</span>
                </div>
                {Object.entries(pattern.difficulty_distribution || {}).map(([k, v]) => (
                  <div key={k}>
                    <span className="text-slate-400">{k}:</span>{" "}
                    <span className="font-semibold">{String(v)}%</span>
                  </div>
                ))}
              </div>
              {pattern.high_value_topics?.length > 0 && (
                <div className="mt-3 text-sm">
                  <span className="text-slate-400">High Value Topics:</span>{" "}
                  <span className="text-emerald-300">{pattern.high_value_topics.join(", ")}</span>
                </div>
              )}
              {pattern.repeat_candidates?.length > 0 && (
                <div className="mt-2 text-sm">
                  <span className="text-slate-400">Repeat Candidates:</span>{" "}
                  <span className="text-amber-300">{pattern.repeat_candidates.length} likely to repeat</span>
                </div>
              )}
            </div>
          )}

          {/* Validation */}
          {data.validation && (
            <div className="rounded-xl border border-white/10 bg-slate-900/70 p-4 text-sm">
              <span className="text-slate-400">Quality Score:</span>{" "}
              <span className={`font-semibold ${data.validation.quality_score >= 80 ? "text-emerald-300" : data.validation.quality_score >= 50 ? "text-amber-300" : "text-rose-300"}`}>
                {data.validation.quality_score}/100
              </span>
              {data.validation.answer_rate !== undefined && (
                <>
                  <span className="text-slate-400 ml-4">Answer Rate:</span>{" "}
                  <span className="font-semibold">{data.validation.answer_rate}%</span>
                </>
              )}
            </div>
          )}

          {/* Solved Questions by Section */}
          {Object.entries(grouped).map(([section, questions]) => (
            <div key={section}>
              <h3 className="text-lg font-semibold text-cyan-200 mb-3">
                Section {section}
              </h3>
              <div className="space-y-4">
                {questions.map((q: any, idx: number) => (
                  <article
                    key={idx}
                    className="rounded-xl border border-white/10 bg-slate-900/70 p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 text-sm">
                          <span className="font-semibold text-cyan-200">
                            Q{q.question_number}
                          </span>
                          <span className="rounded bg-cyan-400/20 px-2 py-0.5 text-xs text-cyan-300">
                            {q.marks} mark{q.marks !== 1 ? "s" : ""}
                          </span>
                          {q.difficulty && (
                            <span className={`rounded px-2 py-0.5 text-xs ${
                              q.difficulty === "Easy"
                                ? "bg-emerald-400/20 text-emerald-300"
                                : q.difficulty === "Medium"
                                ? "bg-amber-400/20 text-amber-300"
                                : "bg-rose-400/20 text-rose-300"
                            }`}>
                              {q.difficulty}
                            </span>
                          )}
                          {q.chapter && (
                            <span className="text-xs text-slate-500">{q.chapter}</span>
                          )}
                        </div>
                        <p className="mt-2 text-sm text-slate-200">{q.question_text}</p>
                      </div>
                    </div>

                    {/* Answer */}
                    {q.answer && (
                      <div className="mt-3 rounded-lg bg-slate-950/50 p-3">
                        <p className="text-sm text-slate-200 whitespace-pre-wrap">
                          {q.answer.direct_answer}
                        </p>

                        {q.answer.key_points?.length > 0 && (
                          <div className="mt-2">
                            <p className="text-xs font-semibold text-cyan-300 mb-1">
                              Key Points:
                            </p>
                            <ul className="list-disc space-y-0.5 pl-4 text-xs text-slate-400">
                              {q.answer.key_points.map((p: string, i: number) => (
                                <li key={i}>{p}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {q.answer.common_mistakes?.length > 0 && (
                          <div className="mt-2">
                            <p className="text-xs font-semibold text-amber-300 mb-1">
                              Common Mistakes:
                            </p>
                            <ul className="list-disc space-y-0.5 pl-4 text-xs text-slate-400">
                              {q.answer.common_mistakes.map((m: string, i: number) => (
                                <li key={i}>{m}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {q.answer.exam_tips && (
                          <p className="mt-2 text-xs text-emerald-300">
                            Tip: {q.answer.exam_tips}
                          </p>
                        )}

                        <p className="mt-1 text-xs text-slate-600">
                          {q.answer.word_count} words
                        </p>
                      </div>
                    )}
                  </article>
                ))}
              </div>
            </div>
          ))}

          {/* Export & Save */}
          <div className="flex flex-wrap gap-3">
            <button
              onClick={async () => {
                setSaving(true);
                try {
                  await saveSolvedPaper({
                    paper_data: data,
                    class_level: classLevel,
                    subject: subject,
                    source: mode === "upload" ? "uploaded_file" : "topic_generation",
                  });
                  setSaved(true);
                } catch (err) {
                  setError(err instanceof Error ? err.message : "Failed to save");
                } finally {
                  setSaving(false);
                }
              }}
              disabled={saving || saved}
              className="rounded-lg border border-emerald-400/40 bg-emerald-400/10 px-3 py-2 text-sm text-emerald-300 hover:border-emerald-400/60 disabled:opacity-50"
            >
              {saved ? "Saved" : saving ? "Saving..." : "Save Paper"}
            </button>
            <button
              onClick={async () => {
                setExporting("pdf");
                try {
                  await exportPaperInline({ data, format: "pdf" });
                } catch (err) {
                  setError(err instanceof Error ? err.message : "PDF export failed");
                } finally {
                  setExporting(null);
                }
              }}
              disabled={exporting === "pdf"}
              className="rounded-lg border border-white/10 px-3 py-2 text-sm hover:border-cyan-400/40 disabled:opacity-50"
            >
              {exporting === "pdf" ? "Generating..." : "Export PDF"}
            </button>
            <button
              onClick={async () => {
                setExporting("docx");
                try {
                  await exportPaperInline({ data, format: "docx" });
                } catch (err) {
                  setError(err instanceof Error ? err.message : "DOCX export failed");
                } finally {
                  setExporting(null);
                }
              }}
              disabled={exporting === "docx"}
              className="rounded-lg border border-white/10 px-3 py-2 text-sm hover:border-cyan-400/40 disabled:opacity-50"
            >
              {exporting === "docx" ? "Generating..." : "Export DOCX"}
            </button>
            <button
              onClick={() => {
                const blob = new Blob([JSON.stringify(data, null, 2)], {
                  type: "application/json",
                });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = "solved-paper.json";
                a.click();
                URL.revokeObjectURL(url);
              }}
              className="rounded-lg border border-white/10 px-3 py-2 text-sm hover:border-cyan-400/40"
            >
              Export JSON
            </button>
            <button
              onClick={() => {
                const text = data.solved_questions
                  ?.map(
                    (q: any) =>
                      `Q${q.question_number} [${q.marks} marks]\n${q.question_text}\n\nAnswer:\n${q.answer?.direct_answer || "N/A"}\n\nKey Points:\n${q.answer?.key_points?.map((p: string) => `- ${p}`).join("\n") || ""}\n---`
                  )
                  .join("\n\n");
                const blob = new Blob([text || ""], { type: "text/plain" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = "solved-paper.txt";
                a.click();
                URL.revokeObjectURL(url);
              }}
              className="rounded-lg border border-white/10 px-3 py-2 text-sm hover:border-cyan-400/40"
            >
              Export Text
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
