import LmsContentHub from "@/src/components/admin/LmsContentHub";

export default function AdminContentPage() {
  return (
    <div className="space-y-6">
      <header className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-cyan-200/90">LMS CMS</p>
        <h1 className="mt-2 text-2xl font-semibold text-white sm:text-3xl">Unified Content Hub</h1>
        <p className="mt-2 max-w-3xl text-sm text-slate-300 sm:text-base">
          Create and publish lesson notes, CBSE PDFs, and courses for every subject/class route from one reusable system.
        </p>
      </header>

      <LmsContentHub />
    </div>
  );
}
