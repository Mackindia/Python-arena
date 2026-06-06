import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Educational AI · Python Arena",
  description: "Multi-book knowledge engine for notes, MCQs, question banks, worksheets, and grounded educational search.",
};

export default function EducationalAIPage() {
  const cards = [
    {
      href: "/educational-ai/search",
      title: "Knowledge Search",
      desc: "Find relevant chapter context by class, subject, and topic.",
    },
    {
      href: "/educational-ai/notes",
      title: "Generate Notes",
      desc: "Create structured lesson notes from retrieved textbook context.",
    },
    {
      href: "/educational-ai/mcq",
      title: "Generate MCQs",
      desc: "Build validated objective questions with explanations.",
    },
    {
      href: "/educational-ai/question-bank",
      title: "Question Bank",
      desc: "Generate and organize broad assessment pools by type.",
    },
    {
      href: "/educational-ai/worksheet",
      title: "Worksheet",
      desc: "Produce printable classroom worksheets in one click.",
    },
    {
      href: "/educational-ai/library",
      title: "Book Library",
      desc: "View indexed books, metadata, and registry status.",
    },
    {
      href: "/educational-ai/upload",
      title: "Upload Books",
      desc: "Upload and index textbooks into FAISS knowledge base.",
    },
  ];

  return (
    <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {cards.map((card) => (
        <Link
          key={card.href}
          href={card.href}
          className="rounded-3xl border border-white/10 bg-slate-900/70 p-5 transition hover:border-cyan-400/40 hover:bg-slate-900"
        >
          <h2 className="text-lg font-semibold text-white">{card.title}</h2>
          <p className="mt-2 text-sm text-slate-400">{card.desc}</p>
        </Link>
      ))}
    </section>
  );
}
