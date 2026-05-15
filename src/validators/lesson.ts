import { z } from "zod";

// ─── Shared primitives ────────────────────────────────────────────────────────

const HttpUrl = z
  .string()
  .url("Must be a valid URL")
  .refine((v) => v.startsWith("http://") || v.startsWith("https://"), {
    message: "URL must use http or https",
  });

const MongoObjectId = z
  .string()
  .regex(/^[a-f\d]{24}$/i, "Must be a valid MongoDB ObjectId");

const SlugString = z
  .string()
  .min(1)
  .max(120)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase alphanumeric with hyphens");

// ─── Lesson creation (admin API) ──────────────────────────────────────────────

export const LessonCreateSchema = z.object({
  title: z.string().min(2, "Title must be at least 2 characters").max(200),
  slug: SlugString.optional(),
  contentType: z.enum(["notes", "cbse-pdf", "mixed"]).optional(),
  /** Subject slug or ObjectId */
  subject: z.string().min(1, "Subject is required"),
  /** Class slug or ObjectId */
  class: z.string().min(1, "Class is required"),
  description: z.string().min(1, "Description is required").max(2000),
  pdfUrl: HttpUrl.optional().or(z.literal("")),
  thumbnailUrl: HttpUrl.optional().or(z.literal("")),
  /** Backward compatible field for legacy callers */
  thumbnail: HttpUrl.optional().or(z.literal("")),
  content: z.string().max(100_000).optional(),
  published: z.boolean({ required_error: "published must be a boolean" }),
  /** Injected server-side from Clerk/MongoDB — not accepted from client */
  createdBy: MongoObjectId,
}).superRefine((data, ctx) => {
  const hasContent = Boolean(data.content?.trim());
  const hasPdf = Boolean(data.pdfUrl && data.pdfUrl.trim());
  const hasThumb = Boolean(data.thumbnailUrl && data.thumbnailUrl.trim());
  const type = data.contentType ?? (hasPdf && hasContent ? "mixed" : hasPdf ? "cbse-pdf" : "notes");

  if ((type === "notes" || type === "mixed") && !hasContent) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["content"],
      message: "content is required for notes or mixed lessons",
    });
  }

  if ((type === "cbse-pdf" || type === "mixed") && !hasPdf) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["pdfUrl"],
      message: "pdfUrl is required for cbse-pdf or mixed lessons",
    });
  }

  if ((type === "cbse-pdf" || type === "mixed") && !hasThumb) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["thumbnailUrl"],
      message: "thumbnailUrl is required for cbse-pdf or mixed lessons",
    });
  }
});

export type LessonCreateInput = z.infer<typeof LessonCreateSchema>;

// ─── Lesson upload (admin multipart form) ─────────────────────────────────────

const ALLOWED_FOLDERS = ["lms/pdfs", "lms/thumbnails", "lms/content", "python-arena"] as const;

export const UploadFormSchema = z.object({
  kind: z.enum(["pdf", "image"], {
    errorMap: () => ({ message: "kind must be pdf or image" }),
  }),
  /** Folder is restricted to an allowlist to prevent path traversal */
  folder: z.enum(ALLOWED_FOLDERS, {
    errorMap: () => ({
      message: `folder must be one of: ${ALLOWED_FOLDERS.join(", ")}`,
    }),
  }).optional(),
});

export type UploadFormInput = z.infer<typeof UploadFormSchema>;
