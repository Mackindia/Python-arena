import { ArrowRight } from "lucide-react";

export default function HeroSection() {
  return (
    <section id="top" className="px-4 pb-14 pt-8 sm:px-6 lg:px-10 lg:pt-10">
      <div className="mx-auto grid max-w-7xl items-center gap-12 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm lg:grid-cols-2 lg:p-12">
        <div>
          <p className="inline-flex rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-slate-600">
            Futuristic Learning Platform
          </p>

          <h1 className="mt-5 text-4xl font-bold leading-tight text-slate-900 sm:text-5xl">
            Learn Python & AI From Class 6 to Class 12
          </h1>

          <p className="mt-5 max-w-xl text-base leading-relaxed text-slate-600 sm:text-lg">
            Interactive coding, quizzes, projects, and AI-powered learning.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href="/learn"
              className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              Start Learning
              <ArrowRight className="h-4 w-4" />
            </a>
            <a
              href="/learn"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-800 transition hover:bg-slate-100"
            >
              Explore Classes
            </a>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-900 p-5 shadow-inner">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-xs font-medium uppercase tracking-[0.14em] text-slate-300">Lesson Preview</p>
            <span className="rounded-full bg-emerald-400/20 px-2.5 py-1 text-xs font-semibold text-emerald-300">Live</span>
          </div>

          <pre className="overflow-x-auto rounded-xl bg-slate-950 p-4 text-sm leading-relaxed text-slate-100">
            <code>{`# Class 10: loops and conditions
score = 78

if score >= 60:
    level = "Builder"
else:
    level = "Foundation"

print(f"Current track: {level}")`}</code>
          </pre>

          <div className="mt-4 grid gap-2 text-sm text-slate-300 sm:grid-cols-2">
            <div className="rounded-lg border border-slate-700 bg-slate-800/70 px-3 py-2">Exercises: 12</div>
            <div className="rounded-lg border border-slate-700 bg-slate-800/70 px-3 py-2">Completion: 82%</div>
          </div>
        </div>
      </div>
    </section>
  );
}
