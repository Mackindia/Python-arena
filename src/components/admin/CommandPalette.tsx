"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Sparkles, Command, ArrowRight, CornerDownLeft } from "lucide-react";
import { ENGINES_LIST, iconMap } from "@/src/constants/engines";

type PaletteItem = {
  id: string;
  title: string;
  description: string;
  href: string;
  category: string;
  iconName: string;
  external?: boolean;
};

export default function CommandPalette() {
  const router = useRouter();
  const { user } = useUser();
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [dbUser, setDbUser] = useState<any>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Fetch dbUser to check roles
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

  const userRole = dbUser?.role || (user?.publicMetadata?.role as string) || "student";

  // Toggle Command Palette on Ctrl + K or Cmd + K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsOpen((prev) => !prev);
        setSearchQuery("");
        setSelectedIndex(0);
      }
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Autofocus input when palette opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Static core pages to index in search results
  const staticPages: PaletteItem[] = [
    {
      id: "admin-dashboard",
      title: "Admin Dashboard",
      description: "Return to the main administrative hub and view system summaries.",
      href: "/admin",
      category: "Navigation Hub",
      iconName: "LayoutDashboard"
    },
    {
      id: "admin-content",
      title: "Content Hub",
      description: "Manage subject directories and curriculum media resources.",
      href: "/admin/content",
      category: "Navigation Hub",
      iconName: "FolderOpen"
    },
    {
      id: "admin-students",
      title: "Students Dashboard",
      description: "Inspect student registries, course progressions, and role assignments.",
      href: "/admin/users",
      category: "Navigation Hub",
      iconName: "Users"
    },
    {
      id: "admin-launcher",
      title: "AI Engines Launcher",
      description: "Browse category folders, favorites, and open specialized study generators.",
      href: "/admin/engines",
      category: "Navigation Hub",
      iconName: "Sparkles"
    },
    {
      id: "admin-settings",
      title: "System Settings",
      description: "Configure keys, third-party limits, and portal defaults.",
      href: "/admin/settings",
      category: "Navigation Hub",
      iconName: "Settings"
    }
  ];

  // Merge static pages and engines list, filtered by role restrictions
  const allItems: PaletteItem[] = [
    ...staticPages,
    ...ENGINES_LIST.map((e) => ({
      id: e.id,
      title: e.title,
      description: e.description,
      href: e.href,
      category: e.category,
      iconName: e.iconName,
      external: e.external,
      roleRestriction: e.roleRestriction
    }))
  ].filter((item: any) => {
    if (item.roleRestriction && !item.roleRestriction.includes(userRole)) {
      return false;
    }
    return true;
  });

  // Filter items based on search query
  const filteredItems = allItems.filter((item) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      item.title.toLowerCase().includes(query) ||
      item.description.toLowerCase().includes(query) ||
      item.category.toLowerCase().includes(query)
    );
  });

  // Handle arrow navigation and enter key
  useEffect(() => {
    const handleNav = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % filteredItems.length);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + filteredItems.length) % filteredItems.length);
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (filteredItems[selectedIndex]) {
          triggerAction(filteredItems[selectedIndex]);
        }
      }
    };
    window.addEventListener("keydown", handleNav);
    return () => window.removeEventListener("keydown", handleNav);
  }, [isOpen, filteredItems, selectedIndex]);

  const triggerAction = (item: PaletteItem) => {
    setIsOpen(false);
    if (item.external) {
      window.open(item.href, "_blank", "noopener,noreferrer");
    } else {
      router.push(item.href);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]">
          {/* Backdrop Blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.97, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: -8 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="relative w-full max-w-2xl overflow-hidden rounded-3xl border border-white/10 bg-slate-900/90 text-white shadow-[0_32px_120px_rgba(15,23,42,0.6)] ring-1 ring-white/5 backdrop-blur-md px-1 mx-4"
          >
            {/* Search Header */}
            <div className="flex items-center gap-3 border-b border-white/5 px-4 py-4">
              <Command className="h-5 w-5 text-cyan-400" />
              <input
                ref={inputRef}
                type="text"
                placeholder="Search tools, databases, configurations..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setSelectedIndex(0);
                }}
                className="w-full bg-transparent text-sm placeholder-slate-400 outline-none text-white"
              />
              <span className="rounded-lg bg-white/5 border border-white/10 px-2 py-0.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                ESC
              </span>
            </div>

            {/* Results Grid */}
            <div className="max-h-[360px] overflow-y-auto px-2 py-3 space-y-1 scrollbar-thin">
              {filteredItems.map((item, idx) => {
                const Icon = iconMap[item.iconName] || Sparkles;
                const isSelected = idx === selectedIndex;

                return (
                  <button
                    key={item.id}
                    onClick={() => triggerAction(item)}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    className={[
                      "flex w-full items-center gap-4 rounded-2xl px-4 py-3 text-left transition-all duration-150",
                      isSelected
                        ? "bg-cyan-500/10 border border-cyan-400/20 text-white"
                        : "border border-transparent text-slate-300 hover:text-white"
                    ].join(" ")}
                  >
                    <span
                      className={[
                        "inline-flex h-9 w-9 items-center justify-center rounded-xl border transition-colors",
                        isSelected
                          ? "border-cyan-400/30 bg-cyan-400/10 text-cyan-300"
                          : "border-white/10 bg-white/5 text-slate-400"
                      ].join(" ")}
                    >
                      <Icon className="h-4.5 w-4.5" />
                    </span>
                    <div className="flex-1 overflow-hidden">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold">{item.title}</span>
                        <span className="rounded-full border border-white/5 bg-white/5 px-2 py-0.5 text-[8px] uppercase tracking-wider text-slate-400">
                          {item.category}
                        </span>
                      </div>
                      <p className="mt-1 text-[10px] text-slate-400 truncate max-w-[420px] leading-relaxed">
                        {item.description}
                      </p>
                    </div>

                    {isSelected && (
                      <span className="flex items-center gap-1 text-[10px] text-cyan-400 opacity-80 animate-fade-in pr-1">
                        Open <CornerDownLeft className="h-3 w-3" />
                      </span>
                    )}
                  </button>
                );
              })}

              {filteredItems.length === 0 && (
                <div className="py-8 text-center text-slate-400 text-xs">
                  <Search className="mx-auto h-6 w-6 opacity-40 mb-2" />
                  No results found for &ldquo;{searchQuery}&rdquo;
                </div>
              )}
            </div>

            {/* Sticky footer info */}
            <div className="flex items-center justify-between border-t border-white/5 px-4 py-3 text-[10px] text-slate-400">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <kbd className="rounded bg-white/5 px-1.5 py-0.5 border border-white/10">↑↓</kbd> Navigate
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="rounded bg-white/5 px-1.5 py-0.5 border border-white/10">Enter</kbd> Launch
                </span>
              </div>
              <span className="flex items-center gap-1.5 text-cyan-400/80">
                <Command className="h-3 w-3" /> Ctrl + K
              </span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
