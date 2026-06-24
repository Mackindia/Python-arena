"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

type Subject = {
  _id: string;
  name: string;
  slug: string;
};

type ClassItem = {
  _id: string;
  name: string;
  slug: string;
  subject: string;
};

type ContentType = "notes" | "cbse-pdf" | "course";

type CourseItem = {
  _id: string;
  title: string;
  description?: string;
  subjectSlug?: string;
  classSlug?: string;
  status: "draft" | "published" | "archived";
};

function toSlug(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export default function LmsContentHub() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [navSeeding, setNavSeeding] = useState(false);
  const [courses, setCourses] = useState<CourseItem[]>([]);

  const [subjectId, setSubjectId] = useState("");
  const [classId, setClassId] = useState("");
  const [contentType, setContentType] = useState<ContentType>("notes");

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [published, setPublished] = useState(false);

  const [content, setContent] = useState("");

  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [thumbFile, setThumbFile] = useState<File | null>(null);

  const [difficulty, setDifficulty] = useState("beginner");
  const [chaptersInput, setChaptersInput] = useState("");

  const selectedSubject = useMemo(() => subjects.find((item) => item._id === subjectId) ?? null, [subjects, subjectId]);
  const filteredClasses = useMemo(
    () => classes.filter((item) => item.subject === subjectId),
    [classes, subjectId],
  );

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        setError("");

        const [subjectsRes, classesRes, coursesRes] = await Promise.all([
          fetch("/api/lms/subjects", { cache: "no-store" }),
          fetch("/api/lms/classes", { cache: "no-store" }),
          fetch("/api/admin/courses", { cache: "no-store" }),
        ]);

        if (!subjectsRes.ok || !classesRes.ok || !coursesRes.ok) {
          setError("Failed to load subjects/classes");
          return;
        }

        const subjectsData = await subjectsRes.json();
        const classesData = await classesRes.json();
        const coursesData = await coursesRes.json();

        const loadedSubjects: Subject[] = subjectsData.subjects ?? [];
        const loadedClasses: ClassItem[] = classesData.classes ?? [];

        setSubjects(loadedSubjects);
        setClasses(loadedClasses);
        setCourses(coursesData.courses ?? []);

        if (loadedSubjects.length) {
          setSubjectId(loadedSubjects[0]._id);
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  const filteredCourses = useMemo(() => {
    const selectedClass = classes.find((item) => item._id === classId);
    if (!selectedSubject || !selectedClass) {
      return [];
    }

    return courses.filter((course) => {
      const courseSubject = String(course.subjectSlug || "").toLowerCase();
      const courseClass = String(course.classSlug || "").toLowerCase();
      return courseSubject === selectedSubject.slug.toLowerCase() && courseClass === selectedClass.slug.toLowerCase();
    });
  }, [courses, classes, classId, selectedSubject]);

  async function refreshCourses() {
    const response = await fetch("/api/admin/courses", { cache: "no-store" });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || "Failed to load courses");
    }
    setCourses(data.courses ?? []);
  }

  useEffect(() => {
    if (!subjectId) {
      setClassId("");
      return;
    }

    const firstClass = classes.find((item) => item.subject === subjectId);
    setClassId(firstClass?._id ?? "");
  }, [subjectId, classes]);

  async function uploadAsset(kind: "pdf" | "image", file: File) {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("kind", kind);
    formData.append("folder", kind === "pdf" ? "lms/pdfs" : "lms/thumbnails");

    const response = await fetch("/api/admin/upload", {
      method: "POST",
      body: formData,
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || "Upload failed");
    }

    return String(data.upload?.secure_url || "");
  }

  async function createNotesOrPdf() {
    if (!subjectId || !classId) {
      throw new Error("Select subject and class");
    }

    if (!title.trim() || !description.trim()) {
      throw new Error("Title and description are required");
    }

    let pdfUrl = "";
    let thumbnailUrl = "";

    if (contentType === "cbse-pdf") {
      if (!pdfFile || !thumbFile) {
        throw new Error("PDF and thumbnail are required for CBSE PDF content");
      }
      pdfUrl = await uploadAsset("pdf", pdfFile);
      thumbnailUrl = await uploadAsset("image", thumbFile);
    }

    if (contentType === "notes" && !content.trim()) {
      throw new Error("Lesson content is required for notes");
    }

    const response = await fetch("/api/admin/lms-lessons", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: title.trim(),
        description: description.trim(),
        subject: subjectId,
        class: classId,
        contentType,
        content: content.trim(),
        pdfUrl,
        thumbnailUrl,
        thumbnail: thumbnailUrl,
        published,
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      // Show specific field errors if the API returned them
      if (data.errors && typeof data.errors === "object") {
        const fieldErrors = Object.entries(data.errors)
          .map(([field, msgs]) => `${field}: ${Array.isArray(msgs) ? msgs.join(", ") : msgs}`)
          .join(" | ");
        throw new Error(fieldErrors || data.message || "Failed to create content");
      }
      throw new Error(data.message || "Failed to create content");
    }

    return data;
  }

  async function createCourse() {
    if (!subjectId || !classId) {
      throw new Error("Select subject and class");
    }

    const selectedClass = classes.find((item) => item._id === classId);
    if (!selectedSubject || !selectedClass) {
      throw new Error("Invalid subject/class selection");
    }

    if (!title.trim()) {
      throw new Error("Course title is required");
    }

    const chapters = chaptersInput
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line, index) => ({ title: line, slug: toSlug(line), order: index }));

    const response = await fetch("/api/admin/courses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: title.trim(),
        description: description.trim(),
        subject: selectedSubject.name,
        subjectSlug: selectedSubject.slug,
        classLevel: selectedClass.name,
        classSlug: selectedClass.slug,
        category: selectedSubject.name,
        difficulty,
        chapters,
        status: published ? "published" : "draft",
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || "Failed to create course");
    }

    return data;
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();

    try {
      setSaving(true);
      setError("");
      setMessage("");

      if (contentType === "course") {
        await createCourse();
        setMessage("Course saved successfully.");
        await refreshCourses();
      } else {
        await createNotesOrPdf();
        setMessage("Content saved successfully.");
      }

      setTitle("");
      setDescription("");
      setContent("");
      setPdfFile(null);
      setThumbFile(null);
      setChaptersInput("");
      setPublished(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setSaving(false);
    }
  }

  async function toggleCourseStatus(course: CourseItem) {
    const nextStatus = course.status === "published" ? "draft" : "published";

    try {
      setError("");
      setMessage("");
      const response = await fetch(`/api/admin/courses/${course._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Failed to update course status");
      }
      await refreshCourses();
      setMessage(`Course ${nextStatus === "published" ? "published" : "saved as draft"}.`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    }
  }

  async function editCourse(course: CourseItem) {
    const nextTitle = window.prompt("Update course title", course.title);
    if (!nextTitle || !nextTitle.trim()) return;

    const nextDescription = window.prompt("Update course description", course.description ?? "") ?? "";

    try {
      setError("");
      setMessage("");
      const response = await fetch(`/api/admin/courses/${course._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: nextTitle.trim(), description: nextDescription.trim() }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Failed to update course");
      }
      await refreshCourses();
      setMessage("Course updated successfully.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    }
  }

  async function deleteCourse(course: CourseItem) {
    const confirmed = window.confirm(`Delete course \"${course.title}\"? This cannot be undone.`);
    if (!confirmed) return;

    try {
      setError("");
      setMessage("");
      const response = await fetch(`/api/admin/courses/${course._id}`, {
        method: "DELETE",
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Failed to delete course");
      }
      await refreshCourses();
      setMessage("Course deleted.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    }
  }

  async function reseedNavigation() {
    try {
      setNavSeeding(true);
      setError("");
      setMessage("");

      const response = await fetch("/api/admin/navigation/seed", {
        method: "POST",
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to reseed navigation");
      }

      setMessage(`Navigation reseeded: ${data.subjects} subjects, ${data.classes} classes/categories.`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setNavSeeding(false);
    }
  }

  if (loading) {
    return <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-slate-300">Loading content hub...</div>;
  }

  return (
    <div className="space-y-5">
      <form onSubmit={onSubmit} className="space-y-5 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-slate-950/50 p-4">
          <div>
            <p className="text-sm font-medium text-white">Learn navigation matrix</p>
            <p className="mt-1 text-xs text-slate-400">
              Recreate AI, Python, and Computer Science subject/class entries without disturbing content.
            </p>
          </div>
          <button
            type="button"
            onClick={reseedNavigation}
            disabled={navSeeding}
            className="rounded-lg border border-cyan-300/30 bg-cyan-400/10 px-4 py-2 text-sm font-semibold text-cyan-100 transition hover:bg-cyan-400/20 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {navSeeding ? "Reseeding..." : "Reseed Navigation"}
          </button>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <label className="space-y-2 text-sm">
            <span className="text-slate-200">Subject</span>
            <select
              value={subjectId}
              onChange={(event) => setSubjectId(event.target.value)}
              className="w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-sm text-white"
            >
              {subjects.map((subject) => (
                <option key={subject._id} value={subject._id}>
                  {subject.name}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-2 text-sm">
            <span className="text-slate-200">Class/Category</span>
            <select
              value={classId}
              onChange={(event) => setClassId(event.target.value)}
              className="w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-sm text-white"
            >
              {filteredClasses.map((classItem) => (
                <option key={classItem._id} value={classItem._id}>
                  {classItem.name}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-2 text-sm">
            <span className="text-slate-200">Content Type</span>
            <select
              value={contentType}
              onChange={(event) => setContentType(event.target.value as ContentType)}
              className="w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-sm text-white"
            >
              <option value="notes">Lesson Content</option>
              <option value="cbse-pdf">PDF</option>
              <option value="course">Course</option>
            </select>
          </label>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <label className="space-y-2 text-sm md:col-span-1">
            <span className="text-slate-200">Title</span>
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              className="w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-sm text-white"
              placeholder={contentType === "course" ? "Course title" : "Lesson title"}
            />
          </label>

          <label className="space-y-2 text-sm md:col-span-1">
            <span className="text-slate-200">Description</span>
            <input
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              className="w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-sm text-white"
              placeholder="Short summary"
            />
          </label>
        </div>

        {contentType === "notes" ? (
          <label className="space-y-2 text-sm">
            <span className="text-slate-200">Lesson Content (Markdown supported)</span>
            <textarea
              value={content}
              onChange={(event) => setContent(event.target.value)}
              rows={12}
              className="w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-sm text-white"
              placeholder="# Heading\n\n- Bullet point\n- MCQ: A) ...\n\n```python\nprint('hello')\n```"
            />
          </label>
        ) : null}

        {contentType === "cbse-pdf" ? (
          <div className="grid gap-3 md:grid-cols-2">
            <label className="space-y-2 text-sm">
              <span className="text-slate-200">PDF File</span>
              <input
                type="file"
                accept="application/pdf"
                onChange={(event) => setPdfFile(event.target.files?.[0] ?? null)}
                className="w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-sm text-white"
              />
            </label>
            <label className="space-y-2 text-sm">
              <span className="text-slate-200">Thumbnail Image</span>
              <input
                type="file"
                accept="image/*"
                onChange={(event) => setThumbFile(event.target.files?.[0] ?? null)}
                className="w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-sm text-white"
              />
            </label>
          </div>
        ) : null}

        {contentType === "course" ? (
          <div className="grid gap-3 md:grid-cols-2">
            <label className="space-y-2 text-sm">
              <span className="text-slate-200">Difficulty</span>
              <select
                value={difficulty}
                onChange={(event) => setDifficulty(event.target.value)}
                className="w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-sm text-white"
              >
                <option value="beginner">beginner</option>
                <option value="intermediate">intermediate</option>
                <option value="advanced">advanced</option>
              </select>
            </label>
            <label className="space-y-2 text-sm md:col-span-2">
              <span className="text-slate-200">Modules/Chapters (one per line)</span>
              <textarea
                value={chaptersInput}
                onChange={(event) => setChaptersInput(event.target.value)}
                rows={8}
                className="w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-sm text-white"
                placeholder="Introduction\nData Types\nControl Flow"
              />
            </label>
          </div>
        ) : null}

        <label className="inline-flex items-center gap-2 text-sm text-slate-200">
          <input
            type="checkbox"
            checked={published}
            onChange={(event) => setPublished(event.target.checked)}
            className="h-4 w-4 rounded border-white/20 bg-slate-950"
          />
          Publish now
        </label>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? "Saving..." : "Save Content"}
          </button>
          {message ? <p className="text-sm text-emerald-300">{message}</p> : null}
          {error ? <p className="text-sm text-rose-300">{error}</p> : null}
        </div>
      </form>

      <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
        <h2 className="text-lg font-semibold text-white">Course Management</h2>
        <p className="mt-1 text-sm text-slate-300">
          Publish/unpublish, edit, or delete courses for the selected subject and class.
        </p>

        <div className="mt-4 space-y-2">
          {filteredCourses.length ? (
            filteredCourses.map((course) => (
              <div key={course._id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-slate-950/60 p-3">
                <div>
                  <p className="font-medium text-white">{course.title}</p>
                  <p className="text-xs text-slate-400">Status: {course.status}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => toggleCourseStatus(course)}
                    className="rounded-md border border-cyan-300/30 px-3 py-1.5 text-xs text-cyan-100 transition hover:bg-cyan-400/10"
                  >
                    {course.status === "published" ? "Unpublish" : "Publish"}
                  </button>
                  <button
                    type="button"
                    onClick={() => editCourse(course)}
                    className="rounded-md border border-white/20 px-3 py-1.5 text-xs text-white transition hover:bg-white/10"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteCourse(course)}
                    className="rounded-md border border-rose-400/30 px-3 py-1.5 text-xs text-rose-200 transition hover:bg-rose-500/10"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-xl border border-white/10 bg-slate-950/60 p-4 text-sm text-slate-400">
              No courses found for this subject/class selection.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
