import Link from "next/link";

export const metadata = {
  title: "Chapter 1: Getting Started with Python | Class XI Python",
  description: "Introductory chapter landing page for Class XI Python students.",
};

export default function ChapterOnePage() {
  return (
    <main className="px-4 pb-16 pt-8 sm:px-8 lg:px-12">
      <section className="mx-auto max-w-5xl rounded-3xl border border-brand-100 bg-white p-8 shadow-sm">
        <p className="text-sm text-slate-500">Home &gt; Class XI &gt; Chapter 1</p>
        <h1 className="mt-3 font-heading text-3xl font-bold text-slate-900 sm:text-4xl">
          Chapter 1: Getting Started with Python
        </h1>
        <p className="mt-4 max-w-2xl text-slate-600">
          This chapter introduces Python basics, how programs run, and how students can begin
          writing their first simple code examples.
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <h2 className="font-heading text-xl font-semibold text-slate-900">What you will learn</h2>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-slate-700">
              <li>What Python is and where it is used</li>
              <li>How to write and run a simple print statement</li>
              <li>Basic coding habits for beginners</li>
            </ul>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <h2 className="font-heading text-xl font-semibold text-slate-900">Ready for next step?</h2>
            <p className="mt-3 text-sm text-slate-700">
              Continue to Chapter 2 for variables, values, and data types with full interactive notes.
            </p>
            <Link
              href="/class-xi/chapter-2"
              className="mt-5 inline-flex rounded-xl bg-brand-600 px-5 py-3 font-semibold text-white transition hover:bg-brand-700"
            >
              Go to Chapter 2
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
