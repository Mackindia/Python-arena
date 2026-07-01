"use client";

import { useMemo, useState } from "react";
import {
  generateExamPaper,
  saveSolvedPaper,
  exportPaperInline,
  type EducationalBookRecord,
} from "@/lib/educational-ai";
import BookSelector from "@/src/components/educational-ai/BookSelector";

type SectionSpec = {
  name: string;
  mark_type: number;
  count: number;
  required: number;
  internal_choice: boolean;
};

const DEFAULT_SECTIONS: SectionSpec[] = [
  { name: "A", mark_type: 1, count: 20, required: 20, internal_choice: false },
  { name: "B", mark_type: 2, count: 8, required: 5, internal_choice: false },
  { name: "C", mark_type: 3, count: 6, required: 4, internal_choice: false },
  { name: "D", mark_type: 5, count: 3, required: 2, internal_choice: true },
];

export default function PaperGeneratorPage() {
  const [classLevel, setClassLevel] = useState("");
  const [subject, setSubject] = useState("");
  const [topic, setTopic] = useState("");
  const [bookId, setBookId] = useState("");
  const [totalMarks, setTotalMarks] = useState(80);
  const [sections, setSections] = useState<SectionSpec[]>(DEFAULT_SECTIONS);
  const [difficultyProfile, setDifficultyProfile] = useState<string>("cbse_board");
  const [useCbsePattern, setUseCbsePattern] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [data, setData] = useState<any>(null);
  const [showAnswers, setShowAnswers] = useState(true);
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  function handleSelectBook(book: EducationalBookRecord) {
    setBookId(book.book_id);
    setClassLevel(book.class_level);
    setSubject(book.subject);
  }

  function updateSection(idx: number, field: keyof SectionSpec, value: any) {
    setSections((prev) =>
      prev.map((s, i) => (i === idx ? { ...s, [field]: value } : s))
    );
  }

  function addSection() {
    setSections((prev) => [
      ...prev,
      { name: String.fromCharCode(65 + prev.length), mark_type: 2, count: 5, required: 3, internal_choice: false },
    ]);
  }

  function removeSection(idx: number) {
    setSections((prev) => prev.filter((_, i) => i !== idx));
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
      const result = await generateExamPaper({
        class_level: classLevel,
        subject,
        topic,
        book_id: bookId || undefined,
        total_marks: totalMarks,
        sections: useCbsePattern ? undefined : sections.map((s) => ({
          name: s.name,
          mark_type: s.mark_type,
          count: s.count,
          required: s.required,
          internal_choice: s.internal_choice,
        })),
        difficulty_profile: difficultyProfile || undefined,
        use_cbse_pattern: useCbsePattern,
      });
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate paper");
    } finally {
      setLoading(false);
    }
  }

  const grouped = useMemo(() => {
    const map: Record<string, any[]> = {};
    for (const q of data?.questions || []) {
      const key = q.section || "All";
      map[key] = map[key] || [];
      map[key].push(q);
    }
    return map;
  }, [data]);

  return (
    <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
      <h2 className="text-2xl font-semibold">Paper Pattern Generator</h2>
      <p className="mt-1 text-sm text-slate-400">
        Generate new question papers matching your exact pattern — sections, marks, and topic distribution.
      </p>

      <form className="mt-4 grid gap-4 sm:grid-cols-4" onSubmit={onGenerate}>
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
          placeholder="Topic (e.g. Genetics)"
          required
        />
        <input
          type="number"
          min={10}
          max={200}
          value={totalMarks}
          onChange={(e) => setTotalMarks(Number(e.target.value))}
          className="rounded-xl border border-white/10 bg-slate-950 px-3 py-2.5"
          placeholder="Total Marks"
        />

        {/* CBSE Profile Selector */}
        <div className="sm:col-span-4">
          <label className="block text-sm text-slate-400 mb-1">Difficulty Profile</label>
          <select
            value={difficultyProfile}
            onChange={(e) => setDifficultyProfile(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2.5 text-sm"
          >
            <option value="cbse_board">CBSE Board Exam (30% Easy, 30% Medium, 40% Hard)</option>
            <option value="cbse_unit_test">CBSE Unit Test (40% Easy, 40% Medium, 20% Hard)</option>
            <option value="cbse_competitive">Competitive (20% Easy, 30% Medium, 50% Hard)</option>
            <option value="cbse_easy">Easy Practice (50% Easy, 35% Medium, 15% Hard)</option>
            <option value="cbse_hard">Hard Practice (15% Easy, 25% Medium, 60% Hard)</option>
            <option value="balanced">Balanced (33% each)</option>
            <option value="">Custom (use section builder below)</option>
          </select>
        </div>

        <div className="sm:col-span-4">
          <label className="flex items-center gap-2 text-sm text-slate-400">
            <input
              type="checkbox"
              checked={useCbsePattern}
              onChange={(e) => setUseCbsePattern(e.target.checked)}
              className="rounded"
            />
            Use CBSE standard section pattern (auto-creates sections based on total marks)
          </label>
        </div>

        {/* Section Builder (hidden when CBSE pattern is selected) */}
        {!useCbsePattern && (
        <div className="sm:col-span-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-semibold text-slate-300">Sections</p>
            <button
              type="button"
              onClick={addSection}
              className="text-xs text-cyan-400 hover:text-cyan-300"
            >
              + Add Section
            </button>
          </div>
          <div className="space-y-2">
            {sections.map((sec, idx) => (
              <div
                key={idx}
                className="flex flex-wrap items-center gap-2 rounded-lg border border-white/10 bg-slate-950/50 p-2 text-sm"
              >
                <input
                  value={sec.name}
                  onChange={(e) => updateSection(idx, "name", e.target.value)}
                  className="w-12 rounded border border-white/10 bg-slate-900 px-2 py-1 text-center"
                  placeholder="Name"
                />
                <span className="text-slate-500">|</span>
                <label className="text-xs text-slate-400">Marks:</label>
                <input
                  type="number"
                  min={1}
                  max={10}
                  value={sec.mark_type}
                  onChange={(e) => updateSection(idx, "mark_type", Number(e.target.value))}
                  className="w-14 rounded border border-white/10 bg-slate-900 px-2 py-1 text-center"
                />
                <label className="text-xs text-slate-400">Count:</label>
                <input
                  type="number"
                  min={1}
                  max={50}
                  value={sec.count}
                  onChange={(e) => updateSection(idx, "count", Number(e.target.value))}
                  className="w-14 rounded border border-white/10 bg-slate-900 px-2 py-1 text-center"
                />
                <label className="text-xs text-slate-400">Required:</label>
                <input
                  type="number"
                  min={1}
                  max={50}
                  value={sec.required}
                  onChange={(e) => updateSection(idx, "required", Number(e.target.value))}
                  className="w-14 rounded border border-white/10 bg-slate-900 px-2 py-1 text-center"
                />
                <label className="flex items-center gap-1 text-xs text-slate-400">
                  <input
                    type="checkbox"
                    checked={sec.internal_choice}
                    onChange={(e) => updateSection(idx, "internal_choice", e.target.checked)}
                    className="rounded"
                  />
                  Choice
                </label>
                {sections.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeSection(idx)}
                    className="ml-auto text-xs text-rose-400 hover:text-rose-300"
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
        )}

        <button
          disabled={loading}
          className="sm:col-span-4 rounded-xl bg-cyan-400 px-4 py-2.5 font-semibold text-slate-950 disabled:opacity-70"
        >
          {loading ? "Generating Paper..." : "Generate Question Paper"}
        </button>
      </form>

      {error && <p className="mt-4 text-sm text-rose-300">{error}</p>}

      {/* Results */}
      {data && (
        <div className="mt-6 space-y-6">
          {/* Paper Info */}
          <div className="rounded-xl border border-white/10 bg-slate-900/70 p-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-cyan-200">Generated Paper</h3>
              <div className="flex items-center gap-3 text-sm">
                <span className="text-slate-400">
                  {data.questions?.length || 0} questions
                </span>
                <span className="text-slate-400">
                  {data.actual_total_marks || data.paper_info?.total_marks} marks
                </span>
                {data.validation && (
                  <span
                    className={`font-semibold ${
                      data.validation.quality_score >= 80
                        ? "text-emerald-300"
                        : data.validation.quality_score >= 50
                        ? "text-amber-300"
                        : "text-rose-300"
                    }`}
                  >
                    Quality: {data.validation.quality_score}/100
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Sections */}
          {Object.entries(grouped).map(([section, questions]) => (
            <div key={section}>
              <h3 className="text-lg font-semibold text-cyan-200 mb-3">
                Section {section}
              </h3>
              <div className="space-y-3">
                {questions.map((q: any, idx: number) => (
                  <article
                    key={idx}
                    className="rounded-xl border border-white/10 bg-slate-900/70 p-4"
                  >
                    <div className="flex items-start gap-3">
                      <span className="font-semibold text-cyan-200">
                        Q{q.question_number || idx + 1}
                      </span>
                      <span className="rounded bg-cyan-400/20 px-2 py-0.5 text-xs text-cyan-300">
                        {q.marks} mark{q.marks !== 1 ? "s" : ""}
                      </span>
                      {q.difficulty && (
                        <span
                          className={`rounded px-2 py-0.5 text-xs ${
                            q.difficulty === "Easy"
                              ? "bg-emerald-400/20 text-emerald-300"
                              : q.difficulty === "Medium"
                              ? "bg-amber-400/20 text-amber-300"
                              : "bg-rose-400/20 text-rose-300"
                          }`}
                        >
                          {q.difficulty}
                        </span>
                      )}
                      {q.chapter_hint && (
                        <span className="text-xs text-slate-500">{q.chapter_hint}</span>
                      )}
                    </div>
                    <p className="mt-2 text-sm text-slate-200">{q.question_text}</p>
                    {q.has_internal_choice && q.optional_part && (
                      <div className="mt-2 rounded-lg bg-slate-950/50 p-2 text-sm">
                        <span className="text-xs font-semibold text-amber-300">
                          OR
                        </span>
                        <p className="mt-1 text-slate-300">{q.optional_part}</p>
                      </div>
                    )}
                  </article>
                ))}
              </div>
            </div>
          ))}

          {/* Answers */}
          {data.answers?.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold text-emerald-200">Answer Key</h3>
                <button
                  onClick={() => setShowAnswers(!showAnswers)}
                  className="rounded-lg border border-white/10 px-3 py-1.5 text-xs hover:border-cyan-400/40"
                >
                  {showAnswers ? "Hide" : "Show"} Answers
                </button>
              </div>
              {showAnswers && (
                <div className="space-y-3">
                  {data.answers.map((ans: any, idx: number) => (
                    <article
                      key={idx}
                      className="rounded-xl border border-white/10 bg-slate-900/70 p-4"
                    >
                      <div className="flex items-center gap-2 text-sm">
                        <span className="font-semibold text-cyan-200">
                          Q{ans.question_number}
                        </span>
                        <span className="text-xs text-slate-400">
                          {ans.marks} marks
                        </span>
                      </div>
                      <p className="mt-2 text-sm text-slate-200 whitespace-pre-wrap">
                        {ans.answer?.direct_answer}
                      </p>
                      {ans.answer?.key_points?.length > 0 && (
                        <ul className="mt-2 list-disc space-y-0.5 pl-4 text-xs text-slate-400">
                          {ans.answer.key_points.map((p: string, i: number) => (
                            <li key={i}>{p}</li>
                          ))}
                        </ul>
                      )}
                    </article>
                  ))}
                </div>
              )}
            </div>
          )}

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
                    source: "generated",
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
                a.download = "generated-paper.json";
                a.click();
                URL.revokeObjectURL(url);
              }}
              className="rounded-lg border border-white/10 px-3 py-2 text-sm hover:border-cyan-400/40"
            >
              Export JSON
            </button>
            <button
              onClick={() => {
                const lines: string[] = [];
                lines.push("QUESTION PAPER");
                lines.push("=".repeat(50));
                lines.push("");
                for (const [section, questions] of Object.entries(grouped)) {
                  lines.push(`SECTION ${section}`);
                  lines.push("-".repeat(30));
                  for (const q of questions) {
                    lines.push(
                      `Q${q.question_number || ""} [${q.marks} marks] ${q.question_text}`
                    );
                    if (q.has_internal_choice && q.optional_part) {
                      lines.push(`  OR: ${q.optional_part}`);
                    }
                    lines.push("");
                  }
                }
                if (data.answers?.length) {
                  lines.push("");
                  lines.push("ANSWER KEY");
                  lines.push("=".repeat(50));
                  for (const ans of data.answers) {
                    lines.push(`Q${ans.question_number} [${ans.marks} marks]`);
                    lines.push(ans.answer?.direct_answer || "");
                    lines.push("");
                  }
                }
                const blob = new Blob([lines.join("\n")], { type: "text/plain" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = "generated-paper.txt";
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
