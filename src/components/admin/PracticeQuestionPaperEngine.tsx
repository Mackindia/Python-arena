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

type ResourceType = "question-paper" | "sample-paper" | "important-pdf" | "worksheet" | "other";

type PracticeResource = {
  id: string;
  title: string;
  description: string;
  resourceType: ResourceType;
  fileUrl: string;
  published: boolean;
  createdAt?: string | null;
  subject: { id: string; name: string; slug: string };
  class: { id: string; name: string; slug: string };
};

const resourceTypeOptions: Array<{ value: ResourceType; label: string }> = [
  { value: "question-paper", label: "Question Paper" },
  { value: "sample-paper", label: "Sample Paper" },
  { value: "important-pdf", label: "Important PDF" },
  { value: "worksheet", label: "Worksheet" },
  { value: "other", label: "Other Resource" },
];

function uploadPdf(file: File, onProgress: (percent: number) => void) {
  return new Promise<string>((resolve, reject) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("kind", "pdf");
    formData.append("folder", "practice/resources");

    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/admin/upload");

    xhr.upload.onprogress = (event) => {
      if (!event.lengthComputable) return;
      const percent = Math.min(100, Math.round((event.loaded / event.total) * 100));
      onProgress(percent);
    };

    xhr.onerror = () => {
      reject(new Error("Network error while uploading PDF"));
    };

    xhr.onload = () => {
      let data: { message?: string; upload?: { url?: string } } = {};
      try {
        data = JSON.parse(xhr.responseText || "{}");
      } catch {
        reject(new Error("Invalid upload response"));
        return;
      }

      if (xhr.status < 200 || xhr.status >= 300) {
        reject(new Error(data.message || "PDF upload failed"));
        return;
      }

      const fileUrl = String(data.upload?.url || "");
      if (!fileUrl) {
        reject(new Error("Upload succeeded but URL was missing"));
        return;
      }

      onProgress(100);
      resolve(fileUrl);
    };

    xhr.send(formData);
  });
}

export default function PracticeQuestionPaperEngine() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [resources, setResources] = useState<PracticeResource[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [newSubjectName, setNewSubjectName] = useState("");
  const [newSubjectDescription, setNewSubjectDescription] = useState("");
  const [subjectForClass, setSubjectForClass] = useState("");
  const [newClassName, setNewClassName] = useState("");

  const [subjectId, setSubjectId] = useState("");
  const [classId, setClassId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [resourceType, setResourceType] = useState<ResourceType>("question-paper");
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [published, setPublished] = useState(true);

  const filteredClasses = useMemo(
    () => classes.filter((item) => item.subject === subjectId),
    [classes, subjectId],
  );

  const classesForSubjectCreator = useMemo(
    () => classes.filter((item) => item.subject === subjectForClass),
    [classes, subjectForClass],
  );

  const resourceCountBySubject = useMemo(() => {
    const map = new Map<string, number>();
    for (const resource of resources) {
      map.set(resource.subject.id, (map.get(resource.subject.id) || 0) + 1);
    }
    return map;
  }, [resources]);

  const resourceCountByClass = useMemo(() => {
    const map = new Map<string, number>();
    for (const resource of resources) {
      map.set(resource.class.id, (map.get(resource.class.id) || 0) + 1);
    }
    return map;
  }, [resources]);

  useEffect(() => {
    void loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      setError("");

      const [subjectsRes, classesRes, resourcesRes] = await Promise.all([
        fetch("/api/lms/subjects", { cache: "no-store" }),
        fetch("/api/lms/classes", { cache: "no-store" }),
        fetch("/api/admin/practice-resources", { cache: "no-store" }),
      ]);

      const subjectsData = await subjectsRes.json();
      const classesData = await classesRes.json();
      const resourcesData = await resourcesRes.json();

      if (!subjectsRes.ok || !classesRes.ok || !resourcesRes.ok) {
        throw new Error("Failed to load practice engine data");
      }

      const loadedSubjects: Subject[] = subjectsData.subjects || [];
      const loadedClasses: ClassItem[] = classesData.classes || [];
      const loadedResources: PracticeResource[] = resourcesData.items || [];

      setSubjects(loadedSubjects);
      setClasses(loadedClasses);
      setResources(loadedResources);

      if (loadedSubjects.length > 0) {
        setSubjectId((prev) => prev || loadedSubjects[0]._id);
        setSubjectForClass((prev) => prev || loadedSubjects[0]._id);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!subjectId) {
      setClassId("");
      return;
    }

    const first = classes.find((item) => item.subject === subjectId);
    if (!classId || !classes.some((item) => item._id === classId && item.subject === subjectId)) {
      setClassId(first?._id || "");
    }
  }, [subjectId, classes, classId]);

  async function createSubject(event: FormEvent) {
    event.preventDefault();
    if (!newSubjectName.trim()) return;

    try {
      setSaving(true);
      setError("");
      setMessage("");

      const response = await fetch("/api/lms/subjects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newSubjectName.trim(),
          description: newSubjectDescription.trim(),
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Failed to create subject");
      }

      setMessage("Subject created.");
      setNewSubjectName("");
      setNewSubjectDescription("");
      await loadData();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setSaving(false);
    }
  }

  async function createClass(event: FormEvent) {
    event.preventDefault();

    if (!subjectForClass || !newClassName.trim()) return;

    try {
      setSaving(true);
      setError("");
      setMessage("");

      const response = await fetch("/api/lms/classes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newClassName.trim(),
          subjectId: subjectForClass,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Failed to create class");
      }

      setMessage("Class created.");
      setNewClassName("");
      await loadData();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setSaving(false);
    }
  }

  async function createResource(event: FormEvent) {
    event.preventDefault();

    if (!subjectId || !classId) {
      setError("Select subject and class");
      return;
    }

    if (!pdfFile) {
      setError("PDF file is required");
      return;
    }

    if (!title.trim()) {
      setError("Title is required");
      return;
    }

    try {
      setSaving(true);
      setIsUploading(true);
      setUploadProgress(0);
      setError("");
      setMessage("Uploading PDF...");

      const fileUrl = await uploadPdf(pdfFile, (percent) => setUploadProgress(percent));

      setMessage("Saving resource...");

      const response = await fetch("/api/admin/practice-resources", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          resourceType,
          subjectId,
          classId,
          fileUrl,
          published,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Failed to create resource");
      }

      setMessage("Practice resource created.");
      setTitle("");
      setDescription("");
      setPdfFile(null);
      setPublished(true);
      setResourceType("question-paper");
      setUploadProgress(0);
      await loadData();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
      setMessage("");
    } finally {
      setIsUploading(false);
      setSaving(false);
    }
  }

  async function deleteSubject(subject: Subject) {
    const relatedClasses = classes.filter((item) => item.subject === subject._id).length;
    const relatedResources = resourceCountBySubject.get(subject._id) || 0;
    const confirmed = window.confirm(
      `Delete subject "${subject.name}"? This will also delete ${relatedClasses} class(es) and ${relatedResources} practice resource(s).`,
    );
    if (!confirmed) return;

    try {
      setSaving(true);
      setError("");
      setMessage("");

      const response = await fetch(`/api/lms/subjects?id=${encodeURIComponent(subject._id)}`, {
        method: "DELETE",
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Failed to delete subject");
      }

      setMessage("Subject deleted.");
      await loadData();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setSaving(false);
    }
  }

  async function deleteClass(item: ClassItem) {
    const relatedResources = resourceCountByClass.get(item._id) || 0;
    const confirmed = window.confirm(
      `Delete class "${item.name}"? This will also delete ${relatedResources} practice resource(s) in this class.`,
    );
    if (!confirmed) return;

    try {
      setSaving(true);
      setError("");
      setMessage("");

      const response = await fetch(`/api/lms/classes?id=${encodeURIComponent(item._id)}`, {
        method: "DELETE",
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Failed to delete class");
      }

      setMessage("Class deleted.");
      await loadData();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setSaving(false);
    }
  }

  async function togglePublished(item: PracticeResource) {
    try {
      setError("");
      setMessage("");
      const response = await fetch(`/api/admin/practice-resources/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ published: !item.published }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Failed to update status");
      }

      setMessage(`Resource ${item.published ? "saved as draft" : "published"}.`);
      await loadData();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    }
  }

  async function deleteResource(item: PracticeResource) {
    if (!window.confirm(`Delete \"${item.title}\"?`)) return;

    try {
      setError("");
      setMessage("");
      const response = await fetch(`/api/admin/practice-resources/${item.id}`, {
        method: "DELETE",
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Failed to delete resource");
      }

      setMessage("Resource deleted.");
      await loadData();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    }
  }

  if (loading) {
    return <p className="text-sm text-cyan-200">Loading practice engine...</p>;
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">{error}</div>
      )}
      {message && (
        <div className="rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">{message}</div>
      )}

      <section className="grid gap-4 lg:grid-cols-2">
        <form onSubmit={createSubject} className="rounded-2xl border border-white/10 bg-black/20 p-4 space-y-3">
          <h2 className="text-lg font-semibold text-white">Create Subject</h2>
          <input
            value={newSubjectName}
            onChange={(e) => setNewSubjectName(e.target.value)}
            placeholder="e.g. AI"
            className="w-full rounded-lg border border-white/15 bg-slate-900 px-3 py-2 text-sm text-white outline-none focus:border-cyan-300/40"
            required
          />
          <textarea
            value={newSubjectDescription}
            onChange={(e) => setNewSubjectDescription(e.target.value)}
            placeholder="Optional description"
            className="w-full rounded-lg border border-white/15 bg-slate-900 px-3 py-2 text-sm text-white outline-none focus:border-cyan-300/40"
            rows={3}
          />
          <button disabled={saving} className="rounded-lg bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950 disabled:opacity-50">
            Add Subject
          </button>

          <div className="rounded-xl border border-white/10 bg-slate-900/50 p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-300">Existing Subjects</p>
            <div className="mt-2 space-y-2">
              {subjects.length === 0 ? (
                <p className="text-xs text-slate-500">No subjects created yet.</p>
              ) : (
                subjects.map((subject) => {
                  const classCount = classes.filter((item) => item.subject === subject._id).length;
                  const resourceCount = resourceCountBySubject.get(subject._id) || 0;
                  return (
                    <div key={subject._id} className="flex items-center justify-between rounded-lg border border-white/10 bg-black/20 px-3 py-2">
                      <div>
                        <p className="text-sm text-white">{subject.name}</p>
                        <p className="text-[11px] text-slate-400">{classCount} classes, {resourceCount} resources</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => void deleteSubject(subject)}
                        disabled={saving || isUploading}
                        className="rounded-md border border-red-400/30 px-2.5 py-1 text-xs text-red-200 hover:bg-red-500/10 disabled:opacity-50"
                      >
                        Delete
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </form>

        <form onSubmit={createClass} className="rounded-2xl border border-white/10 bg-black/20 p-4 space-y-3">
          <h2 className="text-lg font-semibold text-white">Create Class</h2>
          <select
            value={subjectForClass}
            onChange={(e) => setSubjectForClass(e.target.value)}
            className="w-full rounded-lg border border-white/15 bg-slate-900 px-3 py-2 text-sm text-white outline-none focus:border-cyan-300/40"
            required
          >
            <option value="">Select subject</option>
            {subjects.map((subject) => (
              <option key={subject._id} value={subject._id}>{subject.name}</option>
            ))}
          </select>
          <input
            value={newClassName}
            onChange={(e) => setNewClassName(e.target.value)}
            placeholder="e.g. Class 10"
            className="w-full rounded-lg border border-white/15 bg-slate-900 px-3 py-2 text-sm text-white outline-none focus:border-cyan-300/40"
            required
          />
          <button disabled={saving} className="rounded-lg bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950 disabled:opacity-50">
            Add Class
          </button>

          <div className="rounded-xl border border-white/10 bg-slate-900/50 p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-300">Classes In Selected Subject</p>
            <div className="mt-2 space-y-2">
              {classesForSubjectCreator.length === 0 ? (
                <p className="text-xs text-slate-500">No classes available for this subject.</p>
              ) : (
                classesForSubjectCreator.map((item) => {
                  const resourceCount = resourceCountByClass.get(item._id) || 0;
                  return (
                    <div key={item._id} className="flex items-center justify-between rounded-lg border border-white/10 bg-black/20 px-3 py-2">
                      <div>
                        <p className="text-sm text-white">{item.name}</p>
                        <p className="text-[11px] text-slate-400">{resourceCount} resources</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => void deleteClass(item)}
                        disabled={saving || isUploading}
                        className="rounded-md border border-red-400/30 px-2.5 py-1 text-xs text-red-200 hover:bg-red-500/10 disabled:opacity-50"
                      >
                        Delete
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </form>
      </section>

      <form onSubmit={createResource} className="rounded-2xl border border-white/10 bg-black/20 p-5 space-y-4">
        <h2 className="text-lg font-semibold text-white">Upload Practice PDF Resource</h2>

        <div className="grid gap-3 md:grid-cols-2">
          <select
            value={subjectId}
            onChange={(e) => setSubjectId(e.target.value)}
            className="rounded-lg border border-white/15 bg-slate-900 px-3 py-2 text-sm text-white outline-none focus:border-cyan-300/40"
            required
          >
            <option value="">Select subject</option>
            {subjects.map((subject) => (
              <option key={subject._id} value={subject._id}>{subject.name}</option>
            ))}
          </select>

          <select
            value={classId}
            onChange={(e) => setClassId(e.target.value)}
            className="rounded-lg border border-white/15 bg-slate-900 px-3 py-2 text-sm text-white outline-none focus:border-cyan-300/40"
            required
          >
            <option value="">Select class</option>
            {filteredClasses.map((item) => (
              <option key={item._id} value={item._id}>{item.name}</option>
            ))}
          </select>

          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Resource title"
            className="rounded-lg border border-white/15 bg-slate-900 px-3 py-2 text-sm text-white outline-none focus:border-cyan-300/40 md:col-span-2"
            required
          />

          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Optional description"
            className="rounded-lg border border-white/15 bg-slate-900 px-3 py-2 text-sm text-white outline-none focus:border-cyan-300/40 md:col-span-2"
            rows={3}
          />

          <select
            value={resourceType}
            onChange={(e) => setResourceType(e.target.value as ResourceType)}
            className="rounded-lg border border-white/15 bg-slate-900 px-3 py-2 text-sm text-white outline-none focus:border-cyan-300/40"
          >
            {resourceTypeOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>

          <label className="flex items-center gap-2 rounded-lg border border-white/15 bg-slate-900 px-3 py-2 text-sm text-white">
            <input
              type="checkbox"
              checked={published}
              onChange={(e) => setPublished(e.target.checked)}
            />
            Publish immediately
          </label>

          <input
            type="file"
            accept="application/pdf"
            onChange={(e) => setPdfFile(e.target.files?.[0] ?? null)}
            className="rounded-lg border border-white/15 bg-slate-900 px-3 py-2 text-sm text-white outline-none focus:border-cyan-300/40 md:col-span-2"
            required
          />

          {(isUploading || uploadProgress > 0) && (
            <div className="md:col-span-2 rounded-lg border border-cyan-300/30 bg-cyan-500/10 p-3">
              <div className="mb-2 flex items-center justify-between text-xs text-cyan-100">
                <span>Uploading PDF</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-slate-800">
                <div
                  className="h-full bg-cyan-400 transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}
        </div>

        <button disabled={saving || isUploading} className="rounded-lg bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950 disabled:opacity-50">
          {saving ? "Saving..." : "Upload Resource"}
        </button>
      </form>

      <section className="rounded-2xl border border-white/10 bg-black/20 p-5">
        <h2 className="text-lg font-semibold text-white">Existing Resources</h2>
        <p className="mt-1 text-sm text-slate-400">Newest first. Toggle publish state or delete outdated items.</p>

        <div className="mt-4 space-y-3">
          {resources.length === 0 ? (
            <p className="text-sm text-slate-500">No practice resources uploaded yet.</p>
          ) : (
            resources.map((item) => (
              <article key={item.id} className="rounded-xl border border-white/10 bg-slate-900/60 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="font-semibold text-white">{item.title}</h3>
                    <p className="mt-1 text-xs text-slate-400">{item.subject.name} / {item.class.name} / {item.resourceType}</p>
                    {item.description && <p className="mt-1 text-sm text-slate-300">{item.description}</p>}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => void togglePublished(item)}
                      className="rounded-md border border-white/15 px-3 py-1.5 text-xs text-slate-200 hover:bg-white/10"
                    >
                      {item.published ? "Unpublish" : "Publish"}
                    </button>
                    <button
                      onClick={() => void deleteResource(item)}
                      className="rounded-md border border-red-400/30 px-3 py-1.5 text-xs text-red-200 hover:bg-red-500/10"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </article>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
