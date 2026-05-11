import Link from "next/link";
import { notFound } from "next/navigation";
import { readdir } from "node:fs/promises";
import { join } from "node:path";
import type { Metadata } from "next";
import SearchBar from "@/src/components/learn/SearchBar";
import Sidebar from "@/components/sidebar/Sidebar";
import { searchSuggestions } from "@/src/constants/search";
import { getSubjectClass } from "@/src/lib/courses";

// Force rebuild
type Params = {
  subject: string;
  class: string;
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

async function getClassFiles(subject: string, classSlug: string) {
  const classDir = join(process.cwd(), "src", "content", subject, classSlug);

  try {
    const entries = await readdir(classDir, { withFileTypes: true });
    return entries.filter((entry) => entry.isFile()).map((entry) => entry.name);
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { subject, class: classSlug } = await params;

  const prettySubject = formatLabel(subject);
  const prettyClass = formatLabel(classSlug);

  return {
    title: `${prettySubject} ${prettyClass} | Python Arena`,
    description: `Browse lessons, quizzes and resources for ${prettySubject} ${prettyClass}.`,
    alternates: { canonical: `/learn/${subject}/${classSlug}` },
  };
}

export default async function ClassPage({ params }: { params: Promise<Params> }) {
  const { subject, class: classSlug } = await params;
  const courseClass = getSubjectClass(subject, classSlug);
  const files = await getClassFiles(subject, classSlug);

  if (!files || !courseClass) {
    notFound();
  }

  const lessons = courseClass.chapters;
  const notes = files.filter((name) => name.includes("note") || name.endsWith(".txt"));
  const quizFiles = files.filter((name) => name.endsWith(".json"));

  return (
    <main className="min-h-screen bg-black px-4 py-14 text-white sm:px-6 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <Link href="/learn" className="text-sm text-cyan-300 hover:text-cyan-200">
          Back to learn tracks
        </Link>

        <h1 className="mt-4 text-3xl font-bold sm:text-4xl">
          {formatLabel(subject)} - {formatLabel(classSlug)}
        </h1>
        <p className="mt-3 text-slate-300">Browse lessons and open learning content for this class.</p>

        <div className="mt-6">
          <SearchBar placeholders={searchSuggestions} />
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[260px_1fr]">
          <Sidebar activeItem="Chapters" basePath={`/learn/${subject}/${classSlug}`} chapters={lessons} />

          <section className="rounded-2xl border border-cyan-400/20 bg-slate-950 p-5 shadow-[0_10px_30px_rgba(0,0,0,0.45)]">
            <h2 className="text-xl font-semibold">Lesson List</h2>
            <ul className="mt-4 space-y-2">
              {lessons.length ? (
                lessons.map((lesson) => (
                  <li key={lesson.slug} className="rounded-lg border border-white/10 px-3 py-2 text-sm text-slate-200">
                    <Link href={`/learn/${subject}/${classSlug}/${lesson.slug}`} className="transition hover:text-cyan-200">
                      {lesson.title}
                    </Link>
                  </li>
                ))
              ) : (
                <li className="text-slate-400">No lesson files yet.</li>
              )}
            </ul>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-white/10 bg-slate-900 p-4">
                <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-cyan-200">Notes</h3>
                <ul className="mt-2 space-y-1 text-sm text-slate-300">
                  {notes.length ? notes.map((item) => <li key={item}>{item}</li>) : <li>No notes files found.</li>}
                </ul>
              </div>

              <div className="rounded-xl border border-white/10 bg-slate-900 p-4">
                <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-cyan-200">MCQs</h3>
                <ul className="mt-2 space-y-1 text-sm text-slate-300">
                  {quizFiles.length ? (
                    <li>
                      <Link href={`/learn/${subject}/${classSlug}/quiz`} className="transition hover:text-cyan-200">
                        Start Quiz
                      </Link>
                    </li>
                  ) : (
                    <li>No quiz files found.</li>
                  )}
                </ul>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
