"use client";

import { useMemo } from "react";

export default function Sidebar({ topics }) {
  const navItems = useMemo(() => topics, [topics]);

  return (
    <aside className="top-24 h-fit rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-sm backdrop-blur lg:sticky">
      <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">Topics</p>
      <nav>
        <ul className="space-y-1">
          {navItems.map((topic) => (
            <li key={topic.id}>
              <a
                href={`#${topic.id}`}
                className="block rounded-lg px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-brand-50 hover:text-brand-700"
              >
                {topic.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}
