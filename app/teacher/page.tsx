import { requireRolePage } from "@/lib/rbac";

export default async function TeacherPanelPage() {
  await requireRolePage(["teacher", "admin"]);

  return (
    <main className="min-h-screen bg-black px-4 py-10 text-white sm:px-6 lg:px-10">
      <div className="mx-auto max-w-5xl rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur sm:p-8">
        <h1 className="text-3xl font-bold">Teacher Panel</h1>
        <p className="mt-2 text-slate-300">Upload lessons, manage quizzes, and monitor assigned students.</p>

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <a className="rounded-2xl border border-white/10 bg-black/30 p-4 hover:bg-black/40" href="/admin/lessons">Manage Lessons</a>
          <a className="rounded-2xl border border-white/10 bg-black/30 p-4 hover:bg-black/40" href="/admin/quizzes">Manage Quizzes</a>
          <a className="rounded-2xl border border-white/10 bg-black/30 p-4 hover:bg-black/40" href="/admin/users">Monitor Students</a>
        </div>
      </div>
    </main>
  );
}
