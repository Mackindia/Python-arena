"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { foundationPrograms as programs } from "@/lib/foundationContent";

function CodeCard({ program, idx }) {
  const [showOutput, setShowOutput] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.12 }}
      transition={{ duration: 0.45, delay: idx * 0.06 }}
      className="group relative flex flex-col bg-ink-900 transition-colors duration-300 hover:bg-ink-800"
    >
      {/* Card header */}
      <div className="flex items-start justify-between border-b border-[rgba(255,255,255,0.07)] px-6 py-5">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-ink-400">
            {String(idx + 1).padStart(2, "0")}
          </p>
          <h3 className="mt-1 font-heading text-base font-semibold text-ink-50">
            {program.title}
          </h3>
          <p className="mt-1 text-xs leading-relaxed text-ink-400">{program.description}</p>
        </div>
        {/* Toggle button */}
        <button
          onClick={() => setShowOutput((v) => !v)}
          className="ml-4 mt-1 shrink-0 rounded border border-[rgba(255,255,255,0.08)] bg-ink-800 px-3 py-1 font-mono text-[10px] uppercase tracking-widest text-neon transition-colors hover:bg-ink-700"
        >
          {showOutput ? "Code" : "Output"}
        </button>
      </div>

      {/* Code / Output pane */}
      <div className="flex-1 overflow-x-auto p-5">
        {showOutput ? (
          <pre className="font-mono text-xs leading-relaxed text-emerald-400 whitespace-pre-wrap">
            {program.output}
          </pre>
        ) : (
          <pre className="font-mono text-xs leading-relaxed text-sky-300 whitespace-pre-wrap">
            {program.code}
          </pre>
        )}
      </div>

      {/* Neon underline on hover */}
      <div className="absolute bottom-0 left-0 h-[1px] w-0 bg-neon transition-all duration-500 group-hover:w-full" />
    </motion.div>
  );
}

export default function PythonProgramsSection() {
  return (
    <section id="python-programs" className="px-6 py-24 sm:px-10 lg:px-16">
      <div className="mx-auto w-full max-w-6xl">
        {/* Section header */}
        <div className="mb-12 flex items-end justify-between border-b border-[rgba(255,255,255,0.08)] pb-6">
          <div>
            <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.28em] text-neon">
              05 / Programs
            </p>
            <h2 className="font-heading text-3xl font-bold text-ink-50 sm:text-4xl">
              Python Programs
            </h2>
          </div>
          <p className="hidden max-w-xs text-right text-sm text-ink-300 md:block">
            Explore common programs with live code and expected output.
          </p>
        </div>

        {/* Program grid */}
        <div
          className="grid sm:grid-cols-2 lg:grid-cols-3"
          style={{ gap: "1px", background: "rgba(255,255,255,0.07)" }}
        >
          {programs.map((program, idx) => (
            <CodeCard key={program.title} program={program} idx={idx} />
          ))}
        </div>
      </div>
    </section>
  );
}
