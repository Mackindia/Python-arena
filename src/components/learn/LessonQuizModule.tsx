"use client";

import { useEffect } from "react";
import { useQuiz, type QuizResultItem } from "@/src/hooks/useQuiz";

// ─── Types ───────────────────────────────────────────────────────────────────

type LessonQuizModuleProps = {
  subjectSlug: string;
  classSlug: string;
  lessonSlug: string;
  /** Called after a passing submission so the parent can refresh progress UI */
  onPass?: () => void;
};

// ─── Sub-components ──────────────────────────────────────────────────────────

function QuizSkeleton() {
  return (
    <section className="mt-6 space-y-4 rounded-2xl border border-white/10 bg-slate-950/50 p-5 sm:p-6">
      <div className="h-5 w-1/3 animate-pulse rounded bg-slate-800" />
      <div className="h-7 w-2/3 animate-pulse rounded bg-slate-700/60" />
      {[1, 2, 3].map((i) => (
        <div key={i} className="space-y-2 rounded-xl border border-white/10 bg-slate-900/60 p-4">
          <div className="h-4 w-3/4 animate-pulse rounded bg-slate-700/50" />
          {[1, 2, 3, 4].map((j) => (
            <div key={j} className="h-9 animate-pulse rounded-lg bg-slate-800/50" />
          ))}
        </div>
      ))}
    </section>
  );
}

function OptionLabel({ index }: { index: number }) {
  const letters = ["A", "B", "C", "D", "E", "F"];
  return (
    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-current/30 text-[10px] font-bold">
      {letters[index] ?? index + 1}
    </span>
  );
}

function ScoreCircle({ accuracy, passed }: { accuracy: number; passed: boolean }) {
  const r = 40;
  const circumference = 2 * Math.PI * r;
  const progress = circumference - (accuracy / 100) * circumference;
  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={100} height={100} className="-rotate-90">
        <circle cx={50} cy={50} r={r} strokeWidth={8} stroke="currentColor" className="text-slate-800" fill="none" />
        <circle
          cx={50} cy={50} r={r} strokeWidth={8} stroke="currentColor" fill="none"
          strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={progress}
          className={passed ? "text-emerald-400" : "text-amber-400"}
          style={{ transition: "stroke-dashoffset 0.8s ease" }}
        />
      </svg>
      <div className="absolute text-center">
        <p className="text-xl font-bold text-white">{accuracy}%</p>
      </div>
    </div>
  );
}

function ExplanationBlock({ item }: { item: QuizResultItem }) {
  return (
    <div className={`mt-3 rounded-lg border p-3 text-sm ${item.isCorrect ? "border-emerald-500/20 bg-emerald-500/5" : "border-rose-500/20 bg-rose-500/5"}`}>
      <div className="flex items-center gap-1.5">
        {item.isCorrect ? (
          <>
            <svg className="h-4 w-4 shrink-0 text-emerald-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
            </svg>
            <span className="font-semibold text-emerald-300">Correct!</span>
          </>
        ) : (
          <>
            <svg className="h-4 w-4 shrink-0 text-rose-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
            </svg>
            <span className="font-semibold text-rose-300">
              Incorrect — correct answer: <span className="text-white">{item.options[item.correctIndex]}</span>
            </span>
          </>
        )}
      </div>
      {item.explanation && <p className="mt-1.5 text-slate-300">{item.explanation}</p>}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function LessonQuizModule({
  subjectSlug,
  classSlug,
  lessonSlug,
  onPass,
}: LessonQuizModuleProps) {
  const {
    loadingQuiz,
    submitting,
    quiz,
    bestAttempt,
    result,
    selected,
    error,
    answeredCount,
    totalQuestions,
    canSubmit,
    selectAnswer,
    submit,
    retry,
  } = useQuiz({ subjectSlug, classSlug, lessonSlug });

  useEffect(() => {
    if (result?.passed) onPass?.();
  }, [result?.passed, onPass]);

  // ── Loading ─────────────────────────────────────────────────────────────
  if (loadingQuiz) return <QuizSkeleton />;

  // ── Error (no quiz data at all) ─────────────────────────────────────────
  if (error && !quiz) {
    return (
      <section className="mt-6 rounded-2xl border border-rose-400/20 bg-rose-500/10 p-5 text-sm text-rose-200">
        {error}
      </section>
    );
  }

  // ── No quiz ─────────────────────────────────────────────────────────────
  if (!quiz) {
    return (
      <section className="mt-6 flex items-center gap-3 rounded-2xl border border-dashed border-white/10 bg-slate-950/40 px-5 py-4 text-sm text-slate-500">
        <svg className="h-5 w-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-3-3v6m-9 1.5A2.5 2.5 0 004.5 18h15a2.5 2.5 0 002.5-2.5V8a2.5 2.5 0 00-2.5-2.5h-15A2.5 2.5 0 002 8v7.5z" />
        </svg>
        No quiz available for this lesson yet.
      </section>
    );
  }

  // ── Result screen ────────────────────────────────────────────────────────
  if (result) {
    return (
      <section className="mt-6 space-y-5 rounded-2xl border border-white/10 bg-slate-950/50 p-5 sm:p-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-200/70">Quiz Result</p>
            <h2 className="mt-1 text-xl font-bold text-white">{quiz.title}</h2>
          </div>
          <span className={`rounded-full border px-3 py-1 text-xs font-bold tracking-wide ${result.passed ? "border-emerald-500/30 bg-emerald-500/15 text-emerald-300" : "border-amber-500/30 bg-amber-500/15 text-amber-300"}`}>
            {result.passed ? "PASSED" : "NOT PASSED"}
          </span>
        </div>

        {/* Score card */}
        <div className="flex flex-col items-center gap-4 rounded-xl border border-white/10 bg-slate-900/70 p-5 sm:flex-row sm:gap-8">
          <ScoreCircle accuracy={result.accuracy} passed={result.passed} />
          <div className="space-y-2 text-center sm:text-left">
            <p className="text-3xl font-bold text-white">{result.score} / {result.total}</p>
            <p className="text-sm text-slate-400">
              Passing threshold: <span className="font-semibold text-slate-200">{quiz.passingPercent}%</span>
            </p>
            {result.passed ? (
              <p className="flex items-center gap-1.5 text-sm text-emerald-300">
                <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                </svg>
                Lesson marked complete
              </p>
            ) : (
              <p className="text-sm text-amber-300">Review the explanations below and try again.</p>
            )}
          </div>
        </div>

        {/* Best score */}
        {bestAttempt && (
          <p className="text-xs text-slate-500">
            Best score: <span className="font-medium text-slate-300">{bestAttempt.accuracy}%</span>
            {bestAttempt.passed && (
              <span className="ml-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-400">passed</span>
            )}
          </p>
        )}

        {/* Per-question review */}
        <div className="space-y-4">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Review</p>
          {quiz.questions.map((question, idx) => {
            const evaluated = result.results.find((r) => r.questionId === question.id);
            return (
              <article key={question.id} className={`rounded-xl border p-4 ${evaluated?.isCorrect ? "border-emerald-500/20 bg-slate-900/50" : "border-rose-500/20 bg-slate-900/50"}`}>
                <p className="text-sm font-medium text-white">
                  <span className="mr-2 font-bold text-slate-500">{idx + 1}.</span>
                  {question.prompt}
                </p>
                <div className="mt-3 grid gap-1.5">
                  {question.options.map((opt, optIdx) => {
                    const isSelected = evaluated?.selectedIndex === optIdx;
                    const isCorrect = evaluated?.correctIndex === optIdx;
                    const isWrong = isSelected && !evaluated?.isCorrect;
                    const cls = isCorrect
                      ? "border-emerald-400/60 bg-emerald-500/10 text-emerald-200"
                      : isWrong
                      ? "border-rose-400/60 bg-rose-500/10 text-rose-200"
                      : "border-white/5 text-slate-400 opacity-60";
                    return (
                      <div key={optIdx} className={`flex items-center gap-3 rounded-lg border px-3 py-2 text-sm ${cls}`}>
                        <OptionLabel index={optIdx} />
                        <span className="flex-1">{opt}</span>
                        {isCorrect && (
                          <svg className="h-4 w-4 shrink-0 text-emerald-400" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                          </svg>
                        )}
                        {isWrong && (
                          <svg className="h-4 w-4 shrink-0 text-rose-400" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                    );
                  })}
                </div>
                {evaluated && <ExplanationBlock item={evaluated} />}
              </article>
            );
          })}
        </div>

        {/* Try again */}
        <div className="flex justify-end">
          <button
            type="button"
            onClick={retry}
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-slate-800/70 px-4 py-2 text-sm font-medium text-slate-200 transition hover:border-cyan-500/40 hover:bg-slate-800 hover:text-white"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Try Again
          </button>
        </div>
      </section>
    );
  }

  // ── Quiz form ────────────────────────────────────────────────────────────
  return (
    <section className="mt-6 rounded-2xl border border-white/10 bg-slate-950/50 p-5 sm:p-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-200/80">Lesson Quiz</p>
          <h2 className="mt-1 text-xl font-bold text-white sm:text-2xl">{quiz.title}</h2>
          {quiz.instructions && (
            <p className="mt-2 text-sm leading-relaxed text-slate-300">{quiz.instructions}</p>
          )}
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          <span className="rounded-lg border border-white/10 bg-slate-900/80 px-3 py-1.5 text-xs text-slate-300">
            Pass at <span className="font-semibold text-cyan-300">{quiz.passingPercent}%</span>
          </span>
          {bestAttempt && (
            <span className="text-xs text-slate-500">
              Best: <span className={`font-medium ${bestAttempt.passed ? "text-emerald-400" : "text-slate-300"}`}>{bestAttempt.accuracy}%</span>
            </span>
          )}
        </div>
      </div>

      {/* Progress bar */}
      <div className="mt-4 space-y-1">
        <div className="flex items-center justify-between text-[11px] text-slate-500">
          <span>{answeredCount} of {totalQuestions} answered</span>
          <span>{Math.round((answeredCount / Math.max(1, totalQuestions)) * 100)}%</span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-slate-800">
          <div
            className="h-full rounded-full bg-cyan-500 transition-all duration-300"
            style={{ width: `${(answeredCount / Math.max(1, totalQuestions)) * 100}%` }}
          />
        </div>
      </div>

      {/* Questions */}
      <div className="mt-5 space-y-4">
        {quiz.questions.map((question, idx) => {
          const selIdx = selected[question.id];
          const isAnswered = selIdx !== undefined;
          return (
            <article
              key={question.id}
              className={`rounded-xl border p-4 transition ${isAnswered ? "border-cyan-500/20 bg-slate-900/70" : "border-white/10 bg-slate-900/50"}`}
            >
              <div className="flex items-start gap-2">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-800 text-[10px] font-bold text-slate-400">
                  {idx + 1}
                </span>
                <p className="text-sm font-medium leading-snug text-white sm:text-base">{question.prompt}</p>
              </div>
              <div className="mt-3 grid gap-2">
                {question.options.map((option, optIdx) => {
                  const isSelected = selIdx === optIdx;
                  return (
                    <button
                      key={`${question.id}-${optIdx}`}
                      type="button"
                      onClick={() => selectAnswer(question.id, optIdx)}
                      aria-pressed={isSelected}
                      className={`flex items-center gap-3 rounded-lg border px-3 py-2.5 text-left text-sm transition ${isSelected ? "border-cyan-400/60 bg-cyan-500/10 text-white" : "border-white/10 text-slate-300 hover:border-white/20 hover:bg-white/5"}`}
                    >
                      <OptionLabel index={optIdx} />
                      <span className="flex-1">{option}</span>
                      {isSelected && <span className="ml-auto h-2 w-2 shrink-0 rounded-full bg-cyan-400" />}
                    </button>
                  );
                })}
              </div>
            </article>
          );
        })}
      </div>

      {/* Submit error */}
      {error && (
        <p className="mt-4 rounded-lg border border-rose-500/20 bg-rose-500/5 px-3 py-2 text-sm text-rose-300">
          {error}
        </p>
      )}

      {/* Footer */}
      <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-slate-500">
          {canSubmit
            ? "All questions answered. Ready to submit."
            : `${totalQuestions - answeredCount} more question${totalQuestions - answeredCount === 1 ? "" : "s"} remaining`}
        </p>
        <button
          type="button"
          disabled={!canSubmit}
          onClick={submit}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-cyan-400 px-5 py-2.5 text-sm font-bold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {submitting ? (
            <>
              <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Submitting…
            </>
          ) : (
            "Submit Quiz"
          )}
        </button>
      </div>
    </section>
  );
}
