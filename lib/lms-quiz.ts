import { connectDB } from "@/lib/mongodb";
import { markLessonCompleted } from "@/lib/lms-progress";
import Subject from "@/models/lms/Subject";
import ClassModel from "@/models/lms/Class";
import LessonModel from "@/models/lms/Lesson";
import LmsQuizModel from "@/models/lms/Quiz";
import LmsQuizAttemptModel from "@/models/lms/QuizAttempt";

export type QuizAnswerInput = {
  questionId: string;
  selectedIndex: number;
};

export type PublicQuizQuestion = {
  id: string;
  prompt: string;
  options: string[];
};

export type PublicLessonQuiz = {
  quizId: string;
  title: string;
  instructions: string;
  passingPercent: number;
  questions: PublicQuizQuestion[];
};

export type SubmitQuizInput = {
  userId: string;
  subjectSlug: string;
  classSlug: string;
  lessonSlug: string;
  answers: QuizAnswerInput[];
};

type QuizContext = {
  subject: { _id: string; slug: string; name: string };
  classRecord: { _id: string; slug: string; name: string };
  lesson: { _id: string; slug: string; title: string };
  quiz: {
    _id: string;
    title: string;
    instructions?: string;
    passingPercent: number;
    questions: Array<{
      _id: string;
      prompt: string;
      options: string[];
      correctIndex: number;
      explanation?: string;
      order?: number;
    }>;
  };
};

async function resolveQuizContext(subjectSlug: string, classSlug: string, lessonSlug: string): Promise<QuizContext> {
  await connectDB();

  const subject = await Subject.findOne({ slug: subjectSlug }).select("_id slug name").lean();
  if (!subject?._id) {
    throw new Error("Subject not found");
  }

  const classRecord = await ClassModel.findOne({ slug: classSlug, subject: subject._id }).select("_id slug name").lean();
  if (!classRecord?._id) {
    throw new Error("Class not found");
  }

  const lesson = await LessonModel.findOne({
    slug: lessonSlug,
    subject: subject._id,
    class: classRecord._id,
    published: true,
  })
    .select("_id slug title")
    .lean();

  if (!lesson?._id) {
    throw new Error("Lesson not found");
  }

  const quiz = await LmsQuizModel.findOne({ lesson: lesson._id, isPublished: true })
    .select("_id title instructions passingPercent questions")
    .lean();

  if (!quiz?._id) {
    throw new Error("Quiz not found");
  }

  return {
    subject: { _id: String(subject._id), slug: subject.slug, name: subject.name },
    classRecord: { _id: String(classRecord._id), slug: classRecord.slug, name: classRecord.name },
    lesson: { _id: String(lesson._id), slug: lesson.slug, title: lesson.title },
    quiz: {
      _id: String(quiz._id),
      title: quiz.title,
      instructions: quiz.instructions,
      passingPercent: quiz.passingPercent ?? 60,
      questions: (quiz.questions ?? [])
        .map((q) => ({
          _id: String(q._id),
          prompt: q.prompt,
          options: q.options ?? [],
          correctIndex: q.correctIndex,
          explanation: q.explanation ?? "",
          order: q.order ?? 0,
        }))
        .sort((a, b) => a.order - b.order),
    },
  };
}

export async function getPublicLessonQuiz(subjectSlug: string, classSlug: string, lessonSlug: string): Promise<PublicLessonQuiz | null> {
  try {
    const context = await resolveQuizContext(subjectSlug, classSlug, lessonSlug);

    return {
      quizId: context.quiz._id,
      title: context.quiz.title,
      instructions: context.quiz.instructions || "",
      passingPercent: context.quiz.passingPercent,
      questions: context.quiz.questions.map((q) => ({
        id: q._id,
        prompt: q.prompt,
        options: q.options,
      })),
    };
  } catch (error) {
    if (error instanceof Error && error.message === "Quiz not found") {
      return null;
    }
    throw error;
  }
}

export async function submitLessonQuiz(input: SubmitQuizInput) {
  const context = await resolveQuizContext(input.subjectSlug, input.classSlug, input.lessonSlug);

  if (!context.quiz.questions.length) {
    throw new Error("Quiz has no questions");
  }

  const answerMap = new Map(
    (input.answers || []).map((item) => [
      item.questionId,
      Number.isFinite(item.selectedIndex) ? Math.max(0, Math.floor(item.selectedIndex)) : -1,
    ]),
  );

  const evaluated = context.quiz.questions.map((question) => {
    const selectedIndex = answerMap.has(question._id) ? (answerMap.get(question._id) as number) : -1;
    const isCorrect = selectedIndex === question.correctIndex;

    return {
      questionId: question._id,
      prompt: question.prompt,
      options: question.options,
      selectedIndex,
      correctIndex: question.correctIndex,
      isCorrect,
      explanation: question.explanation || "Review this concept and try again.",
    };
  });

  const score = evaluated.filter((item) => item.isCorrect).length;
  const total = evaluated.length;
  const accuracy = total > 0 ? Math.round((score / total) * 100) : 0;
  const passed = accuracy >= context.quiz.passingPercent;

  await LmsQuizAttemptModel.create({
    userId: input.userId,
    subject: context.subject._id,
    class: context.classRecord._id,
    lesson: context.lesson._id,
    quiz: context.quiz._id,
    score,
    total,
    accuracy,
    passed,
    answers: evaluated.map((item) => ({
      questionId: item.questionId,
      selectedIndex: item.selectedIndex,
      isCorrect: item.isCorrect,
    })),
  });

  let progressSummary = null;
  if (passed) {
    const progressResult = await markLessonCompleted({
      userId: input.userId,
      subjectSlug: input.subjectSlug,
      classSlug: input.classSlug,
      lessonSlug: input.lessonSlug,
    });
    progressSummary = progressResult.progressSummary;
  }

  return {
    quiz: {
      id: context.quiz._id,
      title: context.quiz.title,
      passingPercent: context.quiz.passingPercent,
    },
    lesson: {
      id: context.lesson._id,
      title: context.lesson.title,
      slug: context.lesson.slug,
    },
    score,
    total,
    accuracy,
    passed,
    results: evaluated,
    progressSummary,
  };
}
