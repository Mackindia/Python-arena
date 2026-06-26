"use client"

import { useEffect, useRef, useState } from "react"
import { X, Copy, Check } from "lucide-react"
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

interface ProgramDetailModalProps {
  program: PythonProgram | WebProgram
  language: "python" | "web"
  onClose: () => void
}

type CodeTab = "python" | "html" | "css" | "js"

export default function ProgramDetailModal({ program, language, onClose }: ProgramDetailModalProps) {
  const [copied, setCopied] = useState(false)
  const [activeTab, setActiveTab] = useState<CodeTab>(
    language === "python" ? "python" : "html"
  )
  const overlayRef = useRef<HTMLDivElement>(null)

  const isPython = language === "python"
  const webProg = !isPython ? (program as WebProgram) : null

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    document.addEventListener("keydown", handleEscape)
    document.body.style.overflow = "hidden"
    return () => {
      document.removeEventListener("keydown", handleEscape)
      document.body.style.overflow = ""
    }
  }, [onClose])

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) onClose()
  }

  const getCurrentCode = (): string => {
    if (isPython) return (program as PythonProgram).code
    if (!webProg) return ""
    switch (activeTab) {
      case "html": return webProg.htmlCode
      case "css": return webProg.cssCode
      case "js": return webProg.jsCode
      default: return ""
    }
  }

  const getFileName = (): string => {
    if (isPython) return "main.py"
    switch (activeTab) {
      case "html": return "index.html"
      case "css": return "style.css"
      case "js": return "script.js"
      default: return "code"
    }
  }

  const handleOpenInEditor = () => {
    if (isPython) {
      window.location.href = `/dashboard/python?title=${encodeURIComponent(program.title)}&code=${encodeURIComponent((program as PythonProgram).code)}`
    } else {
      const wp = webProg!
      localStorage.setItem("editorCode", JSON.stringify({
        title: program.title,
        htmlCode: wp.htmlCode,
        cssCode: wp.cssCode,
        jsCode: wp.jsCode,
      }))
      window.location.href = "/dashboard/code?from=programs"
    }
  }

  const handleCopy = async () => {
    await navigator.clipboard.writeText(getCurrentCode())
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const catColor = isPython
    ? categoryColors[program.category as keyof typeof categoryColors]
    : webCategoryColors[program.category as keyof typeof webCategoryColors]
  const diffColor = isPython
    ? difficultyColors[program.difficulty as keyof typeof difficultyColors]
    : webDifficultyColors[program.difficulty as keyof typeof webDifficultyColors]
  const pythonProg = isPython ? (program as PythonProgram) : null
  const classColor = pythonProg?.classLevel
    ? classLevelColors[pythonProg.classLevel]
    : null

  const tabs: { id: CodeTab; label: string }[] = isPython
    ? [{ id: "python" as CodeTab, label: "Python" }]
    : [
        { id: "html" as CodeTab, label: "HTML" },
        { id: "css" as CodeTab, label: "CSS" },
        { id: "js" as CodeTab, label: "JS" },
      ]

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
    >
      <div className="relative max-h-[90vh] w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div className="flex items-center gap-3 flex-wrap">
            <h2 className="text-xl font-bold text-slate-900">{program.title}</h2>
            {pythonProg?.classLevel && (
              <span
                className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${classColor?.bg || "bg-slate-50"} ${classColor?.text || "text-slate-700"}`}
              >
                {pythonProg.classLevel}
              </span>
            )}
            <span
              className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${catColor?.bg || "bg-slate-50"} ${catColor?.text || "text-slate-700"}`}
            >
              {program.category}
            </span>
            <span
              className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${diffColor?.bg || "bg-slate-50"} ${diffColor?.text || "text-slate-700"}`}
            >
              {program.difficulty}
            </span>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Description */}
        <div className="px-6 py-4">
          <p className="text-sm leading-relaxed text-slate-600">{program.description}</p>
          {pythonProg?.funFact && (
            <div className="mt-3 rounded-lg bg-amber-50 border border-amber-200 px-4 py-2.5">
              <p className="text-xs font-medium text-amber-700">
                💡 <strong>Fun Fact:</strong> {pythonProg.funFact}
              </p>
            </div>
          )}
        </div>

        {/* Code Tabs (only for web programs) */}
        {!isPython && (
          <div className="px-6">
            <div className="flex gap-1 border-b border-slate-200">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-2 text-sm font-medium transition-colors ${
                    activeTab === tab.id
                      ? "border-b-2 border-blue-600 text-blue-600"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Code Block */}
        <div className="px-6 pb-6 pt-4">
          <div className="overflow-hidden rounded-xl border border-slate-200">
            <div className="flex items-center justify-between bg-slate-900 px-4 py-2">
              <span className="text-xs font-medium text-slate-400">
                {getFileName()}
              </span>
              <button
                onClick={handleCopy}
                className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium text-slate-400 transition hover:bg-slate-800 hover:text-white"
              >
                {copied ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-400" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    Copy
                  </>
                )}
              </button>
            </div>
            <pre className="max-h-80 overflow-auto bg-slate-950 p-4 text-sm leading-relaxed text-slate-100">
              <code>{getCurrentCode()}</code>
            </pre>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-slate-200 px-6 py-4">
          <button
            onClick={onClose}
            className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Close
          </button>
          <button
            onClick={handleOpenInEditor}
            className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            Open in Editor
          </button>
        </div>
      </div>
    </div>
  )
}
