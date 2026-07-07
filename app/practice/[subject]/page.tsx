import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { connectDB } from "@/lib/mongodb";
import SubjectModel from "@/models/lms/Subject";
import ClassModel from "@/models/lms/Class";
import PracticeResourceModel from "@/models/practice/PracticeResource";

export const dynamic = "force-dynamic";

type Params = { subject: string };

type ClassCard = {
  classSlug: string;
  className: string;
  resourceCount: number;
};

async function getSubjectData(subjectSlug: string): Promise<{ subjectName: string; subjectSlug: string; classes: ClassCard[] } | null> {
  await connectDB();

  const subject = await SubjectModel.findOne({ slug: subjectSlug }).select("_id name slug").lean();
  if (!subject?._id) return null;

  const classes = await ClassModel.find({ subject: subject._id }).select("_id name slug").sort({ name: 1 }).lean();

  const classCards = await Promise.all(
    classes.map(async (c) => {
      const classDoc = c as { _id: unknown; name?: string; slug?: string };
      const resourceCount = await PracticeResourceModel.countDocuments({
        subject: subject._id,
        class: classDoc._id,
        published: true,
      });

      return {
        classSlug: classDoc.slug || "",
        className: classDoc.name || "Unnamed Class",
        resourceCount,
      };
    }),
  );

  return {
    subjectName: String((subject as { name?: string }).name || "Subject"),
    subjectSlug: String((subject as { slug?: string }).slug || subjectSlug),
    classes: classCards.filter((item) => item.classSlug),
  };
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { subject } = await params;
  const data = await getSubjectData(subject);

  return {
    title: `${data?.subjectName || "Subject"} Practice Question Papers`,
    description: "Browse class-wise practice question papers and downloadable resources.",
    alternates: { canonical: `/practice/${subject}` },
  };
}

export default async function PracticeSubjectPage({ params }: { params: Promise<Params> }) {
  const { subject } = await params;
  const data = await getSubjectData(subject);

  if (!data) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-black px-4 py-14 text-white sm:px-6 lg:px-10">
      <div className="mx-auto max-w-6xl">
        <nav className="flex items-center gap-2 text-sm text-slate-400">
          <Link href="/practice" className="hover:text-cyan-300">Practice Question Paper</Link>
          <span>/</span>
          <span className="text-slate-200">{data.subjectName}</span>
        </nav>

        <h1 className="mt-6 text-3xl font-bold sm:text-4xl">{data.subjectName}</h1>
        <p className="mt-2 text-slate-300">Select a class to open question papers and printable PDFs.</p>

        <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {data.classes.length === 0 ? (
            <div className="col-span-full rounded-2xl border border-white/10 bg-slate-950 p-8 text-center text-slate-400">
              No classes available for this subject.
            </div>
          ) : (
            data.classes.map((item) => (
              <Link
                key={item.classSlug}
                href={`/practice/${data.subjectSlug}/${item.classSlug}`}
                className="rounded-2xl border border-cyan-400/20 bg-slate-950 p-5 transition hover:border-cyan-300/40 hover:bg-slate-900"
              >
                <h2 className="text-xl font-semibold text-cyan-200">{item.className}</h2>
                <p className="mt-2 text-sm text-slate-300">{item.resourceCount} published resources</p>
              </Link>
            ))
          )}
        </div>
      </div>
    </main>
  );
}
