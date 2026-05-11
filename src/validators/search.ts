import { z } from "zod";

// ─── Lesson search query params (GET) ────────────────────────────────────────

export const LessonSearchQuerySchema = z.object({
  q: z
    .string()
    .max(200, "Search query must be 200 characters or fewer")
    .optional()
    .default(""),
  subject: z.string().max(120).optional().default(""),
  class: z.string().max(120).optional().default(""),
  page: z
    .string()
    .optional()
    .transform((v) => {
      const n = Number(v ?? "1");
      return Number.isFinite(n) && n >= 1 ? Math.floor(n) : 1;
    }),
  limit: z
    .string()
    .optional()
    .transform((v) => {
      const n = Number(v ?? "9");
      if (!Number.isFinite(n)) return 9;
      return Math.min(Math.max(Math.floor(n), 1), 50);
    }),
});

export type LessonSearchQuery = z.infer<typeof LessonSearchQuerySchema>;
