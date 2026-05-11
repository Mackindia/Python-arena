import PdfViewerClient from "./PdfViewerClient";

export default function ResourcesPage() {
  return (
    <main className="min-h-screen bg-black px-4 py-14 text-white sm:px-6 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <h1 className="text-3xl font-bold sm:text-4xl">Resources</h1>
        <p className="mt-3 text-slate-300">Notes, worksheets, assignments, question banks, and PDF study packs.</p>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1.2fr_1fr]">
          <section className="grid gap-4 sm:grid-cols-2">
            {[
              "Notes",
              "Worksheets",
              "Question Banks",
              "Assignments",
              "PDFs",
            ].map((item) => (
              <article key={item} className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur">
                <h2 className="text-lg font-semibold">{item}</h2>
                <p className="mt-2 text-sm text-slate-300">Curated {item.toLowerCase()} for class-wise practice and revision.</p>
              </article>
            ))}
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold">Document Viewer</h2>
            <PdfViewerClient fileUrl="https://mozilla.github.io/pdf.js/web/compressed.tracemonkey-pldi-09.pdf" />
          </section>
        </div>
      </div>
    </main>
  );
}
