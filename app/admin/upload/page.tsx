"use client";

import { BookOpen, Cloud, FileUp, ImageIcon, Sparkles, ListRestart } from "lucide-react";
import { useRouter } from "next/navigation";
import AdminLessonUploadForm from "@/src/components/admin/AdminLessonUploadForm";
import EnginePageLayout from "@/src/components/admin/EnginePageLayout";

export default function AdminUploadPage() {
  const router = useRouter();

  return (
    <EnginePageLayout
      title="Upload & Ingest Lesson"
      category="AI Generators"
      description="Upload textbook PDFs and generate vector index embeddings for AI-assisted teaching and quiz creation."
      quickActions={[
        {
          label: "View Lesson Manager",
          onClick: () => router.push("/admin/lessons"),
          icon: BookOpen
        }
      ]}
    >
      <div className="space-y-6">
        <section className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
          <article className="overflow-hidden rounded-[28px] border border-white/10 bg-[linear-gradient(135deg,rgba(8,47,73,0.95),rgba(2,6,23,0.98)_55%,rgba(15,23,42,0.98))] p-6 shadow-[0_24px_80px_rgba(8,47,73,0.35)] sm:p-7">
            <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-cyan-200/90">Admin Upload</p>
            <h1 className="mt-3 max-w-2xl text-3xl font-semibold leading-tight text-white sm:text-4xl">
              Publish a complete lesson with PDF, thumbnail, and LMS metadata in one place.
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-slate-300 sm:text-base">
              This workflow uploads assets to Cloudinary, saves the lesson in MongoDB, and redirects you straight to the published lesson page.
            </p>

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              {[
                { label: "Assets", value: "PDF + thumbnail", icon: Cloud },
                { label: "Validation", value: "Zod-safe", icon: Sparkles },
                { label: "Routing", value: "Auto redirect", icon: FileUp },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.label} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-xs uppercase tracking-[0.22em] text-slate-400">{item.label}</p>
                      <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-black/20 text-cyan-100">
                        <Icon className="h-4 w-4" />
                      </span>
                    </div>
                    <p className="mt-4 text-sm font-semibold text-white">{item.value}</p>
                  </div>
                );
              })}
            </div>
          </article>

          <aside className="grid gap-4 sm:grid-cols-3 xl:grid-cols-1">
            <div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-5">
              <div className="flex items-center gap-3 text-white">
                <FileUp className="h-5 w-5 text-cyan-200" />
                <p className="font-medium">PDF upload</p>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-slate-400">Send the lesson PDF to Cloudinary before the lesson is written to MongoDB.</p>
            </div>
            <div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-5">
              <div className="flex items-center gap-3 text-white">
                <ImageIcon className="h-5 w-5 text-emerald-200" />
                <p className="font-medium">Thumbnail upload</p>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-slate-400">Attach a visual preview for the lesson card and viewer header.</p>
            </div>
            <div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-5">
              <div className="flex items-center gap-3 text-white">
                <BookOpen className="h-5 w-5 text-fuchsia-200" />
                <p className="font-medium">Lesson publish</p>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-slate-400">The lesson slug is generated automatically from the title after saving.</p>
            </div>
          </aside>
        </section>

        <AdminLessonUploadForm />
      </div>
    </EnginePageLayout>
  );
}
