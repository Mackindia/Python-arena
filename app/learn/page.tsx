import Link from "next/link";
import type { Metadata } from "next";
import SearchBar from "@/src/components/learn/SearchBar";
import { searchSuggestions } from "@/src/constants/search";
import { connectDB } from "@/lib/mongodb";
import Subject from "@/src/models/lms/Subject";
import ClassModel from "@/src/models/lms/Class";

export const metadata: Metadata = {
  title: "Learning Tracks | Python Arena",
  description: "Explore AI, Python and Computer Science tracks by class.",
  alternates: { canonical: "/learn" },
};

type SubjectCard = {
  subject: string;
  subjectName: string;
  classes: { slug: string; name: string }[];
};

async function getSubjectCards(): Promise<SubjectCard[]> {
  try {
    await connectDB();
    const subjects = await Subject.find({}).select("_id name slug").sort({ name: 1 }).lean();

    const cards = await Promise.all(
      subjects.map(async (s) => {
        const subjectDoc = s as { _id: unknown; name?: string; slug?: string };
        const classes = await ClassModel.find({ subject: subjectDoc._id })
          .select("name slug")
          .sort({ name: 1 })
          .lean();
        return {
          subject: subjectDoc.slug ?? "",
          subjectName: subjectDoc.name ?? "",
          classes: classes.map((c) => {
            const cls = c as { name?: string; slug?: string };
            return { slug: cls.slug ?? "", name: cls.name ?? "" };
          }),
        };
      }),
    );

    return cards;
  } catch {
    return [];
  }
}

export default async function LearnPage() {
  const cards = await getSubjectCards();

  return (
    <main className="min-h-screen bg-black px-4 py-14 text-white sm:px-6 lg:px-10">
      <div className="mx-auto max-w-6xl">
        <Link href="/" className="text-sm text-cyan-300 hover:text-cyan-200">
          Back to homepage
        </Link>

        <h1 className="mt-4 text-3xl font-bold sm:text-4xl">Explore Learning Tracks</h1>
        <p className="mt-3 text-slate-300">Browse available subjects and class-wise content.</p>

        <div className="mt-6">
          <SearchBar placeholders={searchSuggestions} />
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {cards.length === 0 ? (
            <div className="col-span-full rounded-2xl border border-white/10 bg-slate-950 p-8 text-center text-slate-400">
              No subjects found. Add subjects and classes from the admin panel.
            </div>
          ) : (
            cards.map((card) => (
              <section
                key={card.subject}
                className="rounded-2xl border border-cyan-400/20 bg-slate-950 p-5 shadow-[0_10px_30px_rgba(0,0,0,0.45)]"
              >
                <h2 className="text-xl font-semibold text-cyan-200">{card.subjectName}</h2>
                <ul className="mt-4 space-y-2 text-sm text-slate-200">
                  {card.classes.length ? (
                    card.classes.map((cls) => (
                      <li key={`${card.subject}-${cls.slug}`}>
                        <Link
                          href={`/learn/${card.subject}/${cls.slug}`}
                          className="rounded-md px-2 py-1 transition hover:bg-white/10 hover:text-white"
                        >
                          {cls.name}
                        </Link>
                      </li>
                    ))
                  ) : (
                    <li className="px-2 text-slate-400">No classes yet.</li>
                  )}
                </ul>
              </section>
            ))
          )}
        </div>
      </div>
    </main>
  );
}
