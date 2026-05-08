"use client"

import { useState } from "react"
import type { LucideIcon } from "lucide-react"
import { AnimatePresence, motion } from "framer-motion"
import { ChevronDown, Menu, Sparkles, X } from "lucide-react"
import GlassCard from "@/src/components/ui/GlassCard"
import type { LearnMenu, NavLink } from "@/src/types/navigation"

type NavbarProps = {
  brandName: string
  brandHref?: string
  brandIcon?: LucideIcon
  links: NavLink[]
  learnMenu: LearnMenu
}

export default function Navbar({
  brandName,
  brandHref = "#top",
  brandIcon: BrandIcon = Sparkles,
  links,
  learnMenu,
}: NavbarProps) {
  const [isLearnOpen, setIsLearnOpen] = useState(false)
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const [isMobileLearnOpen, setIsMobileLearnOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 px-4 py-4 sm:px-6 lg:px-10">
      <GlassCard className="mx-auto max-w-7xl px-4 py-3 sm:px-6">
        <div className="flex items-center justify-between">
          <a href={brandHref} className="flex items-center gap-2 text-white">
            <BrandIcon className="h-5 w-5 text-cyan-300" />
            <span className="text-sm font-bold tracking-[0.2em] text-cyan-200">{brandName}</span>
          </a>

          <nav className="hidden items-center gap-7 md:flex">
            <div className="relative">
              <button
                onClick={() => setIsLearnOpen((prev) => !prev)}
                className="flex items-center gap-1 text-sm font-medium text-slate-200 transition hover:text-cyan-300"
              >
                Learn
                <ChevronDown className={`h-4 w-4 transition ${isLearnOpen ? "rotate-180" : ""}`} />
              </button>

              <AnimatePresence>
                {isLearnOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 12 }}
                    transition={{ duration: 0.2 }}
                    className="absolute left-0 top-10 w-[760px]"
                  >
                    <GlassCard className="p-6">
                      <div className="grid grid-cols-2 gap-5 lg:grid-cols-4">
                        {learnMenu.map((group) => (
                          <div key={group.title}>
                            <p className="mb-2 text-sm font-semibold text-cyan-200">{group.title}</p>
                            <ul className="space-y-1.5">
                              {group.items.map((item) => (
                                <li key={item}>
                                  <a
                                    href="#"
                                    className="text-sm text-slate-300 transition hover:text-white"
                                    onClick={(event) => event.preventDefault()}
                                  >
                                    {item}
                                  </a>
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    </GlassCard>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {links.map((item) => (
              <a key={item.label} href={item.href} className="text-sm font-medium text-slate-200 transition hover:text-cyan-300">
                {item.label}
              </a>
            ))}
          </nav>

          <button
            onClick={() => setIsMobileOpen((prev) => !prev)}
            className="rounded-lg border border-white/15 p-2 text-slate-100 md:hidden"
            aria-label="Toggle menu"
          >
            {isMobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        <AnimatePresence>
          {isMobileOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-3 overflow-hidden md:hidden"
            >
              <div className="space-y-3 border-t border-white/10 pt-4">
                <button
                  onClick={() => setIsMobileLearnOpen((prev) => !prev)}
                  className="flex w-full items-center justify-between text-sm font-medium text-slate-200"
                >
                  Learn
                  <ChevronDown className={`h-4 w-4 transition ${isMobileLearnOpen ? "rotate-180" : ""}`} />
                </button>

                <AnimatePresence>
                  {isMobileLearnOpen && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-2 pl-2">
                      {learnMenu.map((group) => (
                        <div key={group.title}>
                          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-cyan-200">{group.title}</p>
                          <ul className="space-y-1">
                            {group.items.map((item) => (
                              <li key={item} className="text-sm text-slate-300">
                                {item}
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>

                {links.map((item) => (
                  <a key={item.label} href={item.href} className="block text-sm text-slate-200">
                    {item.label}
                  </a>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </GlassCard>
    </header>
  )
}
