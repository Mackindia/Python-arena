import Link from "next/link";

export default function HomeDocumentEditor() {
  return (
    <section className="max-w-5xl mx-auto my-12 px-4">
      <div className="bg-white rounded-lg shadow p-6 flex items-center justify-between gap-6">
        <div>
          <h2 className="text-2xl font-bold mb-1">Web Document Editor</h2>
          <p className="text-slate-500 text-sm">Write, format, and export documents in your browser.</p>
        </div>
        <Link
          href="/dashboard/documents"
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 transition-colors"
        >
          Open Editor
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        </Link>
      </div>
    </section>
  );
}
