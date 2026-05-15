import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { connectDB } from "@/lib/mongodb";
import SubjectModel from "@/src/models/lms/Subject";
import ClassModel from "@/src/models/lms/Class";

type Params = { subject: string };

function formatLabel(value: string) {
  if (value.toLowerCase() === "ai") return "AI";
  return value
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

async function getSubjectWithClasses(subjectSlug: string) {
  try {
    await connectDB();

    const subject = await SubjectModel.findOne({ slug: subjectSlug })
      .select("_id name slug description")
      .lean();

    if (!subject) return null;

    const subjectDoc = subject as {
      _id: unknown;
      name?: string;
      slug?: string;
      description?: string;
    };

    const classes = await ClassModel.find({ subject: subjectDoc._id })
      .select("name slug")
      .sort({ name: 1 })
      .lean();

    return {
      name: String(subjectDoc.name || formatLabel(subjectSlug)),
      slug: String(subjectDoc.slug || subjectSlug),
      description: String(subjectDoc.description || ""),
      classes: classes.map((c) => {
        const cls = c as { name?: string; slug?: string };
        return {
          name: String(cls.name || ""),
          slug: String(cls.slug || ""),
        };
      }),
    };
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { subject } = await params;
  const data = await getSubjectWithClasses(subject);

  if (!data) {
    return {
      title: "Subject Not Found | Python Arena",
      description: "The requested subject could not be found.",
    };
  }

  return {
    title: `${data.name} | Learn | Python Arena`,
    description:
      data.description ||
      `Browse all ${data.name} classes — notes, CBSE PDFs, and courses.`,
    alternates: { canonical: `/learn/${subject}` },
  };
}

export default async function LearnSubjectPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { subject } = await params;
  const data = await getSubjectWithClasses(subject);

  if (!data) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-black px-4 py-14 text-white sm:px-6 lg:px-10">
      <div className="mx-auto max-w-6xl">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-slate-400">
          <Link href="/learn" className="transition hover:text-cyan-300">
            Learn
          </Link>
          <span>/</span>
          <span className="text-slate-200">{data.name}</span>
        </nav>

        {/* Header */}
        <h1 className="mt-6 text-3xl font-bold sm:text-4xl">{data.name}</h1>
        {data.description && (
          <p className="mt-3 max-w-2xl text-slate-300">{data.description}</p>
        )}

        {/* Classes grid */}
        <section className="mt-10">
          <h2 className="mb-5 text-lg font-semibold text-slate-200">
            Select a class to begin
          </h2>

          {data.classes.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-slate-950 p-8 text-center text-slate-400">
              No classes have been published for this subject yet.
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {data.classes.map((cls) => (
                <div
                  key={cls.slug}
                  className="overflow-hidden rounded-2xl border border-white/10 bg-slate-950"
                >
                  {/* Class label */}
                  <div className="border-b border-white/10 px-5 py-4">
                    <p className="text-base font-semibold text-white">
                      {cls.name}
                    </p>
                  </div>

                  {/* Content-type links */}
                  <div className="flex flex-col gap-1 p-3">
                    <Link
                      href={`/learn/${subject}/${cls.slug}/notes`}
                      className="rounded-lg px-4 py-2.5 text-sm text-cyan-200 transition hover:bg-cyan-400/10 hover:text-cyan-100"
                    >
                      📝 Notes
                    </Link>
                    <Link
                      href={`/learn/${subject}/${cls.slug}/cbse-pdf`}
                      className="rounded-lg px-4 py-2.5 text-sm text-indigo-200 transition hover:bg-indigo-400/10 hover:text-indigo-100"
                    >
                      📄 CBSE PDF
                    </Link>
                    <Link
                      href={`/learn/${subject}/${cls.slug}/course`}
                      className="rounded-lg px-4 py-2.5 text-sm text-emerald-200 transition hover:bg-emerald-400/10 hover:text-emerald-100"
                    >
                      🎓 Courses
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
