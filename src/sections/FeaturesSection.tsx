import { Award, BookOpen, Bot, Code2, FolderKanban, ListChecks } from "lucide-react"
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

export default function FeaturesSection() {
  return (
    <section id="features" className="px-4 py-16 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <ScrollReveal>
          <h2 className="text-3xl font-bold text-slate-900 sm:text-4xl">Features</h2>
          <p className="mt-3 max-w-2xl text-slate-600">
            A practical learning stack designed to keep students consistent from first lesson to final project.
          </p>
        </ScrollReveal>

        <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {featureCards.map((card, index) => {
            const Icon = iconMap[card.icon as keyof typeof iconMap] ?? Bot
            return (
              <ScrollReveal key={card.title} delay={index * 0.06}>
                <article className="h-full rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <span className="inline-flex rounded-lg bg-slate-100 p-2.5 text-slate-700">
                    <Icon className="h-5 w-5" />
                  </span>
                  <h3 className="mt-4 text-lg font-semibold text-slate-900">{card.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">{card.description}</p>
                </article>
              </ScrollReveal>
            )
          })}
        </div>
      </div>
    </section>
  )
}
