"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

interface Subject {
  _id: string;
  name: string;
  slug: string;
}

interface Class {
  _id: string;
  name: string;
  slug: string;
  subject: string;
}

interface UploadState {
  file: File | null;
  dragActive: boolean;
}

interface ThumbnailState {
  file: File | null;
  dragActive: boolean;
}

export default function LmsLessonUploadForm({
  subjects,
  classes,
}: {
  subjects: Subject[];
  classes: Class[];
}) {
  const router = useRouter();

  const [pdf, setPdf] = useState<UploadState>({ file: null, dragActive: false });
  const [thumbnail, setThumbnail] = useState<ThumbnailState>({ file: null, dragActive: false });

  const [form, setForm] = useState<{
    title: string;
    description: string;
    subject: string;
    classes: string[];
    published: boolean;
  }>({
    title: "",
    description: "",
    subject: "",
    classes: [],
    published: false,
  });

  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // ─── PDF handlers ────────────────────────────────────────────────────────

  function handlePdfDrag(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setPdf((prev) => ({ ...prev, dragActive: true }));
    } else if (e.type === "dragleave") {
      setPdf((prev) => ({ ...prev, dragActive: false }));
    }
  }

  function handlePdfDrop(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setPdf((prev) => ({ ...prev, dragActive: false }));

    const files = e.dataTransfer?.files;
    if (files?.[0]) {
      const file = files[0];
      if (file.type === "application/pdf") {
        setPdf((prev) => ({ ...prev, file }));
        setError("");
      } else {
        setError("PDF file only");
      }
    }
  }

  function handlePdfChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.currentTarget.files?.[0];
    if (file?.type === "application/pdf") {
      setPdf((prev) => ({ ...prev, file }));
      setError("");
    } else {
      setError("PDF file only");
    }
  }

  // ─── Thumbnail handlers ──────────────────────────────────────────────────

  function handleThumbnailDrag(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setThumbnail((prev) => ({ ...prev, dragActive: true }));
    } else if (e.type === "dragleave") {
      setThumbnail((prev) => ({ ...prev, dragActive: false }));
    }
  }

  // ─── Drop/Change Handlers ─────────────────────────────────────────────────

  function handleThumbnailDrop(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setThumbnail((prev) => ({ ...prev, dragActive: false }));

    const files = e.dataTransfer?.files;
    if (files?.[0]) {
      const file = files[0];
      if (["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
        setThumbnail((prev) => ({ ...prev, file }));
        setError("");
      } else {
        setError("Image file only (JPG, PNG, WebP)");
      }
    }
  }

  function handleThumbnailChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.currentTarget.files?.[0];
    if (file && ["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setThumbnail((prev) => ({ ...prev, file }));
      setError("");
    } else {
      setError("Image file only (JPG, PNG, WebP)");
    }
  }

  // ─── Upload handler ─────────────────────────────────────────────────────

  async function uploadFiles(kind: "pdf" | "image", file: File) {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("kind", kind);
    formData.append("folder", kind === "pdf" ? "lms/pdfs" : "lms/thumbnails");

    const res = await fetch("/api/admin/upload", {
      method: "POST",
      body: formData,
    });

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.message || "Upload failed");
    }

    const data = await res.json();
    return data.upload.secure_url;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");

    // Validate form
    if (!form.title.trim()) {
      setError("Title is required");
      return;
    }
    if (!form.description.trim()) {
      setError("Description is required");
      return;
    }
    if (!form.subject) {
      setError("Subject is required");
      return;
    }
    if (!form.classes || form.classes.length === 0) {
      setError("At least one class must be selected");
      return;
    }
    if (!pdf.file) {
      setError("PDF file is required");
      return;
    }
    if (!thumbnail.file) {
      setError("Thumbnail image is required");
      return;
    }

    try {
      setUploading(true);

      // Upload PDF
      setSuccess("Uploading PDF...");
      const pdfUrl = await uploadFiles("pdf", pdf.file);

      // Upload thumbnail
      setSuccess("Uploading thumbnail...");
      const thumbnailUrl = await uploadFiles("image", thumbnail.file);

      // Create lesson
      setSuccess("Creating lesson...");
      const lessonRes = await fetch("/api/admin/lms-lessons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title.trim(),
          description: form.description.trim(),
          subject: form.subject,
          classes: form.classes,
          pdfUrl,
          thumbnail: thumbnailUrl,
          thumbnailUrl,
          published: form.published,
        }),
      });

      if (!lessonRes.ok) {
        const data = await lessonRes.json();
        throw new Error(data.message || "Failed to create lesson");
      }

      const lessonData = await lessonRes.json();
      setSuccess("Lesson published successfully! Redirecting...");

      // Capture subject/class at submission time — avoids stale closure in setTimeout.
      const submittedSubject = subjects.find((s) => s._id === form.subject);
      const firstClassId = form.classes[0];
      const submittedClass = classes.find((c) => c._id === firstClassId);

      // Redirect to published lesson page
      setTimeout(() => {
        const lesson = lessonData.lesson;

        if (submittedSubject?.slug && submittedClass?.slug && lesson?.slug) {
          router.push(`/lms/${submittedSubject.slug}/${submittedClass.slug}/${lesson.slug}`);
          return;
        }

        // Fallback to class page if lesson slug is unexpectedly unavailable.
        if (submittedSubject?.slug && submittedClass?.slug) {
          router.push(`/lms/${submittedSubject.slug}/${submittedClass.slug}`);
          return;
        }

        router.push("/lms");
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      setSuccess("");
    } finally {
      setUploading(false);
    }
  }

  const selectedSubject = subjects.find((s) => s._id === form.subject);
  const filteredClasses = selectedSubject
    ? classes.filter((c) => c.subject === form.subject || !c.subject)
    : classes;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Title & Description */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-200 mb-2">Lesson Title</label>
          <input
            type="text"
            value={form.title}
            onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
            placeholder="e.g., Introduction to Physics"
            className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            disabled={uploading}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-200 mb-2">Description</label>
          <textarea
            value={form.description}
            onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
            placeholder="Brief lesson description..."
            rows={3}
            className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            disabled={uploading}
          />
        </div>
      </div>

      {/* Subject & Target Classes */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-200 mb-2">Subject</label>
          <select
            value={form.subject}
            onChange={(e) => {
              setForm((prev) => ({ ...prev, subject: e.target.value, classes: [] }));
            }}
            className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-cyan-500"
            disabled={uploading}
          >
            <option value="">Select subject...</option>
            {subjects.map((s) => (
              <option key={s._id} value={s._id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>

        {form.subject && (
          <div>
            <label className="block text-sm font-medium text-slate-200 mb-2">Target Classes</label>
            {filteredClasses.length > 0 ? (
              <div className="flex flex-wrap gap-2.5">
                {filteredClasses.map((c) => {
                  const isSelected = form.classes.includes(c._id);
                  return (
                    <button
                      key={c._id}
                      type="button"
                      onClick={() => {
                        setForm((prev) => {
                          const isSel = prev.classes.includes(c._id);
                          const nextClasses = isSel
                            ? prev.classes.filter((id) => id !== c._id)
                            : [...prev.classes, c._id];
                          return { ...prev, classes: nextClasses };
                        });
                      }}
                      className={`inline-flex items-center gap-2 rounded-lg border px-4 py-2.5 text-xs font-semibold uppercase tracking-wider transition ${
                        isSelected
                          ? "border-cyan-400 bg-cyan-500/10 text-cyan-200 shadow-[0_4px_20px_rgba(34,211,238,0.15)]"
                          : "border-slate-700 bg-slate-900 text-slate-400 hover:border-slate-600 hover:text-white"
                      }`}
                      disabled={uploading}
                    >
                      <span className={`inline-flex h-4 w-4 items-center justify-center rounded border transition-all ${
                        isSelected ? "border-cyan-400 bg-cyan-500 text-slate-950" : "border-slate-600 bg-transparent"
                      }`}>
                        {isSelected ? (
                          <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                        ) : null}
                      </span>
                      {c.name}
                    </button>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-slate-500">No classes found for this subject.</p>
            )}
          </div>
        )}
      </div>

      {/* PDF Upload */}
      <div>
        <label className="block text-sm font-medium text-slate-200 mb-2">Lesson PDF</label>
        <div
          onDragEnter={handlePdfDrag}
          onDragLeave={handlePdfDrag}
          onDragOver={handlePdfDrag}
          onDrop={handlePdfDrop}
          className={`relative border-2 border-dashed rounded-lg p-8 text-center transition ${
            pdf.dragActive ? "border-cyan-400 bg-cyan-500/10" : "border-slate-600 bg-slate-900/50"
          } ${uploading ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
        >
          <input
            type="file"
            accept="application/pdf"
            onChange={handlePdfChange}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            disabled={uploading}
          />
          <div className="pointer-events-none">
            <div className="text-3xl mb-2">📄</div>
            {pdf.file ? (
              <>
                <p className="text-cyan-400 font-medium">{pdf.file.name}</p>
                <p className="text-xs text-slate-400">Click to change</p>
              </>
            ) : (
              <>
                <p className="text-slate-300 font-medium">Drag and drop PDF here</p>
                <p className="text-xs text-slate-400">or click to browse</p>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Thumbnail Upload */}
      <div>
        <label className="block text-sm font-medium text-slate-200 mb-2">Thumbnail Image</label>
        <div
          onDragEnter={handleThumbnailDrag}
          onDragLeave={handleThumbnailDrag}
          onDragOver={handleThumbnailDrag}
          onDrop={handleThumbnailDrop}
          className={`relative border-2 border-dashed rounded-lg p-8 text-center transition ${
            thumbnail.dragActive ? "border-cyan-400 bg-cyan-500/10" : "border-slate-600 bg-slate-900/50"
          } ${uploading ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
        >
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleThumbnailChange}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            disabled={uploading}
          />
          <div className="pointer-events-none">
            <div className="text-3xl mb-2">🖼️</div>
            {thumbnail.file ? (
              <>
                <p className="text-cyan-400 font-medium">{thumbnail.file.name}</p>
                <p className="text-xs text-slate-400">Click to change</p>
              </>
            ) : (
              <>
                <p className="text-slate-300 font-medium">Drag and drop image here</p>
                <p className="text-xs text-slate-400">JPG, PNG, or WebP • Click to browse</p>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Publish checkbox */}
      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="published"
          checked={form.published}
          onChange={(e) => setForm((prev) => ({ ...prev, published: e.target.checked }))}
          className="w-4 h-4 rounded border-slate-600 bg-slate-900 text-cyan-500 cursor-pointer"
          disabled={uploading}
        />
        <label htmlFor="published" className="text-sm text-slate-300 cursor-pointer">
          Publish immediately after creation
        </label>
      </div>

      {/* Error */}
      {error && (
        <div className="p-4 bg-red-900/50 border border-red-500 rounded-lg text-red-200 text-sm">
          {error}
        </div>
      )}

      {/* Success */}
      {success && (
        <div className="p-4 bg-green-900/50 border border-green-500 rounded-lg text-green-200 text-sm">
          {success}
        </div>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={uploading}
        className={`w-full py-3 px-4 rounded-lg font-medium transition ${
          uploading
            ? "bg-slate-700 text-slate-400 cursor-not-allowed"
            : "bg-cyan-600 hover:bg-cyan-700 text-white"
        }`}
      >
        {uploading ? "Publishing..." : "Publish Lesson"}
      </button>
    </form>
  );
}
