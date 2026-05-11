import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { connectDB } from "@/lib/mongodb";
import { currentUser } from "@clerk/nextjs/server";
import { getLessonCompletionState } from "@/lib/lms-progress";
import { processLessonPdfContent } from "@/lib/pdf-lesson-content";
import Subject from "@/models/lms/Subject";
import ClassModel from "@/models/lms/Class";
import LessonModel from "@/models/lms/Lesson";
import LessonViewerLayout from "@/src/components/learn/LessonViewerLayout";

type Params = {
  subject: string;
  class: string;
  lesson: string;
};

type LessonNav = {
  slug: string;
  title: string;
};

async function getCurrentUserSafe() {
  try {
    return await currentUser();
  } catch {
    return null;
  }
}

async function getLmsLessonData(subjectSlug: string, classSlug: string, lessonSlug: string) {
  await connectDB();

  const subject = await Subject.findOne({ slug: subjectSlug }).select("_id slug name").lean();
  if (!subject) {
    return null;
  }

  const classRecord = await ClassModel.findOne({ slug: classSlug, subject: subject._id })
    .select("_id slug name")
    .lean();

  if (!classRecord) {
    return null;
  }

  const lesson = await LessonModel.findOne({ slug: lessonSlug, class: classRecord._id, published: true })
    .select("title slug description content pdfUrl thumbnail thumbnailUrl")
    .lean();

  if (!lesson) {
    return null;
  }

  // Backfill extracted text for older lessons that were uploaded before extraction was stable.
  if (!lesson.content?.trim() && lesson.pdfUrl) {
    const extraction = await processLessonPdfContent({
      pdfUrl: lesson.pdfUrl,
      maxFetchBytes: 50 * 1024 * 1024,
      fetchTimeoutMs: 30_000,
    });

    if (extraction.ok && extraction.extractedText.trim()) {
      const extractedText = extraction.extractedText.trim();

      await LessonModel.updateOne(
        { _id: lesson._id },
        {
          $set: {
            content: extractedText,
            pdfTextExtraction: {
              status: "succeeded",
              sourceUrl: extraction.sourceUrl,
              pageCount: extraction.pageCount,
              extractedAt: extraction.extractedAt,
              contentLength: extractedText.length,
              error: "",
            },
          },
        },
      );

      lesson.content = extractedText;
    }
  }

  const lessonSequence = await LessonModel.find({ class: classRecord._id, published: true })
    .sort({ createdAt: 1, title: 1 })
    .select("slug title")
    .lean<Array<LessonNav>>();

  const currentIndex = lessonSequence.findIndex((item) => item.slug === lesson.slug);
  const previousLesson = currentIndex > 0 ? lessonSequence[currentIndex - 1] : null;
  const nextLesson = currentIndex >= 0 && currentIndex < lessonSequence.length - 1 ? lessonSequence[currentIndex + 1] : null;

  return {
    lesson,
    previousLesson,
    nextLesson,
  };
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { subject, class: classSlug, lesson } = await params;
  const lessonData = await getLmsLessonData(subject, classSlug, lesson);

  if (!lessonData) {
    return {
      title: "Lesson Not Found | Python Arena",
      description: "The requested LMS lesson could not be found.",
    };
  }

  return {
    title: `${lessonData.lesson.title} | Python Arena LMS`,
    description: lessonData.lesson.description || `Study ${lessonData.lesson.title} in Python Arena LMS.`,
    alternates: {
      canonical: `/lms/${subject}/${classSlug}/${lesson}`,
    },
  };
}

export default async function LmsLessonViewerPage({ params }: { params: Promise<Params> }) {
  const { subject, class: classSlug, lesson } = await params;
  const lessonData = await getLmsLessonData(subject, classSlug, lesson);
  const authUser = await getCurrentUserSafe();

  if (!lessonData) {
    notFound();
  }

  if (!lessonData.lesson.pdfUrl) {
    notFound();
  }

  const completionState = authUser?.id
    ? await getLessonCompletionState(authUser.id, subject, classSlug, lesson)
    : { completed: false, completedAt: null };

  return (
    <LessonViewerLayout
      subjectSlug={subject}
      classSlug={classSlug}
      lessonSlug={lesson}
      lesson={{
        title: lessonData.lesson.title,
        description: lessonData.lesson.description || "No description available for this lesson yet.",
        content: lessonData.lesson.content || "",
        pdfUrl: lessonData.lesson.pdfUrl,
        thumbnail: lessonData.lesson.thumbnailUrl || lessonData.lesson.thumbnail || "",
      }}
      completionState={{
        completed: completionState.completed,
        completedAt: completionState.completedAt ? new Date(completionState.completedAt).toISOString() : null,
      }}
      previousLesson={lessonData.previousLesson}
      nextLesson={lessonData.nextLesson}
    />
  );
}
