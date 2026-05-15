import Link from "next/link";
import Image from "next/image";
import { isValidHttpUrl } from "@/lib/pdf-source";

type CbsePdfCardProps = {
  title: string;
  description?: string;
  thumbnailUrl?: string;
  pdfUrl: string;
};

export default function CbsePdfCard({ title, description, thumbnailUrl, pdfUrl }: CbsePdfCardProps) {
  const hasValidPdfUrl = isValidHttpUrl(pdfUrl);

  const viewerUrl = hasValidPdfUrl
    ? `/pdf/view?url=${encodeURIComponent(pdfUrl)}&title=${encodeURIComponent(title)}`
    : pdfUrl;

  const downloadUrl = hasValidPdfUrl
    ? `/api/pdf-view?download=1&url=${encodeURIComponent(pdfUrl)}`
    : pdfUrl;

  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-slate-900 shadow-[0_4px_20px_rgba(0,0,0,0.4)] transition hover:border-cyan-400/40 hover:shadow-cyan-900/20">
      {/* Thumbnail */}
      <div className="relative aspect-[4/3] w-full bg-slate-800">
        {thumbnailUrl && thumbnailUrl.includes("res.cloudinary.com") ? (
          <Image
            src={thumbnailUrl}
            alt={title}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        ) : thumbnailUrl ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={thumbnailUrl}
            alt={title}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <svg
              className="h-14 w-14 text-slate-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col gap-3 p-4">
        <h3 className="text-sm font-semibold leading-snug text-white">{title}</h3>
        {description && (
          <p className="line-clamp-2 text-xs leading-relaxed text-slate-400">{description}</p>
        )}
        <div className="mt-auto flex flex-col gap-2">
          {hasValidPdfUrl ? (
            <Link
              href={viewerUrl}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-cyan-500 px-4 py-2 text-xs font-semibold text-slate-950 transition hover:bg-cyan-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-400"
            >
              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                />
              </svg>
              View PDF
            </Link>
          ) : (
            <a
              href={viewerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-cyan-500 px-4 py-2 text-xs font-semibold text-slate-950 transition hover:bg-cyan-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-400"
            >
              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                />
              </svg>
              View PDF
            </a>
          )}
          <a
            href={downloadUrl}
            {...(!hasValidPdfUrl ? { download: `${title.replace(/\s+/g, "_")}.pdf` } : {})}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-cyan-400/40 bg-cyan-500/10 px-4 py-2 text-xs font-semibold text-cyan-300 transition hover:border-cyan-400/80 hover:bg-cyan-500/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-400"
          >
            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
              />
            </svg>
            Download
          </a>
        </div>
      </div>
    </div>
  );
}
