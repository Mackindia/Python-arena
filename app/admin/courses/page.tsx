"use client";

import { FormEvent, useEffect, useState } from "react";

type Course = {
  _id: string;
  title: string;
  subject: string;
  classLevel: string;
  difficulty: string;
  status: string;
  thumbnail: string;
};

export default function AdminCoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    title: "",
    description: "",
    subject: "Python",
    classLevel: "Class 11",
    category: "Computer Science",
    difficulty: "beginner",
    thumbnail: "",
  });

  async function fetchCourses() {
    setLoading(true);
    const response = await fetch("/api/admin/courses");
    const data = await response.json();
    setLoading(false);

    if (!response.ok) {
      setError(data.message || "Failed to load courses");
      return;
    }

    setCourses(data.courses || []);
  }

  useEffect(() => {
    fetchCourses();
  }, []);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");

    const response = await fetch("/api/admin/courses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    const data = await response.json();

    if (!response.ok) {
      setError(data.message || "Failed to create course");
      return;
    }

    setForm({
      title: "",
      description: "",
      subject: "Python",
      classLevel: "Class 11",
      category: "Computer Science",
      difficulty: "beginner",
      thumbnail: "",
    });

    fetchCourses();
  }

  return (
    <div>
      <h1 className="text-2xl font-bold">Course Creator</h1>
      <p className="mt-2 text-sm text-slate-300">Create and manage courses dynamically without code edits.</p>

      <form onSubmit={onSubmit} className="mt-6 grid gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 sm:grid-cols-2">
        <input className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm" placeholder="Course title" value={form.title} onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))} required />
        <input className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm" placeholder="Subject" value={form.subject} onChange={(e) => setForm((prev) => ({ ...prev, subject: e.target.value }))} required />
        <input className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm" placeholder="Class" value={form.classLevel} onChange={(e) => setForm((prev) => ({ ...prev, classLevel: e.target.value }))} required />
        <select className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm" value={form.difficulty} onChange={(e) => setForm((prev) => ({ ...prev, difficulty: e.target.value }))}>
          <option value="beginner">Beginner</option>
          <option value="intermediate">Intermediate</option>
          <option value="advanced">Advanced</option>
        </select>
        <input className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm" placeholder="Category (AI/Python/Computer Science)" value={form.category} onChange={(e) => setForm((prev) => ({ ...prev, category: e.target.value }))} />
        <input className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm" placeholder="Thumbnail URL" value={form.thumbnail} onChange={(e) => setForm((prev) => ({ ...prev, thumbnail: e.target.value }))} />
        <textarea className="sm:col-span-2 rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm" rows={4} placeholder="Description" value={form.description} onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))} />
        <button className="sm:col-span-2 rounded-lg bg-cyan-500 px-4 py-2 text-sm font-semibold text-black">Create Course</button>
      </form>

      {error ? <p className="mt-3 text-sm text-rose-300">{error}</p> : null}

      <div className="mt-6 overflow-x-auto rounded-2xl border border-white/10">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-white/5 text-slate-300">
            <tr>
              <th className="px-4 py-3">Title</th>
              <th className="px-4 py-3">Subject</th>
              <th className="px-4 py-3">Class</th>
              <th className="px-4 py-3">Difficulty</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {!loading && courses.map((course) => (
              <tr key={course._id} className="border-t border-white/10">
                <td className="px-4 py-3">{course.title}</td>
                <td className="px-4 py-3">{course.subject}</td>
                <td className="px-4 py-3">{course.classLevel}</td>
                <td className="px-4 py-3 capitalize">{course.difficulty}</td>
                <td className="px-4 py-3 capitalize">{course.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
