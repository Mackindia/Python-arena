"use client"

import type { LucideIcon } from "lucide-react"
import { motion } from "framer-motion"
import { BrainCircuit, Code2, Database } from "lucide-react"
import GlassCard from "@/src/components/ui/GlassCard"

export type CodeCardItem = {
  title: string
  icon: LucideIcon
  code: string
  className: string
  duration?: number
  delay?: number
}

type FloatingCodeCardsProps = {
  cards?: CodeCardItem[]
}

const defaultCards: CodeCardItem[] = [
  {
    title: "Python Logic",
    icon: Code2,
    code: "for level in range(6, 13):\n    skill += practice",
    className: "-left-8 top-8 md:-left-20",
    duration: 6.6,
  },
  {
    title: "AI Model",
    icon: BrainCircuit,
    code: "model.fit(data)\nmodel.predict(ideas)",
    className: "right-0 top-0 md:-right-12",
    duration: 7.8,
    delay: 0.4,
  },
  {
    title: "Data Skills",
    icon: Database,
    code: "dataset.clean()\ninsight = visualize(trends)",
    className: "left-10 bottom-0 md:left-24",
    duration: 8.4,
    delay: 0.2,
  },
]

export default function FloatingCodeCards({ cards = defaultCards }: FloatingCodeCardsProps) {
  return (
    <div className="pointer-events-none absolute inset-0 hidden lg:block">
      {cards.map((card) => {
        const Icon = card.icon
        return (
          <motion.div
            key={card.title}
            className={`absolute w-64 ${card.className}`}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: [0, -12, 0] }}
            transition={{
              opacity: { duration: 0.45, delay: card.delay ?? 0 },
              y: { duration: card.duration ?? 7, repeat: Infinity, ease: "easeInOut", delay: card.delay ?? 0 },
            }}
          >
            <GlassCard className="p-4">
              <div className="mb-3 flex items-center gap-2 text-cyan-200">
                <Icon className="h-4 w-4" />
                <p className="text-sm font-semibold">{card.title}</p>
              </div>
              <pre className="overflow-x-auto rounded-lg bg-slate-950/70 p-3 text-xs leading-relaxed text-emerald-300">
                <code>{card.code}</code>
              </pre>
            </GlassCard>
          </motion.div>
        )
      })}
    </div>
  )
}
