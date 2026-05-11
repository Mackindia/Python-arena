import Link from "next/link";
import LmsLessonManager from "@/src/components/admin/LmsLessonManager";

export default function AdminLessonsPage() {
  return (
    <div className="space-y-6">
      <header className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-cyan-200/90">LMS CMS</p>
            <h1 className="mt-2 text-2xl font-semibold text-white sm:text-3xl">Admin Lesson Management</h1>
            <p className="mt-2 max-w-3xl text-sm text-slate-300 sm:text-base">
              Manage uploaded LMS lessons with search, filters, publish controls, safe Cloudinary-backed deletion, and quick access to metadata editing.
            </p>
          </div>

          <Link
            href="/admin/lms"
            className="rounded-lg border border-cyan-300/30 bg-cyan-400/10 px-4 py-2 text-sm font-semibold text-cyan-100 transition hover:bg-cyan-400/20"
          >
            Upload New Lesson
          </Link>
        </div>
      </header>

      <LmsLessonManager />
    </div>
  );
}
