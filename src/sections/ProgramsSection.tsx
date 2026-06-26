"use client"

import { useState, useMemo } from "react"
import { BookOpen, Filter, Layers } from "lucide-react"
import ScrollReveal from "@/src/components/ScrollReveal"
import ProgramCard from "@/src/components/python-programs/ProgramCard"
import {
  pythonPrograms,
  categories as pythonCategories,
  classLevels,
  type Category,
  type ClassLevel,
  type PythonProgram,
} from "@/src/data/pythonPrograms"
import {
  webPrograms,
  webCategories,
  type WebCategory,
  type WebProgram,
} from "@/src/data/webPrograms"

type LanguageTab = "python" | "web"

const PROGRAMS_PER_PAGE = 50

const languageTabs: { id: LanguageTab; label: string; icon: string }[] = [
  { id: "python", label: "Python", icon: "🐍" },
  { id: "web", label: "HTML / CSS / JS", icon: "🌐" },
]

const pythonCategoryIcons: Record<Category, string> = {
  Basics: "🟢",
  Strings: "📝",
  "Math & Logic": "🧮",
  "Loops & Patterns": "🔁",
  Sets: "🎯",
  Lists: "📋",
  Tuples: "📦",
  Dictionaries: "📖",
  Functions: "⚡",
  "File Handling": "💾",
  "Error Handling": "🛡️",
  OOP: "🏗️",
  "Modules & Projects": "🚀",
  "Number Systems": "🔢",
}

const classLevelIcons: Record<ClassLevel, string> = {
  "Class 8": "8️⃣",
  "Class 9": "9️⃣",
  "Class 10": "🔟",
  "Class 11": "1️⃣1️⃣",
}

const webCategoryIcons: Record<WebCategory, string> = {
  "HTML Basics": "📄",
  "HTML Tables": "📊",
  "HTML Forms": "📝",
  "Inline CSS": "🎨",
  "Internal CSS": "🖌️",
  "External CSS": "📁",
  "JS Basics": "⚡",
  "JS DOM": "🔧",
  "JS Events": "🎯",
}

export default function ProgramsSection() {
  const [activeLanguage, setActiveLanguage] = useState<LanguageTab>("python")
  const [activeCategory, setActiveCategory] = useState<string>("All")
  const [activeClassLevel, setActiveClassLevel] = useState<string>("All")
  const [currentPage, setCurrentPage] = useState(1)

  const isPython = activeLanguage === "python"
  const categories = isPython ? pythonCategories : webCategories
  const programs = isPython ? pythonPrograms : webPrograms
  const categoryIcons = isPython ? pythonCategoryIcons : webCategoryIcons

  const filtered = useMemo(() => {
    let result: (PythonProgram | WebProgram)[] = [...programs]

    if (isPython && activeClassLevel !== "All") {
      result = result.filter((p) => (p as PythonProgram).classLevel === activeClassLevel)
    }

    if (activeCategory !== "All") {
      result = result.filter((p) => p.category === activeCategory)
    }

    return result
  }, [programs, activeClassLevel, activeCategory, isPython])

  const totalPages = Math.ceil(filtered.length / PROGRAMS_PER_PAGE)
  const paginatedPrograms = filtered.slice(
    (currentPage - 1) * PROGRAMS_PER_PAGE,
    currentPage * PROGRAMS_PER_PAGE
  )

  const classCounts = useMemo(() => {
    if (!isPython) return {}
    const counts: Record<string, number> = { All: pythonPrograms.length }
    for (const cl of classLevels) {
      counts[cl] = pythonPrograms.filter((p) => p.classLevel === cl).length
    }
    return counts
  }, [isPython])

  const handleLanguageChange = (lang: LanguageTab) => {
    setActiveLanguage(lang)
    setActiveCategory("All")
    setActiveClassLevel("All")
    setCurrentPage(1)
  }

  const handleClassLevelChange = (cl: string) => {
    setActiveClassLevel(cl)
    setActiveCategory("All")
    setCurrentPage(1)
  }

  const handleCategoryChange = (cat: string) => {
    setActiveCategory(cat)
    setCurrentPage(1)
  }

  return (
    <section id="programs" className="relative overflow-hidden bg-gradient-to-b from-slate-50 to-white px-4 py-16 sm:px-6 lg:py-20">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 right-0 h-64 w-64 rounded-full bg-indigo-500/5 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 h-64 w-64 rounded-full bg-cyan-500/5 blur-3xl"></div>
      </div>

      <div className="relative mx-auto max-w-7xl">
        {/* Section header */}
        <ScrollReveal>
          <div className="text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-4 py-1.5 text-sm font-medium text-indigo-700">
              <BookOpen className="h-4 w-4" />
              <span>Practice Hub</span>
            </div>
            <h2 className="mt-4 text-3xl font-bold text-slate-900 sm:text-4xl lg:text-5xl">
              Programs{" "}
              <span className="bg-gradient-to-r from-indigo-600 to-cyan-600 bg-clip-text text-transparent">
                Library
              </span>
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-base text-slate-600">
              Master programming through hands-on practice. Each program includes step-by-step
              explanations and execution traces.
            </p>
          </div>
        </ScrollReveal>

        {/* Language Tabs */}
        <ScrollReveal delay={0.05}>
          <div className="mt-8 flex justify-center">
            <div className="inline-flex rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
              {languageTabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => handleLanguageChange(tab.id)}
                  className={`inline-flex items-center gap-2 rounded-lg px-6 py-2.5 text-sm font-semibold transition-all duration-200 ${
                    activeLanguage === tab.id
                      ? "bg-gradient-to-r from-indigo-500 to-blue-500 text-white shadow-md"
                      : "text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <span>{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </ScrollReveal>

        {/* Filters container */}
        <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          {/* Section labels */}
          <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-700">
            <Filter className="h-4 w-4 text-indigo-500" />
            <span>Filters</span>
          </div>

          {/* Class Level Filters (Python only) */}
          {isPython && (
            <div className="mb-4">
              <p className="mb-2.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">Class Level</p>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => handleClassLevelChange("All")}
                  className={`rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200 ${
                    activeClassLevel === "All"
                      ? "bg-gradient-to-r from-indigo-500 to-blue-500 text-white shadow-md"
                      : "border border-slate-200 bg-slate-50 text-slate-600 hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
                  }`}
                >
                  All ({classCounts["All"] || 0})
                </button>
                {classLevels.map((cl) => (
                  <button
                    key={cl}
                    onClick={() => handleClassLevelChange(cl)}
                    className={`inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200 ${
                      activeClassLevel === cl
                        ? "bg-gradient-to-r from-indigo-500 to-blue-500 text-white shadow-md"
                        : "border border-slate-200 bg-slate-50 text-slate-600 hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
                    }`}
                  >
                    <span>{classLevelIcons[cl]}</span>
                    {cl} ({classCounts[cl] || 0})
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Divider */}
          {isPython && <div className="border-t border-slate-100"></div>}

          {/* Category Filters */}
          <div className={isPython ? "mt-4" : ""}>
            <p className="mb-2.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">Categories</p>
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => handleCategoryChange("All")}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200 ${
                  activeCategory === "All"
                    ? "bg-gradient-to-r from-indigo-500 to-blue-500 text-white shadow-md"
                    : "border border-slate-200 bg-slate-50 text-slate-600 hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
                }`}
              >
                All
              </button>
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => handleCategoryChange(cat)}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition-all duration-200 ${
                    activeCategory === cat
                      ? "bg-gradient-to-r from-indigo-500 to-blue-500 text-white shadow-md"
                      : "border border-slate-200 bg-slate-50 text-slate-600 hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
                  }`}
                >
                  <span>{categoryIcons[cat as keyof typeof categoryIcons]}</span>
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Stats and Pagination Info */}
        <div className="mt-6 flex items-center justify-between text-sm text-slate-500">
          <span>
            Showing {paginatedPrograms.length} of {filtered.length} program{filtered.length !== 1 ? "s" : ""}
            {isPython ? " in Python" : " in HTML/CSS/JS"}
            {activeClassLevel !== "All" ? ` — ${activeClassLevel}` : ""}
          </span>
          {totalPages > 1 && (
            <span>
              Page {currentPage} of {totalPages}
            </span>
          )}
        </div>

        {/* Program Cards Grid */}
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {paginatedPrograms.map((program, index) => (
            <ScrollReveal key={program.id} delay={Math.min(index * 0.03, 0.3)}>
              <ProgramCard program={program as PythonProgram & WebProgram} language={activeLanguage} />
            </ScrollReveal>
          ))}
        </div>

        {/* Empty State */}
        {filtered.length === 0 && (
          <div className="mt-12 text-center">
            <Layers className="mx-auto h-12 w-12 text-slate-300" />
            <p className="mt-4 text-lg text-slate-500">No programs found for this filter.</p>
          </div>
        )}

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="mt-10 flex items-center justify-center gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              ← Previous
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`h-10 w-10 rounded-lg text-sm font-medium transition ${
                  currentPage === page
                    ? "bg-gradient-to-r from-indigo-500 to-blue-500 text-white shadow-md"
                    : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                }`}
              >
                {page}
              </button>
            ))}

            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next →
            </button>
          </div>
        )}
      </div>
    </section>
  )
}
