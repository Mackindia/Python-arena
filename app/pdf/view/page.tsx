import Link from "next/link";
import PDFViewerClient from "./PDFViewerClient";
import { isValidHttpUrl } from "@/lib/pdf-source";

type Props = {
  searchParams: Promise<{
    url?: string;
    title?: string;
  }>;
};

export default async function PdfViewPage({ searchParams }: Props) {
  const params = await searchParams;
  const pdfUrl = params.url?.trim() || "";
  const title = params.title?.trim() || "Lesson PDF";

  if (!pdfUrl || !isValidHttpUrl(pdfUrl)) {
    return (
      <main className="min-h-screen bg-slate-950 p-4 text-white sm:p-6">
        <div className="mx-auto flex max-w-2xl flex-col items-center justify-center rounded-2xl border border-white/10 bg-slate-900 p-8 text-center shadow-xl">
          <h1 className="text-xl font-semibold text-cyan-100">PDF link unavailable</h1>
          <p className="mt-3 text-sm text-slate-300">
            This PDF could not be opened because its link is missing or invalid.
          </p>
          <Link
            href="/learn"
            className="mt-6 inline-flex items-center rounded-lg bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400"
          >
            Back to Learn
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 p-4 text-white sm:p-6">
      <div className="mx-auto max-w-6xl">
        <h1 className="mb-4 text-lg font-semibold text-cyan-100 sm:text-xl">{title}</h1>
        <PDFViewerClient
          pdfUrl={pdfUrl}
          title={title}
          showDownloadButton
          showFullscreenButton
          height="82vh"
          minHeight="520px"
        />
      </div>
    </main>
  );
}
