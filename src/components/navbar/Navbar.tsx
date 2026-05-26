"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, Menu, X, ExternalLink } from "lucide-react";
import { UserButton, useUser } from "@clerk/nextjs";
import MegaDropdown from "@/src/components/dropdown/MegaDropdown";
import { learnMenu, primaryNavLinks } from "@/src/data/navigation";

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
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isMobileLearnOpen, setIsMobileLearnOpen] = useState(false);
  const learnRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function onClickOutside(event: MouseEvent) {
      if (!learnRef.current) {
        return;
      }
      if (!learnRef.current.contains(event.target as Node)) {
        setIsLearnOpen(false);
      }
    }

    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const handleMobileMenuClose = () => {
    setIsMobileOpen(false);
    setIsMobileLearnOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur sm:px-6 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <div className="flex items-center justify-between gap-3">
          <Link href="/" className="text-xs font-bold tracking-[0.2em] text-slate-900 sm:text-sm">
            PYTHON ARENA
          </Link>

          <nav className="hidden items-center gap-1 lg:flex">
            {primaryNavLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
              >
                {link.label}
              </Link>
            ))}

            <div className="relative" ref={learnRef}>
              <button
                type="button"
                onClick={() => setIsLearnOpen((prev) => !prev)}
                aria-expanded={isLearnOpen}
                className="flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
              >
                Learn
                <ChevronDown className={`h-4 w-4 transition duration-200 ${isLearnOpen ? "rotate-180" : ""}`} />
              </button>

              <AnimatePresence mode="wait">
                {isLearnOpen ? <MegaDropdown categories={learnMenu} onItemClick={() => setIsLearnOpen(false)} /> : null}
              </AnimatePresence>
            </div>
          </nav>

          <div className="hidden items-center gap-2 lg:flex">
            {isLoaded && isSignedIn ? (
              <>
              <Link href="/dashboard" className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900">
                Dashboard
              </Link>
              {user?.publicMetadata?.role === "admin" && (
                <Link href="/admin/resets" className="rounded-lg px-3 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50 hover:text-red-700">
                  Resets
                </Link>
              )}
              <Link href="/dashboard/code" className="rounded-lg bg-emerald-100 px-3 py-2 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-200">
                Web Editor
              </Link>
              <Link href="/dashboard/python" className="rounded-lg bg-blue-100 px-3 py-2 text-sm font-semibold text-blue-700 transition hover:bg-blue-200">
                Python Editor
              </Link>
              {(dbUser?.role === "admin" || dbUser?.role === "super_admin") && (
                <>
                  <Link href="/admin/users" className="rounded-lg px-3 py-2 text-sm font-medium text-purple-600 transition hover:bg-purple-50 hover:text-purple-700">
                    User Mgmt
                  </Link>
                  <Link 
                    href={process.env.NODE_ENV === "development" ? "http://localhost:5173" : "/admin/timetable"}
                    target={process.env.NODE_ENV === "development" ? "_blank" : undefined}
                    className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-indigo-600 transition hover:bg-indigo-50 hover:text-indigo-700"
                  >
                    Timetable Mgmt {process.env.NODE_ENV === "development" && <ExternalLink className="h-3 w-3" />}
                  </Link>
                </>
              )}
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
                    className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
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
                <Link href="/sign-in" className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100">
                  Sign In
                </Link>
                <Link href="/sign-up" className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800">
                  Sign Up
                </Link>
              </>
            )}
          </div>

          <button
            type="button"
            aria-label="Toggle menu"
            className="rounded-lg border border-slate-300 p-2 text-slate-700 lg:hidden"
            onClick={() => setIsMobileOpen((prev) => !prev)}
          >
            {isMobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        <AnimatePresence>
          {isMobileOpen ? (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="mt-3 overflow-hidden lg:hidden"
            >
              <div className="max-h-[80vh] overflow-y-auto overscroll-contain space-y-1 border-t border-slate-200 pt-3 pb-2">
                {primaryNavLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={handleMobileMenuClose}
                    className="block w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                  >
                    {link.label}
                  </Link>
                ))}

                <div className="space-y-1">
                  <button
                    type="button"
                    onClick={() => setIsMobileLearnOpen((prev) => !prev)}
                    aria-expanded={isMobileLearnOpen}
                    className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                  >
                    Learn
                    <ChevronDown className={`h-4 w-4 transition duration-200 ${isMobileLearnOpen ? "rotate-180" : ""}`} />
                  </button>
                  <AnimatePresence>
                    {isMobileLearnOpen ? (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="space-y-3 overflow-hidden rounded-lg bg-slate-50 px-2 py-3"
                      >
                        {learnMenu.map((category) => (
                          <div key={category.id} className="space-y-1">
                            <p className="px-2 py-1 text-xs font-bold uppercase tracking-wide text-slate-500">{category.title}</p>
                            <div className="space-y-0.5">
                              {category.items.map((item) => (
                                <Link
                                  key={item.href}
                                  href={item.href}
                                  onClick={handleMobileMenuClose}
                                  className="block rounded-lg px-4 py-1.5 text-xs text-slate-600 transition hover:bg-white hover:text-slate-900"
                                >
                                  {item.label}
                                </Link>
                              ))}
                            </div>
                          </div>
                        ))}
                      </motion.div>
                    ) : null}
                  </AnimatePresence>
                </div>

                <div className="border-t border-slate-200 pt-3">
                  {isLoaded && isSignedIn ? (
                    <div className="flex flex-col gap-2 rounded-lg px-3 py-2">
                      <div className="flex items-center justify-between">
                        <Link
                          href="/dashboard"
                          onClick={handleMobileMenuClose}
                          className="text-sm font-medium text-slate-700"
                        >
                          Dashboard
                        </Link>
                        {dbUser && !dbUser.isClerk ? (
                          <button
                            onClick={async () => {
                              await fetch("/api/auth/logout", { method: "POST" });
                              window.location.href = "/";
                            }}
                            className="rounded-lg border border-slate-300 px-2 py-1 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
                          >
                            Sign Out
                          </button>
                        ) : (
                          <UserButton afterSignOutUrl="/" />
                        )}
                      </div>
                      {(dbUser?.role === "admin" || dbUser?.role === "super_admin") && (
                        <>
                          <Link
                            href="/admin/users"
                            onClick={handleMobileMenuClose}
                            className="text-sm font-medium text-purple-600"
                          >
                            User Mgmt
                          </Link>
                          <Link
                            href={process.env.NODE_ENV === "development" ? "http://localhost:5173" : "/admin/timetable"}
                            target={process.env.NODE_ENV === "development" ? "_blank" : undefined}
                            onClick={handleMobileMenuClose}
                            className="flex items-center gap-1.5 text-sm font-medium text-indigo-600"
                          >
                            Timetable Mgmt {process.env.NODE_ENV === "development" && <ExternalLink className="h-3 w-3" />}
                          </Link>
                        </>
                      )}
                      <Link
                        href="/dashboard/code"
                        onClick={handleMobileMenuClose}
                        className="text-sm font-medium text-slate-700"
                      >
                        Web Editor
                      </Link>
                      <Link
                        href="/dashboard/python"
                        onClick={handleMobileMenuClose}
                        className="text-sm font-medium text-slate-700"
                      >
                        Python Editor
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-2 px-1">
                      <Link
                        href="/sign-in"
                        onClick={handleMobileMenuClose}
                        className="block w-full rounded-lg border border-slate-300 px-3 py-2 text-left text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                      >
                        Sign In
                      </Link>

                      <Link
                        href="/sign-up"
                        onClick={handleMobileMenuClose}
                        className="block w-full rounded-lg bg-slate-900 px-3 py-2 text-left text-sm font-semibold text-white transition hover:bg-slate-800"
                      >
                        Sign Up
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
