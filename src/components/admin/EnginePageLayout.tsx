"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Search, Zap, Clock, ShieldCheck, ChevronRight } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type QuickActionItem = {
  label: string;
  onClick: () => void;
  icon?: LucideIcon;
  disabled?: boolean;
};

export type RecentActivityItem = {
  label: string;
  meta?: string;
  timestamp?: string;
  onClick?: () => void;
};

type EnginePageLayoutProps = {
  title: string;
  description: string;
  category?: string;
  quickActions?: QuickActionItem[];
  recentActivity?: RecentActivityItem[];
  children: React.ReactNode;
};

export default function EnginePageLayout({
  title,
  description,
  category = "Console Tool",
  quickActions = [],
  recentActivity = [],
  children
}: EnginePageLayoutProps) {
  const [localSearch, setLocalSearch] = useState("");

  return (
    <div className="space-y-6">
      {/* Navigation Top bar: Breadcrumbs & Back button */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/5 pb-4">
        {/* Breadcrumbs */}
        <nav className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
          <Link href="/admin" className="hover:text-cyan-400 transition-colors">
            Home
          </Link>
          <ChevronRight className="h-3 w-3 opacity-60" />
          <Link href="/admin/engines" className="hover:text-cyan-400 transition-colors">
            AI Engines
          </Link>
          <ChevronRight className="h-3 w-3 opacity-60" />
          <span className="text-white truncate max-w-[150px] sm:max-w-[300px]">
            {title}
          </span>
        </nav>

        {/* Back Button */}
        <Link
          href="/admin/engines"
          className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-slate-300 hover:border-cyan-400/25 hover:bg-cyan-400/10 hover:text-white transition-all"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Engines
        </Link>
      </div>

      {/* Main Grid Section */}
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        {/* Left Column: Children Page Content */}
        <div className="space-y-6 overflow-hidden">
          {/* Header Block */}
          <div className="rounded-3xl border border-white/10 bg-slate-900/40 p-5 sm:p-6 backdrop-blur-md">
            <span className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-cyan-200">
              {category}
            </span>
            <h1 className="mt-4 text-2xl sm:text-3xl font-semibold text-white">{title}</h1>
            <p className="mt-2 text-xs sm:text-sm leading-relaxed text-slate-400">{description}</p>
          </div>

          {children}
        </div>

        {/* Right Column: Shared Sidebar Utilities */}
        <aside className="space-y-6 lg:self-start lg:sticky lg:top-6">
          {/* Local Search Mockup */}
          <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-4 backdrop-blur-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search local elements..."
                value={localSearch}
                onChange={(e) => setLocalSearch(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-black/20 py-2.5 pl-9 pr-3 text-xs text-white placeholder-slate-400 outline-none ring-cyan-500/10 transition-all focus:border-cyan-500/30 focus:ring-4"
              />
            </div>
          </div>

          {/* Quick Actions Panel */}
          {quickActions.length > 0 && (
            <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-5 backdrop-blur-md">
              <div className="flex items-center gap-2 border-b border-white/5 pb-3">
                <Zap className="h-4 w-4 text-cyan-400" />
                <h3 className="text-xs font-semibold uppercase tracking-wider text-white">Quick Actions</h3>
              </div>
              <div className="mt-4 space-y-2">
                {quickActions.map((action, idx) => {
                  const ActionIcon = action.icon || ShieldCheck;
                  return (
                    <button
                      key={idx}
                      onClick={action.onClick}
                      disabled={action.disabled}
                      className="flex w-full items-center gap-3 rounded-xl border border-white/5 bg-white/[0.01] px-3 py-2.5 text-left text-xs font-semibold text-slate-300 hover:border-cyan-400/20 hover:bg-cyan-400/5 hover:text-white disabled:opacity-40 disabled:pointer-events-none transition-all"
                    >
                      <ActionIcon className="h-4 w-4 text-slate-400 shrink-0" />
                      <span>{action.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Recent Activity Panel */}
          {recentActivity.length > 0 && (
            <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-5 backdrop-blur-md">
              <div className="flex items-center gap-2 border-b border-white/5 pb-3">
                <Clock className="h-4 w-4 text-cyan-400" />
                <h3 className="text-xs font-semibold uppercase tracking-wider text-white">Recent Activity</h3>
              </div>
              <div className="mt-4 space-y-3">
                {recentActivity.map((activity, idx) => (
                  <div
                    key={idx}
                    onClick={activity.onClick}
                    className={[
                      "group rounded-xl border border-transparent p-2.5 transition-all text-left",
                      activity.onClick ? "hover:border-white/5 hover:bg-white/[0.02] cursor-pointer" : ""
                    ].join(" ")}
                  >
                    <p className="text-xs font-semibold text-slate-200 group-hover:text-white truncate">
                      {activity.label}
                    </p>
                    {activity.meta && (
                      <p className="mt-1 text-[10px] text-slate-400 group-hover:text-slate-300 truncate">
                        {activity.meta}
                      </p>
                    )}
                    {activity.timestamp && (
                      <p className="mt-1.5 text-[9px] text-slate-500">
                        {activity.timestamp}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
