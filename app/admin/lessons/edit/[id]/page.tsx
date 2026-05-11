import LmsLessonEditForm from "@/src/components/admin/LmsLessonEditForm";

type EditLessonPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function EditLessonPage({ params }: EditLessonPageProps) {
  const { id } = await params;

  return (
    <div className="space-y-5">
      <header className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-cyan-200/90">LMS CMS</p>
        <h1 className="mt-2 text-2xl font-semibold text-white sm:text-3xl">Edit Lesson Metadata</h1>
        <p className="mt-2 text-sm text-slate-300 sm:text-base">
          Update lesson title, slug, subject/class mapping, publish state, and metadata without changing the stable PDF rendering workflow.
        </p>
      </header>

      <LmsLessonEditForm lessonId={id} />
    </div>
  );
}
