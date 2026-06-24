"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import { motion, AnimatePresence } from "framer-motion";
import { Star, Search, Sparkles, ArrowRight, Activity, Zap } from "lucide-react";
import { ENGINES_LIST, iconMap, type Engine } from "@/src/constants/engines";
import { useEngineStorage } from "@/src/hooks/useEngineStorage";

const CATEGORIES = [
  "All",
  "Academic Tools",
  "AI Generators",
  "Administration",
  "Analytics",
  "Communication",
  "Automation",
  "Utilities"
];

export default function EngineLauncherPage() {
  const { user } = useUser();
  const [dbUser, setDbUser] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const { favorites, recentlyUsed, toggleFavorite, recordUsage, mounted } = useEngineStorage();

  useEffect(() => {
    async function fetchDbUser() {
      try {
        const res = await fetch("/api/auth/me");
        if (res.ok) {
          const data = await res.json();
          if (data.user) setDbUser(data.user);
        }
      } catch (err) {
        console.error("Error fetching user session", err);
      }
    }
    fetchDbUser();
  }, []);

  // Determine current user's role
  const userRole = dbUser?.role || (user?.publicMetadata?.role as string) || "student";
  const isSuperAdmin = userRole === "super_admin";
  const isAdminOrStaff = ["super_admin", "admin", "teacher"].includes(userRole);

  // Filter engines based on role restrictions, category, and search query
  const filteredEngines = ENGINES_LIST.filter((engine) => {
    // 1. Check role restrictions
    if (engine.roleRestriction && !engine.roleRestriction.includes(userRole)) {
      return false;
    }
    // 2. Check category
    if (activeCategory !== "All" && engine.category !== activeCategory) {
      return false;
    }
    // 3. Check search query
    if (searchQuery.trim() !== "") {
      const query = searchQuery.toLowerCase();
      const titleMatch = engine.title.toLowerCase().includes(query);
      const descMatch = engine.description.toLowerCase().includes(query);
      const categoryMatch = engine.category.toLowerCase().includes(query);
      if (!titleMatch && !descMatch && !categoryMatch) {
        return false;
      }
    }
    return true;
  });

  // Split filtered engines into favorites and rest (only show favorites in the main list if filtered)
  const favoriteEngines = ENGINES_LIST.filter(
    (e) => favorites.includes(e.id) && (!e.roleRestriction || e.roleRestriction.includes(userRole))
  );

  const recentEngines = ENGINES_LIST.filter(
    (e) => recentlyUsed.includes(e.id) && (!e.roleRestriction || e.roleRestriction.includes(userRole))
  ).sort((a, b) => recentlyUsed.indexOf(a.id) - recentlyUsed.indexOf(b.id));

  // Loading / mounting placeholder to prevent layout shifts
  if (!mounted) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-cyan-400 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="rounded-[28px] border border-cyan-400/20 bg-[linear-gradient(135deg,rgba(8,47,73,0.85),rgba(15,23,42,0.92))] p-6 shadow-[0_24px_80px_rgba(8,47,73,0.25)] sm:p-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-cyan-400/10 text-cyan-400 ring-1 ring-cyan-400/20">
                <Zap className="h-3 w-3" />
              </span>
              <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-cyan-200/90">Console Launcher</p>
            </div>
            <h1 className="mt-3 text-3xl font-semibold text-white sm:text-4xl">AI & Timetable Control Center</h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-300">
              Access AI document editors, custom curriculum planners, vector search engines, and scheduling automations. Star your most-used tools for instant access.
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-3 rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
            <Activity className="h-4 w-4 text-cyan-400" />
            <div className="text-right">
              <p className="text-[10px] uppercase tracking-wider text-slate-400">Security Access</p>
              <p className="text-xs font-semibold text-white uppercase tracking-wide mt-0.5">{userRole.replace("_", " ")}</p>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mt-8 relative max-w-xl">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search console tools, generators, or administration utilities..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-2xl border border-white/10 bg-black/30 py-3 pl-12 pr-4 text-sm text-white placeholder-slate-400 outline-none ring-cyan-500/20 transition-all focus:border-cyan-500/50 focus:ring-4"
          />
        </div>
      </div>

      {/* Favorites & Recent section */}
      <AnimatePresence>
        {searchQuery === "" && (favoriteEngines.length > 0 || recentEngines.length > 0) && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid gap-6 md:grid-cols-2"
          >
            {/* Favorites */}
            {favoriteEngines.length > 0 && (
              <div className="rounded-[24px] border border-white/5 bg-white/[0.02] p-5 backdrop-blur-md">
                <h3 className="flex items-center gap-2 text-sm font-semibold text-white uppercase tracking-[0.2em] mb-4">
                  <Star className="h-4 w-4 fill-amber-400 text-amber-400" /> Favorites
                </h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  {favoriteEngines.map((engine) => (
                    <QuickAccessCard key={engine.id} engine={engine} onLaunch={recordUsage} />
                  ))}
                </div>
              </div>
            )}

            {/* Recently Used */}
            {recentEngines.length > 0 && (
              <div className="rounded-[24px] border border-white/5 bg-white/[0.02] p-5 backdrop-blur-md">
                <h3 className="flex items-center gap-2 text-sm font-semibold text-white uppercase tracking-[0.2em] mb-4">
                  <Activity className="h-4 w-4 text-cyan-400" /> Recently Used
                </h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  {recentEngines.map((engine) => (
                    <QuickAccessCard key={engine.id} engine={engine} onLaunch={recordUsage} />
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Launcher Grid */}
      <div className="space-y-6">
        {/* Category Tabs */}
        <div className="flex flex-wrap gap-2 border-b border-white/5 pb-4">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={[
                "rounded-xl px-4 py-2 text-xs font-semibold uppercase tracking-wider transition-all duration-250",
                activeCategory === cat
                  ? "bg-cyan-500/25 text-cyan-200 border border-cyan-400/30"
                  : "text-slate-400 border border-transparent hover:text-white hover:bg-white/5"
              ].join(" ")}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Engine Cards Grid */}
        <motion.div
          layout
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
        >
          <AnimatePresence mode="popLayout">
            {filteredEngines.map((engine) => {
              const Icon = iconMap[engine.iconName] || Sparkles;
              const isFav = favorites.includes(engine.id);

              return (
                <motion.div
                  layout
                  key={engine.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className="group relative flex flex-col justify-between rounded-3xl border border-white/10 bg-slate-900/40 p-5 backdrop-blur-md transition-all duration-300 hover:border-cyan-500/30 hover:bg-slate-900/60"
                >
                  <div>
                    {/* Card Top Row */}
                    <div className="flex items-start justify-between">
                      <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-slate-300 group-hover:border-cyan-400/20 group-hover:bg-cyan-400/10 group-hover:text-cyan-200 transition-colors">
                        <Icon className="h-5 w-5" />
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="flex items-center gap-1.5 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-emerald-300">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"></span> Active
                        </span>
                        <button
                          onClick={() => toggleFavorite(engine.id)}
                          className="rounded-xl border border-white/10 bg-white/5 p-2 text-slate-400 hover:border-amber-400/30 hover:bg-amber-400/10 hover:text-amber-300 transition-colors"
                        >
                          <Star className={["h-4.5 w-4.5", isFav ? "fill-amber-400 text-amber-400" : ""].join(" ")} />
                        </button>
                      </div>
                    </div>

                    {/* Content */}
                    <h3 className="mt-5 text-lg font-semibold text-white group-hover:text-cyan-200 transition-colors">
                      {engine.title}
                    </h3>
                    <p className="mt-2 text-xs leading-relaxed text-slate-400 group-hover:text-slate-300 transition-colors">
                      {engine.description}
                    </p>
                  </div>

                  {/* Card Bottom Row */}
                  <div className="mt-6 flex items-center justify-between border-t border-white/5 pt-4">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                      {engine.category}
                    </span>
                    <Link
                      href={engine.href}
                      onClick={() => recordUsage(engine.id)}
                      target={engine.external ? "_blank" : undefined}
                      rel={engine.external ? "noopener noreferrer" : undefined}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-cyan-400/20 bg-cyan-400/10 px-3.5 py-1.5 text-xs font-semibold text-cyan-200 hover:bg-cyan-400/20 hover:text-white transition-all"
                    >
                      Launch <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>

        {filteredEngines.length === 0 && (
          <div className="rounded-2xl border border-white/5 bg-white/[0.01] p-10 text-center text-slate-400">
            <Sparkles className="mx-auto h-8 w-8 opacity-40 mb-3" />
            No console engines match your active filters or search query.
          </div>
        )}
      </div>
    </div>
  );
}

// Shared Helper Quick Access Card Component
function QuickAccessCard({ engine, onLaunch }: { engine: Engine; onLaunch: (id: string) => void }) {
  const Icon = iconMap[engine.iconName] || Sparkles;

  return (
    <Link
      href={engine.href}
      onClick={() => onLaunch(engine.id)}
      target={engine.external ? "_blank" : undefined}
      rel={engine.external ? "noopener noreferrer" : undefined}
      className="group flex items-center gap-3.5 rounded-2xl border border-white/5 bg-black/30 p-3 hover:border-cyan-400/20 hover:bg-cyan-400/5 transition-all duration-250"
    >
      <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-400 group-hover:border-cyan-400/20 group-hover:bg-cyan-400/15 group-hover:text-cyan-300 transition-colors">
        <Icon className="h-4.5 w-4.5" />
      </span>
      <div className="overflow-hidden">
        <h4 className="text-xs font-semibold text-white truncate group-hover:text-cyan-200 transition-colors">
          {engine.title}
        </h4>
        <p className="mt-0.5 text-[10px] text-slate-400 group-hover:text-slate-300 transition-colors">
          {engine.category}
        </p>
      </div>
    </Link>
  );
}
