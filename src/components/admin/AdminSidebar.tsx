"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { adminSidebarLinks } from "@/src/constants/admin";

export default function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-full shrink-0 rounded-[28px] border border-white/10 bg-slate-900/80 p-4 shadow-[0_24px_80px_rgba(15,23,42,0.35)] ring-1 ring-white/5 backdrop-blur sm:p-5 lg:sticky lg:top-6 lg:w-80 lg:self-start">
      <div className="rounded-2xl border border-cyan-400/20 bg-[linear-gradient(135deg,rgba(8,47,73,0.92),rgba(15,23,42,0.92))] p-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-cyan-200/90">Python Arena</p>
        <h2 className="mt-3 text-xl font-semibold text-white">Admin Console</h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-300">
          Manage courses, users, and platform activity from one responsive control center.
        </p>
      </div>

      <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.03] p-3">
        <div className="mb-3 flex items-center justify-between px-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">Navigation</p>
          <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.2em] text-emerald-200">
            Live
          </span>
        </div>

        <nav className="grid gap-1.5 sm:grid-cols-2 lg:grid-cols-1">
        {adminSidebarLinks.map((section) => {
          const active = pathname === section.href || (section.href !== "/admin" && pathname.startsWith(section.href));
          const Icon = section.icon;

          return (
            <Link
              key={section.href}
              href={section.href}
              className={[
                "flex items-center gap-3 rounded-2xl border px-3 py-3 text-sm transition",
                active
                  ? "border-cyan-300/30 bg-cyan-400/15 text-white shadow-[0_8px_30px_rgba(34,211,238,0.08)]"
                  : "border-transparent text-slate-300 hover:border-white/10 hover:bg-white/5 hover:text-white",
              ].join(" ")}
            >
              <span className={[
                "inline-flex h-9 w-9 items-center justify-center rounded-xl border",
                active ? "border-cyan-300/30 bg-cyan-400/15 text-cyan-100" : "border-white/10 bg-white/5 text-slate-400",
              ].join(" ")}>
                <Icon className="h-4 w-4" />
              </span>
              {section.label}
            </Link>
          );
        })}
      </nav>
      </div>

      <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">Today</p>
        <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-xl border border-white/10 bg-black/20 p-3">
            <p className="text-slate-400">Review Queue</p>
            <p className="mt-1 text-lg font-semibold text-white">12</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-black/20 p-3">
            <p className="text-slate-400">Active Staff</p>
            <p className="mt-1 text-lg font-semibold text-white">4</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
