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

const MODES: Array<{ key: ReadingMode; label: string }> = [
  { key: "pdf", label: "PDF View" },
  { key: "text", label: "Text View" },
  { key: "split", label: "Split View" },
];

export default function LessonReadingPanel({ title, pdfUrl, content }: LessonReadingPanelProps) {
  const hasText = useMemo(() => content.trim().length > 0, [content]);
  const [mode, setMode] = useState<ReadingMode>(hasText ? "text" : "pdf");

  return (
    <section className="mt-6 rounded-2xl border border-white/10 bg-slate-950/50 p-4 sm:p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-200/90">Reading Mode</h2>

        <div className="inline-flex rounded-xl border border-white/10 bg-slate-900 p-1">
          {MODES.map((item) => {
            const active = mode === item.key;
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
      </div>

      {mode === "pdf" && (
        <PDFViewer
          pdfUrl={pdfUrl}
          title={title}
          showDownloadButton
          showFullscreenButton
          height="65vh"
          minHeight="420px"
        />
      )}

      {mode === "text" && <LessonContentRenderer content={content} />}

      {mode === "split" && (
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

      {!hasText && mode !== "pdf" && (
        <p className="mt-3 text-xs text-slate-400">
          Extracted lesson text is not available yet. Use PDF View for the original document.
        </p>
      )}
    </section>
  );
}
