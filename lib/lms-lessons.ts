import mongoose from "mongoose";
import { connectDB } from "@/lib/mongodb";
import { processLessonPdfContent } from "@/lib/pdf-lesson-content";
import Subject from "@/models/lms/Subject";
import ClassModel from "@/models/lms/Class";
import LessonModel from "@/models/lms/Lesson";

export type LessonCreationInput = {
  title: string;
  slug?: string;
  contentType?: "notes" | "cbse-pdf" | "mixed";
  subject: string;
  class: string;
  description: string;
  pdfUrl?: string;
  thumbnailUrl?: string;
  thumbnail?: string;
  content?: string;
  published: boolean;
  createdBy: string;
};

type SubjectRefRecord = {
  _id: mongoose.Types.ObjectId | string;
  slug?: string;
};

type ClassRefRecord = {
  _id: mongoose.Types.ObjectId | string;
  slug?: string;
  subject?: mongoose.Types.ObjectId | string;
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
  const hasContent = Boolean(input.content?.trim());
  const hasPdf = Boolean(input.pdfUrl?.trim());
  const contentType = input.contentType ?? (hasPdf && hasContent ? "mixed" : hasPdf ? "cbse-pdf" : "notes");

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

  if ((contentType === "cbse-pdf" || contentType === "mixed") && !input.pdfUrl?.trim()) {
    errors.push("pdfUrl is required for cbse-pdf or mixed lessons");
  } else if (input.pdfUrl?.trim() && !isValidHttpUrl(input.pdfUrl)) {
    errors.push("pdfUrl must be a valid http/https URL");
  }

  if ((contentType === "cbse-pdf" || contentType === "mixed") && !input.thumbnailUrl?.trim()) {
    errors.push("thumbnailUrl is required for cbse-pdf or mixed lessons");
  } else if (input.thumbnailUrl?.trim() && !isValidHttpUrl(input.thumbnailUrl)) {
    errors.push("thumbnailUrl must be a valid http/https URL");
  }

  if ((contentType === "notes" || contentType === "mixed") && !input.content?.trim()) {
    errors.push("content is required for notes or mixed lessons");
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

  const resolvedSubject = subjectRecord as SubjectRefRecord;

  const classRecord = await resolveClassRef(input.class, String(resolvedSubject._id));

  if (!classRecord) {
    throw new Error("Class not found");
  }

  const resolvedClass = classRecord as ClassRefRecord;

  const classSubjectId = String(resolvedClass.subject || "");
  if (classSubjectId !== String(resolvedSubject._id)) {
    throw new Error("Selected class does not belong to the selected subject");
  }

  const slug = input.slug?.trim() ? toSlug(input.slug) : toSlug(input.title);

  const hasContent = Boolean(input.content?.trim());
  const hasPdf = Boolean(input.pdfUrl?.trim());
  const resolvedContentType = input.contentType ?? (hasPdf && hasContent ? "mixed" : hasPdf ? "cbse-pdf" : "notes");

  const pdfProcessing = hasPdf
    ? await processLessonPdfContent({
      pdfUrl: String(input.pdfUrl).trim(),
    })
    : {
      ok: false as const,
      sourceUrl: "",
      pageCount: 0,
      extractedAt: null,
      extractedText: "",
      message: "PDF not attached",
    };

  const extractedContent = pdfProcessing.ok ? pdfProcessing.extractedText : "";
  const finalContent = input.content?.trim() || extractedContent;

  const lesson = await (LessonModel as mongoose.Model<unknown>).create({
    title: input.title.trim(),
    slug,
    contentType: resolvedContentType,
    subject: String(resolvedSubject._id),
    class: String(resolvedClass._id),
    description: input.description.trim(),
    content: finalContent,
    pdfUrl: input.pdfUrl?.trim() || "",
    pdfTextExtraction: hasPdf
      ? (pdfProcessing.ok
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
        })
      : {
        status: "skipped",
        sourceUrl: "",
        pageCount: 0,
        extractedAt: null,
        contentLength: 0,
        error: "",
      },
    thumbnailUrl: input.thumbnailUrl?.trim() || "",
    // Keep legacy field populated for existing readers/components.
    thumbnail: input.thumbnailUrl?.trim() || "",
    published: input.published,
    createdBy: input.createdBy,
  });

  return lesson;
}
