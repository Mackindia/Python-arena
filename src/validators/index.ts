/**
 * Central export for all LMS Zod validators.
 *
 * Usage in API routes:
 *   import { LessonCreateSchema, type LessonCreateInput } from "@/src/validators";
 *
 * Usage with safeParse:
 *   const result = LessonCreateSchema.safeParse(body);
 *   if (!result.success) {
 *     return NextResponse.json({ errors: result.error.flatten().fieldErrors }, { status: 400 });
 *   }
 *   const data = result.data; // fully typed
 */

export {
  LessonCreateSchema,
  UploadFormSchema,
  type LessonCreateInput,
  type UploadFormInput,
} from "./lesson";

export {
  QuizAnswerSchema,
  QuizSubmitSchema,
  QuizQuestionCreateSchema,
  QuizCreateSchema,
  type QuizAnswerInput,
  type QuizSubmitInput,
  type QuizCreateInput,
} from "./quiz";

export {
  ProgressCompleteSchema,
  ProgressSummaryQuerySchema,
  type ProgressCompleteInput,
  type ProgressSummaryQuery,
} from "./progress";

export {
  LessonSearchQuerySchema,
  type LessonSearchQuery,
} from "./search";
