"use client";

import dynamic from "next/dynamic";

const PdfViewer = dynamic(() => import("@/src/components/resources/PdfViewer"), {
  ssr: false,
  loading: () => (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur">
      <p className="text-sm text-slate-300">Loading PDF preview...</p>
    </div>
  ),
});

type Props = {
  fileUrl: string;
};

export default function PdfViewerClient({ fileUrl }: Props) {
  return <PdfViewer fileUrl={fileUrl} />;
}
