"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

// Use the bundled pdfjs-dist worker to avoid CDN/version mismatch failures.
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url,
).toString();

// Optimize pdfjs for mobile
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url,
).toString();

type PDFViewerProps = {
  pdfUrl: string;
  title: string;
  showDownloadButton?: boolean;
  showFullscreenButton?: boolean;
  height?: string;
  minHeight?: string;
};

export default function PDFViewer({
  pdfUrl,
  title,
  showDownloadButton = true,
  showFullscreenButton = true,
  height = "65vh",
  minHeight = "420px",
}: PDFViewerProps) {
  const proxyUrl = `/api/pdf-view?url=${encodeURIComponent(pdfUrl)}`;
  const downloadPdfUrl = `/api/pdf-view?download=1&url=${encodeURIComponent(pdfUrl)}`;
  
  const isIOSDevice = useMemo(() => {
    if (typeof navigator === "undefined") {
      return false;
    }

    const userAgent = navigator.userAgent || "";
    const platform = navigator.platform || "";
    const maxTouchPoints = navigator.maxTouchPoints || 0;

    return (
      /iPad|iPhone|iPod/i.test(userAgent) ||
      (platform === "MacIntel" && maxTouchPoints > 1)
    );
  }, []);

  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isFullscreenActive, setIsFullscreenActive] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [containerWidth, setContainerWidth] = useState(600);
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const documentRef = useRef<any>(null);
  
  // Page cache to avoid re-rendering
  const pageCache = useRef<Map<number, any>>(new Map());

  // Track container width for responsive page rendering
  useEffect(() => {
    if (!scrollRef.current) return;
    const obs = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect.width;
      if (w) setContainerWidth(Math.floor(w) - 2);
    });
    obs.observe(scrollRef.current);
    return () => obs.disconnect();
  }, []);

  const handleLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setIsLoading(false);
    setHasError(false);
    // Clear cache on new PDF load
    pageCache.current.clear();
  };

  const handleLoadError = (error: Error) => {
    setIsLoading(false);
    setHasError(true);
    setErrorMessage(error.message || "Failed to load PDF");
  };

  const handleDownload = () => {
    const link = document.createElement("a");
    link.href = downloadPdfUrl;
    link.download = `${title.toLowerCase().replace(/\s+/g, "-")}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Preload next page in background for instant navigation
  useEffect(() => {
    if (!documentRef.current || pageNumber >= numPages || isLoading) return;
    
    const nextPageNum = pageNumber + 1;
    if (nextPageNum <= numPages && !pageCache.current.has(nextPageNum)) {
      // Preload next page asynchronously
      setTimeout(() => {
        if (documentRef.current) {
          try {
            documentRef.current.getPage?.(nextPageNum);
          } catch {
            // Silent fail on preload
          }
        }
      }, 200);
    }
  }, [pageNumber, numPages, isLoading]);

  // Prevent page scrolling while in-app fullscreen is active.
  useEffect(() => {
    if (!isFullscreenActive) {
      return;
    }

    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previous;
    };
  }, [isFullscreenActive]);

  const handleFullscreen = () => {
    setIsFullscreenActive((previous) => !previous);
  };

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsFullscreenActive(false);
      }
    };

    if (isFullscreenActive) {
      document.addEventListener("keydown", onKeyDown);
    }

    return () => {
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [isFullscreenActive]);

  // Keyboard shortcuts for page navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" && pageNumber < numPages) {
        setPageNumber(p => Math.min(p + 1, numPages));
      } else if (e.key === "ArrowLeft" && pageNumber > 1) {
        setPageNumber(p => Math.max(p - 1, 1));
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [pageNumber, numPages]);

  return (
    <div
      ref={containerRef}
      className={`relative flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-slate-950 ${
        isFullscreenActive ? "fixed inset-0 z-50 rounded-none border-0" : ""
      }`}
      style={{
        height: isFullscreenActive ? "100vh" : height,
        minHeight: isFullscreenActive ? undefined : minHeight,
      }}
    >
      {/* Toolbar */}
      <div className={`flex-shrink-0 flex items-center justify-between border-b border-white/10 bg-slate-900/50 px-4 py-2.5 ${isFullscreenActive ? "py-3 px-5" : ""}`}>
        {/* Page navigation */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setPageNumber((p) => Math.max(p - 1, 1))}
            disabled={pageNumber <= 1 || isLoading}
            aria-label="Previous page"
            className="rounded-lg p-1.5 text-slate-400 transition hover:bg-white/10 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <span className="text-xs text-slate-400 tabular-nums min-w-[5rem] text-center">
            {isLoading ? "Loading…" : numPages ? `${pageNumber} / ${numPages}` : ""}
          </span>
          <button
            type="button"
            onClick={() => setPageNumber((p) => Math.min(p + 1, numPages))}
            disabled={pageNumber >= numPages || isLoading}
            aria-label="Next page"
            className="rounded-lg p-1.5 text-slate-400 transition hover:bg-white/10 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          {showDownloadButton && (
            <button
              type="button"
              onClick={handleDownload}
              title="Download PDF"
              aria-label="Download PDF"
              className="rounded-lg p-2 text-slate-400 transition hover:bg-white/10 hover:text-cyan-400"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
            </button>
          )}
          {showFullscreenButton && !hasError && (
            <button
              type="button"
              onClick={handleFullscreen}
              title={isFullscreenActive ? "Exit Fullscreen" : "Fullscreen"}
              aria-label={isFullscreenActive ? "Exit Fullscreen" : "Fullscreen"}
              className="rounded-lg p-2 text-slate-400 transition hover:bg-white/10 hover:text-cyan-400"
            >
              {isFullscreenActive ? (
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 9V5m0 0H5m4 0l-4 4m0 6v4m0 0H5m4 0l-4-4m8 4v4m0 0h4m-4 0l4-4m0-6v-4m0 0h4m-4 0l4 4" />
                </svg>
              ) : (
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6v4m0-4l4-4m0 0h4m-4 0l4 4m0 6h4v-4m0 4l4 4m0 0v-4m0 4h-4m-4-4l-4-4" />
                </svg>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-cyan-400/30 border-t-cyan-400" />
            <p className="text-sm text-slate-400">Loading PDF…</p>
          </div>
        </div>
      )}

      {/* Error state */}
      {hasError && (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 bg-slate-950 p-6">
          <div className="rounded-full bg-red-500/10 p-3">
            <svg className="h-6 w-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M12 4a8 8 0 100 16 8 8 0 000-16z" />
            </svg>
          </div>
          <div className="text-center">
            <h3 className="font-semibold text-slate-200">Unable to Load PDF</h3>
            {errorMessage && <p className="mt-1 text-xs text-red-300">{errorMessage}</p>}
            <button onClick={handleDownload} className="mt-3 text-sm font-medium text-cyan-400 hover:text-cyan-300">
              Download PDF instead
            </button>
          </div>
        </div>
      )}

      {/* PDF canvas renderer via react-pdf with lazy page rendering */}
      {!hasError && (
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto bg-slate-700 flex flex-col items-center py-4"
        >
          <Document
            ref={documentRef}
            file={proxyUrl}
            onLoadSuccess={handleLoadSuccess}
            onLoadError={handleLoadError}
            loading={null}
            error={null}
          >
            {/* Only render current page for performance, not all pages */}
            <Page
              pageNumber={pageNumber}
              width={containerWidth || 600}
              renderTextLayer
              renderAnnotationLayer
              loading={
                <div className="flex justify-center py-4">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-cyan-400/30 border-t-cyan-400" />
                </div>
              }
              error={null}
            />
          </Document>
        </div>
      )}

      {/* Fullscreen hint */}
      {isFullscreenActive && (
        <div className="absolute bottom-4 right-4 rounded-lg bg-slate-900/80 px-3 py-1.5 text-xs text-slate-400 backdrop-blur-sm">
          Press ESC to exit fullscreen
        </div>
      )}
    </div>
  );
}

