import { ArrowRight, Sparkles, Code2, Zap } from "lucide-react";

export default function HeroSection() {
  return (
    <section id="top" className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-900 px-4 pt-12 pb-16 sm:px-6 lg:px-10 lg:pt-16 lg:pb-20">
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-indigo-500/20 blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-cyan-500/20 blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-purple-500/10 blur-3xl"></div>
      </div>

      <div className="relative mx-auto max-w-7xl">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div>
            {/* Badge */}
            <div className="inline-flex items-center gap-2 rounded-full border border-indigo-400/30 bg-indigo-500/10 px-4 py-1.5 text-sm font-medium text-indigo-300 backdrop-blur-sm">
              <Sparkles className="h-4 w-4" />
              <span>Futuristic Learning Platform</span>
            </div>

            {/* Main heading */}
            <h1 className="mt-6 text-4xl font-bold leading-tight text-white sm:text-5xl lg:text-6xl">
              Learn{" "}
              <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                Python & AI
              </span>
            </h1>

            {/* Subtitle */}
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-slate-300">
              Interactive coding, quizzes, projects, and AI-powered learning.
            </p>

            {/* Stats */}
            <div className="mt-6 flex flex-wrap gap-6 text-sm text-slate-400">
              <div className="flex items-center gap-2">
                <Code2 className="h-4 w-4 text-cyan-400" />
                <span>112+ Programs</span>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-amber-400" />
                <span>4 Class Levels</span>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="mt-8 flex flex-wrap gap-4">
              <a
                href="/learn"
                className="group inline-flex h-12 items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-blue-500 px-7 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition-all hover:from-indigo-600 hover:to-blue-600 hover:shadow-xl hover:shadow-indigo-500/30"
              >
                Start Learning
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </a>
              <a
                href="/learn"
                className="inline-flex h-12 items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-7 text-sm font-semibold text-white backdrop-blur-sm transition-all hover:bg-white/20"
              >
                Explore Classes
              </a>
            </div>
          </div>

          {/* Code preview card */}
          <div className="relative">
            <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-indigo-500/20 to-cyan-500/20 blur-sm"></div>
            <div className="relative rounded-2xl border border-white/10 bg-slate-900/80 p-6 shadow-2xl backdrop-blur-sm">
              <div className="mb-4 flex items-center justify-between">
                <p className="text-xs font-medium uppercase tracking-wider text-slate-400">Lesson Preview</p>
                <span className="flex items-center gap-1.5 rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-semibold text-emerald-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  Live
                </span>
              </div>

              <pre className="overflow-x-auto rounded-xl bg-slate-950/80 p-4 text-sm leading-relaxed text-slate-200">
                <code>{`# Class 10: loops and conditions
score = 78

if score >= 60:
    level = "Builder"
else:
    level = "Foundation"

print(f"Current track: {level}")`}</code>
              </pre>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="rounded-lg border border-slate-700/50 bg-slate-800/50 px-4 py-2.5 text-sm text-slate-300">
                  <span className="text-slate-500">Exercises:</span>{" "}
                  <span className="font-semibold text-white">12</span>
                </div>
                <div className="rounded-lg border border-slate-700/50 bg-slate-800/50 px-4 py-2.5 text-sm text-slate-300">
                  <span className="text-slate-500">Completion:</span>{" "}
                  <span className="font-semibold text-emerald-400">82%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
