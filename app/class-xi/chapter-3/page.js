import Link from "next/link";

export const metadata = {
  title: "Chapter 3: Functions and Modular Code | Class XI Python",
  description: "Preview page for the next chapter in the Class XI Python platform.",
};

export default function ChapterThreePage() {
  return (
    <main className="px-4 pb-16 pt-8 sm:px-8 lg:px-12">
      <section className="mx-auto max-w-5xl rounded-3xl border border-brand-100 bg-white p-8 shadow-sm">
        <p className="text-sm text-slate-500">Home &gt; Class XI &gt; Chapter 3</p>
        <h1 className="mt-3 font-heading text-3xl font-bold text-slate-900 sm:text-4xl">
          Chapter 3: Functions and Modular Code
        </h1>
        <p className="mt-4 max-w-2xl text-slate-600">
          This chapter preview introduces reusable functions, parameters, return values, and how
          to split larger programs into clear manageable parts.
        </p>

        <div className="mt-8 rounded-2xl border border-slate-200 bg-slate-50 p-5">
          <h2 className="font-heading text-xl font-semibold text-slate-900">Coming up next</h2>
          <p className="mt-3 text-sm text-slate-700">
            Learn how to create your own functions and organize Python code in a cleaner way.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              href="/class-xi/chapter-2"
              className="rounded-xl border border-slate-300 px-5 py-3 font-semibold text-slate-700 transition hover:border-brand-400 hover:text-brand-700"
            >
              Back to Chapter 2
            </Link>
            <Link
              href="/"
              className="rounded-xl bg-brand-600 px-5 py-3 font-semibold text-white transition hover:bg-brand-700"
            >
              Return Home
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
