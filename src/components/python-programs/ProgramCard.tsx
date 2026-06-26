"use client"

import { useState } from "react"
import { ArrowRight, ExternalLink } from "lucide-react"
import {
  type PythonProgram,
  categoryColors,
  difficultyColors,
  classLevelColors,
} from "@/src/data/pythonPrograms"
import {
  type WebProgram,
  webCategoryColors,
  webDifficultyColors,
} from "@/src/data/webPrograms"
import ProgramDetailModal from "./ProgramDetailModal"

interface ProgramCardProps {
  program: PythonProgram | WebProgram
  language: "python" | "web"
}

export default function ProgramCard({ program, language }: ProgramCardProps) {
  const [showModal, setShowModal] = useState(false)

  const isPython = language === "python"
  const pythonProg = isPython ? (program as PythonProgram) : null
  const catColor = isPython
    ? categoryColors[program.category as keyof typeof categoryColors]
    : webCategoryColors[program.category as keyof typeof webCategoryColors]
  const diffColor = isPython
    ? difficultyColors[program.difficulty as keyof typeof difficultyColors]
    : webDifficultyColors[program.difficulty as keyof typeof webDifficultyColors]
  const classColor = pythonProg?.classLevel
    ? classLevelColors[pythonProg.classLevel]
    : null

  return (
    <>
      <article
        className="group relative cursor-pointer overflow-hidden rounded-xl border border-slate-200 bg-white p-4 transition-all duration-300 hover:border-indigo-200 hover:shadow-lg hover:shadow-indigo-500/5"
        onClick={() => setShowModal(true)}
      >
        {/* Top row: badges */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1.5">
            {pythonProg?.classLevel && (
              <span
                className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold ${classColor?.bg || "bg-slate-100"} ${classColor?.text || "text-slate-600"}`}
              >
                {pythonProg.classLevel}
              </span>
            )}
            <span
              className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold ${catColor?.bg || "bg-slate-100"} ${catColor?.text || "text-slate-600"}`}
            >
              {program.category}
            </span>
          </div>
          <span
            className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold ${diffColor?.bg || "bg-slate-100"} ${diffColor?.text || "text-slate-600"}`}
          >
            {program.difficulty}
          </span>
        </div>

        {/* Title */}
        <h3 className="mt-3 text-sm font-bold text-slate-900 transition-colors group-hover:text-indigo-600">
          {program.title}
        </h3>

        {/* Description */}
        <p className="mt-1.5 text-xs leading-relaxed text-slate-500 line-clamp-2">
          {program.description}
        </p>

        {/* Action row */}
        <div className="mt-3 flex items-center justify-between">
          <span className="text-xs font-medium text-indigo-600 opacity-0 transition-all group-hover:opacity-100">
            View Program
          </span>
          <ExternalLink className="h-3.5 w-3.5 text-slate-400 transition-colors group-hover:text-indigo-500" />
        </div>

        {/* Hover gradient overlay */}
        <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-indigo-500/5 to-cyan-500/5 opacity-0 transition-opacity group-hover:opacity-100"></div>
      </article>

      {showModal && (
        <ProgramDetailModal
          program={program}
          language={language}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  )
}
