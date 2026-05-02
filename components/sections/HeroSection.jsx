"use client";

import Link from "next/link";
import { motion } from "framer-motion";

const lines = ["LEARN", "PYTHON", "THE SMART", "WAY."];

export default function HeroSection() {
  return (
    <section className="relative flex min-h-screen flex-col justify-between overflow-hidden px-6 pb-14 pt-28 sm:px-10 lg:px-16">
      {/* Top labels */}
      <div className="flex items-center justify-between">
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
          className="font-mono text-[10px] uppercase tracking-[0.28em] text-ink-300"
        >
          01 / Introduction
        </motion.p>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="font-mono text-[10px] uppercase tracking-[0.28em] text-ink-300"
        >
          Class XI · Python
        </motion.p>
      </div>

      {/* Giant headline */}
      <div className="my-auto py-8">
        {lines.map((line, i) => (
          <div key={line} className="overflow-hidden">
            <motion.h1
              initial={{ y: "105%" }}
              animate={{ y: 0 }}
              transition={{
                duration: 0.9,
                delay: 0.2 + i * 0.1,
                ease: [0.22, 1, 0.36, 1],
              }}
              className={`block font-heading text-[clamp(3.2rem,10.5vw,9.5rem)] font-extrabold uppercase leading-[0.9] tracking-tight ${
                line === "WAY." ? "text-neon" : "text-ink-50"
              }`}
            >
              {line}
            </motion.h1>
          </div>
        ))}
      </div>

      {/* Bottom row */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.75 }}
        className="flex flex-col gap-6 border-t border-[rgba(255,255,255,0.08)] pt-6 sm:flex-row sm:items-end sm:justify-between"
      >
        <p className="max-w-sm text-sm leading-relaxed text-ink-300 sm:text-base">
          Interactive notes, programs, and AI-powered learning designed for Class XI students.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/class-xi/chapter-2"
            className="group inline-flex items-center gap-2 border border-neon px-7 py-3 font-mono text-[10px] font-semibold uppercase tracking-[0.22em] text-neon transition-all duration-300 hover:bg-neon hover:text-ink-950"
          >
            Start Learning
            <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
          </Link>
          <a
            href="#chapters"
            className="inline-flex items-center gap-2 border border-ink-500 px-7 py-3 font-mono text-[10px] font-semibold uppercase tracking-[0.22em] text-ink-200 transition-all duration-300 hover:border-ink-300 hover:text-ink-50"
          >
            Explore Chapters
          </a>
          <a
            href="/class-xi/test"
            className="group inline-flex items-center gap-2 border border-cyan-400 px-7 py-3 font-mono text-[10px] font-semibold uppercase tracking-[0.22em] text-cyan-400 transition-all duration-300 hover:bg-cyan-400 hover:text-ink-950"
          >
            Online Test
            <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
          </a>
        </div>
      </motion.div>

      {/* Ambient glow */}
      <div className="pointer-events-none absolute -top-20 left-1/3 h-[700px] w-[700px] -translate-x-1/2 rounded-full bg-neon opacity-[0.03] blur-[130px]" />
    </section>
  );
}
