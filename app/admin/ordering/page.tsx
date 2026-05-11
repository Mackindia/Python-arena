"use client";

import { useEffect, useState } from "react";

type Course = { _id: string; title: string; chapters: { title: string; slug: string }[] };
type Item = { _id: string; title?: string; question?: string; order?: number };

function reorder<T>(list: T[], from: number, to: number) {
  const copy = [...list];
  const [moved] = copy.splice(from, 1);
  copy.splice(to, 0, moved);
  return copy;
}

export default function AdminOrderingPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [lessons, setLessons] = useState<Item[]>([]);
  const [quizzes, setQuizzes] = useState<Item[]>([]);
  const [courseId, setCourseId] = useState("");
  const [chapterList, setChapterList] = useState<{ title: string; slug: string }[]>([]);
  const [error, setError] = useState("");

  async function load() {
    const [courseRes, lessonRes, quizRes] = await Promise.all([
      fetch("/api/admin/courses"),
      fetch("/api/admin/lessons"),
      fetch("/api/admin/quizzes"),
    ]);

    const courseData = await courseRes.json();
    const lessonData = await lessonRes.json();
    const quizData = await quizRes.json();

    if (!courseRes.ok || !lessonRes.ok || !quizRes.ok) {
      setError(courseData.message || lessonData.message || quizData.message || "Failed to load ordering data");
      return;
    }

    setCourses(courseData.courses || []);
    setLessons((lessonData.lessons || []).sort((a: Item, b: Item) => (a.order ?? 0) - (b.order ?? 0)));
    setQuizzes((quizData.quizzes || []).sort((a: Item, b: Item) => (a.order ?? 0) - (b.order ?? 0)));

    if (!courseId && courseData.courses?.length) {
      setCourseId(courseData.courses[0]._id);
      setChapterList(courseData.courses[0].chapters || []);
    }
  }

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    const selected = courses.find((course) => course._id === courseId);
    setChapterList(selected?.chapters || []);
  }, [courseId, courses]);

  async function saveChapters() {
    await fetch("/api/admin/order/chapters", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ courseId, chapters: chapterList }),
    });
    load();
  }

  async function saveLessons() {
    await fetch("/api/admin/order/lessons", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items: lessons.map((item, index) => ({ id: item._id, order: index })) }),
    });
    load();
  }

  async function saveQuizzes() {
    await fetch("/api/admin/order/quizzes", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items: quizzes.map((item, index) => ({ id: item._id, order: index })) }),
    });
    load();
  }

  return (
    <div>
      <h1 className="text-2xl font-bold">Ordering</h1>
      <p className="mt-2 text-sm text-slate-300">Reorder chapters, lessons and quizzes with drag-and-drop.</p>

      {error ? <p className="mt-3 text-sm text-rose-300">{error}</p> : null}

      <section className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="text-lg font-semibold">Chapter Ordering</h2>
          <select className="rounded border border-white/10 bg-black/40 px-3 py-2 text-sm" value={courseId} onChange={(e) => setCourseId(e.target.value)}>
            {courses.map((course) => <option key={course._id} value={course._id}>{course.title}</option>)}
          </select>
          <button onClick={saveChapters} className="rounded bg-cyan-500 px-3 py-2 text-sm font-semibold text-black">Save Chapters</button>
        </div>

        <ul className="mt-4 space-y-2">
          {chapterList.map((chapter, index) => (
            <li
              key={chapter.slug}
              className="cursor-move rounded-xl border border-white/10 bg-black/30 px-3 py-2"
              draggable
              onDragStart={(event) => event.dataTransfer.setData("text/plain", String(index))}
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => {
                const from = Number(event.dataTransfer.getData("text/plain"));
                setChapterList((prev) => reorder(prev, from, index));
              }}
            >
              {chapter.title}
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-6 grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Lesson Ordering</h2>
            <button onClick={saveLessons} className="rounded bg-cyan-500 px-3 py-2 text-sm font-semibold text-black">Save Lessons</button>
          </div>
          <ul className="mt-4 space-y-2">
            {lessons.map((lesson, index) => (
              <li
                key={lesson._id}
                className="cursor-move rounded-xl border border-white/10 bg-black/30 px-3 py-2"
                draggable
                onDragStart={(event) => event.dataTransfer.setData("text/plain", String(index))}
                onDragOver={(event) => event.preventDefault()}
                onDrop={(event) => {
                  const from = Number(event.dataTransfer.getData("text/plain"));
                  setLessons((prev) => reorder(prev, from, index));
                }}
              >
                {lesson.title}
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Quiz Ordering</h2>
            <button onClick={saveQuizzes} className="rounded bg-cyan-500 px-3 py-2 text-sm font-semibold text-black">Save Quizzes</button>
          </div>
          <ul className="mt-4 space-y-2">
            {quizzes.map((quiz, index) => (
              <li
                key={quiz._id}
                className="cursor-move rounded-xl border border-white/10 bg-black/30 px-3 py-2"
                draggable
                onDragStart={(event) => event.dataTransfer.setData("text/plain", String(index))}
                onDragOver={(event) => event.preventDefault()}
                onDrop={(event) => {
                  const from = Number(event.dataTransfer.getData("text/plain"));
                  setQuizzes((prev) => reorder(prev, from, index));
                }}
              >
                {quiz.question}
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}
