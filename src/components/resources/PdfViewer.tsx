"use client";

import { useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

type PdfViewerProps = {
  fileUrl: string;
};

export default function PdfViewer({ fileUrl }: PdfViewerProps) {
  const [pages, setPages] = useState<number>(0);

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur">
      <Document
        file={fileUrl}
        onLoadSuccess={({ numPages }) => setPages(numPages)}
        onLoadError={() => setPages(0)}
        loading={<p className="text-sm text-slate-300">Loading PDF preview...</p>}
      >
        <Page pageNumber={1} renderTextLayer={false} renderAnnotationLayer={false} width={520} />
      </Document>
      <p className="mt-3 text-xs text-slate-400">Pages: {pages || "-"}</p>
      <a
        href={fileUrl}
        target="_blank"
        rel="noreferrer"
        className="mt-3 inline-flex rounded-lg border border-white/15 px-3 py-1.5 text-xs text-slate-200 transition hover:bg-white/10"
      >
        Download PDF
      </a>
    </div>
  );
}
