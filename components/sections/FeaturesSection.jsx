"use client";

import { motion } from "framer-motion";
import { features } from "@/lib/content";

const icons = {
  notes: (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M7 4h10a2 2 0 0 1 2 2v12l-3-2-3 2-3-2-3 2V6a2 2 0 0 1 2-2Z" />
      <path d="M9 8h6M9 11h6" />
    </svg>
  ),
  code: (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="m8 9-3 3 3 3M16 9l3 3-3 3M13 6l-2 12" />
    </svg>
  ),
  ai: (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M12 3v3M5.64 5.64l2.12 2.12M3 12h3M5.64 18.36l2.12-2.12M12 18v3M18.36 18.36l-2.12-2.12M18 12h3M18.36 5.64l-2.12 2.12" />
      <circle cx="12" cy="12" r="4" />
    </svg>
  ),
  quiz: (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M9.5 9a2.5 2.5 0 1 1 3.6 2.24c-.9.45-1.6 1.06-1.6 2.26" />
      <circle cx="12" cy="17" r=".8" fill="currentColor" stroke="none" />
      <rect x="3" y="3" width="18" height="18" rx="3" />
    </svg>
  ),
};

export default function FeaturesSection() {
  return (
    <section className="px-6 py-24 sm:px-10 lg:px-16">
      <div className="mx-auto w-full max-w-6xl">
        {/* Section header */}
        <div className="mb-12 flex items-end justify-between border-b border-[rgba(255,255,255,0.08)] pb-6">
          <div>
            <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.28em] text-neon">
              02 / Features
            </p>
            <h2 className="font-heading text-3xl font-bold text-ink-50 sm:text-4xl">
              Powerful Learning Tools
            </h2>
          </div>
          <p className="hidden max-w-xs text-right text-sm text-ink-300 md:block">
            Everything needed to master Python concepts and practice with confidence.
          </p>
        </div>

        {/* Card grid with gap lines */}
        <div
          className="grid sm:grid-cols-2 lg:grid-cols-4"
          style={{ gap: "1px", background: "rgba(255,255,255,0.07)" }}
        >
          {features.map((feature, idx) => (
            <motion.article
              key={feature.title}
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: idx * 0.07 }}
              className="group relative bg-ink-900 p-8 transition-colors duration-300 hover:bg-ink-800"
            >
              <div className="mb-6 text-neon">{icons[feature.icon]}</div>
              <h3 className="font-heading text-sm font-semibold uppercase tracking-widest text-ink-50">
                {feature.title}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-ink-300">{feature.description}</p>
              {/* Neon underline on hover */}
              <div className="absolute bottom-0 left-0 h-[1px] w-0 bg-neon transition-all duration-500 group-hover:w-full" />
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}
