"use client";

import Link from "next/link";
import { motion } from "framer-motion";

const demoLines = [
  { text: "A variable in Python is a named", mono: false },
  { text: "container that stores a value.", mono: false },
  { text: ">>> name = 'Alice'", mono: true },
  { text: "You can reassign it at any time.", mono: false },
];

export default function AiSection() {
  return (
    <section className="px-6 py-24 sm:px-10 lg:px-16">
      <div className="mx-auto w-full max-w-6xl border border-[rgba(255,255,255,0.08)] bg-ink-800 p-10 md:p-14">
        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr] md:gap-16">
          {/* Left */}
          <div>
            <p className="mb-5 font-mono text-[10px] uppercase tracking-[0.28em] text-neon">
              04 / AI Tutor
            </p>
            <h2 className="font-heading text-3xl font-bold text-ink-50 sm:text-4xl">
              Learn with AI Assistance
            </h2>
            <p className="mt-5 text-sm leading-relaxed text-ink-300 sm:text-base">
              Your AI tutor explains concepts, breaks down programs step-by-step, and generates
              practice questions tailored to Class XI level.
            </p>
            <Link
              href="/class-xi/chapter-2"
              className="group mt-8 inline-flex items-center gap-2 border border-neon px-7 py-3 font-mono text-[10px] font-semibold uppercase tracking-[0.22em] text-neon transition-all duration-300 hover:bg-neon hover:text-ink-950"
            >
              Try AI Tutor
              <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
            </Link>
          </div>

          {/* Right — mock AI response */}
          <div className="relative overflow-hidden border border-[rgba(255,255,255,0.08)] bg-ink-900 p-6">
            <p className="mb-5 font-mono text-[10px] uppercase tracking-[0.2em] text-ink-400">
              ● AI Response
            </p>
            <motion.div
              className="space-y-2"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              {demoLines.map((line, i) => (
                <motion.p
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: 0.1 + i * 0.14 }}
                  className={`text-sm leading-relaxed ${
                    line.mono ? "font-mono text-neon" : "text-ink-200"
                  }`}
                >
                  {line.text}
                </motion.p>
              ))}
            </motion.div>
            {/* Ambient glow inside card */}
            <div className="pointer-events-none absolute -bottom-8 -right-8 h-28 w-28 rounded-full bg-neon opacity-10 blur-3xl" />
          </div>
        </div>
      </div>
    </section>
  );
}
