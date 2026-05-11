import { GraduationCap, LaptopMinimal, Sparkles } from "lucide-react"
import ScrollReveal from "@/src/components/ScrollReveal"

const paths = [
  {
    icon: GraduationCap,
    title: "Foundation Track",
    level: "Class 6 - 8",
    detail: "Visual logic, core Python syntax, and beginner problem solving.",
  },
  {
    icon: LaptopMinimal,
    title: "Builder Track",
    level: "Class 9 - 10",
    detail: "Functions, loops, data structures, and real mini applications.",
  },
  {
    icon: Sparkles,
    title: "Advanced AI Track",
    level: "Class 11 - 12",
    detail: "Data analysis, machine learning workflows, and portfolio-ready projects.",
  },
]

export default function LearningPathsSection() {
  return (
    <section id="learning-paths" className="px-4 py-16 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <ScrollReveal>
          <h2 className="text-3xl font-bold text-slate-900 sm:text-4xl">Learning Paths</h2>
          <p className="mt-3 max-w-2xl text-slate-600">
            Follow structured pathways tailored to your class level and career direction.
          </p>
        </ScrollReveal>

        <div className="mt-10 grid gap-5 lg:grid-cols-3">
          {paths.map((path, index) => {
            const Icon = path.icon
            return (
              <ScrollReveal key={path.title} delay={index * 0.08}>
                <article className="h-full rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="rounded-lg bg-slate-100 p-2.5 text-slate-700">
                      <Icon className="h-5 w-5" />
                    </span>
                    <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
                      {path.level}
                    </span>
                  </div>
                  <h3 className="mt-5 text-xl font-semibold text-slate-900">{path.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-slate-600">{path.detail}</p>
                </article>
              </ScrollReveal>
            )
          })}
        </div>
      </div>
    </section>
  )
}
