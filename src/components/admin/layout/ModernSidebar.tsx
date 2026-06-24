"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ENGINES_LIST, iconMap } from "@/src/constants/engines";
import { LayoutDashboard, ChevronLeft, ChevronRight, Menu, X, Rocket, Sparkles } from "lucide-react";
import type { AppRole } from "@/lib/rbac";

type SidebarProps = {
  role: AppRole;
};

export default function ModernSidebar({ role }: SidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Group engines by category, filter by role
  const allowedEngines = ENGINES_LIST.filter(
    (e) => !e.roleRestriction || e.roleRestriction.includes(role)
  );

  const categories = Array.from(new Set(allowedEngines.map((e) => e.category)));

  const SidebarContent = () => (
    <>
      <div className="flex items-center justify-between px-4 py-6">
        <Link href="/admin" className="flex items-center gap-3" onClick={() => setMobileOpen(false)}>
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-indigo-500 shadow-lg shadow-cyan-500/20">
            <Rocket className="h-5 w-5 text-white" />
          </div>
          {!collapsed && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col">
              <span className="text-sm font-bold tracking-wide text-white">PYTHON ARENA</span>
              <span className="text-[10px] uppercase tracking-widest text-cyan-400">Admin Console</span>
            </motion.div>
          )}
        </Link>
        {/* Desktop Collapse Toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hidden lg:flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white transition"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-3 pb-6 custom-scrollbar">
        {/* Main Dashboard Link */}
        <div className="mb-6">
          <Link
            href="/admin"
            onClick={() => setMobileOpen(false)}
            className={[
              "group flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all duration-200",
              pathname === "/admin"
                ? "bg-cyan-500/15 text-cyan-300"
                : "text-slate-400 hover:bg-white/5 hover:text-white"
            ].join(" ")}
          >
            <LayoutDashboard className={`shrink-0 ${collapsed ? "h-5 w-5 mx-auto" : "h-5 w-5"}`} />
            {!collapsed && <span className="text-sm font-medium">Dashboard</span>}
          </Link>
        </div>

        {/* Categories */}
        <div className="space-y-8">
          {categories.map((category) => {
            const categoryEngines = allowedEngines.filter((e) => e.category === category);
            if (categoryEngines.length === 0) return null;

            return (
              <div key={category}>
                {!collapsed ? (
                  <p className="mb-3 px-3 text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500">
                    {category}
                  </p>
                ) : (
                  <div className="mb-3 flex justify-center border-b border-white/5 pb-2">
                    <div className="h-1 w-4 rounded-full bg-white/10" />
                  </div>
                )}

                <div className="space-y-1">
                  {categoryEngines.map((engine) => {
                    const active = pathname === engine.href || pathname.startsWith(`${engine.href}/`);
                    const Icon = iconMap[engine.iconName] || Sparkles;

                    return (
                      <Link
                        key={engine.href}
                        href={engine.href}
                        onClick={() => setMobileOpen(false)}
                        target={engine.external ? "_blank" : undefined}
                        className={[
                          "group flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all duration-200 relative",
                          active
                            ? "bg-indigo-500/15 text-indigo-300"
                            : "text-slate-400 hover:bg-white/5 hover:text-white"
                        ].join(" ")}
                      >
                        {active && (
                          <motion.div
                            layoutId="activeNavIndicator"
                            className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-indigo-400"
                          />
                        )}
                        <Icon className={`shrink-0 ${collapsed ? "h-5 w-5 mx-auto" : "h-5 w-5"}`} />
                        {!collapsed && (
                          <span className="text-sm font-medium truncate">{engine.title}</span>
                        )}
                        {/* Tooltip for collapsed state */}
                        {collapsed && (
                          <div className="absolute left-14 hidden rounded-md bg-slate-800 px-2 py-1 text-xs text-white group-hover:block z-50 whitespace-nowrap border border-white/10 shadow-xl">
                            {engine.title}
                          </div>
                        )}
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile Toggle Button */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-cyan-600 text-white shadow-xl shadow-cyan-600/30"
      >
        <Menu className="h-6 w-6" />
      </button>

      {/* Desktop Sidebar */}
      <motion.aside
        animate={{ width: collapsed ? 80 : 280 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="hidden lg:flex h-screen shrink-0 flex-col border-r border-white/5 bg-slate-950/50 backdrop-blur-xl sticky top-0"
      >
        <SidebarContent />
      </motion.aside>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm lg:hidden"
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", bounce: 0, duration: 0.4 }}
              className="fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-white/10 bg-slate-950 shadow-2xl lg:hidden"
            >
              <div className="absolute right-4 top-4">
                <button
                  onClick={() => setMobileOpen(false)}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <SidebarContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
