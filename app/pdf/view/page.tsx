import { notFound } from "next/navigation";
import PDFViewerClient from "./PDFViewerClient";

type Props = {
  searchParams: Promise<{
    url?: string;
    title?: string;
  }>;
};

function isAllowedPdfUrl(rawUrl: string) {
  try {
    const parsed = new URL(rawUrl);
    return ["http:", "https:"].includes(parsed.protocol) && parsed.hostname === "res.cloudinary.com";
  } catch {
    return false;
  }
}

export default async function PdfViewPage({ searchParams }: Props) {
  const params = await searchParams;
  const pdfUrl = params.url?.trim() || "";
  const title = params.title?.trim() || "Lesson PDF";

  if (!pdfUrl || !isAllowedPdfUrl(pdfUrl)) {
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
