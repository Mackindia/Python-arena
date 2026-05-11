"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

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

type LessonRow = {
  id: string;
  title: string;
  slug: string;
  description: string;
  published: boolean;
  createdAt: string;
  updatedAt: string;
  pdfStatus: "pending" | "succeeded" | "failed" | "skipped" | string;
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

type LessonsResponse = {
  items: LessonRow[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
};

type Notification = {
  type: "success" | "error";
  message: string;
};

function formatDate(value: string) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString();
}

function PdfStatusBadge({ status }: { status: LessonRow["pdfStatus"] }) {
  const map: Record<string, string> = {
    succeeded: "border-emerald-400/30 bg-emerald-400/15 text-emerald-200",
    failed: "border-rose-400/30 bg-rose-400/15 text-rose-200",
    pending: "border-amber-400/30 bg-amber-400/15 text-amber-200",
    skipped: "border-slate-300/20 bg-slate-300/10 text-slate-200",
  };

  return (
    <span className={`inline-flex rounded-full border px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] ${map[status] || map.pending}`}>
      {status}
    </span>
  );
}

function PublishBadge({ published }: { published: boolean }) {
  return (
    <span
      className={`inline-flex rounded-full border px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] ${
        published
          ? "border-emerald-400/30 bg-emerald-400/15 text-emerald-200"
          : "border-slate-300/20 bg-slate-300/10 text-slate-200"
      }`}
    >
      {published ? "Published" : "Draft"}
    </span>
  );
}

export default function LmsLessonManager() {
  const [subjects, setSubjects] = useState<SubjectOption[]>([]);
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [lessons, setLessons] = useState<LessonRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [subjectFilter, setSubjectFilter] = useState("");
  const [classFilter, setClassFilter] = useState("");
  const [publishedFilter, setPublishedFilter] = useState<"all" | "published" | "draft">("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState<LessonsResponse["meta"]>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPrevPage: false,
  });
  const [notification, setNotification] = useState<Notification | null>(null);
  const [pendingLessonId, setPendingLessonId] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<LessonRow | null>(null);

  const visibleClasses = useMemo(() => {
    if (!subjectFilter) return classes;
    const selectedSubject = subjects.find((subject) => subject.slug === subjectFilter);
    if (!selectedSubject) return [];
    return classes.filter((item) => item.subject === selectedSubject._id);
  }, [classes, subjectFilter, subjects]);

  const fetchStaticFilters = useCallback(async () => {
    const [subjectsRes, classesRes] = await Promise.all([fetch("/api/lms/subjects"), fetch("/api/lms/classes")]);

    if (!subjectsRes.ok || !classesRes.ok) {
      throw new Error("Failed to load subjects and classes");
    }

    const subjectsData = (await subjectsRes.json()) as { subjects?: SubjectOption[] };
    const classesData = (await classesRes.json()) as { classes?: ClassOption[] };

    setSubjects(subjectsData.subjects || []);
    setClasses(classesData.classes || []);
  }, []);

  const fetchLessons = useCallback(async () => {
    setLoading(true);
    setNotification(null);

    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: "10",
      });

      if (subjectFilter) params.set("subject", subjectFilter);
      if (classFilter) params.set("class", classFilter);
      if (publishedFilter !== "all") params.set("published", publishedFilter);
      if (search.trim()) params.set("q", search.trim());

      const response = await fetch(`/api/admin/lms-lessons?${params.toString()}`);
      const data = (await response.json()) as LessonsResponse & { message?: string };

      if (!response.ok) {
        throw new Error(data.message || "Failed to load lessons");
      }

      setLessons(data.items || []);
      setMeta(data.meta);
    } catch (error) {
      setLessons([]);
      setMeta({
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0,
        hasNextPage: false,
        hasPrevPage: false,
      });
      setNotification({
        type: "error",
        message: error instanceof Error ? error.message : "Failed to load lessons",
      });
    } finally {
      setLoading(false);
    }
  }, [classFilter, page, publishedFilter, search, subjectFilter]);

  useEffect(() => {
    fetchStaticFilters().catch((error) => {
      setNotification({
        type: "error",
        message: error instanceof Error ? error.message : "Failed to load filters",
      });
    });
  }, [fetchStaticFilters]);

  useEffect(() => {
    fetchLessons().catch(() => {});
  }, [fetchLessons]);

  function resetPageAndSet<T>(setter: (value: T) => void, value: T) {
    setPage(1);
    setter(value);
  }

  async function handlePublishToggle(lesson: LessonRow) {
    setPendingLessonId(lesson.id);
    setNotification(null);

    try {
      const response = await fetch(`/api/admin/lms-lessons/${lesson.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ published: !lesson.published }),
      });

      const data = (await response.json()) as { message?: string; lesson?: LessonRow };

      if (!response.ok) {
        throw new Error(data.message || "Failed to update publish state");
      }

      setLessons((prev) => prev.map((item) => (item.id === lesson.id ? { ...item, published: !lesson.published } : item)));
      setNotification({
        type: "success",
        message: !lesson.published ? "Lesson published" : "Lesson unpublished",
      });
    } catch (error) {
      setNotification({
        type: "error",
        message: error instanceof Error ? error.message : "Failed to update publish state",
      });
    } finally {
      setPendingLessonId("");
    }
  }

  async function handleDeleteConfirmed() {
    if (!deleteTarget) {
      return;
    }

    setPendingLessonId(deleteTarget.id);
    setNotification(null);

    try {
      const response = await fetch(`/api/admin/lms-lessons/${deleteTarget.id}`, {
        method: "DELETE",
      });

      const data = (await response.json()) as { message?: string; errors?: string[] };

      if (!response.ok) {
        const details = data.errors?.length ? ` (${data.errors.join("; ")})` : "";
        throw new Error((data.message || "Failed to delete lesson") + details);
      }

      setDeleteTarget(null);
      setNotification({ type: "success", message: "Lesson deleted successfully" });

      if (lessons.length === 1 && page > 1) {
        setPage((prev) => prev - 1);
      } else {
        fetchLessons().catch(() => {});
      }
    } catch (error) {
      setNotification({
        type: "error",
        message: error instanceof Error ? error.message : "Failed to delete lesson",
      });
    } finally {
      setPendingLessonId("");
    }
  }

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:p-5">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <input
            type="search"
            value={search}
            onChange={(event) => resetPageAndSet(setSearch, event.target.value)}
            placeholder="Search by title"
            className="h-10 rounded-xl border border-white/10 bg-slate-950/80 px-3 text-sm text-slate-100 outline-none focus:border-cyan-500/50"
          />

          <select
            value={subjectFilter}
            onChange={(event) => {
              const value = event.target.value;
              setPage(1);
              setSubjectFilter(value);
              setClassFilter("");
            }}
            className="h-10 rounded-xl border border-white/10 bg-slate-950/80 px-3 text-sm text-slate-100 outline-none focus:border-cyan-500/50"
          >
            <option value="">All subjects</option>
            {subjects.map((subject) => (
              <option key={subject._id} value={subject.slug}>
                {subject.name}
              </option>
            ))}
          </select>

          <select
            value={classFilter}
            onChange={(event) => resetPageAndSet(setClassFilter, event.target.value)}
            className="h-10 rounded-xl border border-white/10 bg-slate-950/80 px-3 text-sm text-slate-100 outline-none focus:border-cyan-500/50"
          >
            <option value="">All classes</option>
            {visibleClasses.map((classItem) => (
              <option key={`${classItem.subject}-${classItem.slug}`} value={classItem.slug}>
                {classItem.name}
              </option>
            ))}
          </select>

          <select
            value={publishedFilter}
            onChange={(event) => resetPageAndSet(setPublishedFilter, event.target.value as "all" | "published" | "draft")}
            className="h-10 rounded-xl border border-white/10 bg-slate-950/80 px-3 text-sm text-slate-100 outline-none focus:border-cyan-500/50"
          >
            <option value="all">All statuses</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
          </select>
        </div>
      </div>

      {notification ? (
        <div
          className={`rounded-xl border px-4 py-3 text-sm ${
            notification.type === "success"
              ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-100"
              : "border-rose-400/30 bg-rose-400/10 text-rose-100"
          }`}
        >
          {notification.message}
        </div>
      ) : null}

      <div className="rounded-2xl border border-white/10 bg-white/[0.02]">
        <div className="hidden overflow-x-auto md:block">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-white/[0.04] text-slate-300">
              <tr>
                <th className="px-4 py-3">Title</th>
                <th className="px-4 py-3">Subject / Class</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">PDF</th>
                <th className="px-4 py-3">Uploaded</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-slate-400">
                    Loading lessons...
                  </td>
                </tr>
              ) : lessons.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-slate-400">
                    No lessons found for current filters.
                  </td>
                </tr>
              ) : (
                lessons.map((lesson) => (
                  <tr key={lesson.id} className="border-t border-white/10 align-top">
                    <td className="px-4 py-3">
                      <p className="font-medium text-white">{lesson.title}</p>
                      <p className="mt-1 text-xs text-slate-400">/{lesson.slug}</p>
                    </td>
                    <td className="px-4 py-3 text-slate-200">
                      <p>{lesson.subject.name}</p>
                      <p className="text-xs text-slate-400">{lesson.class.name}</p>
                    </td>
                    <td className="px-4 py-3">
                      <PublishBadge published={lesson.published} />
                    </td>
                    <td className="px-4 py-3">
                      <PdfStatusBadge status={lesson.pdfStatus} />
                    </td>
                    <td className="px-4 py-3 text-slate-300">
                      <p>{formatDate(lesson.createdAt)}</p>
                      <p className="mt-1 text-xs text-slate-500">Updated {formatDate(lesson.updatedAt)}</p>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap justify-end gap-2">
                        <Link
                          href={`/admin/lessons/edit/${lesson.id}`}
                          className="rounded-lg border border-cyan-300/30 bg-cyan-400/10 px-3 py-1.5 text-xs font-semibold text-cyan-100 transition hover:bg-cyan-400/20"
                        >
                          Edit
                        </Link>
                        <button
                          type="button"
                          disabled={pendingLessonId === lesson.id}
                          onClick={() => handlePublishToggle(lesson)}
                          className="rounded-lg border border-amber-300/30 bg-amber-400/10 px-3 py-1.5 text-xs font-semibold text-amber-100 transition hover:bg-amber-400/20 disabled:opacity-60"
                        >
                          {lesson.published ? "Unpublish" : "Publish"}
                        </button>
                        <button
                          type="button"
                          disabled={pendingLessonId === lesson.id}
                          onClick={() => setDeleteTarget(lesson)}
                          className="rounded-lg border border-rose-300/30 bg-rose-400/10 px-3 py-1.5 text-xs font-semibold text-rose-100 transition hover:bg-rose-400/20 disabled:opacity-60"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="space-y-3 p-3 md:hidden">
          {loading ? (
            <div className="rounded-xl border border-white/10 bg-black/20 px-4 py-6 text-center text-sm text-slate-400">
              Loading lessons...
            </div>
          ) : lessons.length === 0 ? (
            <div className="rounded-xl border border-white/10 bg-black/20 px-4 py-6 text-center text-sm text-slate-400">
              No lessons found for current filters.
            </div>
          ) : (
            lessons.map((lesson) => (
              <article key={lesson.id} className="rounded-xl border border-white/10 bg-black/20 p-4">
                <p className="text-sm font-semibold text-white">{lesson.title}</p>
                <p className="mt-1 text-xs text-slate-400">/{lesson.slug}</p>
                <p className="mt-3 text-xs text-slate-300">
                  {lesson.subject.name} • {lesson.class.name}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <PublishBadge published={lesson.published} />
                  <PdfStatusBadge status={lesson.pdfStatus} />
                </div>
                <p className="mt-3 text-xs text-slate-500">Uploaded {formatDate(lesson.createdAt)}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Link
                    href={`/admin/lessons/edit/${lesson.id}`}
                    className="rounded-lg border border-cyan-300/30 bg-cyan-400/10 px-3 py-1.5 text-xs font-semibold text-cyan-100"
                  >
                    Edit
                  </Link>
                  <button
                    type="button"
                    disabled={pendingLessonId === lesson.id}
                    onClick={() => handlePublishToggle(lesson)}
                    className="rounded-lg border border-amber-300/30 bg-amber-400/10 px-3 py-1.5 text-xs font-semibold text-amber-100 disabled:opacity-60"
                  >
                    {lesson.published ? "Unpublish" : "Publish"}
                  </button>
                  <button
                    type="button"
                    disabled={pendingLessonId === lesson.id}
                    onClick={() => setDeleteTarget(lesson)}
                    className="rounded-lg border border-rose-300/30 bg-rose-400/10 px-3 py-1.5 text-xs font-semibold text-rose-100 disabled:opacity-60"
                  >
                    Delete
                  </button>
                </div>
              </article>
            ))
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3 text-sm">
        <p className="text-slate-300">
          Showing page {meta.page} of {Math.max(1, meta.totalPages)} • {meta.total} lessons
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={!meta.hasPrevPage || loading}
            onClick={() => setPage((prev) => Math.max(1, prev - 1))}
            className="rounded-lg border border-white/10 bg-black/20 px-3 py-1.5 text-slate-200 disabled:opacity-50"
          >
            Previous
          </button>
          <button
            type="button"
            disabled={!meta.hasNextPage || loading}
            onClick={() => setPage((prev) => prev + 1)}
            className="rounded-lg border border-white/10 bg-black/20 px-3 py-1.5 text-slate-200 disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>

      {deleteTarget ? (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/65 px-4">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-slate-900 p-5 shadow-[0_24px_80px_rgba(2,6,23,0.55)]">
            <h3 className="text-lg font-semibold text-white">Delete lesson?</h3>
            <p className="mt-2 text-sm text-slate-300">
              This will permanently remove the lesson from MongoDB and attempt to delete its PDF and thumbnail from Cloudinary.
            </p>
            <p className="mt-3 rounded-lg border border-rose-400/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-100">
              {deleteTarget.title}
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1.5 text-sm text-slate-200"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirmed}
                disabled={pendingLessonId === deleteTarget.id}
                className="rounded-lg border border-rose-300/30 bg-rose-500/20 px-3 py-1.5 text-sm font-semibold text-rose-100 disabled:opacity-60"
              >
                {pendingLessonId === deleteTarget.id ? "Deleting..." : "Confirm delete"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
