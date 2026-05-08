"use client"

import { motion } from "framer-motion"
import { BrainCircuit, Code2, Database } from "lucide-react"
import GlassCard from "@/src/components/ui/GlassCard"

const cards = [
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
  },
  {
    title: "Data Skills",
    icon: Database,
    code: "dataset.clean()\ninsight = visualize(trends)",
    className: "left-10 bottom-0 md:left-24",
    duration: 8.4,
  },
]

export default function FloatingCodeCards() {
  return (
    <div className="pointer-events-none absolute inset-0 hidden lg:block">
      {cards.map((card) => {
        const Icon = card.icon
        return (
          <motion.div
            key={card.title}
            className={`absolute w-64 ${card.className}`}
            animate={{ y: [0, -12, 0] }}
            transition={{ duration: card.duration, repeat: Infinity, ease: "easeInOut" }}
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
