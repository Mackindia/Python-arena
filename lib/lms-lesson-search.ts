import { connectDB } from "@/lib/mongodb";
import Subject from "@/models/lms/Subject";
import ClassModel from "@/models/lms/Class";
import LessonModel from "@/models/lms/Lesson";

type SearchParams = {
  query?: string;
  subjectSlug?: string;
  classSlug?: string;
  page?: number;
  limit?: number;
};

export type LessonSearchItem = {
  id: string;
  title: string;
  slug: string;
  description: string;
  subject: {
    id: string;
    name: string;
    slug: string;
  };
  class: {
    id: string;
    name: string;
    slug: string;
  };
  thumbnail: string;
  pdfUrl: string;
  href: string;
  createdAt?: Date;
};

export type LessonSearchResult = {
  items: LessonSearchItem[];
  meta: {
    query: string;
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
};

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 9;
const MAX_LIMIT = 30;

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function normalizePaging(page?: number, limit?: number) {
  const safePage = Number.isFinite(page) && page && page > 0 ? Math.floor(page) : DEFAULT_PAGE;
  const safeLimitRaw = Number.isFinite(limit) && limit && limit > 0 ? Math.floor(limit) : DEFAULT_LIMIT;
  const safeLimit = Math.min(Math.max(safeLimitRaw, 1), MAX_LIMIT);

  return {
    page: safePage,
    limit: safeLimit,
    skip: (safePage - 1) * safeLimit,
  };
}

async function resolveFilterIds(subjectSlug?: string, classSlug?: string) {
  const [subject, classRecord] = await Promise.all([
    subjectSlug ? Subject.findOne({ slug: subjectSlug }).select("_id").lean() : Promise.resolve(null),
    classSlug ? ClassModel.findOne({ slug: classSlug }).select("_id").lean() : Promise.resolve(null),
  ]);

  return {
    subjectId: subject?._id ? String(subject._id) : null,
    classId: classRecord?._id ? String(classRecord._id) : null,
  };
}

export async function searchLmsLessons(params: SearchParams): Promise<LessonSearchResult> {
  await connectDB();

  const query = (params.query ?? "").trim();
  const { page, limit, skip } = normalizePaging(params.page, params.limit);
  const filterIds = await resolveFilterIds(params.subjectSlug, params.classSlug);

  const mongoFilter: Record<string, unknown> = {
    published: true,
  };

  if (filterIds.subjectId) {
    mongoFilter.subject = filterIds.subjectId;
  }

  if (filterIds.classId) {
    mongoFilter.class = filterIds.classId;
  }

  if (query) {
    const regex = new RegExp(escapeRegex(query), "i");

    const [matchingSubjects, matchingClasses] = await Promise.all([
      Subject.find({ $or: [{ name: regex }, { slug: regex }, { description: regex }] }).select("_id").lean(),
      ClassModel.find({ $or: [{ name: regex }, { slug: regex }] }).select("_id").lean(),
    ]);

    const matchingSubjectIds = matchingSubjects.map((item) => String(item._id));
    const matchingClassIds = matchingClasses.map((item) => String(item._id));

    mongoFilter.$or = [
      { title: regex },
      { description: regex },
      { content: regex },
      ...(matchingSubjectIds.length > 0 ? [{ subject: { $in: matchingSubjectIds } }] : []),
      ...(matchingClassIds.length > 0 ? [{ class: { $in: matchingClassIds } }] : []),
    ];
  }

  const [total, lessons] = await Promise.all([
    LessonModel.countDocuments(mongoFilter),
    LessonModel.find(mongoFilter)
      .select("title slug description thumbnail pdfUrl createdAt subject class")
      .populate({ path: "subject", select: "_id name slug" })
      .populate({ path: "class", select: "_id name slug" })
      .sort({ updatedAt: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
  ]);

  const items: LessonSearchItem[] = lessons
    .map((lesson) => {
      const subjectDoc = lesson.subject as { _id?: string; name?: string; slug?: string } | null;
      const classDoc = lesson.class as { _id?: string; name?: string; slug?: string } | null;

      if (!subjectDoc?._id || !classDoc?._id || !lesson.slug) {
        return null;
      }

      return {
        id: String(lesson._id),
        title: lesson.title || "Untitled lesson",
        slug: lesson.slug,
        description: lesson.description || "",
        subject: {
          id: String(subjectDoc._id),
          name: subjectDoc.name || "Unknown subject",
          slug: subjectDoc.slug || "",
        },
        class: {
          id: String(classDoc._id),
          name: classDoc.name || "Unknown class",
          slug: classDoc.slug || "",
        },
        thumbnail: lesson.thumbnail || "",
        pdfUrl: lesson.pdfUrl || "",
        href: `/lms/${subjectDoc.slug}/${classDoc.slug}/${lesson.slug}`,
        createdAt: lesson.createdAt,
      };
    })
    .filter((item): item is LessonSearchItem => item !== null);

  return {
    items,
    meta: {
      query,
      page,
      limit,
      total,
      hasMore: page * limit < total,
    },
  };
}
