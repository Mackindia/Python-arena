"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { chapters } from "@/lib/content";

export default function ChapterPreviewSection() {
  return (
    <section id="chapters" className="px-6 py-24 sm:px-10 lg:px-16">
      <div className="mx-auto w-full max-w-6xl">
        {/* Section header */}
        <div className="mb-12 flex items-end justify-between border-b border-[rgba(255,255,255,0.08)] pb-6">
          <div>
            <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.28em] text-neon">
              03 / Chapters
            </p>
            <h2 className="font-heading text-3xl font-bold text-ink-50 sm:text-4xl">
              Chapter Previews
            </h2>
          </div>
          <p className="hidden max-w-xs text-right text-sm text-ink-300 md:block">
            Begin from any chapter with structured notes, examples, and guided practice.
          </p>
        </div>

        {/* Chapter grid */}
        <div
          className="grid md:grid-cols-2 lg:grid-cols-3"
          style={{ gap: "1px", background: "rgba(255,255,255,0.07)" }}
        >
          {chapters.map((chapter, idx) => (
            <motion.article
              key={chapter.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.15 }}
              transition={{ duration: 0.5, delay: idx * 0.06 }}
              className="group relative bg-ink-900 p-8 transition-colors duration-300 hover:bg-ink-800"
            >
              <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-ink-400">
                {String(idx + 1).padStart(2, "0")}
              </p>
              <h3 className="mt-4 font-heading text-lg font-semibold text-ink-50">
                {chapter.title}
              </h3>
              <p className="mt-3 min-h-12 text-sm leading-relaxed text-ink-300">
                {chapter.description}
              </p>
              {chapter.available ? (
                <Link
                  href={chapter.href}
                  className="mt-6 inline-flex items-center gap-2 font-mono text-[10px] font-semibold uppercase tracking-[0.22em] text-neon transition-all duration-200 hover:gap-3"
                >
                  Open Chapter <span>→</span>
                </Link>
              ) : (
                <span className="mt-6 inline-flex items-center gap-2 font-mono text-[10px] font-semibold uppercase tracking-[0.22em] text-ink-500">
                  Coming Soon
                </span>
              )}
              {/* Neon underline on hover */}
              <div className="absolute bottom-0 left-0 h-[1px] w-0 bg-neon transition-all duration-500 group-hover:w-full" />
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}
