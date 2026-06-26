"use client"

import { useState } from "react"
import ScrollReveal from "@/src/components/ScrollReveal"
import ProgramCard from "@/src/components/python-programs/ProgramCard"
import {
  pythonPrograms,
  categories,
  type Category,
} from "@/src/data/pythonPrograms"

const categoryIcons: Record<Category, string> = {
  Basic: "🟢",
  Logic: "🔵",
  Loops: "🟡",
  Functions: "🟣",
  Lists: "🔴",
  Tuples: "🟠",
}

export default function PythonProgramsSection() {
  const [activeCategory, setActiveCategory] = useState<Category | "All">("All")

  const filtered =
    activeCategory === "All"
      ? pythonPrograms
      : pythonPrograms.filter((p) => p.category === activeCategory)

  return (
    <section id="python-programs" className="px-4 py-16 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <ScrollReveal>
          <div className="text-center">
            <h2 className="text-3xl font-bold text-slate-900 sm:text-4xl">
              Python Programs
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-slate-600">
              Master Python through hands-on practice programs covering
              fundamentals, logic building, loops, functions, lists, and tuples.
            </p>
          </div>
        </ScrollReveal>

        {/* Category Filters */}
        <ScrollReveal delay={0.1}>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
            <button
              onClick={() => setActiveCategory("All")}
              className={`rounded-full px-4 py-2 text-sm font-medium transition-all duration-200 ${
                activeCategory === "All"
                  ? "bg-slate-900 text-white shadow-md"
                  : "border border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
              }`}
            >
              All Programs
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-all duration-200 ${
                  activeCategory === cat
                    ? "bg-slate-900 text-white shadow-md"
                    : "border border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                }`}
              >
                <span>{categoryIcons[cat]}</span>
                {cat}
              </button>
            ))}
          </div>
        </ScrollReveal>

        {/* Stats */}
        <ScrollReveal delay={0.15}>
          <div className="mt-6 text-center text-sm text-slate-500">
            Showing {filtered.length} program
            {filtered.length !== 1 ? "s" : ""}
          </div>
        </ScrollReveal>

        {/* Program Cards Grid */}
        <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((program, index) => (
            <ScrollReveal key={program.id} delay={index * 0.04}>
              <ProgramCard program={program} />
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  )
}
