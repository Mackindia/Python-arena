"use client";

import { FileText, ArrowUpRight } from "lucide-react";

export default function HomeDocumentEditor() {
  return (
    <section className="px-4 py-6 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <div
          role="button"
          tabIndex={0}
          onClick={() => window.open("/dashboard/documents", "_blank")}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              window.open("/dashboard/documents", "_blank");
            }
          }}
          className="group relative cursor-pointer overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-r from-indigo-50 to-cyan-50 p-5 transition-all duration-300 hover:border-indigo-200 hover:shadow-lg hover:shadow-indigo-500/5 sm:p-6"
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-500 shadow-lg">
                <FileText className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900">Web Document Editor</h2>
                <p className="mt-0.5 text-sm text-slate-600">Write, format, and export documents in your browser.</p>
              </div>
            </div>
            <span className="inline-flex h-10 shrink-0 items-center gap-2 rounded-lg bg-gradient-to-r from-indigo-500 to-blue-500 px-5 text-sm font-semibold text-white shadow-md shadow-indigo-500/25 transition-all group-hover:from-indigo-600 group-hover:to-blue-600 group-hover:shadow-lg">
              Open Editor
              <ArrowUpRight className="h-4 w-4" />
            </span>
          </div>

          {/* Hover gradient */}
          <div className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-r from-indigo-500/5 to-cyan-500/5 opacity-0 transition-opacity group-hover:opacity-100"></div>
        </div>
      </div>
    </section>
  );
}
