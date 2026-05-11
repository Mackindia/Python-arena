import Link from "next/link";
import type { ChapterItem } from "@/src/data/courses";

type SidebarProps = {
  activeItem?: string;
  basePath?: string;
  chapters?: ChapterItem[];
  activeChapterSlug?: string;
};

const items = ["Chapters", "Notes", "MCQs", "Assignments", "Practice"];

export default function Sidebar({ activeItem = "Chapters", basePath = "", chapters = [], activeChapterSlug }: SidebarProps) {
  return (
    <aside className="rounded-2xl border border-cyan-400/20 bg-slate-950 p-4 shadow-[0_10px_30px_rgba(0,0,0,0.45)] lg:sticky lg:top-24">
      <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-200">Course Menu</p>
      <ul className="space-y-1">
        {items.map((item) => (
          <li key={item}>
            <button
              type="button"
              className={`w-full rounded-lg px-3 py-2 text-left text-sm transition ${
                item === activeItem ? "bg-cyan-400/20 text-cyan-100" : "text-slate-200 hover:bg-slate-900"
              }`}
            >
              {item}
            </button>
          </li>
        ))}
      </ul>

      {chapters.length ? (
        <div className="mt-5 border-t border-white/10 pt-4">
          <p className="mb-2 text-xs uppercase tracking-[0.16em] text-slate-300">Chapters</p>
          <ul className="space-y-1.5">
            {chapters.map((chapter) => (
              <li key={chapter.slug}>
                <Link
                  href={`${basePath}/${chapter.slug}`}
                  className={`block rounded-lg px-3 py-2 text-sm transition ${
                    activeChapterSlug === chapter.slug
                      ? "bg-cyan-400/20 text-cyan-100"
                      : "text-slate-200 hover:bg-slate-900"
                  }`}
                >
                  {chapter.title}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </aside>
  );
}
