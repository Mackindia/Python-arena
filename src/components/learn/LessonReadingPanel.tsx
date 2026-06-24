"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import LessonContentRenderer from "@/src/components/learn/LessonContentRenderer";

const PDFViewer = dynamic(() => import("@/src/components/learn/PDFViewer"), { ssr: false });

type LessonReadingPanelProps = {
  title: string;
  pdfUrl: string;
  content: string;
};

type ReadingMode = "pdf" | "text" | "split";

const ALL_MODES: Array<{ key: ReadingMode; label: string }> = [
  { key: "pdf", label: "PDF View" },
  { key: "text", label: "Text View" },
  { key: "split", label: "Split View" },
];

export default function LessonReadingPanel({ title, pdfUrl, content }: LessonReadingPanelProps) {
  const hasPdf = pdfUrl.trim().length > 0;
  const hasText = useMemo(() => content.trim().length > 0, [content]);

  // Determine which modes to show based on available content.
  const visibleModes = ALL_MODES.filter((m) => {
    if (m.key === "pdf" || m.key === "split") return hasPdf;
    return true; // "text" always visible
  });

  // Default to "text" for notes-only lessons, "pdf" when PDF is the only content.
  const defaultMode: ReadingMode = hasPdf ? (hasText ? "text" : "pdf") : "text";
  const [mode, setMode] = useState<ReadingMode>(defaultMode);

  // If the active mode is no longer valid (e.g., no pdf), fall back to text.
  const activeMode: ReadingMode =
    (mode === "pdf" || mode === "split") && !hasPdf ? "text" : mode;

  return (
    <section className="mt-6 rounded-2xl border border-white/10 bg-slate-950/50 p-4 sm:p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-200/90">Reading Mode</h2>

        {/* Only render the switcher if there is more than one mode available */}
        {visibleModes.length > 1 && (
          <div className="inline-flex rounded-xl border border-white/10 bg-slate-900 p-1">
            {visibleModes.map((item) => {
              const active = activeMode === item.key;
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setMode(item.key)}
                  className={[
                    "rounded-lg px-3 py-1.5 text-xs font-medium transition sm:px-4 sm:text-sm",
                    active
                      ? "bg-cyan-400 text-slate-950"
                      : "text-slate-300 hover:bg-white/10 hover:text-white",
                  ].join(" ")}
                >
                  {item.label}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {activeMode === "pdf" && hasPdf && (
        <PDFViewer
          pdfUrl={pdfUrl}
          title={title}
          showDownloadButton
          showFullscreenButton
          height="65vh"
          minHeight="420px"
        />
      )}

      {activeMode === "text" && <LessonContentRenderer content={content} />}

      {activeMode === "split" && hasPdf && (
        <div className="grid gap-4 lg:grid-cols-2">
          <PDFViewer
            pdfUrl={pdfUrl}
            title={title}
            showDownloadButton
            showFullscreenButton={false}
            height="65vh"
            minHeight="420px"
          />

          <div className="min-h-[420px]">
            <LessonContentRenderer content={content} />
          </div>
        </div>
      )}

      {!hasText && activeMode !== "pdf" && (
        <p className="mt-3 text-xs text-slate-400">
          Extracted lesson text is not available yet. Use PDF View for the original document.
        </p>
      )}
    </section>
  );
}
