import Link from "next/link";
import { notFound } from "next/navigation";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import type { Metadata } from "next";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import Sidebar from "@/components/sidebar/Sidebar";
import Quiz, { type QuizQuestion } from "@/components/quiz/Quiz";
import CodeBlock from "@/src/components/lesson/CodeBlock";
import LessonComments from "@/components/comments/LessonComments";
import { getChapterBySlug, getPrevNextChapter, getSubjectClass } from "@/src/lib/courses";

type Params = {
  subject: string;
  class: string;
  lesson: string;
};

function formatLabel(value: string) {
  if (value.toLowerCase() === "ai") {
    return "AI";
  }

  return value
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { subject, class: classSlug, lesson } = await params;
  const prettySubject = formatLabel(subject);
  const prettyClass = formatLabel(classSlug);

  if (lesson === "quiz") {
    return {
      title: `${prettySubject} ${prettyClass} Quiz | Python Arena`,
      description: `Practice MCQs for ${prettySubject} ${prettyClass}.`,
      alternates: { canonical: `/learn/${subject}/${classSlug}/quiz` },
    };
  }

  const lessonItem = getChapterBySlug(subject, classSlug, lesson);
  const title = lessonItem?.title ?? `${prettySubject} ${prettyClass}`;
  const description = lessonItem?.description ?? `Study ${title} for ${prettySubject} ${prettyClass}.`;

  return {
    title: `${title} | Python Arena`,
    description,
    alternates: { canonical: `/learn/${subject}/${classSlug}/${lesson}` },
  };
}

export default async function LessonPage({ params }: { params: Promise<Params> }) {
  const { subject, class: classSlug, lesson } = await params;
  const courseClass = getSubjectClass(subject, classSlug);

  if (!courseClass) {
    notFound();
  }

  const basePath = `/learn/${subject}/${classSlug}`;
  const isQuizRoute = lesson === "quiz";

  if (isQuizRoute) {
    if (!courseClass.quizFile) {
      notFound();
    }

    const quizPath = join(process.cwd(), "src", "content", subject, classSlug, courseClass.quizFile);
    const rawQuiz = await readFile(quizPath, "utf8");
    const parsed = JSON.parse(rawQuiz) as { title?: string; questions?: QuizQuestion[] };
    const questions = Array.isArray(parsed.questions) ? parsed.questions : [];

    return (
      <main className="min-h-screen bg-black px-4 py-14 text-white sm:px-6 lg:px-10">
        <div className="mx-auto max-w-7xl">
          <Link href={basePath} className="text-sm text-cyan-300 hover:text-cyan-200">
            Back to {formatLabel(subject)} {formatLabel(classSlug)}
          </Link>

          <div className="mt-6 grid gap-6 lg:grid-cols-[260px_1fr]">
            <Sidebar activeItem="MCQs" basePath={basePath} chapters={courseClass.chapters} />
            <section className="rounded-2xl border border-cyan-400/20 bg-slate-950 p-5 shadow-[0_10px_30px_rgba(0,0,0,0.45)]">
              <h1 className="text-2xl font-bold sm:text-3xl">{parsed.title ?? "Quiz"}</h1>
              <div className="mt-5">
                <Quiz title={parsed.title ?? "Quiz"} questions={questions} storageKey={`quiz:${subject}:${classSlug}:quiz`} />
              </div>
            </section>
          </div>
        </div>
      </main>
    );
  }

  const lessonItem = getChapterBySlug(subject, classSlug, lesson);
  if (!lessonItem) {
    notFound();
  }

  const markdownPath = join(process.cwd(), "src", "content", subject, classSlug, lessonItem.fileName);
  const content = await readFile(markdownPath, "utf8");
  const { previous, next } = getPrevNextChapter(subject, classSlug, lesson);

  return (
    <main className="min-h-screen bg-black px-4 py-14 text-white sm:px-6 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <Link href={basePath} className="text-sm text-cyan-300 hover:text-cyan-200">
          Back to {formatLabel(subject)} {formatLabel(classSlug)}
        </Link>

        <div className="mt-6 grid gap-6 lg:grid-cols-[260px_1fr]">
          <Sidebar
            activeItem="Chapters"
            basePath={basePath}
            chapters={courseClass.chapters}
            activeChapterSlug={lessonItem.slug}
          />

          <section className="rounded-2xl border border-cyan-400/20 bg-slate-950 p-5 shadow-[0_10px_30px_rgba(0,0,0,0.45)]">
            <h1 className="text-2xl font-bold sm:text-3xl">{lessonItem.title}</h1>
            {lessonItem.description ? <p className="mt-2 text-sm text-slate-300">{lessonItem.description}</p> : null}

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
                {content}
              </ReactMarkdown>
            </article>

            <div className="mt-8 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-slate-900 p-4">
              {previous ? (
                <Link
                  href={`${basePath}/${previous.slug}`}
                  className="rounded-lg border border-white/15 px-4 py-2 text-sm text-slate-200 transition hover:bg-white/10"
                >
                  ← Previous Lesson
                </Link>
              ) : (
                <span className="text-sm text-slate-500">No previous lesson</span>
              )}

              {next ? (
                <Link
                  href={`${basePath}/${next.slug}`}
                  className="rounded-lg bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300"
                >
                  Next Lesson →
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
      </div>
    </main>
  );
}
