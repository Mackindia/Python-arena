import Link from "next/link";
import type { Metadata } from "next";
import { connectDB } from "@/lib/mongodb";
import Subject from "@/models/lms/Subject";
import LessonSearchSection from "@/src/components/learn/LessonSearchSection";

// Revalidate this page every hour (ISR)
export const revalidate = 3600;

type SubjectCardData = {
  slug: string;
  name: string;
  description: string;
};

type LmsSubjectsState = {
  subjects: SubjectCardData[];
  dataError: string;
};

async function getAllSubjectsState(): Promise<LmsSubjectsState> {
  try {
    await connectDB();

    const subjects = await Subject.find({})
      .select("slug name description")
      .sort({ name: 1 })
      .lean();

    return {
      subjects: subjects.map((item) => {
        const subject = item as {
          slug?: string;
          name?: string;
          description?: string;
        };

        return {
          slug: subject.slug || "",
          name: subject.name || "",
          description: subject.description || "",
        };
      }),
      dataError: "",
    };
  } catch (error) {
    return {
      subjects: [],
      dataError: error instanceof Error ? error.message : "Failed to load LMS subjects",
    };
  }
}

export const metadata: Metadata = {
  title: "Subjects | Python Arena LMS",
  description: "Browse all available subjects and classes in Python Arena Learning Management System.",
  alternates: {
    canonical: "/lms",
  },
};

export default async function LmsPage() {
  const { subjects, dataError } = await getAllSubjectsState();

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-10 text-white sm:px-6 lg:px-10">
      <div className="mx-auto max-w-6xl">
        <header className="space-y-4 rounded-3xl border border-white/10 bg-slate-900/85 p-8 shadow-[0_16px_60px_rgba(2,6,23,0.45)]">
          <h1 className="text-4xl font-bold leading-tight text-white sm:text-5xl">Learning Center</h1>
          <p className="max-w-2xl text-base leading-relaxed text-slate-300 sm:text-lg">
            Explore all subjects and classes available in Python Arena. Select a subject to view its classes and start
            learning.
          </p>
        </header>

        <LessonSearchSection />

        {dataError ? (
          <div className="mt-8 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-100">
            LMS data is temporarily unavailable. Please verify your MongoDB connection and try again.
          </div>
        ) : null}

        <section className="mt-12">
          {subjects.length > 0 ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {subjects.map((subject) => (
                <Link
                  key={subject.slug}
                  href={`/lms/${subject.slug}`}
                  className="group rounded-3xl border border-white/10 bg-slate-900/60 p-6 shadow-[0_16px_60px_rgba(2,6,23,0.25)] transition hover:border-cyan-400/50 hover:bg-slate-900/85 hover:shadow-[0_16px_60px_rgba(2,6,23,0.45)]"
                >
                  <div className="space-y-4">
                    <div className="h-16 w-16 rounded-2xl border border-cyan-300/30 bg-cyan-400/10 flex items-center justify-center group-hover:border-cyan-300/50 group-hover:bg-cyan-400/20 transition">
                      <svg
                        className="h-8 w-8 text-cyan-300"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 6.253v13m0-13C6.5 6.253 2 10.753 2 16.5S6.5 26.75 12 26.75s10-4.5 10-10.25S17.5 6.253 12 6.253z"
                        />
                      </svg>
                    </div>

                    <div>
                      <h2 className="text-xl font-bold text-white group-hover:text-cyan-200 transition">
                        {subject.name}
                      </h2>
                      {subject.description && (
                        <p className="mt-2 line-clamp-2 text-sm text-slate-400 group-hover:text-slate-300 transition">
                          {subject.description}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 pt-2 text-xs text-cyan-300 opacity-0 group-hover:opacity-100 transition">
                      <span>View classes</span>
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="rounded-3xl border border-dashed border-white/20 bg-slate-900/40 px-8 py-16 text-center">
              <svg className="mx-auto h-16 w-16 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M12 6v6m0 0v6m0-6h6m0 0h6m0 0v6m0 0v6m0-6h-6m0 0h-6m0 0v-6m0 0v-6"
                />
              </svg>
              <h3 className="mt-4 text-lg font-semibold text-slate-300">No subjects yet</h3>
              <p className="mt-2 text-sm text-slate-500">Subjects will appear here once they are created.</p>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
