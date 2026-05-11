"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";

type SubjectOption = {
  _id: string;
  slug: string;
  name: string;
};

type ClassOption = {
  _id: string;
  slug: string;
  name: string;
  subject: string;
};

type LessonDetails = {
  id: string;
  title: string;
  slug: string;
  description: string;
  published: boolean;
  createdAt: string;
  updatedAt: string;
  pdfStatus: string;
  pdfUrl: string;
  thumbnailUrl: string;
  subject: {
    id: string;
    name: string;
    slug: string;
  };
  class: {
    id: string;
    name: string;
    slug: string;
  };
};

type FormState = {
  title: string;
  slug: string;
  description: string;
  subject: string;
  class: string;
  published: boolean;
};

function formatDate(value: string) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString();
}

export default function LmsLessonEditForm({ lessonId }: { lessonId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [subjects, setSubjects] = useState<SubjectOption[]>([]);
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [lesson, setLesson] = useState<LessonDetails | null>(null);
  const [form, setForm] = useState<FormState>({
    title: "",
    slug: "",
    description: "",
    subject: "",
    class: "",
    published: false,
  });

  const filteredClasses = useMemo(() => {
    if (!form.subject) return classes;

    const selectedSubject = subjects.find((subject) => subject.slug === form.subject || subject._id === form.subject);
    if (!selectedSubject) return [];

    return classes.filter((classItem) => classItem.subject === selectedSubject._id);
  }, [classes, form.subject, subjects]);

  useEffect(() => {
    let isCancelled = false;

    async function loadPageData() {
      setLoading(true);
      setError("");

      try {
        const [lessonRes, subjectsRes, classesRes] = await Promise.all([
          fetch(`/api/admin/lms-lessons/${lessonId}`),
          fetch("/api/lms/subjects"),
          fetch("/api/lms/classes"),
        ]);

        const lessonData = (await lessonRes.json()) as { message?: string; lesson?: LessonDetails };
        const subjectsData = (await subjectsRes.json()) as { message?: string; subjects?: SubjectOption[] };
        const classesData = (await classesRes.json()) as { message?: string; classes?: ClassOption[] };

        if (!lessonRes.ok || !lessonData.lesson) {
          throw new Error(lessonData.message || "Failed to load lesson");
        }

        if (!subjectsRes.ok || !classesRes.ok) {
          throw new Error(subjectsData.message || classesData.message || "Failed to load filters");
        }

        if (isCancelled) return;

        setLesson(lessonData.lesson);
        setSubjects(subjectsData.subjects || []);
        setClasses(classesData.classes || []);
        setForm({
          title: lessonData.lesson.title,
          slug: lessonData.lesson.slug,
          description: lessonData.lesson.description,
          subject: lessonData.lesson.subject.slug,
          class: lessonData.lesson.class.slug,
          published: lessonData.lesson.published,
        });
      } catch (loadError) {
        if (!isCancelled) {
          setError(loadError instanceof Error ? loadError.message : "Failed to load lesson");
        }
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    }

    loadPageData().catch(() => {});

    return () => {
      isCancelled = true;
    };
  }, [lessonId]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(`/api/admin/lms-lessons/${lessonId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title,
          slug: form.slug,
          description: form.description,
          subject: form.subject,
          class: form.class,
          published: form.published,
        }),
      });

      const data = (await response.json()) as { message?: string; lesson?: LessonDetails };

      if (!response.ok || !data.lesson) {
        throw new Error(data.message || "Failed to update lesson");
      }

      setLesson(data.lesson);
      setSuccess("Lesson updated successfully.");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Failed to update lesson");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-center text-slate-300">
        Loading lesson details...
      </div>
    );
  }

  if (error && !lesson) {
    return (
      <div className="rounded-2xl border border-rose-400/30 bg-rose-500/10 p-6 text-sm text-rose-100">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/admin/lessons"
          className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-slate-200 transition hover:bg-white/[0.06]"
        >
          Back to lessons
        </Link>

        <div className="text-xs text-slate-400">
          <p>Uploaded: {formatDate(lesson?.createdAt || "")}</p>
          <p>Updated: {formatDate(lesson?.updatedAt || "")}</p>
        </div>
      </div>

      {success ? (
        <div className="rounded-xl border border-emerald-400/30 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-100">
          {success}
        </div>
      ) : null}

      {error ? (
        <div className="rounded-xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
          {error}
        </div>
      ) : null}

      <form onSubmit={handleSubmit} className="space-y-5 rounded-2xl border border-white/10 bg-white/[0.03] p-5 sm:p-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="mb-2 block text-sm font-medium text-slate-200">Lesson Title</label>
            <input
              type="text"
              value={form.title}
              onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
              className="h-10 w-full rounded-xl border border-white/10 bg-slate-950/80 px-3 text-sm text-white outline-none focus:border-cyan-500/50"
              required
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-200">Slug</label>
            <input
              type="text"
              value={form.slug}
              onChange={(event) => setForm((prev) => ({ ...prev, slug: event.target.value }))}
              className="h-10 w-full rounded-xl border border-white/10 bg-slate-950/80 px-3 text-sm text-white outline-none focus:border-cyan-500/50"
              required
            />
          </div>

          <div className="flex items-end">
            <label className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm text-slate-200">
              <input
                type="checkbox"
                checked={form.published}
                onChange={(event) => setForm((prev) => ({ ...prev, published: event.target.checked }))}
              />
              Published
            </label>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-200">Subject</label>
            <select
              value={form.subject}
              onChange={(event) => {
                const nextSubject = event.target.value;
                setForm((prev) => ({ ...prev, subject: nextSubject, class: "" }));
              }}
              className="h-10 w-full rounded-xl border border-white/10 bg-slate-950/80 px-3 text-sm text-white outline-none focus:border-cyan-500/50"
              required
            >
              <option value="">Select subject</option>
              {subjects.map((subject) => (
                <option key={subject._id} value={subject.slug}>
                  {subject.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-200">Class</label>
            <select
              value={form.class}
              onChange={(event) => setForm((prev) => ({ ...prev, class: event.target.value }))}
              className="h-10 w-full rounded-xl border border-white/10 bg-slate-950/80 px-3 text-sm text-white outline-none focus:border-cyan-500/50"
              required
            >
              <option value="">Select class</option>
              {filteredClasses.map((classItem) => (
                <option key={`${classItem.subject}-${classItem.slug}`} value={classItem.slug}>
                  {classItem.name}
                </option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-2">
            <label className="mb-2 block text-sm font-medium text-slate-200">Description</label>
            <textarea
              value={form.description}
              onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
              rows={5}
              className="w-full rounded-xl border border-white/10 bg-slate-950/80 px-3 py-2 text-sm text-white outline-none focus:border-cyan-500/50"
            />
          </div>
        </div>

        <div className="grid gap-3 rounded-xl border border-white/10 bg-black/20 p-4 text-xs text-slate-300 sm:grid-cols-3">
          <div>
            <p className="font-semibold text-slate-200">PDF Status</p>
            <p className="mt-1 uppercase tracking-[0.16em]">{lesson?.pdfStatus || "pending"}</p>
          </div>
          <div className="sm:col-span-2">
            <p className="font-semibold text-slate-200">PDF URL</p>
            <a href={lesson?.pdfUrl || "#"} target="_blank" rel="noreferrer" className="mt-1 line-clamp-1 text-cyan-200 underline">
              {lesson?.pdfUrl || "N/A"}
            </a>
          </div>
        </div>

        <div className="flex flex-wrap justify-end gap-2">
          <button
            type="button"
            onClick={() => router.push("/admin/lessons")}
            className="rounded-lg border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-slate-200"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg border border-cyan-300/30 bg-cyan-400/10 px-4 py-2 text-sm font-semibold text-cyan-100 disabled:opacity-60"
          >
            {saving ? "Saving..." : "Save changes"}
          </button>
        </div>
      </form>
    </div>
  );
}
