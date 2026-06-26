"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, Menu, X, ExternalLink, LayoutGrid, Box, ShieldAlert } from "lucide-react";
import { UserButton, useUser } from "@clerk/nextjs";
import MegaDropdown from "@/src/components/dropdown/MegaDropdown";
import { learnMenu as fallbackLearnMenu, primaryNavLinks } from "@/src/data/navigation";
import type { LearnCategory } from "@/src/data/navigation";

export default function Navbar() {
  const { isLoaded: isClerkLoaded, isSignedIn: isClerkSignedIn, user } = useUser();
  const [dbUser, setDbUser] = useState<any>(null);
  const [isDbLoaded, setIsDbLoaded] = useState(false);

  useEffect(() => {
    async function fetchDbUser() {
      try {
        const res = await fetch("/api/auth/me");
        if (res.ok) {
          const data = await res.json();
          if (data.user) {
            setDbUser(data.user);
          } else {
            setDbUser(null);
          }
        }
      } catch (err) {
        console.error("Error fetching user session", err);
      } finally {
        setIsDbLoaded(true);
      }
    }
    fetchDbUser();
  }, [isClerkSignedIn]);

  const isSignedIn = isClerkSignedIn || !!dbUser;
  const isLoaded = isClerkLoaded && isDbLoaded;
  
  const [isLearnOpen, setIsLearnOpen] = useState(false);
  const [isAppsOpen, setIsAppsOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isMobileLearnOpen, setIsMobileLearnOpen] = useState(false);
  const [isMobileAppsOpen, setIsMobileAppsOpen] = useState(false);
  const [isMobileAdminOpen, setIsMobileAdminOpen] = useState(false);
  
  const learnRef = useRef<HTMLDivElement | null>(null);
  const appsRef = useRef<HTMLDivElement | null>(null);
  const adminRef = useRef<HTMLDivElement | null>(null);

  const [learnMenu, setLearnMenu] = useState<LearnCategory[]>(fallbackLearnMenu);

  useEffect(() => {
    async function fetchLearnMenu() {
      try {
        const [subRes, clsRes] = await Promise.all([
          fetch("/api/lms/subjects", { cache: "no-store" }),
          fetch("/api/lms/classes", { cache: "no-store" }),
        ]);
        if (!subRes.ok || !clsRes.ok) return;
        const subData = await subRes.json();
        const clsData = await clsRes.json();
        const subjects: { _id: string; name: string; slug: string }[] = subData.subjects || [];
        const classes: { _id: string; name: string; slug: string; subject: string }[] = clsData.classes || [];

        const menu: LearnCategory[] = subjects.map((s) => ({
          id: s.slug,
          title: s.name,
          items: classes
            .filter((c) => c.subject === s._id)
            .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }))
            .map((c) => ({ label: c.name, href: `/learn/${s.slug}/${c.slug}` })),
        }));

        if (menu.length > 0) {
          setLearnMenu(menu);
        }
      } catch {
        // keep fallback
      }
    }
    fetchLearnMenu();
  }, []);

  useEffect(() => {
    function onClickOutside(event: MouseEvent) {
      if (learnRef.current && !learnRef.current.contains(event.target as Node)) {
        setIsLearnOpen(false);
      }
      if (appsRef.current && !appsRef.current.contains(event.target as Node)) {
        setIsAppsOpen(false);
      }
      if (adminRef.current && !adminRef.current.contains(event.target as Node)) {
        setIsAdminOpen(false);
      }
    }

    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const handleMobileMenuClose = () => {
    setIsMobileOpen(false);
    setIsMobileLearnOpen(false);
    setIsMobileAppsOpen(false);
    setIsMobileAdminOpen(false);
  };

  const isAdmin = user?.publicMetadata?.role === "admin" || dbUser?.role === "admin" || dbUser?.role === "super_admin";

  const resolvePrimaryHref = (href: string) => {
    if (href === "/online-class" && isAdmin) {
      return "/admin/online-scheduler";
    }
    return href;
  };

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/50 bg-white/80 px-4 py-3 backdrop-blur-xl sm:px-6 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <div className="flex items-center justify-between gap-3">
          {/* Brand */}
          <Link href="/" className="group flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-cyan-500 shadow-md shadow-indigo-500/20">
              <span className="text-sm font-bold text-white">PA</span>
            </div>
            <span className="hidden text-sm font-extrabold tracking-wider sm:block">
              <span className="bg-gradient-to-r from-indigo-600 to-cyan-600 bg-clip-text text-transparent">PYTHON</span>{" "}
              <span className="text-slate-900">ARENA</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden items-center gap-0.5 lg:flex">
            {primaryNavLinks.map((link) => (
              <Link
                key={link.href}
                href={resolvePrimaryHref(link.href)}
                className="group relative rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-gradient-to-r hover:from-indigo-50 hover:to-cyan-50 hover:text-indigo-700"
              >
                {link.label}
                <span className="absolute bottom-0 left-1/2 h-0.5 w-0 -translate-x-1/2 rounded-full bg-gradient-to-r from-indigo-500 to-cyan-500 transition-all duration-300 group-hover:w-3/4"></span>
              </Link>
            ))}

            {/* Learn Dropdown */}
            <div className="relative" ref={learnRef}>
              <button
                type="button"
                onClick={() => setIsLearnOpen((prev) => !prev)}
                aria-expanded={isLearnOpen}
                className="group flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-gradient-to-r hover:from-indigo-50 hover:to-cyan-50 hover:text-indigo-700"
              >
                Learn
                <ChevronDown className={`h-4 w-4 transition-all duration-300 ${isLearnOpen ? "rotate-180 text-indigo-600" : ""}`} />
              </button>

              <AnimatePresence mode="wait">
                {isLearnOpen ? <MegaDropdown categories={learnMenu} onItemClick={() => setIsLearnOpen(false)} /> : null}
              </AnimatePresence>
            </div>
          </nav>

          {/* Right side */}
          <div className="hidden items-center gap-2 lg:flex">
            {isLoaded && isSignedIn ? (
              <>
                <Link href="/dashboard" className="group relative rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-gradient-to-r hover:from-indigo-50 hover:to-cyan-50 hover:text-indigo-700">
                  Dashboard
                </Link>
                
                {/* Apps Dropdown */}
                <div className="relative" ref={appsRef}>
                  <button
                    type="button"
                    onClick={() => setIsAppsOpen((prev) => !prev)}
                    className="group flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-gradient-to-r hover:from-indigo-50 hover:to-cyan-50 hover:text-indigo-700"
                  >
                    <Box className="h-4 w-4" />
                    Apps
                    <ChevronDown className={`h-4 w-4 transition-all duration-300 ${isAppsOpen ? "rotate-180 text-indigo-600" : ""}`} />
                  </button>

                  <AnimatePresence>
                    {isAppsOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.95 }}
                        transition={{ duration: 0.15, ease: "easeOut" }}
                        className="absolute right-0 top-full z-50 mt-2 w-56 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl shadow-slate-200/50"
                      >
                        <div className="p-2">
                          <div className="mb-1 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-slate-400">Learning</div>
                          <Link href="/dashboard/code" onClick={() => setIsAppsOpen(false)} className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-emerald-600 transition hover:bg-emerald-50">
                            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-emerald-100 text-xs">🌐</span>
                            Web Editor
                          </Link>
                          <Link href="/dashboard/python" onClick={() => setIsAppsOpen(false)} className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-blue-600 transition hover:bg-blue-50">
                            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-blue-100 text-xs">🐍</span>
                            Python Editor
                          </Link>
                          <Link href="/educational-ai" onClick={() => setIsAppsOpen(false)} className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-cyan-600 transition hover:bg-cyan-50">
                            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-cyan-100 text-xs">🤖</span>
                            Educational AI
                          </Link>
                          
                          <div className="my-2 border-t border-slate-100"></div>
                          <div className="mb-1 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-slate-400">School</div>
                          <Link href="/admin/timetable" onClick={() => setIsAppsOpen(false)} className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50">
                            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-slate-100 text-xs">📅</span>
                            Timetable
                          </Link>
                          <Link href="/substitutions" onClick={() => setIsAppsOpen(false)} className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50">
                            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-slate-100 text-xs">🔄</span>
                            Substitutions
                          </Link>
                          <Link href="/teacher" onClick={() => setIsAppsOpen(false)} className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50">
                            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-slate-100 text-xs">👩‍🏫</span>
                            Teacher Tools
                          </Link>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Admin Dropdown */}
                {isAdmin && (
                  <div className="relative" ref={adminRef}>
                    <button
                      type="button"
                      onClick={() => setIsAdminOpen((prev) => !prev)}
                      className="group flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-purple-600 transition-colors hover:bg-purple-50"
                    >
                      <ShieldAlert className="h-4 w-4" />
                      Admin
                      <ChevronDown className={`h-4 w-4 transition-all duration-300 ${isAdminOpen ? "rotate-180" : ""}`} />
                    </button>

                    <AnimatePresence>
                      {isAdminOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: 8, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 8, scale: 0.95 }}
                          transition={{ duration: 0.15, ease: "easeOut" }}
                          className="absolute right-0 top-full z-50 mt-2 w-56 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl shadow-slate-200/50"
                        >
                          <div className="p-2">
                            <Link href="/admin/users" onClick={() => setIsAdminOpen(false)} className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50">
                              <span className="flex h-6 w-6 items-center justify-center rounded-md bg-slate-100 text-xs">👥</span>
                              User Management
                            </Link>
                            <Link 
                              href={process.env.NODE_ENV === "development" ? "http://localhost:5173" : "/admin/timetable"}
                              target={process.env.NODE_ENV === "development" ? "_blank" : undefined}
                              onClick={() => setIsAdminOpen(false)}
                              className="flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium text-indigo-600 transition hover:bg-indigo-50"
                            >
                              <span className="flex items-center gap-2">
                                <span className="flex h-6 w-6 items-center justify-center rounded-md bg-indigo-100 text-xs">⚙️</span>
                                Timetable Engine
                              </span>
                              {process.env.NODE_ENV === "development" && <ExternalLink className="h-3 w-3" />}
                            </Link>
                            {user?.publicMetadata?.role === "admin" && (
                              <Link href="/admin/resets" onClick={() => setIsAdminOpen(false)} className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-red-600 transition hover:bg-red-50">
                                <span className="flex h-6 w-6 items-center justify-center rounded-md bg-red-100 text-xs">⚠️</span>
                                Resets
                              </Link>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}
                
                <Link href="/settings" className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-gradient-to-r hover:from-indigo-50 hover:to-cyan-50 hover:text-indigo-700">
                  Settings
                </Link>

                {dbUser && !dbUser.isClerk ? (
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-slate-700">
                      Hi, {dbUser.fullName}
                    </span>
                    <button
                      onClick={async () => {
                        await fetch("/api/auth/logout", { method: "POST" });
                        window.location.href = "/";
                      }}
                      className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                    >
                      Sign Out
                    </button>
                  </div>
                ) : (
                  <UserButton afterSignOutUrl="/" />
                )}
              </>
            ) : (
              <>
                <Link href="/sign-in" className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50">
                  Sign In
                </Link>
                <Link href="/sign-up" className="rounded-lg bg-gradient-to-r from-indigo-500 to-blue-500 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-indigo-500/25 transition-all hover:from-indigo-600 hover:to-blue-600 hover:shadow-lg">
                  Sign Up
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            type="button"
            aria-label="Toggle menu"
            className="rounded-lg border border-slate-200 bg-white p-2 text-slate-600 transition-all hover:bg-slate-50 lg:hidden"
            onClick={() => setIsMobileOpen((prev) => !prev)}
          >
            {isMobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {/* Mobile menu */}
        <AnimatePresence>
          {isMobileOpen ? (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="mt-3 overflow-hidden lg:hidden"
            >
              <div className="max-h-[80vh] overflow-y-auto overscroll-contain space-y-1 border-t border-slate-100 pt-3 pb-2">
                {primaryNavLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={resolvePrimaryHref(link.href)}
                    onClick={handleMobileMenuClose}
                    className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-slate-700 transition hover:bg-gradient-to-r hover:from-indigo-50 hover:to-cyan-50 hover:text-indigo-700"
                  >
                    {link.label}
                  </Link>
                ))}

                {/* Mobile Learn */}
                <div className="space-y-1">
                  <button
                    type="button"
                    onClick={() => setIsMobileLearnOpen((prev) => !prev)}
                    className="flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm font-medium text-slate-700 transition hover:bg-gradient-to-r hover:from-indigo-50 hover:to-cyan-50 hover:text-indigo-700"
                  >
                    Learn
                    <ChevronDown className={`h-4 w-4 transition duration-200 ${isMobileLearnOpen ? "rotate-180" : ""}`} />
                  </button>
                  <AnimatePresence>
                    {isMobileLearnOpen && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="space-y-3 overflow-hidden rounded-xl border border-slate-100 bg-gradient-to-br from-slate-50 to-indigo-50/30 px-3 py-3"
                      >
                        {learnMenu.map((category) => (
                          <div key={category.id} className="space-y-1">
                            <p className="px-2 py-1 text-xs font-bold uppercase tracking-wider text-indigo-600">{category.title}</p>
                            <div className="space-y-0.5">
                              {category.items.map((item) => (
                                <Link
                                  key={item.href}
                                  href={item.href}
                                  onClick={handleMobileMenuClose}
                                  className="block rounded-lg px-3 py-1.5 text-sm text-slate-600 transition hover:bg-white hover:text-slate-900"
                                >
                                  {item.label}
                                </Link>
                              ))}
                            </div>
                          </div>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div className="border-t border-slate-100 pt-3">
                  {isLoaded && isSignedIn ? (
                    <div className="flex flex-col gap-1 px-2">
                      <div className="flex items-center justify-between px-1 mb-2">
                        <Link href="/dashboard" onClick={handleMobileMenuClose} className="text-sm font-bold text-slate-800">
                          Dashboard
                        </Link>
                        {dbUser && !dbUser.isClerk ? (
                          <button
                            onClick={async () => {
                              await fetch("/api/auth/logout", { method: "POST" });
                              window.location.href = "/";
                            }}
                            className="rounded-lg border border-slate-200 px-2 py-1 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                          >
                            Sign Out
                          </button>
                        ) : (
                          <UserButton afterSignOutUrl="/" />
                        )}
                      </div>

                      {/* Mobile Apps Section */}
                      <button
                        type="button"
                        onClick={() => setIsMobileAppsOpen((prev) => !prev)}
                        className="flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm font-medium text-slate-700 transition hover:bg-gradient-to-r hover:from-indigo-50 hover:to-cyan-50"
                      >
                        <div className="flex items-center gap-2"><Box className="h-4 w-4" /> Apps</div>
                        <ChevronDown className={`h-4 w-4 transition duration-200 ${isMobileAppsOpen ? "rotate-180" : ""}`} />
                      </button>
                      <AnimatePresence>
                        {isMobileAppsOpen && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="space-y-1 overflow-hidden rounded-xl border border-slate-100 bg-slate-50 px-2 py-2"
                          >
                            <Link href="/dashboard/code" onClick={handleMobileMenuClose} className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-emerald-600 hover:bg-emerald-50">🌐 Web Editor</Link>
                            <Link href="/dashboard/python" onClick={handleMobileMenuClose} className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-blue-600 hover:bg-blue-50">🐍 Python Editor</Link>
                            <Link href="/educational-ai" onClick={handleMobileMenuClose} className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-cyan-600 hover:bg-cyan-50">🤖 Educational AI</Link>
                            <Link href="/admin/timetable" onClick={handleMobileMenuClose} className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-slate-100">📅 Timetable</Link>
                            <Link href="/substitutions" onClick={handleMobileMenuClose} className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-slate-100">🔄 Substitutions</Link>
                            <Link href="/teacher" onClick={handleMobileMenuClose} className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-slate-100">👩‍🏫 Teacher Tools</Link>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {/* Mobile Admin Section */}
                      {isAdmin && (
                        <>
                          <button
                            type="button"
                            onClick={() => setIsMobileAdminOpen((prev) => !prev)}
                            className="flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm font-medium text-purple-600 transition hover:bg-purple-50"
                          >
                            <div className="flex items-center gap-2"><ShieldAlert className="h-4 w-4" /> Admin</div>
                            <ChevronDown className={`h-4 w-4 transition duration-200 ${isMobileAdminOpen ? "rotate-180" : ""}`} />
                          </button>
                          <AnimatePresence>
                            {isMobileAdminOpen && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                className="space-y-1 overflow-hidden rounded-xl border border-purple-100 bg-purple-50/50 px-2 py-2"
                              >
                                <Link href="/admin/users" onClick={handleMobileMenuClose} className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-white">👥 User Mgmt</Link>
                                <Link 
                                  href={process.env.NODE_ENV === "development" ? "http://localhost:5173" : "/admin/timetable"}
                                  target={process.env.NODE_ENV === "development" ? "_blank" : undefined}
                                  onClick={handleMobileMenuClose}
                                  className="flex items-center justify-between rounded-lg px-3 py-2 text-sm text-indigo-600 hover:bg-white"
                                >
                                  <span className="flex items-center gap-2">⚙️ Timetable Engine</span>
                                  {process.env.NODE_ENV === "development" && <ExternalLink className="h-3 w-3" />}
                                </Link>
                                {user?.publicMetadata?.role === "admin" && (
                                  <Link href="/admin/resets" onClick={handleMobileMenuClose} className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-600 hover:bg-white">⚠️ Resets</Link>
                                )}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </>
                      )}

                      <Link href="/settings" onClick={handleMobileMenuClose} className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-gradient-to-r hover:from-indigo-50 hover:to-cyan-50">
                        ⚙️ Settings
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-2 px-1">
                      <Link
                        href="/sign-in"
                        onClick={handleMobileMenuClose}
                        className="block w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-center text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                      >
                        Sign In
                      </Link>

                      <Link
                        href="/sign-up"
                        onClick={handleMobileMenuClose}
                        className="block w-full rounded-xl bg-gradient-to-r from-indigo-500 to-blue-500 px-3 py-2.5 text-center text-sm font-semibold text-white shadow-md"
                      >
                        Sign Up Free
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </header>
  );
}
