import mongoose from "mongoose";
import { connectDB } from "@/lib/mongodb";
import { processLessonPdfContent } from "@/lib/pdf-lesson-content";
import Subject from "@/models/lms/Subject";
import ClassModel from "@/models/lms/Class";
import LessonModel from "@/models/lms/Lesson";

export type LessonCreationInput = {
  title: string;
  slug?: string;
  subject: string;
  class: string;
  description: string;
  pdfUrl: string;
  thumbnailUrl: string;
  thumbnail?: string;
  content?: string;
  published: boolean;
  createdBy: string;
};

function toSlug(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function isValidHttpUrl(value: string) {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

export function validateLessonCreationInput(input: Partial<LessonCreationInput>) {
  const errors: string[] = [];

  if (!input.title?.trim()) {
    errors.push("title is required");
  }

  if (!input.subject?.trim()) {
    errors.push("subject is required");
  }

  if (!input.class?.trim()) {
    errors.push("class is required");
  }

  if (!input.description?.trim()) {
    errors.push("description is required");
  }

  if (!input.pdfUrl?.trim()) {
    errors.push("pdfUrl is required");
  } else if (!isValidHttpUrl(input.pdfUrl)) {
    errors.push("pdfUrl must be a valid http/https URL");
  }

  if (!input.thumbnailUrl?.trim()) {
    errors.push("thumbnailUrl is required");
  } else if (!isValidHttpUrl(input.thumbnailUrl)) {
    errors.push("thumbnailUrl must be a valid http/https URL");
  }

  if (typeof input.published !== "boolean") {
    errors.push("published must be boolean");
  }

  if (!input.createdBy?.trim()) {
    errors.push("createdBy is required");
  } else if (!mongoose.Types.ObjectId.isValid(input.createdBy)) {
    errors.push("createdBy must be a valid ObjectId");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

async function resolveSubjectRef(subjectRef: string) {
  if (mongoose.Types.ObjectId.isValid(subjectRef)) {
    return Subject.findById(subjectRef).select("_id slug").lean();
  }

  return Subject.findOne({ slug: subjectRef }).select("_id slug").lean();
}

async function resolveClassRef(classRef: string, subjectId?: string) {
  if (mongoose.Types.ObjectId.isValid(classRef)) {
    return ClassModel.findById(classRef).select("_id slug subject").lean();
  }

  const query = subjectId
    ? { slug: classRef, subject: subjectId }
    : { slug: classRef };

  return ClassModel.findOne(query).select("_id slug subject").lean();
}

export async function createLmsLesson(input: LessonCreationInput) {
  await connectDB();

  const subjectRecord = await resolveSubjectRef(input.subject);

  if (!subjectRecord) {
    throw new Error("Subject not found");
  }

  const classRecord = await resolveClassRef(input.class, String(subjectRecord._id));

  if (!classRecord) {
    throw new Error("Class not found");
  }

  const classSubjectId = String(classRecord.subject);
  if (classSubjectId !== String(subjectRecord._id)) {
    throw new Error("Selected class does not belong to the selected subject");
  }

  const slug = input.slug?.trim() ? toSlug(input.slug) : toSlug(input.title);

  const pdfProcessing = await processLessonPdfContent({
    pdfUrl: input.pdfUrl.trim(),
  });

  const extractedContent = pdfProcessing.ok ? pdfProcessing.extractedText : "";
  const finalContent = input.content?.trim() || extractedContent;

  const lesson = await LessonModel.create({
    title: input.title.trim(),
    slug,
    subject: String(subjectRecord._id),
    class: String(classRecord._id),
    description: input.description.trim(),
    content: finalContent,
    pdfUrl: input.pdfUrl.trim(),
    pdfTextExtraction: pdfProcessing.ok
      ? {
        status: "succeeded",
        sourceUrl: pdfProcessing.sourceUrl,
        pageCount: pdfProcessing.pageCount,
        extractedAt: pdfProcessing.extractedAt,
        contentLength: pdfProcessing.extractedText.length,
        error: "",
      }
      : {
        status: "failed",
        sourceUrl: pdfProcessing.sourceUrl,
        pageCount: 0,
        extractedAt: null,
        contentLength: 0,
        error: pdfProcessing.message,
      },
    thumbnailUrl: input.thumbnailUrl.trim(),
    // Keep legacy field populated for existing readers/components.
    thumbnail: input.thumbnailUrl.trim(),
    published: input.published,
    createdBy: input.createdBy,
  });

  return lesson;
}
