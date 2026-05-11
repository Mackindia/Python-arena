"use client";

import { FormEvent, useEffect, useState } from "react";

type Course = { _id: string; title: string };
type Quiz = {
  _id: string;
  question: string;
  difficulty: "easy" | "medium" | "hard";
  chapterSlug: string;
};

export default function AdminQuizzesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    courseId: "",
    chapterSlug: "",
    question: "",
    optionsText: "Option A\nOption B\nOption C\nOption D",
    answer: 0,
    explanation: "",
    difficulty: "easy",
    tags: "",
    isPublished: false,
  });

  async function loadInitial() {
    const [coursesRes, quizzesRes] = await Promise.all([
      fetch("/api/admin/courses"),
      fetch("/api/admin/quizzes"),
    ]);

    const coursesData = await coursesRes.json();
    const quizzesData = await quizzesRes.json();

    if (!coursesRes.ok || !quizzesRes.ok) {
      setError(coursesData.message || quizzesData.message || "Failed to load quiz data");
      return;
    }

    setCourses(coursesData.courses || []);
    setQuizzes(quizzesData.quizzes || []);

    if (!form.courseId && coursesData.courses?.length) {
      setForm((prev) => ({ ...prev, courseId: coursesData.courses[0]._id }));
    }
  }

  useEffect(() => {
    loadInitial();
  }, []);

  async function createQuiz(event: FormEvent) {
    event.preventDefault();
    setError("");

    const options = form.optionsText
      .split("\n")
      .map((item) => item.trim())
      .filter(Boolean);

    const response = await fetch("/api/admin/quizzes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        courseId: form.courseId,
        chapterSlug: form.chapterSlug,
        question: form.question,
        options,
        answer: Number(form.answer),
        explanation: form.explanation,
        difficulty: form.difficulty,
        tags: form.tags.split(",").map((tag) => tag.trim()).filter(Boolean),
        isPublished: form.isPublished,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      setError(data.message || "Failed to create quiz");
      return;
    }

    setForm((prev) => ({
      ...prev,
      question: "",
      optionsText: "Option A\nOption B\nOption C\nOption D",
      answer: 0,
      explanation: "",
      tags: "",
      chapterSlug: "",
      isPublished: false,
    }));

    loadInitial();
  }

  return (
    <div>
      <h1 className="text-2xl font-bold">Quiz Manager</h1>
      <p className="mt-2 text-sm text-slate-300">Create and assign MCQs to chapters.</p>

      <form onSubmit={createQuiz} className="mt-6 space-y-3 rounded-2xl border border-white/10 bg-white/5 p-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <select className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm" value={form.courseId} onChange={(e) => setForm((prev) => ({ ...prev, courseId: e.target.value }))} required>
            <option value="">Select course</option>
            {courses.map((course) => (
              <option key={course._id} value={course._id}>{course.title}</option>
            ))}
          </select>
          <input className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm" placeholder="Chapter slug" value={form.chapterSlug} onChange={(e) => setForm((prev) => ({ ...prev, chapterSlug: e.target.value }))} />
        </div>

        <textarea className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm" rows={2} placeholder="Question" value={form.question} onChange={(e) => setForm((prev) => ({ ...prev, question: e.target.value }))} required />
        <textarea className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm" rows={4} placeholder="One option per line" value={form.optionsText} onChange={(e) => setForm((prev) => ({ ...prev, optionsText: e.target.value }))} required />

        <div className="grid gap-3 sm:grid-cols-3">
          <input type="number" min={0} className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm" placeholder="Correct option index" value={form.answer} onChange={(e) => setForm((prev) => ({ ...prev, answer: Number(e.target.value) }))} />
          <select className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm" value={form.difficulty} onChange={(e) => setForm((prev) => ({ ...prev, difficulty: e.target.value }))}>
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
          <input className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm" placeholder="Tags comma separated" value={form.tags} onChange={(e) => setForm((prev) => ({ ...prev, tags: e.target.value }))} />
        </div>

        <textarea className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm" rows={3} placeholder="Explanation" value={form.explanation} onChange={(e) => setForm((prev) => ({ ...prev, explanation: e.target.value }))} />

        <label className="inline-flex items-center gap-2 text-sm">
          <input type="checkbox" checked={form.isPublished} onChange={(e) => setForm((prev) => ({ ...prev, isPublished: e.target.checked }))} />
          Publish immediately
        </label>

        <button className="block rounded-lg bg-cyan-500 px-4 py-2 text-sm font-semibold text-black">Create Quiz</button>
      </form>

      {error ? <p className="mt-3 text-sm text-rose-300">{error}</p> : null}

      <div className="mt-6 overflow-x-auto rounded-2xl border border-white/10">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-white/5 text-slate-300">
            <tr>
              <th className="px-4 py-3">Question</th>
              <th className="px-4 py-3">Chapter</th>
              <th className="px-4 py-3">Difficulty</th>
            </tr>
          </thead>
          <tbody>
            {quizzes.map((quiz) => (
              <tr key={quiz._id} className="border-t border-white/10">
                <td className="px-4 py-3">{quiz.question}</td>
                <td className="px-4 py-3">{quiz.chapterSlug || "-"}</td>
                <td className="px-4 py-3 capitalize">{quiz.difficulty}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
