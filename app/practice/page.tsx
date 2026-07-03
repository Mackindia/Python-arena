import Link from "next/link";
import type { Metadata } from "next";
import { connectDB } from "@/lib/mongodb";
import SubjectModel from "@/models/lms/Subject";
import ClassModel from "@/models/lms/Class";
import PracticeResourceModel from "@/models/practice/PracticeResource";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Practice Question Paper | Python Arena",
  description: "Browse class-wise practice question papers and downloadable PDF resources.",
  alternates: { canonical: "/practice" },
};

type SubjectCard = {
  subjectSlug: string;
  subjectName: string;
  classCount: number;
  resourceCount: number;
};

async function getSubjectCards(): Promise<SubjectCard[]> {
  await connectDB();

  const subjects = await SubjectModel.find({}).select("_id name slug").sort({ name: 1 }).lean();

  const cards = await Promise.all(
    subjects.map(async (s) => {
      const subject = s as { _id: unknown; name?: string; slug?: string };
      const classes = await ClassModel.find({ subject: subject._id }).select("_id").lean();
      const classIds = classes.map((item) => String((item as { _id: unknown })._id));

      const resourceCount = classIds.length
        ? await PracticeResourceModel.countDocuments({
            subject: subject._id,
            class: { $in: classIds },
            published: true,
          })
        : 0;

      return {
        subjectSlug: subject.slug || "",
        subjectName: subject.name || "Untitled Subject",
        classCount: classIds.length,
        resourceCount,
      };
    }),
  );

  return cards.filter((item) => item.subjectSlug);
}

export default async function PracticePage() {
  const cards = await getSubjectCards();

  return (
    <main className="min-h-screen bg-black px-4 py-14 text-white sm:px-6 lg:px-10">
      <div className="mx-auto max-w-6xl">
        <Link href="/" className="text-sm text-cyan-300 hover:text-cyan-200">
          Back to homepage
        </Link>

        <h1 className="mt-4 text-3xl font-bold sm:text-4xl">Practice Question Paper</h1>
        <p className="mt-3 text-slate-300">Select a subject to explore class-wise question papers and important PDFs.</p>

        <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {cards.length === 0 ? (
            <div className="col-span-full rounded-2xl border border-white/10 bg-slate-950 p-8 text-center text-slate-400">
              No practice resources are published yet.
            </div>
          ) : (
            cards.map((card) => (
              <Link
                key={card.subjectSlug}
                href={`/practice/${card.subjectSlug}`}
                className="rounded-2xl border border-cyan-400/20 bg-slate-950 p-5 transition hover:border-cyan-300/40 hover:bg-slate-900"
              >
                <h2 className="text-xl font-semibold text-cyan-200">{card.subjectName}</h2>
                <p className="mt-2 text-sm text-slate-300">{card.classCount} classes configured</p>
                <p className="mt-1 text-sm text-slate-400">{card.resourceCount} published resources</p>
              </Link>
            ))
          )}
        </div>
      </div>
    </main>
  );
}
