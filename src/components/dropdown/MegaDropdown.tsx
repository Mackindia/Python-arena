"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import type { LearnCategory } from "@/src/data/navigation";

type MegaDropdownProps = {
  categories: LearnCategory[];
  onItemClick?: () => void;
};

export default function MegaDropdown({ categories, onItemClick }: MegaDropdownProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      transition={{ duration: 0.15, ease: "easeOut" }}
      className="absolute left-1/2 top-full z-50 mt-3 w-[min(92vw,48rem)] -translate-x-1/2"
    >
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-xl sm:p-7">
        <div className="grid max-h-[70vh] grid-cols-1 gap-6 overflow-y-auto pr-1 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((category) => (
            <div key={category.id}>
              <h4 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-900">
                {category.title}
              </h4>
              <ul className="space-y-1">
                {category.items.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={onItemClick}
                      className="block rounded-lg px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 hover:text-slate-900"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
