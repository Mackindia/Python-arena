"use client";

import { useCallback, useEffect, useReducer, useRef } from "react";

// ─── Public types ───────────────────────────────────────────────────────────

export type QuizQuestion = {
  id: string;
  prompt: string;
  options: string[];
};

export type Quiz = {
  quizId: string;
  title: string;
  instructions: string;
  passingPercent: number;
  questions: QuizQuestion[];
};

export type QuizResultItem = {
  questionId: string;
  prompt: string;
  options: string[];
  selectedIndex: number;
  correctIndex: number;
  isCorrect: boolean;
  explanation: string;
};

export type QuizResult = {
  score: number;
  total: number;
  accuracy: number;
  passed: boolean;
  results: QuizResultItem[];
  progressSummary?: unknown;
};

export type QuizAttemptSummary = {
  id: string;
  score: number;
  total: number;
  accuracy: number;
  passed: boolean;
  createdAt: string;
};

export type UseQuizParams = {
  subjectSlug: string;
  classSlug: string;
  lessonSlug: string;
};

// ─── State / actions ────────────────────────────────────────────────────────

type State = {
  /* Loading phases */
  loadingQuiz: boolean;
  loadingAttempts: boolean;
  submitting: boolean;

  /* Data */
  quiz: Quiz | null;
  attempts: QuizAttemptSummary[];
  result: QuizResult | null;

  /* Interaction */
  selected: Record<string, number>; // questionId → selectedIndex
  error: string;

  /* Attempt counter — incremented on retry so effects re-run */
  attemptKey: number;
};

type Action =
  | { type: "QUIZ_LOADING" }
  | { type: "QUIZ_LOADED"; quiz: Quiz | null }
  | { type: "QUIZ_ERROR"; error: string }
  | { type: "ATTEMPTS_LOADING" }
  | { type: "ATTEMPTS_LOADED"; attempts: QuizAttemptSummary[] }
  | { type: "SELECT_ANSWER"; questionId: string; index: number }
  | { type: "SUBMIT_START" }
  | { type: "SUBMIT_SUCCESS"; result: QuizResult }
  | { type: "SUBMIT_ERROR"; error: string }
  | { type: "RETRY" };

const initialState: State = {
  loadingQuiz: true,
  loadingAttempts: true,
  submitting: false,
  quiz: null,
  attempts: [],
  result: null,
  selected: {},
  error: "",
  attemptKey: 0,
};

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "QUIZ_LOADING":
      return { ...state, loadingQuiz: true, error: "" };
    case "QUIZ_LOADED":
      return { ...state, loadingQuiz: false, quiz: action.quiz };
    case "QUIZ_ERROR":
      return { ...state, loadingQuiz: false, error: action.error };
    case "ATTEMPTS_LOADING":
      return { ...state, loadingAttempts: true };
    case "ATTEMPTS_LOADED":
      return { ...state, loadingAttempts: false, attempts: action.attempts };
    case "SELECT_ANSWER":
      if (state.result) return state; // locked after submission
      return {
        ...state,
        selected: { ...state.selected, [action.questionId]: action.index },
      };
    case "SUBMIT_START":
      return { ...state, submitting: true, error: "" };
    case "SUBMIT_SUCCESS":
      return { ...state, submitting: false, result: action.result };
    case "SUBMIT_ERROR":
      return { ...state, submitting: false, error: action.error };
    case "RETRY":
      return {
        ...state,
        result: null,
        selected: {},
        error: "",
        loadingAttempts: true,
        attemptKey: state.attemptKey + 1,
      };
    default:
      return state;
  }
}

// ─── Hook ───────────────────────────────────────────────────────────────────

export function useQuiz({ subjectSlug, classSlug, lessonSlug }: UseQuizParams) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const paramsRef = useRef({ subjectSlug, classSlug, lessonSlug });
  paramsRef.current = { subjectSlug, classSlug, lessonSlug };

  // ── Load quiz ─────────────────────────────────────────────────────────
  useEffect(() => {
    let active = true;
    const { subjectSlug, classSlug, lessonSlug } = paramsRef.current;

    async function load() {
      dispatch({ type: "QUIZ_LOADING" });
      try {
        const res = await fetch(
          `/api/lms/quiz?subject=${encodeURIComponent(subjectSlug)}&class=${encodeURIComponent(classSlug)}&lesson=${encodeURIComponent(lessonSlug)}`,
        );
        const data = await res.json();
        if (!active) return;
        if (!res.ok) {
          dispatch({ type: "QUIZ_ERROR", error: data.message || "Failed to load quiz" });
        } else {
          dispatch({ type: "QUIZ_LOADED", quiz: data.quiz ?? null });
        }
      } catch {
        if (active) dispatch({ type: "QUIZ_ERROR", error: "Failed to load quiz" });
      }
    }

    load();
    return () => { active = false; };
  // Re-fetch if slugs change (not on retry — quiz doesn't change)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subjectSlug, classSlug, lessonSlug]);

  // ── Load attempts ─────────────────────────────────────────────────────
  useEffect(() => {
    let active = true;
    const { subjectSlug, classSlug, lessonSlug } = paramsRef.current;

    async function loadAttempts() {
      dispatch({ type: "ATTEMPTS_LOADING" });
      try {
        const res = await fetch(
          `/api/lms/quiz/attempts?subject=${encodeURIComponent(subjectSlug)}&class=${encodeURIComponent(classSlug)}&lesson=${encodeURIComponent(lessonSlug)}`,
        );
        const data = await res.json();
        if (!active) return;
        if (res.ok) {
          dispatch({ type: "ATTEMPTS_LOADED", attempts: data.attempts ?? [] });
        } else {
          dispatch({ type: "ATTEMPTS_LOADED", attempts: [] });
        }
      } catch {
        if (active) dispatch({ type: "ATTEMPTS_LOADED", attempts: [] });
      }
    }

    loadAttempts();
    return () => { active = false; };
  // Re-fetch after each attempt (retry increments attemptKey)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subjectSlug, classSlug, lessonSlug, state.attemptKey]);

  // ── Actions ───────────────────────────────────────────────────────────
  const selectAnswer = useCallback((questionId: string, index: number) => {
    dispatch({ type: "SELECT_ANSWER", questionId, index });
  }, []);

  const submit = useCallback(async () => {
    const { quiz, selected, submitting, result } = state;
    if (!quiz || submitting || result) return;

    const { subjectSlug, classSlug, lessonSlug } = paramsRef.current;

    dispatch({ type: "SUBMIT_START" });
    try {
      const answers = quiz.questions.map((q) => ({
        questionId: q.id,
        selectedIndex: selected[q.id] ?? 0,
      }));

      const res = await fetch("/api/lms/quiz/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject: subjectSlug, class: classSlug, lesson: lessonSlug, answers }),
      });

      const data = await res.json();
      if (!res.ok) {
        dispatch({ type: "SUBMIT_ERROR", error: data.message || "Failed to submit quiz" });
        return;
      }

      dispatch({
        type: "SUBMIT_SUCCESS",
        result: {
          score: data.score,
          total: data.total,
          accuracy: data.accuracy,
          passed: data.passed,
          results: data.results ?? [],
          progressSummary: data.progressSummary,
        },
      });
    } catch {
      dispatch({ type: "SUBMIT_ERROR", error: "Submission failed. Please try again." });
    }
  }, [state]);

  const retry = useCallback(() => dispatch({ type: "RETRY" }), []);

  // ── Derived ───────────────────────────────────────────────────────────
  const answeredCount = Object.keys(state.selected).length;
  const totalQuestions = state.quiz?.questions.length ?? 0;
  const canSubmit = totalQuestions > 0 && answeredCount === totalQuestions && !state.submitting && !state.result;

  const bestAttempt = state.attempts.length > 0
    ? state.attempts.reduce((best, a) => (a.accuracy > best.accuracy ? a : best), state.attempts[0])
    : null;

  return {
    // state
    loadingQuiz: state.loadingQuiz,
    loadingAttempts: state.loadingAttempts,
    submitting: state.submitting,
    quiz: state.quiz,
    attempts: state.attempts,
    bestAttempt,
    result: state.result,
    selected: state.selected,
    error: state.error,

    // derived
    answeredCount,
    totalQuestions,
    canSubmit,

    // actions
    selectAnswer,
    submit,
    retry,
  };
}
