import { NextRequest, NextResponse } from "next/server";
import { Types } from "mongoose";
import { connectDB } from "@/lib/mongodb";
import Course from "@/models/Course";
import Lesson from "@/models/Lesson";
import Quiz from "@/models/Quiz";
import Resource from "@/models/Resource";

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export async function GET(request: NextRequest) {
  try {
    const query = request.nextUrl.searchParams.get("q")?.trim() ?? "";

    if (!query) {
      return NextResponse.json({ message: "Query missing" }, { status: 400 });
    }

    await connectDB();

    const [courses, lessons, quizzes, resources] = await Promise.all([
      Course.find({ $text: { $search: query } }).limit(10).select("title slug subject classLevel").lean(),
      Lesson.find({ $text: { $search: query } }).limit(10).select("title slug courseId chapterSlug").lean(),
      Quiz.find({ $text: { $search: query } }).limit(10).select("question difficulty courseId").lean(),
      Resource.find({ $text: { $search: query } }).limit(10).select("title kind url").lean(),
    ]);

    const relatedCourseIds = new Set<string>();
    lessons.forEach((lesson) => {
      if (lesson.courseId) {
        relatedCourseIds.add(String(lesson.courseId));
      }
    });
    quizzes.forEach((quiz) => {
      if (quiz.courseId) {
        relatedCourseIds.add(String(quiz.courseId));
      }
    });

    const relatedCourses = relatedCourseIds.size > 0
      ? await Course.find({ _id: { $in: Array.from(relatedCourseIds).map((id) => new Types.ObjectId(id)) } })
        .select("_id subject classLevel")
        .lean()
      : [];

    const courseContext = new Map(
      relatedCourses.map((course) => [String(course._id), {
        subjectSlug: slugify(course.subject),
        classSlug: slugify(course.classLevel),
      }]),
    );

    const courseResults = courses.map((course) => {
      const subjectSlug = slugify(course.subject);
      const classSlug = slugify(course.classLevel);

      return {
        ...course,
        href: `/learn/${subjectSlug}/${classSlug}`,
      };
    });

    const lessonResults = lessons.map((lesson) => {
      const context = courseContext.get(String(lesson.courseId));
      const chapter = lesson.chapterSlug || lesson.slug;

      return {
        ...lesson,
        href: context ? `/learn/${context.subjectSlug}/${context.classSlug}/${chapter}` : undefined,
      };
    });

    const quizResults = quizzes.map((quiz) => {
      const context = courseContext.get(String(quiz.courseId));

      return {
        ...quiz,
        href: context ? `/learn/${context.subjectSlug}/${context.classSlug}/quiz` : undefined,
      };
    });

    return NextResponse.json({
      query,
      results: {
        courses: courseResults,
        lessons: lessonResults,
        quizzes: quizResults,
        resources,
      },
    });
  } catch (error) {
    return NextResponse.json({ message: "Search failed", error: error instanceof Error ? error.message : "Unknown" }, { status: 500 });
  }
}
