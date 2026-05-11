"use client";

import { useEffect, useMemo, useState } from "react";

export type QuizQuestion = {
  id: number;
  question: string;
  options: string[];
  answer: string;
  explanation?: string;
};

type QuizProps = {
  title?: string;
  questions: QuizQuestion[];
  storageKey?: string;
};

type PersistedScore = {
  lastScore: number;
  bestScore: number;
};

type ResponseItem = {
  questionId: number;
  question: string;
  selected: string;
  correct: string;
  explanation?: string;
};

export default function Quiz({ title = "Quick Quiz", questions, storageKey }: QuizProps) {
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [persisted, setPersisted] = useState<PersistedScore | null>(null);
  const [responses, setResponses] = useState<ResponseItem[]>([]);

  const resolvedStorageKey = storageKey ?? `quiz:${title.toLowerCase().replace(/\s+/g, "-")}:${questions.length}`;

  const current = questions[index];
  const isCorrect = selected === current.answer;

  const progress = useMemo(() => `${index + 1} / ${questions.length}`, [index, questions.length]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(resolvedStorageKey);
      if (!stored) {
        return;
      }

      const parsed = JSON.parse(stored) as PersistedScore;
      if (typeof parsed.lastScore === "number" && typeof parsed.bestScore === "number") {
        setPersisted(parsed);
      }
    } catch {
      setPersisted(null);
    }
  }, [resolvedStorageKey]);

  useEffect(() => {
    if (!showResult) {
      return;
    }

    const bestScore = persisted ? Math.max(persisted.bestScore, score) : score;
    const payload: PersistedScore = { lastScore: score, bestScore };
    setPersisted(payload);

    try {
      localStorage.setItem(resolvedStorageKey, JSON.stringify(payload));
    } catch {
      // Ignore storage write failures (private mode / quota issues).
    }
  }, [showResult, score, resolvedStorageKey]);

  function handleSelect(option: string) {
    if (selected) {
      return;
    }

    setSelected(option);

    setResponses((prev) => {
      const existingIndex = prev.findIndex((item) => item.questionId === current.id);
      const entry: ResponseItem = {
        questionId: current.id,
        question: current.question,
        selected: option,
        correct: current.answer,
        explanation: current.explanation,
      };

      if (existingIndex === -1) {
        return [...prev, entry];
      }

      const copy = [...prev];
      copy[existingIndex] = entry;
      return copy;
    });

    if (option === current.answer) {
      setScore((prev) => prev + 1);
    }
  }

  function handleNext() {
    if (index === questions.length - 1) {
      setShowResult(true);
      return;
    }

    setIndex((prev) => prev + 1);
    setSelected(null);
  }

  function handleRestart() {
    setIndex(0);
    setSelected(null);
    setScore(0);
    setShowResult(false);
    setResponses([]);
  }

  if (!questions.length) {
    return <p className="text-sm text-slate-300">No quiz questions available.</p>;
  }

  if (showResult) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/5 p-5 text-slate-100">
        <h3 className="text-xl font-semibold">{title}</h3>
        <p className="mt-2 text-sm text-slate-300">Final score: {score} / {questions.length}</p>
        {persisted ? (
          <p className="mt-1 text-xs uppercase tracking-[0.14em] text-cyan-200">
            Best score: {persisted.bestScore} / {questions.length}
          </p>
        ) : null}

        <div className="mt-4 space-y-3">
          {responses.map((item) => {
            const correct = item.selected === item.correct;
            return (
              <div key={item.questionId} className="rounded-lg border border-white/10 bg-black/25 p-3 text-sm text-slate-200">
                <p className="font-medium text-white">{item.question}</p>
                <p className={`mt-1 ${correct ? "text-emerald-300" : "text-rose-300"}`}>
                  Your answer: {item.selected}
                </p>
                <p className="text-cyan-200">Correct answer: {item.correct}</p>
                <p className="mt-1 text-slate-300">{item.explanation ?? "Review this concept for better mastery."}</p>
              </div>
            );
          })}
        </div>

        <button
          type="button"
          onClick={handleRestart}
          className="mt-4 rounded-lg bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300"
        >
          Restart Quiz
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5 text-slate-100">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold">{title}</h3>
        <span className="text-xs uppercase tracking-[0.16em] text-cyan-200">{progress}</span>
      </div>

      {persisted ? (
        <p className="mt-2 text-xs uppercase tracking-[0.14em] text-cyan-200">
          Last score: {persisted.lastScore} / {questions.length} | Best: {persisted.bestScore} / {questions.length}
        </p>
      ) : null}

      <p className="mt-4 text-base font-medium">{current.question}</p>

      <div className="mt-4 space-y-2">
        {current.options.map((option) => {
          const isSelected = selected === option;
          const isAnswer = current.answer === option;
          const stateClass = !selected
            ? "hover:bg-white/10"
            : isAnswer
              ? "border-emerald-400/50 bg-emerald-400/15"
              : isSelected
                ? "border-rose-400/50 bg-rose-400/15"
                : "opacity-70";

          return (
            <button
              key={option}
              type="button"
              onClick={() => handleSelect(option)}
              className={`block w-full rounded-lg border border-white/15 px-3 py-2 text-left text-sm transition ${stateClass}`}
            >
              {option}
            </button>
          );
        })}
      </div>

      {selected ? (
        <div className="mt-4 rounded-lg border border-white/10 bg-black/25 p-3 text-sm text-slate-200">
          <p className={`font-semibold ${isCorrect ? "text-emerald-300" : "text-rose-300"}`}>
            {isCorrect ? "Correct" : "Not quite"}
          </p>
          <p className="mt-1">{current.explanation ?? "Review the concept and try the next question."}</p>
        </div>
      ) : null}

      <button
        type="button"
        onClick={handleNext}
        disabled={!selected}
        className="mt-4 rounded-lg bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {index === questions.length - 1 ? "Finish" : "Next Question"}
      </button>
    </div>
  );
}
