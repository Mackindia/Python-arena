import { z } from "zod";

// ─── Mark lesson complete (learner POST) ──────────────────────────────────────

export const ProgressCompleteSchema = z.object({
  subject: z.string().min(1, "subject is required").max(120),
  class: z.string().min(1, "class is required").max(120),
  lesson: z.string().min(1, "lesson is required").max(120),
});

export type ProgressCompleteInput = z.infer<typeof ProgressCompleteSchema>;

// ─── Progress summary query (learner GET) ────────────────────────────────────

export const ProgressSummaryQuerySchema = z.object({
  /** Optional subject slug to narrow the summary */
  subject: z.string().max(120).optional(),
});

export type ProgressSummaryQuery = z.infer<typeof ProgressSummaryQuerySchema>;
