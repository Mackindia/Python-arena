"use client";

import { motion } from "framer-motion";

const cards = [
  {
    title: "Python Basics",
    snippet: "for class_level in range(6, 13):\n    skill += 1",
    pos: "top-6 right-4 md:right-10",
    delay: 0,
  },
  {
    title: "AI Learning",
    snippet: "model.learn(lessons)\nquiz.score(student)",
    pos: "bottom-8 left-4 md:left-8",
    delay: 0.2,
  },
  {
    title: "Project Mode",
    snippet: "build()\npractice()\nimprove()",
    pos: "top-1/3 left-1/2 -translate-x-1/2",
    delay: 0.4,
  },
];

export default function FloatingCodeCards() {
  return (
    <div className="pointer-events-none absolute inset-0 hidden lg:block">
      {cards.map((card, index) => (
        <motion.div
          key={card.title}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: [0, -12, 0] }}
          transition={{
            opacity: { duration: 0.45, delay: card.delay },
            y: { duration: 6 + index, repeat: Infinity, ease: "easeInOut", delay: card.delay },
          }}
          className={`absolute w-64 rounded-xl border border-cyan-300/30 bg-slate-950/65 p-4 shadow-[0_0_40px_rgba(34,211,238,0.2)] backdrop-blur ${card.pos}`}
        >
          <p className="text-sm font-semibold text-cyan-200">{card.title}</p>
          <pre className="mt-2 overflow-x-auto text-xs leading-relaxed text-emerald-300">
            <code>{card.snippet}</code>
          </pre>
        </motion.div>
      ))}
    </div>
  );
}
