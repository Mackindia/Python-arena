import { Award, BookOpen, Bot, Code2, FolderKanban, ListChecks, Sparkles } from "lucide-react"
import ScrollReveal from "@/src/components/ScrollReveal"
import { featureCards } from "@/src/constants/home"

const iconMap = {
  Bot,
  Code2,
  ListChecks,
  FolderKanban,
  BookOpen,
  Award,
}

const iconColors = [
  "from-blue-500 to-cyan-400",
  "from-indigo-500 to-purple-400",
  "from-emerald-500 to-teal-400",
  "from-amber-500 to-orange-400",
  "from-rose-500 to-pink-400",
  "from-violet-500 to-fuchsia-400",
]

export default function FeaturesSection() {
  return (
    <section id="features" className="relative overflow-hidden bg-gradient-to-b from-white to-slate-50 px-4 py-16 sm:px-6 lg:py-20">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-indigo-500/5 blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-cyan-500/5 blur-3xl"></div>
      </div>

      <div className="relative mx-auto max-w-7xl">
        <ScrollReveal>
          <div className="text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-4 py-1.5 text-sm font-medium text-indigo-700">
              <Sparkles className="h-4 w-4" />
              <span>Why Python Arena?</span>
            </div>
            <h2 className="mt-4 text-3xl font-bold text-slate-900 sm:text-4xl lg:text-5xl">
              Built for{" "}
              <span className="bg-gradient-to-r from-indigo-600 to-cyan-600 bg-clip-text text-transparent">
                Learning
              </span>
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-base text-slate-600">
              A practical learning stack designed to keep students consistent from first lesson to final project.
            </p>
          </div>
        </ScrollReveal>

        <div className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {featureCards.map((card, index) => {
            const Icon = iconMap[card.icon as keyof typeof iconMap] ?? Bot
            return (
              <ScrollReveal key={card.title} delay={index * 0.08}>
                <article className="group relative h-full overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 transition-all duration-300 hover:border-transparent hover:shadow-xl hover:shadow-slate-200/50">
                  {/* Icon with gradient */}
                  <div className={`inline-flex rounded-xl bg-gradient-to-br ${iconColors[index % iconColors.length]} p-3 shadow-lg`}>
                    <Icon className="h-5 w-5 text-white" />
                  </div>

                  <h3 className="mt-4 text-lg font-bold text-slate-900">{card.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">{card.description}</p>

                  {/* Hover gradient */}
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-indigo-500/5 to-cyan-500/5 opacity-0 transition-opacity group-hover:opacity-100"></div>
                </article>
              </ScrollReveal>
            )
          })}
        </div>
      </div>
    </section>
  )
}
