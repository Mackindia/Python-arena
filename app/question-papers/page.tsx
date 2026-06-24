import Link from "next/link";
import { BookOpen } from "lucide-react";
import { connectDB } from "@/lib/mongodb";
import QPSubject from "@/src/models/question-papers/Subject";

export const dynamic = "force-dynamic";

export default async function QuestionPapersPage() {
  let subjects: Array<{ _id: string; name: string }> = [];

  try {
    await connectDB();
    subjects = await QPSubject.find().sort({ name: 1 }).lean();
  } catch {
    // silently handle — empty state will show
  }

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-12 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-6xl">
        <div className="mb-10 text-center">
          <h1 className="text-3xl font-bold text-slate-100 sm:text-4xl">
            Practice Question Papers
          </h1>
          <p className="mt-3 text-slate-400">
            Browse and download question papers organized by subject and class.
          </p>
        </div>

        {subjects.length === 0 ? (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-12 text-center">
            <BookOpen className="mx-auto mb-4 h-12 w-12 text-slate-600" />
            <p className="text-lg font-medium text-slate-300">No subjects available yet</p>
            <p className="mt-2 text-sm text-slate-500">
              Question papers will appear here once an admin adds subjects.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {subjects.map((subject) => (
              <Link
                key={subject._id}
                href={`/question-papers/${subject._id}`}
                className="group rounded-2xl border border-slate-800 bg-slate-900/60 p-6 transition hover:border-cyan-400/40 hover:bg-slate-900"
              >
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-400/10 text-cyan-400 transition group-hover:bg-cyan-400/20">
                  <BookOpen className="h-6 w-6" />
                </div>
                <h2 className="text-lg font-semibold text-slate-100">{subject.name}</h2>
                <p className="mt-1 text-sm text-slate-400">View available classes →</p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
