import { z } from "zod";

// ─── Single answer ────────────────────────────────────────────────────────────

export const QuizAnswerSchema = z.object({
  questionId: z
    .string()
    .min(1, "questionId is required")
    .max(100),
  selectedIndex: z
    .number({ required_error: "selectedIndex is required" })
    .int("selectedIndex must be an integer")
    .min(0, "selectedIndex must be >= 0")
    .max(9, "selectedIndex must be <= 9"),
});

export type QuizAnswerInput = z.infer<typeof QuizAnswerSchema>;

// ─── Quiz submission (learner API) ────────────────────────────────────────────

export const QuizSubmitSchema = z.object({
  subject: z.string().min(1, "subject is required").max(120),
  class: z.string().min(1, "class is required").max(120),
  lesson: z.string().min(1, "lesson is required").max(120),
  answers: z
    .array(QuizAnswerSchema)
    .min(1, "At least one answer is required")
    .max(100, "Too many answers"),
});

export type QuizSubmitInput = z.infer<typeof QuizSubmitSchema>;

// ─── Quiz creation / update (admin) ───────────────────────────────────────────

export const QuizQuestionCreateSchema = z.object({
  prompt: z.string().min(5, "Question prompt must be at least 5 characters").max(1000),
  options: z
    .array(z.string().min(1).max(500))
    .min(2, "At least 2 options required")
    .max(6, "Maximum 6 options allowed"),
  correctIndex: z
    .number()
    .int()
    .min(0, "correctIndex must be >= 0")
    .max(5, "correctIndex must be <= 5"),
  explanation: z.string().max(1000).optional(),
  order: z.number().int().min(0).optional(),
});

export const QuizCreateSchema = z.object({
  lesson: z
    .string()
    .regex(/^[a-f\d]{24}$/i, "lesson must be a valid MongoDB ObjectId"),
  title: z.string().min(2).max(200).optional(),
  instructions: z.string().max(1000).optional(),
  passingPercent: z
    .number()
    .int()
    .min(1)
    .max(100)
    .default(70),
  questions: z
    .array(QuizQuestionCreateSchema)
    .min(1, "At least one question is required")
    .max(50, "Maximum 50 questions allowed"),
  isPublished: z.boolean().default(false),
});

export type QuizCreateInput = z.infer<typeof QuizCreateSchema>;
