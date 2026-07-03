"use client";

import React, { useState, useCallback } from "react";
import EnginePageLayout from "@/src/components/admin/EnginePageLayout";
import { Download, Eye, FileText, Loader2, X } from "lucide-react";
import { jsPDF } from "jspdf";

const CLASS_CONFIG = {
  "9": { name: "Class 9 - AI (Code 417)", totalPages: 450 },
  "10": { name: "Class 10 - AI (Code 417)", totalPages: 518 },
  "11": { name: "Class 11 - AI (Code 841)", totalPages: 480 },
  "12": { name: "Class 12 - AI (Code 842)", totalPages: 500 },
};

const UNITS_10 = [
  { id: "unit1", name: "Unit 1", topic: "AI Project Cycle & Ethics", start: 137, end: 174 },
  { id: "unit2", name: "Unit 2", topic: "Modeling in AI", start: 175, end: 220 },
  { id: "unit3", name: "Unit 3", topic: "Evaluating Models", start: 221, end: 251 },
  { id: "unit4", name: "Unit 4", topic: "Statistical Data", start: 252, end: 303 },
  { id: "unit5.1", name: "Unit 5.1", topic: "Computer Vision Theory", start: 304, end: 329 },
  { id: "unit5.2", name: "Unit 5.2", topic: "Computer Vision Practical", start: 330, end: 364 },
  { id: "unit6.1", name: "Unit 6.1", topic: "NLP Theory", start: 365, end: 396 },
  { id: "unit6.2", name: "Unit 6.2", topic: "NLP Practical", start: 397, end: 412 },
  { id: "unit7", name: "Unit 7", topic: "Advance Python", start: 413, end: 481 },
];

const UNITS_11 = [
  { id: "unit1", name: "Unit 1", topic: "Introduction to AI", start: 1, end: 60 },
  { id: "unit2", name: "Unit 2", topic: "AI Project Cycle", start: 61, end: 120 },
  { id: "unit3", name: "Unit 3", topic: "Data & Statistics", start: 121, end: 200 },
  { id: "unit4", name: "Unit 4", topic: "Exploratory Data Analysis", start: 201, end: 280 },
  { id: "unit5", name: "Unit 5", topic: "Data Modeling", start: 281, end: 360 },
  { id: "unit6", name: "Unit 6", topic: "AI Applications", start: 361, end: 450 },
];

const UNITS_12 = [
  { id: "unit1", name: "Unit 1", topic: "Advanced AI Concepts", start: 1, end: 70 },
  { id: "unit2", name: "Unit 2", topic: "Neural Networks", start: 71, end: 150 },
  { id: "unit3", name: "Unit 3", topic: "Deep Learning", start: 151, end: 240 },
  { id: "unit4", name: "Unit 4", topic: "Natural Language Processing", start: 241, end: 330 },
  { id: "unit5", name: "Unit 5", topic: "Computer Vision", start: 331, end: 420 },
  { id: "unit6", name: "Unit 6", topic: "AI Ethics & Society", start: 421, end: 480 },
];

function parsePageRange(range: string): number[] {
  if (!range) return [];
  const pages: number[] = [];
  const parts = range.split(",");
  for (const part of parts) {
    const trimmed = part.trim();
    if (trimmed.includes("-")) {
      const [start, end] = trimmed.split("-").map(Number);
      for (let i = start; i <= end; i++) pages.push(i);
    } else {
      pages.push(parseInt(trimmed));
    }
  }
  return [...new Set(pages)].sort((a, b) => a - b);
}

declare global {
  interface Window {
    jsPDF: any;
  }
}

export default function EbookExtractorPage() {
  const [selectedClass, setSelectedClass] = useState("10");
  const [pageRange, setPageRange] = useState("");
  const [singlePage, setSinglePage] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewPage, setPreviewPage] = useState<number | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [pdfFilename, setPdfFilename] = useState("Touchpad_AI_Extracted");
  const [status, setStatus] = useState<{ message: string; type: "success" | "error" | null }>({ message: "", type: null });

  const selectedPages = parsePageRange(pageRange);

  const getProxyUrl = useCallback((classNum: string, page: number) => {
    return `/api/admin/ebook-extractor?class=${classNum}&page=${page}`;
  }, []);

  const handlePreview = useCallback(() => {
    const page = parseInt(singlePage);
    if (!page) {
      setStatus({ message: "Enter a page number", type: "error" });
      return;
    }
    setPreviewUrl(getProxyUrl(selectedClass, page));
    setPreviewPage(page);
    setStatus({ message: "", type: null });
  }, [singlePage, selectedClass, getProxyUrl]);

  const handleQuickUnit = (unit: typeof UNITS_10[0]) => {
    setPageRange(`${unit.start}-${unit.end}`);
    setPdfFilename(`Touchpad_AI_${unit.name.replace(/\s+/g, "_")}`);
    setStatus({ message: "", type: null });
  };

  const handleDownloadSingle = useCallback(async () => {
    const page = parseInt(singlePage);
    if (!page) {
      setStatus({ message: "Enter a page number", type: "error" });
      return;
    }

    setIsProcessing(true);
    try {
      const url = getProxyUrl(selectedClass, page);
      const response = await fetch(url);
      if (!response.ok) throw new Error("Download failed");

      const blob = await response.blob();
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `page_${page}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);
      setStatus({ message: `Downloaded page ${page}`, type: "success" });
    } catch {
      setStatus({ message: "Download failed", type: "error" });
    } finally {
      setIsProcessing(false);
    }
  }, [singlePage, selectedClass, getProxyUrl]);

  const handleGeneratePDF = useCallback(async () => {
    if (selectedPages.length === 0) {
      setStatus({ message: "Enter a page range first", type: "error" });
      return;
    }

    setIsProcessing(true);
    setProgress({ current: 0, total: selectedPages.length });
    setStatus({ message: "Starting PDF generation...", type: "success" });

    try {
      const pdf = new jsPDF("p", "mm", "a4");
      let downloaded = 0;

      for (const page of selectedPages) {
        setProgress({ current: downloaded + 1, total: selectedPages.length });
        setStatus({ message: `Downloading page ${page} (${downloaded + 1}/${selectedPages.length})...`, type: "success" });

        try {
          const url = getProxyUrl(selectedClass, page);
          const img = await new Promise<HTMLImageElement>((resolve, reject) => {
            const imgEl = new Image();
            imgEl.crossOrigin = "anonymous";
            imgEl.onload = () => resolve(imgEl);
            imgEl.onerror = () => reject(new Error(`Failed to load page ${page}`));
            imgEl.src = url;
          });

          const pdfWidth = pdf.internal.pageSize.getWidth();
          const pdfHeight = pdf.internal.pageSize.getHeight();
          const imgRatio = img.width / img.height;
          const pdfRatio = pdfWidth / pdfHeight;

          let drawWidth: number, drawHeight: number;
          if (imgRatio > pdfRatio) {
            drawWidth = pdfWidth;
            drawHeight = pdfWidth / imgRatio;
          } else {
            drawHeight = pdfHeight;
            drawWidth = pdfHeight * imgRatio;
          }

          const offsetX = (pdfWidth - drawWidth) / 2;
          const offsetY = (pdfHeight - drawHeight) / 2;

          if (downloaded > 0) {
            pdf.addPage();
          }

          pdf.addImage(img, "JPEG", offsetX, offsetY, drawWidth, drawHeight);
          downloaded++;
        } catch (err) {
          console.error(`Error loading page ${page}:`, err);
        }

        await new Promise((r) => setTimeout(r, 100));
      }

      if (downloaded > 0) {
        pdf.save(`${pdfFilename}.pdf`);
        setStatus({ message: `PDF generated! ${downloaded} pages included.`, type: "success" });
      } else {
        setStatus({ message: "No pages could be downloaded", type: "error" });
      }
    } catch (err) {
      console.error("PDF generation error:", err);
      setStatus({ message: "PDF generation failed", type: "error" });
    } finally {
      setIsProcessing(false);
      setProgress({ current: 0, total: 0 });
    }
  }, [selectedPages, selectedClass, getProxyUrl, pdfFilename]);

  return (
    <EnginePageLayout
        title="Ebook Page Extractor"
        description="Extract pages from Touchpad AI ebooks, preview content, and generate topic-wise PDFs for sharing."
        category="AI Generators"
        quickActions={[
          { label: "Preview Page", onClick: handlePreview, icon: Eye },
          { label: "Download JPG", onClick: handleDownloadSingle, icon: Download, disabled: isProcessing },
          { label: "Generate PDF", onClick: handleGeneratePDF, icon: FileText, disabled: isProcessing || selectedPages.length === 0 },
        ]}
      >
        <div className="space-y-6">
          {/* Configuration */}
          <div className="rounded-3xl border border-white/10 bg-slate-900/40 p-5 sm:p-6 backdrop-blur-md">
            <h3 className="text-lg font-semibold text-white mb-4">Configuration</h3>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-2">Select Class</label>
                <select
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-2.5 text-sm text-white outline-none focus:border-cyan-500/30"
                >
                  {Object.entries(CLASS_CONFIG).map(([key, config]) => (
                    <option key={key} value={key}>{config.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-2">PDF Filename</label>
                <input
                  type="text"
                  value={pdfFilename}
                  onChange={(e) => setPdfFilename(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-2.5 text-sm text-white outline-none focus:border-cyan-500/30"
                />
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-xs font-medium text-slate-400 mb-2">Page Range (e.g., 137-175 or 163,165)</label>
              <input
                type="text"
                value={pageRange}
                onChange={(e) => setPageRange(e.target.value)}
                placeholder="e.g., 163-165 for MCQs"
                className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none focus:border-cyan-500/30"
              />
            </div>

            {selectedClass === "10" && (
              <div className="mt-4">
                <label className="block text-xs font-medium text-slate-400 mb-2">Quick Select Unit</label>
                <div className="flex flex-wrap gap-2">
                  {UNITS_10.map((unit) => (
                    <button
                      key={unit.id}
                      onClick={() => handleQuickUnit(unit)}
                      className="rounded-lg border border-cyan-400/20 bg-cyan-400/10 px-3 py-1.5 text-xs font-medium text-cyan-300 hover:bg-cyan-400/20 transition-colors"
                    >
                      {unit.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {selectedClass === "11" && (
              <div className="mt-4">
                <label className="block text-xs font-medium text-slate-400 mb-2">Quick Select Unit</label>
                <div className="flex flex-wrap gap-2">
                  {UNITS_11.map((unit) => (
                    <button
                      key={unit.id}
                      onClick={() => handleQuickUnit(unit)}
                      className="rounded-lg border border-cyan-400/20 bg-cyan-400/10 px-3 py-1.5 text-xs font-medium text-cyan-300 hover:bg-cyan-400/20 transition-colors"
                    >
                      {unit.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {selectedClass === "12" && (
              <div className="mt-4">
                <label className="block text-xs font-medium text-slate-400 mb-2">Quick Select Unit</label>
                <div className="flex flex-wrap gap-2">
                  {UNITS_12.map((unit) => (
                    <button
                      key={unit.id}
                      onClick={() => handleQuickUnit(unit)}
                      className="rounded-lg border border-cyan-400/20 bg-cyan-400/10 px-3 py-1.5 text-xs font-medium text-cyan-300 hover:bg-cyan-400/20 transition-colors"
                    >
                      {unit.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {selectedPages.length > 0 && (
              <div className="mt-4 rounded-xl border border-emerald-400/20 bg-emerald-400/10 p-3">
                <p className="text-xs text-emerald-300">
                  {selectedPages.length} pages selected ({selectedPages[0]} to {selectedPages[selectedPages.length - 1]}) - Est. ~{(selectedPages.length * 4).toFixed(0)} MB
                </p>
              </div>
            )}

            {status.type && (
              <div className={`mt-4 rounded-xl p-3 ${status.type === "success" ? "border border-emerald-400/20 bg-emerald-400/10" : "border border-red-400/20 bg-red-400/10"}`}>
                <p className={`text-xs ${status.type === "success" ? "text-emerald-300" : "text-red-300"}`}>{status.message}</p>
              </div>
            )}

            {isProcessing && progress.total > 0 && (
              <div className="mt-4">
                <div className="h-2 rounded-full bg-black/20 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-300"
                    style={{ width: `${(progress.current / progress.total) * 100}%` }}
                  />
                </div>
                <p className="mt-2 text-xs text-slate-400 text-center">{progress.current} / {progress.total}</p>
              </div>
            )}
          </div>

          {/* Single Page Actions */}
          <div className="rounded-3xl border border-white/10 bg-slate-900/40 p-5 sm:p-6 backdrop-blur-md">
            <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
            <div className="flex gap-3">
              <input
                type="number"
                value={singlePage}
                onChange={(e) => setSinglePage(e.target.value)}
                placeholder="Page number"
                className="flex-1 rounded-xl border border-white/10 bg-black/20 px-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none focus:border-cyan-500/30"
              />
              <button
                onClick={handlePreview}
                className="rounded-xl border border-cyan-400/20 bg-cyan-400/10 px-4 py-2.5 text-sm font-medium text-cyan-300 hover:bg-cyan-400/20 transition-colors"
              >
                <Eye className="h-4 w-4" />
              </button>
              <button
                onClick={handleDownloadSingle}
                disabled={isProcessing}
                className="rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 px-4 py-2.5 text-sm font-medium text-white hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Preview */}
          <div className="rounded-3xl border border-white/10 bg-slate-900/40 p-5 sm:p-6 backdrop-blur-md">
            <h3 className="text-lg font-semibold text-white mb-4">Page Preview</h3>
            {previewUrl ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-400">Page {previewPage}</span>
                  <button onClick={() => { setPreviewUrl(null); setPreviewPage(null); }} className="text-xs text-slate-400 hover:text-white flex items-center gap-1">
                    <X className="h-3 w-3" /> Clear
                  </button>
                </div>
                <div className="flex justify-center bg-black/20 rounded-xl p-4">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={previewUrl} alt={`Page ${previewPage}`} className="max-h-[600px] rounded-lg shadow-2xl" />
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-slate-500">
                <Eye className="h-12 w-12 mb-4 opacity-30" />
                <p className="text-sm">Enter a page number and click Preview</p>
              </div>
            )}
          </div>

          {/* Generate PDF Button */}
          {selectedPages.length > 0 && (
            <div className="rounded-3xl border border-white/10 bg-slate-900/40 p-5 sm:p-6 backdrop-blur-md">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-white">Generate PDF</h3>
                  <p className="text-xs text-slate-400">{selectedPages.length} pages - {pdfFilename}.pdf</p>
                </div>
                <button
                  onClick={handleGeneratePDF}
                  disabled={isProcessing}
                  className="rounded-xl bg-gradient-to-r from-emerald-500 to-green-500 px-6 py-3 text-sm font-medium text-white hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2"
                >
                  {isProcessing ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /> Generating...</>
                  ) : (
                    <><FileText className="h-4 w-4" /> Generate PDF</>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </EnginePageLayout>
  );
}
