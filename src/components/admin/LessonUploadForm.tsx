"use client";

import { useEffect, useState } from "react";
import { z } from "zod";
import UploadDropzone from "@/src/components/admin/UploadDropzone";
import { type AdminUploadedAsset, uploadAdminFile } from "@/src/lib/upload-client";

export type LessonUploadPayload = {
  title: string;
  subject: string;
  classSlug: string;
  description: string;
  publish: boolean;
  lessonPdf: File;
  thumbnail: File;
};

export type LessonUploadSubmission = Omit<LessonUploadPayload, "lessonPdf" | "thumbnail"> & {
  lessonPdfUpload: AdminUploadedAsset;
  thumbnailUpload: AdminUploadedAsset;
};

type LessonUploadFormProps = {
  onSubmit?: (payload: LessonUploadSubmission) => Promise<void> | void;
  submitLabel?: string;
};

type FormErrors = Partial<Record<keyof LessonUploadPayload, string>>;

type SelectOption = {
  slug: string;
  name: string;
};

const MAX_PDF_SIZE_MB = 30;
const MAX_IMAGE_SIZE_MB = 10;

const LessonFormSchema = z.object({
  title: z.string().trim().min(3, "Lesson title must be at least 3 characters."),
  subject: z.string().min(1, "Select a subject."),
  classSlug: z.string().min(1, "Select a class."),
  description: z.string().trim().min(20, "Description must be at least 20 characters."),
  publish: z.boolean(),
});

const PdfFileSchema = z
  .instanceof(File, { message: "Upload a lesson PDF." })
  .refine((file) => file.type === "application/pdf", "Only PDF files are allowed for lesson upload.")
  .refine((file) => file.size <= MAX_PDF_SIZE_MB * 1024 * 1024, `PDF size must be less than ${MAX_PDF_SIZE_MB}MB.`);

const ImageFileSchema = z
  .instanceof(File, { message: "Upload a thumbnail image." })
  .refine((file) => file.type.startsWith("image/"), "Only image files are allowed for thumbnail upload.")
  .refine((file) => file.size <= MAX_IMAGE_SIZE_MB * 1024 * 1024, `Thumbnail size must be less than ${MAX_IMAGE_SIZE_MB}MB.`);

export default function LessonUploadForm({ onSubmit, submitLabel = "Upload Lesson" }: LessonUploadFormProps) {
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [classSlug, setClassSlug] = useState("");
  const [description, setDescription] = useState("");
  const [publish, setPublish] = useState(false);
  const [lessonPdf, setLessonPdf] = useState<File | null>(null);
  const [thumbnail, setThumbnail] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [successMessage, setSuccessMessage] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [pdfUploadProgress, setPdfUploadProgress] = useState(0);
  const [thumbnailUploadProgress, setThumbnailUploadProgress] = useState(0);
  const [uploadedLinks, setUploadedLinks] = useState<{ pdfUrl: string; thumbnailUrl: string } | null>(null);
  const [subjectOptions, setSubjectOptions] = useState<SelectOption[]>([]);
  const [classOptions, setClassOptions] = useState<SelectOption[]>([]);
  const [loadingSubjects, setLoadingSubjects] = useState(true);
  const [loadingClasses, setLoadingClasses] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function loadSubjects() {
      setLoadingSubjects(true);

      try {
        const response = await fetch("/api/lms/subjects");
        const data = (await response.json()) as { items?: SelectOption[]; message?: string };

        if (!response.ok) {
          throw new Error(data.message || "Failed to load subjects.");
        }

        if (mounted) {
          setSubjectOptions(Array.isArray(data.items) ? data.items : []);
        }
      } catch (error) {
        if (mounted) {
          setSubmitError(error instanceof Error ? error.message : "Failed to load subjects.");
        }
      } finally {
        if (mounted) {
          setLoadingSubjects(false);
        }
      }
    }

    loadSubjects();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    let mounted = true;

    async function loadClasses() {
      if (!subject) {
        setClassOptions([]);
        return;
      }

      setLoadingClasses(true);

      try {
        const response = await fetch(`/api/lms/classes?subject=${encodeURIComponent(subject)}`);
        const data = (await response.json()) as { items?: SelectOption[]; message?: string };

        if (!response.ok) {
          throw new Error(data.message || "Failed to load classes.");
        }

        if (mounted) {
          setClassOptions(Array.isArray(data.items) ? data.items : []);
        }
      } catch (error) {
        if (mounted) {
          setClassOptions([]);
          setSubmitError(error instanceof Error ? error.message : "Failed to load classes.");
        }
      } finally {
        if (mounted) {
          setLoadingClasses(false);
        }
      }
    }

    loadClasses();

    return () => {
      mounted = false;
    };
  }, [subject]);

  function validateForm() {
    const nextErrors: FormErrors = {};

    const metadataResult = LessonFormSchema.safeParse({
      title,
      subject,
      classSlug,
      description,
      publish,
    });

    if (!metadataResult.success) {
      const fieldErrors = metadataResult.error.flatten().fieldErrors;
      if (fieldErrors.title?.[0]) nextErrors.title = fieldErrors.title[0];
      if (fieldErrors.subject?.[0]) nextErrors.subject = fieldErrors.subject[0];
      if (fieldErrors.classSlug?.[0]) nextErrors.classSlug = fieldErrors.classSlug[0];
      if (fieldErrors.description?.[0]) nextErrors.description = fieldErrors.description[0];
    }

    const pdfResult = PdfFileSchema.safeParse(lessonPdf);
    if (!pdfResult.success) {
      nextErrors.lessonPdf = pdfResult.error.issues[0]?.message || "Upload a lesson PDF.";
    }

    const thumbnailResult = ImageFileSchema.safeParse(thumbnail);
    if (!thumbnailResult.success) {
      nextErrors.thumbnail = thumbnailResult.error.issues[0]?.message || "Upload a thumbnail image.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSuccessMessage("");
    setSubmitError("");
    setUploadedLinks(null);
    setPdfUploadProgress(0);
    setThumbnailUploadProgress(0);

    if (!validateForm() || !lessonPdf || !thumbnail) {
      return;
    }

    setSubmitting(true);

    try {
      const lessonPdfUpload = await uploadAdminFile({
        file: lessonPdf,
        kind: "pdf",
        folder: "lms/pdfs",
        onProgress: setPdfUploadProgress,
      });

      const thumbnailUpload = await uploadAdminFile({
        file: thumbnail,
        kind: "image",
        folder: "lms/thumbnails",
        onProgress: setThumbnailUploadProgress,
      });

      await onSubmit?.({
        title: title.trim(),
        subject,
        classSlug,
        description: description.trim(),
        publish,
        lessonPdfUpload,
        thumbnailUpload,
      });

      setUploadedLinks({ pdfUrl: lessonPdfUpload.url, thumbnailUrl: thumbnailUpload.url });
      setSuccessMessage("Lesson published successfully.");
      setTitle("");
      setSubject("");
      setClassSlug("");
      setDescription("");
      setPublish(false);
      setLessonPdf(null);
      setThumbnail(null);
      setPdfUploadProgress(100);
      setThumbnailUploadProgress(100);
      setErrors({});
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Failed to submit lesson form.");
    } finally {
      setSubmitting(false);
    }
  }

  const overallProgress = Math.round((pdfUploadProgress + thumbnailUploadProgress) / 2);

  return (
    <form onSubmit={handleSubmit} className="rounded-[24px] border border-white/10 bg-white/[0.04] p-5 sm:p-6">
      <header className="mb-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">Lesson Upload</p>
        <h2 className="mt-2 text-xl font-semibold text-white">Create and Publish Lesson</h2>
        <p className="mt-2 text-sm text-slate-300">
          Upload lesson PDF and thumbnail, choose subject/class, and publish in one workflow.
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-slate-200">Lesson Title</span>
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="e.g. Python Variables and Data Types"
            className="w-full rounded-xl border border-white/15 bg-black/30 px-3 py-2.5 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-300"
          />
          {errors.title ? <span className="mt-1 block text-xs text-rose-300">{errors.title}</span> : null}
        </label>

        <label className="block">
          <span className="mb-1 block text-sm font-medium text-slate-200">Subject</span>
          <select
            value={subject}
            onChange={(event) => {
              setSubject(event.target.value);
              setClassSlug("");
            }}
            disabled={loadingSubjects || submitting}
            className="w-full rounded-xl border border-white/15 bg-black/30 px-3 py-2.5 text-sm text-white outline-none transition disabled:cursor-not-allowed disabled:opacity-60 focus:border-cyan-300"
          >
            <option value="" className="bg-slate-900">
              {loadingSubjects ? "Loading subjects..." : "Select subject"}
            </option>
            {subjectOptions.map((item) => (
              <option key={item.slug} value={item.slug} className="bg-slate-900">
                {item.name}
              </option>
            ))}
          </select>
          {errors.subject ? <span className="mt-1 block text-xs text-rose-300">{errors.subject}</span> : null}
        </label>

        <label className="block">
          <span className="mb-1 block text-sm font-medium text-slate-200">Class</span>
          <select
            value={classSlug}
            onChange={(event) => setClassSlug(event.target.value)}
            disabled={!subject || loadingClasses || submitting}
            className="w-full rounded-xl border border-white/15 bg-black/30 px-3 py-2.5 text-sm text-white outline-none transition disabled:cursor-not-allowed disabled:opacity-60 focus:border-cyan-300"
          >
            <option value="" className="bg-slate-900">
              {loadingClasses ? "Loading classes..." : "Select class"}
            </option>
            {classOptions.map((item) => (
              <option key={item.slug} value={item.slug} className="bg-slate-900">
                {item.name}
              </option>
            ))}
          </select>
          {errors.classSlug ? <span className="mt-1 block text-xs text-rose-300">{errors.classSlug}</span> : null}
        </label>

        <div className="flex items-end">
          <button
            type="button"
            onClick={() => setPublish((value) => !value)}
            className="flex w-full items-center justify-between rounded-xl border border-white/15 bg-black/30 px-3 py-2.5 text-sm text-white transition hover:border-cyan-300"
            aria-pressed={publish}
          >
            <span>Publish Lesson</span>
            <span
              className={[
                "inline-flex h-6 w-11 items-center rounded-full border px-0.5 transition",
                publish ? "border-emerald-300/40 bg-emerald-400/20" : "border-white/20 bg-white/10",
              ].join(" ")}
            >
              <span
                className={[
                  "h-4 w-4 rounded-full bg-white transition",
                  publish ? "translate-x-5" : "translate-x-0",
                ].join(" ")}
              />
            </span>
          </button>
        </div>
      </div>

      <label className="mt-4 block">
        <span className="mb-1 block text-sm font-medium text-slate-200">Lesson Description</span>
        <textarea
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          rows={5}
          placeholder="Add a concise lesson overview, key concepts, and expected outcomes."
          className="w-full rounded-xl border border-white/15 bg-black/30 px-3 py-2.5 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-300"
        />
        {errors.description ? <span className="mt-1 block text-xs text-rose-300">{errors.description}</span> : null}
      </label>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <UploadDropzone
          label="Lesson PDF"
          accept="application/pdf,.pdf"
          file={lessonPdf}
          helperText={`PDF only, max ${MAX_PDF_SIZE_MB}MB`}
          error={errors.lessonPdf}
          disabled={submitting}
          onFileChange={setLessonPdf}
        />

        <UploadDropzone
          label="Thumbnail Image"
          accept="image/*"
          file={thumbnail}
          helperText={`Image only, max ${MAX_IMAGE_SIZE_MB}MB`}
          error={errors.thumbnail}
          disabled={submitting}
          onFileChange={setThumbnail}
        />
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-slate-400">
          Selected context: {subject ? `${subject} • ${classSlug || "no class"}` : "no subject selected"}
        </p>
        <button
          type="submit"
          disabled={submitting || loadingSubjects || loadingClasses}
          className="inline-flex items-center justify-center rounded-xl border border-cyan-300/40 bg-cyan-400/20 px-5 py-2.5 text-sm font-medium text-cyan-100 transition hover:bg-cyan-400/30 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? "Publishing..." : submitLabel}
        </button>
      </div>

      {(submitting || pdfUploadProgress > 0 || thumbnailUploadProgress > 0) ? (
        <div className="mt-4 space-y-3 rounded-xl border border-white/10 bg-black/20 p-3">
          <div>
            <div className="mb-1 flex items-center justify-between text-xs text-slate-300">
              <span>PDF upload</span>
              <span>{pdfUploadProgress}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-white/10">
              <div className="h-full bg-cyan-400 transition-all" style={{ width: `${pdfUploadProgress}%` }} />
            </div>
          </div>

          <div>
            <div className="mb-1 flex items-center justify-between text-xs text-slate-300">
              <span>Thumbnail upload</span>
              <span>{thumbnailUploadProgress}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-white/10">
              <div className="h-full bg-emerald-400 transition-all" style={{ width: `${thumbnailUploadProgress}%` }} />
            </div>
          </div>

          <div>
            <div className="mb-1 flex items-center justify-between text-xs text-slate-300">
              <span>Overall</span>
              <span>{overallProgress}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-white/10">
              <div className="h-full bg-fuchsia-400 transition-all" style={{ width: `${overallProgress}%` }} />
            </div>
          </div>
        </div>
      ) : null}

      {submitError ? <p className="mt-3 text-sm text-rose-300">{submitError}</p> : null}
      {successMessage ? <p className="mt-3 text-sm text-emerald-300">{successMessage}</p> : null}
      {uploadedLinks ? (
        <div className="mt-3 rounded-xl border border-emerald-300/20 bg-emerald-500/10 p-3 text-xs text-emerald-200">
          <p className="font-semibold uppercase tracking-[0.14em]">Uploaded URLs saved</p>
          <a href={uploadedLinks.pdfUrl} target="_blank" rel="noreferrer" className="mt-1 block truncate underline">
            PDF: {uploadedLinks.pdfUrl}
          </a>
          <a href={uploadedLinks.thumbnailUrl} target="_blank" rel="noreferrer" className="mt-1 block truncate underline">
            Thumbnail: {uploadedLinks.thumbnailUrl}
          </a>
        </div>
      ) : null}
    </form>
  );
}
