import { notFound } from "next/navigation";
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
    notFound();
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
