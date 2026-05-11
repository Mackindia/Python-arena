import Link from "next/link";
import ClassCard from "./ClassCard";

type ClassCardData = {
  slug: string;
  name: string;
};

type SubjectOverviewLayoutProps = {
  subject: {
    name: string;
    slug: string;
    description: string;
  };
  classes: ClassCardData[];
};

export default function SubjectOverviewLayout({ subject, classes }: SubjectOverviewLayoutProps) {
  return (
    <main className="min-h-screen bg-slate-950 px-4 py-10 text-white sm:px-6 lg:px-10">
      <div className="mx-auto max-w-6xl">
        <Link href="/lms" className="text-sm text-cyan-300 transition hover:text-cyan-200">
          ← Back to subjects
        </Link>

        <header className="mt-8 space-y-4 rounded-3xl border border-white/10 bg-slate-900/85 p-8 shadow-[0_16px_60px_rgba(2,6,23,0.45)]">
          <h1 className="text-4xl font-bold leading-tight text-white sm:text-5xl">{subject.name}</h1>
          {subject.description && (
            <p className="max-w-2xl text-base leading-relaxed text-slate-300 sm:text-lg">{subject.description}</p>
          )}
          <div className="flex items-center gap-2 pt-2">
            <span className="inline-block h-2 w-2 rounded-full bg-cyan-400" />
            <p className="text-sm text-slate-400">
              {classes.length} {classes.length === 1 ? "class" : "classes"} available
            </p>
          </div>
        </header>

        <section className="mt-12">
          {classes.length > 0 ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {classes.map((classItem) => (
                <ClassCard
                  key={classItem.slug}
                  name={classItem.name}
                  subject={subject.slug}
                  classSlug={classItem.slug}
                  description="Explore lessons and materials"
                />
              ))}
            </div>
          ) : (
            <div className="rounded-3xl border border-white/10 bg-slate-900/60 p-12 text-center">
              <p className="text-slate-400">No classes available for this subject yet.</p>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
