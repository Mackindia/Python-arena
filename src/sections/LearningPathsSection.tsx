import { GraduationCap, LaptopMinimal, Sparkles } from "lucide-react"
import ScrollReveal from "@/src/components/ScrollReveal"
import GlassCard from "@/src/components/ui/GlassCard"

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
    <section id="learning-paths" className="px-4 py-20 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <ScrollReveal>
          <h2 className="text-3xl font-bold text-white sm:text-4xl">Learning Paths</h2>
          <p className="mt-3 max-w-2xl text-slate-300">
            Follow structured pathways tailored to your class level and career direction.
          </p>
        </ScrollReveal>

        <div className="mt-10 grid gap-5 lg:grid-cols-3">
          {paths.map((path, index) => {
            const Icon = path.icon
            return (
              <ScrollReveal key={path.title} delay={index * 0.08}>
                <GlassCard className="h-full p-6">
                  <div className="flex items-center justify-between">
                    <Icon className="h-6 w-6 text-cyan-300" />
                    <span className="rounded-full border border-cyan-400/30 bg-cyan-300/10 px-3 py-1 text-xs font-semibold text-cyan-200">
                      {path.level}
                    </span>
                  </div>
                  <h3 className="mt-5 text-xl font-semibold text-white">{path.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-slate-300">{path.detail}</p>
                </GlassCard>
              </ScrollReveal>
            )
          })}
        </div>
      </div>
    </section>
  )
}
