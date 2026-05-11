"use client";

import dynamic from "next/dynamic";

// ssr: false prevents pdfjs (which uses DOMMatrix) from running in Node.js
const PDFViewer = dynamic(() => import("@/src/components/learn/PDFViewer"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[82vh] items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-cyan-400/30 border-t-cyan-400" />
    </div>
  ),
});

type Props = {
  pdfUrl: string;
  title: string;
  showDownloadButton?: boolean;
  showFullscreenButton?: boolean;
  height?: string;
  minHeight?: string;
};

export default function PDFViewerClient(props: Props) {
  return <PDFViewer {...props} />;
}
