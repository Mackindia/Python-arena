import PracticeQuestionPaperEngine from "@/src/components/admin/PracticeQuestionPaperEngine";

export default function PracticeQuestionPapersAdminPage() {
  return (
    <div className="space-y-6">
      <header className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-cyan-200/90">Practice Engine</p>
        <h1 className="mt-2 text-2xl font-semibold text-white sm:text-3xl">Practice Question Paper Manager</h1>
        <p className="mt-2 max-w-3xl text-sm text-slate-300 sm:text-base">
          Create subjects, create classes, upload question papers and important PDFs, then publish them for students.
        </p>
      </header>

      <PracticeQuestionPaperEngine />
    </div>
  );
}
