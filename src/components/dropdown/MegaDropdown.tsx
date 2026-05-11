"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import type { LearnCategory } from "@/src/data/navigation";

type MegaDropdownProps = {
  categories: LearnCategory[];
  onItemClick?: () => void;
};

function ClassRow({ item, onItemClick }: { item: LearnCategory["items"][number]; onItemClick?: () => void }) {
  const isClassEntry = "subItems" in item;

  if (!isClassEntry) {
    return (
      <li>
        <Link
          href={item.href}
          onClick={onItemClick}
          className="block rounded-lg px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 hover:text-slate-900"
        >
          {item.label}
        </Link>
      </li>
    );
  }

  if (!item.subItems?.length) {
    return (
      <li>
        <Link
          href={item.href}
          onClick={onItemClick}
          className="block rounded-lg px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 hover:text-slate-900"
        >
          {item.label}
        </Link>
      </li>
    );
  }

  return (
    <li>
      <div className="flex items-center gap-1 rounded-lg px-3 py-1.5">
        <span className="flex-1 text-sm font-semibold text-slate-800">{item.label}</span>
      </div>
      <div className="ml-3 mt-0.5 flex flex-wrap gap-1.5 border-l border-slate-200 pl-3">
        {item.subItems.map((sub) => (
          <Link
            key={sub.href}
            href={sub.href}
            onClick={onItemClick}
            className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-xs font-medium text-slate-600 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
          >
            {sub.label === "CBSE PDF" && (
              <svg className="h-3 w-3 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            )}
            {sub.label}
          </Link>
        ))}
      </div>
    </li>
  );
}

export default function MegaDropdown({ categories, onItemClick }: MegaDropdownProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      transition={{ duration: 0.15, ease: "easeOut" }}
      className="absolute left-1/2 top-full z-50 mt-3 w-[min(92vw,56rem)] -translate-x-1/2"
    >
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-xl sm:p-7">
        <div className="grid max-h-[70vh] grid-cols-1 gap-6 overflow-y-auto pr-1 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((category) => (
            <div key={category.id}>
              <h4 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-900">
                {category.title}
              </h4>
              <ul className="space-y-2">
                {category.items.map((item) => (
                  <ClassRow key={item.href} item={item} onItemClick={onItemClick} />
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
