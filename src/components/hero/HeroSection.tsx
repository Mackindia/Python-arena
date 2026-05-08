"use client"

import { motion } from "framer-motion"
import { ArrowRight, Sparkles } from "lucide-react"
import FloatingCodeCards from "@/src/components/hero/FloatingCodeCards"

type HeroSectionProps = {
  title: string
  subtitle: string
  primaryCta: {
    label: string
    href: string
  }
  secondaryCta: {
    label: string
    href: string
  }
  badge?: string
}

export default function HeroSection({
  title,
  subtitle,
  primaryCta,
  secondaryCta,
  badge = "Futuristic Learning Platform",
}: HeroSectionProps) {
  return (
    <section id="top" className="relative overflow-hidden px-4 pb-28 pt-10 sm:px-6 lg:px-10">
      <div className="pointer-events-none absolute inset-0">
        <motion.div
          className="absolute -left-14 top-20 h-72 w-72 rounded-full bg-cyan-500/20 blur-[80px]"
          animate={{ x: [0, 40, 0], y: [0, 20, 0], scale: [1, 1.06, 1] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute right-0 top-10 h-96 w-96 rounded-full bg-indigo-500/20 blur-[100px]"
          animate={{ x: [0, -32, 0], y: [0, -26, 0], scale: [1, 0.96, 1] }}
          transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      <div className="relative mx-auto max-w-7xl">
        <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-slate-900/40 px-6 py-16 backdrop-blur-xl md:px-14 md:py-20">
          <FloatingCodeCards />

          <motion.span
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            className="mb-6 inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-300/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-cyan-200"
          >
            <Sparkles className="h-4 w-4" />
            {badge}
          </motion.span>

          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="max-w-4xl text-4xl font-black leading-tight text-white sm:text-5xl lg:text-6xl"
          >
            {title}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-6 max-w-2xl text-base leading-relaxed text-slate-300 sm:text-lg"
          >
            {subtitle}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-9 flex flex-wrap gap-4"
          >
            <a
              href={primaryCta.href}
              className="inline-flex items-center gap-2 rounded-xl bg-cyan-400 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300"
            >
              {primaryCta.label}
              <ArrowRight className="h-4 w-4" />
            </a>
            <a
              href={secondaryCta.href}
              className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/5 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              {secondaryCta.label}
            </a>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
