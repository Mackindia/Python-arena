import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { connectDB } from "@/lib/mongodb";
import SubjectModel from "@/src/models/lms/Subject";
import ClassModel from "@/src/models/lms/Class";
import CourseModel from "@/src/models/Course";

type Params = { subject: string; class: string };

function toTitleCase(value: string) {
  if (value.toLowerCase() === "ai") return "AI";
  return value
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

async function getCourseData(subjectSlug: string, classSlug: string) {
  await connectDB();

  const subject = await SubjectModel.findOne({ slug: subjectSlug }).select("_id name slug").lean();
  if (!subject?._id) return null;

  const classDoc = await ClassModel.findOne({ slug: classSlug, subject: subject._id }).select("_id name slug").lean();
  if (!classDoc?._id) return null;

  const courses = await CourseModel.find({
    status: "published",
    $or: [
      { subjectSlug, classSlug },
      { subject: { $regex: `^${toTitleCase(subjectSlug)}$`, $options: "i" }, classLevel: { $regex: toTitleCase(classSlug), $options: "i" } },
    ],
  })
    .select("_id title slug description difficulty chapters thumbnail")
    .sort({ updatedAt: -1 })
    .lean();

  return {
    subjectName: String(subject.name || ""),
    className: String(classDoc.name || ""),
    courses: courses.map((course) => ({
      id: String(course._id),
      title: String(course.title || ""),
      slug: String(course.slug || ""),
      description: String(course.description || ""),
      difficulty: String(course.difficulty || "beginner"),
      chapterCount: Array.isArray(course.chapters) ? course.chapters.length : 0,
      thumbnail: String(course.thumbnail || ""),
    })),
  };
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { subject, class: classSlug } = await params;
  return {
    title: `Courses | ${subject} ${classSlug} | Python Arena`,
    description: "Browse published courses by subject and class.",
    alternates: { canonical: `/learn/${subject}/${classSlug}/course` },
  };
}

export default async function CoursePage({ params }: { params: Promise<Params> }) {
  const { subject, class: classSlug } = await params;
  const data = await getCourseData(subject, classSlug);

  if (!data) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-black px-4 py-14 text-white sm:px-6 lg:px-10">
      <div className="mx-auto max-w-6xl">
        <Link href={`/learn/${subject}/${classSlug}`} className="text-sm text-cyan-300 hover:text-cyan-200">
          Back to {data.subjectName} {data.className}
        </Link>

        <h1 className="mt-4 text-3xl font-bold sm:text-4xl">Courses</h1>
        <p className="mt-3 text-slate-300">
          Structured course modules for {data.subjectName} {data.className}.
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.courses.length ? (
            data.courses.map((course) => (
              <article key={course.id} className="rounded-2xl border border-emerald-400/20 bg-slate-950 p-5">
                <h2 className="text-lg font-semibold text-white">{course.title}</h2>
                <p className="mt-2 line-clamp-3 text-sm text-slate-300">{course.description || "No description provided."}</p>
                <div className="mt-4 flex items-center justify-between text-xs text-slate-400">
                  <span>{course.chapterCount} modules</span>
                  <span className="rounded-full border border-emerald-300/25 bg-emerald-500/10 px-2 py-1 text-emerald-200">
                    {course.difficulty}
                  </span>
                </div>
              </article>
            ))
          ) : (
            <div className="sm:col-span-2 lg:col-span-3 rounded-2xl border border-white/10 bg-slate-950 p-8 text-center text-slate-400">
              No published courses yet for this class.
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
