"use client";

import Link from "next/link";
import { motion } from "framer-motion";

export default function NavBar() {
  return (
    <motion.nav
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="fixed left-0 right-0 top-0 z-50 flex items-center justify-between border-b border-[rgba(255,255,255,0.06)] bg-[rgba(7,7,7,0.88)] px-6 py-4 backdrop-blur-md sm:px-10 lg:px-16"
    >
      <Link
        href="/"
        className="font-mono text-[10px] uppercase tracking-[0.32em] text-ink-50 transition-colors hover:text-neon"
      >
        Python · XI
      </Link>

      <div className="flex items-center gap-6 sm:gap-8">
        <a
          href="#chapters"
          className="hidden font-mono text-[10px] uppercase tracking-[0.22em] text-ink-300 transition-colors hover:text-ink-50 sm:block"
        >
          Chapters
        </a>
        <Link
          href="/class-xi/chapter-2"
          className="hidden font-mono text-[10px] uppercase tracking-[0.22em] text-ink-300 transition-colors hover:text-ink-50 sm:block"
        >
          Start
        </Link>
        <Link
          href="/class-xi/chapter-2"
          className="border border-neon px-4 py-2 font-mono text-[10px] uppercase tracking-[0.22em] text-neon transition-all duration-200 hover:bg-neon hover:text-ink-950"
        >
          Open App
        </Link>
      </div>
    </motion.nav>
  );
}
