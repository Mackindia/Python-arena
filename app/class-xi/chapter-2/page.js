import Link from "next/link";
import { chapterMeta, topicOrder, topicSections } from "@/lib/chapter2Content";
import Sidebar from "@/components/chapter/Sidebar";
import ContentSection from "@/components/chapter/ContentSection";
import AIPanel from "@/components/chapter/AIPanel";

export const metadata = {
  title: "Chapter 2: Variables & Data Types | Class XI Python",
  description:
    "Class XI Python chapter page with notes, programs, expected output, practice questions, AI support, and a lightweight 3D concept visual.",
};

export default function ChapterTwoPage() {
  return (
    <main className="px-4 pb-16 pt-8 sm:px-8 lg:px-12">
      <section className="mx-auto w-full max-w-7xl">
        <header className="rounded-2xl border border-brand-100 bg-white/90 p-6 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <nav className="flex flex-wrap items-center gap-2 text-sm text-slate-500">
                <Link href="/" className="transition hover:text-brand-700">
                  Home
                </Link>
                <span>&gt;</span>
                <span>Class XI</span>
                <span>&gt;</span>
                <span>Chapter 2</span>
              </nav>
              <h1 className="mt-2 font-heading text-3xl font-bold text-slate-900 sm:text-4xl">
                Chapter {chapterMeta.chapterNumber}: {chapterMeta.title}
              </h1>
            </div>

            <Link
              href="/"
              className="inline-flex w-fit rounded-xl border border-brand-200 bg-brand-50 px-4 py-2 text-sm font-semibold text-brand-700 transition hover:bg-brand-100"
            >
              Back to Home
            </Link>
          </div>

          <div className="mt-5">
            <div className="mb-2 flex items-center justify-between text-sm">
              <span className="font-medium text-slate-700">Your Progress</span>
              <span className="font-semibold text-brand-700">{chapterMeta.progressPercent}%</span>
            </div>
            <div className="h-2 rounded-full bg-slate-200">
              <div
                className="h-2 rounded-full bg-brand-600"
                style={{ width: `${chapterMeta.progressPercent}%` }}
              />
            </div>
          </div>
        </header>

        <div className="mt-8 grid gap-6 lg:grid-cols-[240px_minmax(0,1fr)_300px]">
          <Sidebar topics={topicOrder} />

          <section className="space-y-6">
            {topicSections.map((section) => (
              <ContentSection key={section.id} section={section} />
            ))}

            <div className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:grid-cols-2">
              <Link
                href="/class-xi/chapter-1"
                className="rounded-xl border border-slate-300 px-4 py-3 text-center font-semibold text-slate-700 transition hover:border-brand-400 hover:text-brand-700"
              >
                Previous Chapter
              </Link>
              <Link
                href="/class-xi/chapter-3"
                className="rounded-xl bg-brand-600 px-4 py-3 text-center font-semibold text-white transition hover:bg-brand-700"
              >
                Next Chapter
              </Link>
            </div>
          </section>

          <AIPanel />
        </div>
      </section>

      <footer className="mx-auto mt-14 w-full max-w-7xl border-t border-slate-200 pt-8 text-sm text-slate-600">
        <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
          <p>Class XI Python Interactive Learning Platform</p>
          <div className="flex gap-4">
            <Link href="/" className="hover:text-brand-700">Home</Link>
            <a href="#introduction" className="hover:text-brand-700">Notes</a>
            <a href="#ai-panel" className="hover:text-brand-700">AI Help</a>
          </div>
        </div>
      </footer>
    </main>
  );
}
