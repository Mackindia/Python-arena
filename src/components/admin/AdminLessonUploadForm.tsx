"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { ArrowRight, BookOpen, CheckCircle2, Cloud, FileUp, ImageIcon, Sparkles } from "lucide-react";
import UploadDropzone from "@/src/components/admin/UploadDropzone";
import { uploadAdminFile } from "@/src/lib/upload-client";

const SUBJECT_OPTIONS = [
  { label: "AI", value: "ai" },
  { label: "Python", value: "python" },
  { label: "Computer Science", value: "computer-science" },
] as const;

const CLASS_OPTIONS = [
  { label: "Class 6", value: "class-6" },
  { label: "Class 7", value: "class-7" },
  { label: "Class 8", value: "class-8" },
  { label: "Class 9", value: "class-9" },
  { label: "Class 10", value: "class-10" },
  { label: "Class 11", value: "class-11" },
  { label: "Class 12", value: "class-12" },
] as const;

const MetadataSchema = z.object({
  title: z.string().trim().min(3, "Lesson title must be at least 3 characters."),
  subject: z.enum(["ai", "python", "computer-science"], {
    errorMap: () => ({ message: "Select a subject." }),
  }),
  classes: z.array(
    z.enum(["class-6", "class-7", "class-8", "class-9", "class-10", "class-11", "class-12"])
  ).min(1, "Select at least one class."),
  description: z.string().trim().min(20, "Description must be at least 20 characters."),
});

const PdfSchema = z
  .instanceof(File, { message: "Upload a lesson PDF." })
  .refine((file) => file.type === "application/pdf", "Only PDF files are allowed.")
  .refine((file) => file.size <= 30 * 1024 * 1024, "PDF size must be 30MB or smaller.");

const ImageSchema = z
  .instanceof(File, { message: "Upload a lesson thumbnail." })
  .refine((file) => file.type.startsWith("image/"), "Only image files are allowed.")
  .refine((file) => file.size <= 10 * 1024 * 1024, "Thumbnail size must be 10MB or smaller.");

type UploadErrors = Partial<Record<"title" | "subject" | "classes" | "description" | "lessonPdf" | "thumbnail", string>>;

export default function AdminLessonUploadForm() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState<(typeof SUBJECT_OPTIONS)[number]["value"] | "">("");
  const [selectedClasses, setSelectedClasses] = useState<string[]>([]);
  const [description, setDescription] = useState("");
  const [lessonPdf, setLessonPdf] = useState<File | null>(null);
  const [thumbnail, setThumbnail] = useState<File | null>(null);
  const [pdfProgress, setPdfProgress] = useState(0);
  const [thumbnailProgress, setThumbnailProgress] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [errors, setErrors] = useState<UploadErrors>({});

  const overallProgress = useMemo(() => Math.round((pdfProgress + thumbnailProgress) / 2), [pdfProgress, thumbnailProgress]);

  function validateForm() {
    const nextErrors: UploadErrors = {};
    const metadata = MetadataSchema.safeParse({ title, subject, classes: selectedClasses, description });

    if (!metadata.success) {
      const fieldErrors = metadata.error.flatten().fieldErrors;
      if (fieldErrors.title?.[0]) nextErrors.title = fieldErrors.title[0];
      if (fieldErrors.subject?.[0]) nextErrors.subject = fieldErrors.subject[0];
      if (fieldErrors.classes?.[0]) nextErrors.classes = fieldErrors.classes[0];
      if (fieldErrors.description?.[0]) nextErrors.description = fieldErrors.description[0];
    }

    const pdfResult = PdfSchema.safeParse(lessonPdf);
    if (!pdfResult.success) {
      nextErrors.lessonPdf = pdfResult.error.issues[0]?.message || "Upload a lesson PDF.";
    }

    const thumbnailResult = ImageSchema.safeParse(thumbnail);
    if (!thumbnailResult.success) {
      nextErrors.thumbnail = thumbnailResult.error.issues[0]?.message || "Upload a lesson thumbnail.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function publishLesson(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSuccessMessage("");
    setErrorMessage("");
    setErrors({});
    setPdfProgress(0);
    setThumbnailProgress(0);

    if (!validateForm() || !lessonPdf || !thumbnail) {
      return;
    }

    setIsSubmitting(true);

    try {
      const pdfUpload = await uploadAdminFile({
        file: lessonPdf,
        kind: "pdf",
        folder: "lms/pdfs",
        onProgress: setPdfProgress,
      });

      const thumbnailUpload = await uploadAdminFile({
        file: thumbnail,
        kind: "image",
        folder: "lms/thumbnails",
        onProgress: setThumbnailProgress,
      });

      const response = await fetch("/api/admin/lms-lessons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          subject,
          classes: selectedClasses,
          description: description.trim(),
          pdfUrl: pdfUpload.url,
          thumbnailUrl: thumbnailUpload.url,
          published: true,
        }),
      });

      const data = (await response.json()) as {
        message?: string;
        lesson?: { slug?: string };
        errors?: Record<string, string[]>;
      };

      if (!response.ok) {
        const combined = data.errors
          ? Object.values(data.errors)
              .flat()
              .filter(Boolean)
              .join(", ")
          : "";

        throw new Error(combined || data.message || "Failed to publish lesson.");
      }

      const lessonSlug = data.lesson?.slug;
      if (!lessonSlug) {
        throw new Error("Lesson created but the slug was missing from the response.");
      }

      setSuccessMessage("Lessons published successfully. Redirecting to the first lesson page...");
      const firstClassSlug = selectedClasses[0];
      router.push(`/lms/${subject}/${firstClassSlug}/${lessonSlug}`);
      router.refresh();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Failed to publish lesson.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="overflow-hidden rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(15,23,42,0.95),rgba(2,6,23,0.98))] shadow-[0_24px_80px_rgba(2,6,23,0.55)]">
      <div className="border-b border-white/10 px-5 py-5 sm:px-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-2xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-cyan-200/90">Lesson Publish Pipeline</p>
            <h1 className="mt-3 text-3xl font-semibold text-white sm:text-4xl">Upload a lesson PDF, thumbnail, and publish it in one flow.</h1>
            <p className="mt-3 text-sm leading-relaxed text-slate-300 sm:text-base">
              Files are uploaded to Cloudinary first, then lesson metadata is saved in MongoDB with an auto-generated slug.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 lg:w-[28rem] lg:grid-cols-1 xl:w-[32rem] xl:grid-cols-3">
            {[
              { label: "Cloudinary", value: "2 assets", icon: Cloud },
              { label: "MongoDB", value: "Multi-Publish", icon: BookOpen },
              { label: "Slugging", value: "Automatic", icon: Sparkles },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.label} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-xs uppercase tracking-[0.22em] text-slate-400">{item.label}</p>
                    <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-black/20 text-cyan-100">
                      <Icon className="h-4 w-4" />
                    </span>
                  </div>
                  <p className="mt-4 text-lg font-semibold text-white">{item.value}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <form onSubmit={publishLesson} className="space-y-6 px-5 py-5 sm:px-6">
        <div className="grid gap-4 lg:grid-cols-[1.3fr_0.7fr]">
          <div className="rounded-[24px] border border-white/10 bg-white/[0.04] p-4 sm:p-5">
            <div className="grid gap-4 md:grid-cols-2">
              <label className="block md:col-span-2">
                <span className="mb-2 block text-sm font-medium text-slate-200">Lesson title</span>
                <input
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="Introduction to Python Functions"
                  className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-300/70"
                />
                {errors.title ? <span className="mt-2 block text-xs text-rose-300">{errors.title}</span> : null}
              </label>

              <label className="block md:col-span-2">
                <span className="mb-2 block text-sm font-medium text-slate-200">Subject</span>
                <select
                  value={subject}
                  onChange={(event) => {
                    setSubject(event.target.value as (typeof SUBJECT_OPTIONS)[number]["value"]);
                    setSelectedClasses([]);
                  }}
                  className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-300/70"
                >
                  <option value="" className="bg-slate-900">Select subject</option>
                  {SUBJECT_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value} className="bg-slate-900">
                      {option.label}
                    </option>
                  ))}
                </select>
                {errors.subject ? <span className="mt-2 block text-xs text-rose-300">{errors.subject}</span> : null}
              </label>

              <div className="block md:col-span-2">
                <span className="mb-2 block text-sm font-medium text-slate-200">Target Classes</span>
                <div className="flex flex-wrap gap-2.5">
                  {CLASS_OPTIONS.map((option) => {
                    const isSelected = selectedClasses.includes(option.value);
                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => {
                          if (isSelected) {
                            setSelectedClasses(selectedClasses.filter((c) => c !== option.value));
                          } else {
                            setSelectedClasses([...selectedClasses, option.value]);
                          }
                        }}
                        className={`inline-flex items-center gap-2 rounded-2xl border px-4 py-2.5 text-xs font-semibold uppercase tracking-wider transition ${
                          isSelected
                            ? "border-cyan-400/40 bg-cyan-400/15 text-white shadow-[0_4px_20px_rgba(34,211,238,0.15)]"
                            : "border-white/10 bg-black/25 text-slate-400 hover:border-white/20 hover:text-white"
                        }`}
                      >
                        <span className={`inline-flex h-4 w-4 items-center justify-center rounded border transition-all ${
                          isSelected ? "border-cyan-300 bg-cyan-400 text-slate-950" : "border-slate-500 bg-transparent"
                        }`}>
                          {isSelected ? (
                            <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                          ) : null}
                        </span>
                        {option.label}
                      </button>
                    );
                  })}
                </div>
                {errors.classes ? <span className="mt-2 block text-xs text-rose-300">{errors.classes}</span> : null}
              </div>

              <label className="block md:col-span-2">
                <span className="mb-2 block text-sm font-medium text-slate-200">Lesson description</span>
                <textarea
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  rows={5}
                  placeholder="Describe the lesson goals, what students will learn, and any important notes."
                  className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-300/70"
                />
                {errors.description ? <span className="mt-2 block text-xs text-rose-300">{errors.description}</span> : null}
              </label>
            </div>
          </div>

          <div className="grid gap-4">
            <div className="rounded-[24px] border border-white/10 bg-white/[0.04] p-4 sm:p-5">
              <div className="flex items-center gap-2 text-sm font-medium text-white">
                <FileUp className="h-4 w-4 text-cyan-200" />
                Lesson PDF
              </div>
              <p className="mt-2 text-xs leading-relaxed text-slate-400">Upload a PDF up to 30MB. This file is sent to Cloudinary before the lesson is created.</p>
              <div className="mt-4">
                <UploadDropzone
                  label="PDF file"
                  accept="application/pdf,.pdf"
                  file={lessonPdf}
                  helperText="PDF only, max 30MB"
                  error={errors.lessonPdf}
                  disabled={isSubmitting}
                  onFileChange={setLessonPdf}
                />
              </div>
            </div>

            <div className="rounded-[24px] border border-white/10 bg-white/[0.04] p-4 sm:p-5">
              <div className="flex items-center gap-2 text-sm font-medium text-white">
                <ImageIcon className="h-4 w-4 text-emerald-200" />
                Thumbnail
              </div>
              <p className="mt-2 text-xs leading-relaxed text-slate-400">Upload a thumbnail image up to 10MB for the lesson card and viewer header.</p>
              <div className="mt-4">
                <UploadDropzone
                  label="Thumbnail image"
                  accept="image/*"
                  file={thumbnail}
                  helperText="PNG, JPG, WebP, GIF, or AVIF"
                  error={errors.thumbnail}
                  disabled={isSubmitting}
                  onFileChange={setThumbnail}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-[24px] border border-white/10 bg-black/25 p-4 sm:p-5">
            <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-300">
              <span>PDF upload</span>
              <span>{pdfProgress}%</span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
              <div className="h-full rounded-full bg-cyan-400 transition-all" style={{ width: `${pdfProgress}%` }} />
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-300">
              <span>Thumbnail upload</span>
              <span>{thumbnailProgress}%</span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
              <div className="h-full rounded-full bg-emerald-400 transition-all" style={{ width: `${thumbnailProgress}%` }} />
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-300">
              <span>Overall progress</span>
              <span>{overallProgress}%</span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
              <div className="h-full rounded-full bg-fuchsia-400 transition-all" style={{ width: `${overallProgress}%` }} />
            </div>
          </div>

          <div className="rounded-[24px] border border-cyan-300/20 bg-cyan-400/10 p-4 sm:p-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-cyan-100/90">Publishing target</p>
            <div className="mt-3 flex items-center gap-3 text-white">
              <CheckCircle2 className="h-5 w-5 text-emerald-300" />
              <div>
                <p className="text-sm font-medium">Auto-generated slug</p>
                <p className="text-sm text-cyan-50/80">The slug is generated from the title when the lesson is saved.</p>
              </div>
            </div>
            <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-3 text-xs text-slate-300">
              <p>Route preview</p>
              {subject && selectedClasses.length > 0 ? (
                <div className="mt-1 space-y-0.5">
                  {selectedClasses.map((cls) => (
                    <p key={cls} className="break-all text-cyan-100">
                      /lms/{subject}/{cls}/[lesson-slug]
                    </p>
                  ))}
                </div>
              ) : (
                <p className="mt-1 break-all text-cyan-100">
                  /lms/subject/class/lesson-slug
                </p>
              )}
            </div>
          </div>
        </div>

        {errorMessage ? (
          <div className="rounded-2xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200" aria-live="polite">
            {errorMessage}
          </div>
        ) : null}

        {successMessage ? (
          <div className="rounded-2xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200" aria-live="polite">
            {successMessage}
          </div>
        ) : null}

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs leading-relaxed text-slate-400">
            Uploads are protected by the admin shell and stored in Cloudinary under <span className="text-slate-200">lms/pdfs</span> and <span className="text-slate-200">lms/thumbnails</span>.
          </p>
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-cyan-300/30 bg-cyan-400/20 px-5 py-3 text-sm font-semibold text-cyan-50 transition hover:bg-cyan-400/30 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "Publishing..." : "Publish Lesson"}
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </form>
    </section>
  );
}
