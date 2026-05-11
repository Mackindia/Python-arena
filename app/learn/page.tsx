import Link from "next/link";
import { readdir } from "node:fs/promises";
import { join } from "node:path";
import type { Metadata } from "next";
import SearchBar from "@/src/components/learn/SearchBar";
import { searchSuggestions } from "@/src/constants/search";

export const metadata: Metadata = {
  title: "Learning Tracks | Python Arena",
  description: "Explore AI, Python and Computer Science tracks by class.",
  alternates: { canonical: "/learn" },
};

type SubjectCard = {
  subject: string;
  classes: string[];
};

function formatLabel(value: string) {
  if (value.toLowerCase() === "ai") {
    return "AI";
  }

  return value
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

async function getSubjectCards(): Promise<SubjectCard[]> {
  const baseDir = join(process.cwd(), "src", "content");
  const subjects = await readdir(baseDir, { withFileTypes: true });

  const cards = await Promise.all(
    subjects
      .filter((entry) => entry.isDirectory())
      .map(async (entry) => {
        const subjectDir = join(baseDir, entry.name);
        const classes = await readdir(subjectDir, { withFileTypes: true });
        return {
          subject: entry.name,
          classes: classes.filter((item) => item.isDirectory()).map((item) => item.name),
        };
      }),
  );

  return cards;
}

export default async function LearnPage() {
  const cards = await getSubjectCards();

  return (
    <main className="min-h-screen bg-black px-4 py-14 text-white sm:px-6 lg:px-10">
      <div className="mx-auto max-w-6xl">
        <Link href="/" className="text-sm text-cyan-300 hover:text-cyan-200">
          Back to homepage
        </Link>

        <h1 className="text-3xl font-bold sm:text-4xl">Explore Learning Tracks</h1>
        <p className="mt-3 text-slate-300">Browse available subjects and class-wise content from your content structure.</p>

        <div className="mt-6">
          <SearchBar placeholders={searchSuggestions} />
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {cards.map((card) => (
            <section key={card.subject} className="rounded-2xl border border-cyan-400/20 bg-slate-950 p-5 shadow-[0_10px_30px_rgba(0,0,0,0.45)]">
              <h2 className="text-xl font-semibold text-cyan-200">{formatLabel(card.subject)}</h2>
              <ul className="mt-4 space-y-2 text-sm text-slate-200">
                {card.classes.length ? (
                  card.classes.map((className) => (
                    <li key={`${card.subject}-${className}`}>
                      <Link href={`/learn/${card.subject}/${className}`} className="rounded-md px-2 py-1 transition hover:bg-white/10 hover:text-white">
                        {formatLabel(className)}
                      </Link>
                    </li>
                  ))
                ) : (
                  <li className="text-slate-400">No class folders yet</li>
                )}
              </ul>
            </section>
          ))}
        </div>
      </div>
    </main>
  );
}
