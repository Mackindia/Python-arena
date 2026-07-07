import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import CodeBlock from "@/src/components/lesson/CodeBlock";
import LessonComments from "@/components/comments/LessonComments";
import { connectDB } from "@/lib/mongodb";
import SubjectModel from "@/src/models/lms/Subject";
import ClassModel from "@/src/models/lms/Class";
import LessonModel from "@/src/models/lms/Lesson";

type Params = {
  subject: string;
  class: string;
  lesson: string;
};

type LessonData = {
  lessonId: string;
  title: string;
  slug: string;
  description: string;
  content: string;
  subjectName: string;
  className: string;
  createdAt: string;
  previous: { slug: string; title: string } | null;
  next: { slug: string; title: string } | null;
};

async function getLessonData(subjectSlug: string, classSlug: string, lessonSlug: string): Promise<LessonData | null> {
  await connectDB();

  const subject = await SubjectModel.findOne({ slug: subjectSlug }).select("_id name").lean();
  if (!subject?._id) return null;

  const classDoc = await ClassModel.findOne({ slug: classSlug, subject: subject._id }).select("_id name").lean();
  if (!classDoc?._id) return null;

  const lessons = await LessonModel.find({
    subject: subject._id,
    class: classDoc._id,
    published: true,
    content: { $exists: true, $ne: "" },
  })
    .select("_id title slug description content createdAt")
    .sort({ createdAt: 1 })
    .lean();

  const index = lessons.findIndex((lesson) => lesson.slug === lessonSlug);
  if (index === -1) {
    return null;
  }

  const current = lessons[index];
  const previous = index > 0 ? lessons[index - 1] : null;
  const next = index < lessons.length - 1 ? lessons[index + 1] : null;

  return {
    lessonId: String(current._id),
    title: String(current.title || ""),
    slug: String(current.slug || ""),
    description: String(current.description || ""),
    content: String(current.content || ""),
    subjectName: String(subject.name || ""),
    className: String(classDoc.name || ""),
    createdAt: (current as any).createdAt ? new Date((current as any).createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "",
    previous: previous ? { slug: String(previous.slug || ""), title: String(previous.title || "") } : null,
    next: next ? { slug: String(next.slug || ""), title: String(next.title || "") } : null,
  };
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { subject, class: classSlug, lesson } = await params;
  const data = await getLessonData(subject, classSlug, lesson);

  if (!data) {
    return {
      title: "Lesson Not Found | Python Arena",
      description: "The requested lesson was not found.",
    };
  }

  return {
    title: `${data.title} | Python Arena`,
    description: data.description || `Study ${data.title}.`,
    alternates: { canonical: `/learn/${subject}/${classSlug}/${lesson}` },
  };
}

export default async function LessonPage({ params }: { params: Promise<Params> }) {
  const { subject, class: classSlug, lesson } = await params;
  const data = await getLessonData(subject, classSlug, lesson);

  if (!data) {
    notFound();
  }

  const basePath = `/learn/${subject}/${classSlug}`;

  return (
    <main className="min-h-screen bg-black px-4 py-14 text-white sm:px-6 lg:px-10">
      <div className="mx-auto max-w-5xl">
        <Link href={`${basePath}/notes`} className="text-sm text-cyan-300 hover:text-cyan-200">
          Back to notes
        </Link>

        <section className="mt-6 rounded-2xl border border-cyan-400/20 bg-slate-950 p-5 shadow-[0_10px_30px_rgba(0,0,0,0.45)]">
          <h1 className="text-2xl font-bold sm:text-3xl">{data.title}</h1>
          {data.description ? <p className="mt-2 text-sm text-slate-300">{data.description}</p> : null}
          {data.createdAt && (
            <p className="mt-2 text-xs text-slate-500">Published on {data.createdAt}</p>
          )}

          <article className="prose prose-invert mt-6 max-w-none prose-headings:text-white prose-p:text-slate-200 prose-li:text-slate-200">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                code({ className, children, ...props }) {
                  const match = /language-(\w+)/.exec(className || "");
                  const rawCode = String(children).replace(/\n$/, "");

                  if (!match) {
                    return (
                      <code className="rounded bg-white/10 px-1 py-0.5 text-cyan-200" {...props}>
                        {children}
                      </code>
                    );
                  }

                  return <CodeBlock code={rawCode} language={match[1]} />;
                },
              }}
            >
              {data.content}
            </ReactMarkdown>
          </article>

          <div className="mt-8 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-slate-900 p-4">
            {data.previous ? (
              <Link
                href={`${basePath}/${data.previous.slug}`}
                className="rounded-lg border border-white/15 px-4 py-2 text-sm text-slate-200 transition hover:bg-white/10"
              >
                Previous Lesson
              </Link>
            ) : (
              <span className="text-sm text-slate-500">No previous lesson</span>
            )}

            {data.next ? (
              <Link
                href={`${basePath}/${data.next.slug}`}
                className="rounded-lg bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300"
              >
                Next Lesson
              </Link>
            ) : (
              <span className="text-sm text-slate-500">No next lesson</span>
            )}
          </div>

          <LessonComments
            lessonPath={`/learn/${subject}/${classSlug}/${lesson}`}
            courseSlug={`${subject}-${classSlug}`}
            chapterSlug={lesson}
          />
        </section>
      </div>
    </main>
  );
}
