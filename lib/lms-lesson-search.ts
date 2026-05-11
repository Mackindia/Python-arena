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

  const items: LessonSearchItem[] = [];

  for (const lesson of lessons) {
    const lessonData = lesson as {
      _id?: unknown;
      title?: string;
      slug?: string;
      description?: string;
      thumbnail?: string;
      pdfUrl?: string;
      createdAt?: Date;
      subject?: { _id?: string; name?: string; slug?: string } | null;
      class?: { _id?: string; name?: string; slug?: string } | null;
    };

    const subjectDoc = lessonData.subject;
    const classDoc = lessonData.class;

    if (!subjectDoc?._id || !classDoc?._id || !lessonData.slug) {
      continue;
    }

    items.push({
      id: String(lessonData._id),
      title: lessonData.title || "Untitled lesson",
      slug: lessonData.slug,
      description: lessonData.description || "",
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
      thumbnail: lessonData.thumbnail || "",
      pdfUrl: lessonData.pdfUrl || "",
      href: `/lms/${subjectDoc.slug || ""}/${classDoc.slug || ""}/${lessonData.slug}`,
      createdAt: lessonData.createdAt,
    });
  }

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
