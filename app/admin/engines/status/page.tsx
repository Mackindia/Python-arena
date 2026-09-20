"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Activity,
  RefreshCw,
  ArrowLeft,
  Zap,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  Filter,
} from "lucide-react";
import { ENGINES_LIST, iconMap } from "@/src/constants/engines";

type EngineStatus = {
  id: string;
  title: string;
  category: string;
  href: string;
  status: "online" | "offline" | "unknown";
  responseTime?: number;
  lastChecked: string;
};

type StatusSummary = {
  total: number;
  online: number;
  offline: number;
  unknown: number;
};

const CATEGORY_COLORS: Record<string, string> = {
  "Academic Tools": "from-blue-500/20 to-blue-600/10 border-blue-500/30",
  "AI Generators": "from-purple-500/20 to-purple-600/10 border-purple-500/30",
  "Administration": "from-amber-500/20 to-amber-600/10 border-amber-500/30",
  "Analytics": "from-emerald-500/20 to-emerald-600/10 border-emerald-500/30",
  "Communication": "from-cyan-500/20 to-cyan-600/10 border-cyan-500/30",
  "Automation": "from-rose-500/20 to-rose-600/10 border-rose-500/30",
  "Utilities": "from-slate-500/20 to-slate-600/10 border-slate-500/30",
};

export default function EngineStatusPage() {
  const [statuses, setStatuses] = useState<EngineStatus[]>([]);
  const [summary, setSummary] = useState<StatusSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "online" | "offline">("all");

  const fetchStatuses = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/engines/status");
      if (res.ok) {
        const data = await res.json();
        setStatuses(data.statuses);
        setSummary(data.summary);
        setLastUpdated(new Date());
      }
    } catch (err) {
      console.error("Failed to fetch engine statuses:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatuses();
  }, [fetchStatuses]);

  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(fetchStatuses, 10000);
    return () => clearInterval(interval);
  }, [autoRefresh, fetchStatuses]);

  const filteredStatuses = statuses.filter((s) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      if (!s.title.toLowerCase().includes(q) && !s.category.toLowerCase().includes(q)) {
        return false;
      }
    }
    if (filterStatus !== "all" && s.status !== filterStatus) {
      return false;
    }
    return true;
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="rounded-[28px] border border-emerald-400/20 bg-[linear-gradient(135deg,rgba(6,78,59,0.85),rgba(15,23,42,0.92))] p-6 shadow-[0_24px_80px_rgba(6,78,59,0.25)] sm:p-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-400/10 text-emerald-400 ring-1 ring-emerald-400/20">
                <Activity className="h-3 w-3" />
              </span>
              <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-emerald-200/90">
                Engine Monitor
              </p>
            </div>
            <h1 className="mt-3 text-3xl font-semibold text-white sm:text-4xl">
              Signal Status Dashboard
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-300">
              Real-time health monitoring for all platform engines. Green signal indicates
              the engine is operational, red signal indicates it is down or unreachable.
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-3 rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
            <Zap className="h-4 w-4 text-emerald-400" />
            <div className="text-right">
              <p className="text-[10px] uppercase tracking-wider text-slate-400">
                Total Engines
              </p>
              <p className="text-xs font-semibold text-white uppercase tracking-wide mt-0.5">
                {summary?.total || 0}
              </p>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative max-w-md flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search engines..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-black/30 py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-400 outline-none transition-all focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold transition-all ${
                autoRefresh
                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-400/30"
                  : "bg-white/5 text-slate-400 border border-white/10 hover:text-white hover:bg-white/10"
              }`}
            >
              <RefreshCw className={`h-3.5 w-3.5 ${autoRefresh ? "animate-spin" : ""}`} />
              Auto Refresh
            </button>
            <button
              onClick={fetchStatuses}
              disabled={loading}
              className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs font-semibold text-slate-400 hover:text-white hover:bg-white/10 transition-all disabled:opacity-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
              Refresh Now
            </button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-white/10 bg-slate-900/40 p-4 backdrop-blur-md"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5">
                <Activity className="h-5 w-5 text-slate-400" />
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-slate-500">Total</p>
                <p className="text-2xl font-bold text-white">{summary.total}</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="rounded-2xl border border-emerald-400/20 bg-emerald-400/5 p-4 backdrop-blur-md"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-400/10">
                <CheckCircle2 className="h-5 w-5 text-emerald-400" />
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-emerald-500/70">Online</p>
                <p className="text-2xl font-bold text-emerald-400">{summary.online}</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-2xl border border-red-400/20 bg-red-400/5 p-4 backdrop-blur-md"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-400/10">
                <XCircle className="h-5 w-5 text-red-400" />
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-red-500/70">Offline</p>
                <p className="text-2xl font-bold text-red-400">{summary.offline}</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="rounded-2xl border border-white/10 bg-slate-900/40 p-4 backdrop-blur-md"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5">
                <Clock className="h-5 w-5 text-slate-400" />
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-slate-500">Last Checked</p>
                <p className="text-sm font-semibold text-white">
                  {lastUpdated ? lastUpdated.toLocaleTimeString() : "--:--:--"}
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center gap-2">
        <Filter className="h-4 w-4 text-slate-500" />
        {(["all", "online", "offline"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilterStatus(f)}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold uppercase tracking-wider transition-all ${
              filterStatus === f
                ? f === "online"
                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-400/30"
                  : f === "offline"
                    ? "bg-red-500/20 text-red-300 border border-red-400/30"
                    : "bg-white/10 text-white border border-white/20"
                : "text-slate-500 border border-transparent hover:text-slate-300 hover:bg-white/5"
            }`}
          >
            {f === "all" ? "All" : f === "online" ? "Online" : "Offline"}
          </button>
        ))}
      </div>

      {/* Engine Signal Grid */}
      {loading && statuses.length === 0 ? (
        <div className="flex min-h-[300px] items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="h-10 w-10 animate-spin rounded-full border-2 border-emerald-400 border-t-transparent"></div>
            <p className="text-sm text-slate-400">Checking engine statuses...</p>
          </div>
        </div>
      ) : (
        <motion.div layout className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence mode="popLayout">
            {filteredStatuses.map((engine, index) => {
              const Icon = iconMap[
                ENGINES_LIST.find((e) => e.id === engine.id)?.iconName || "Zap"
              ] || Activity;
              const isOnline = engine.status === "online";
              const categoryColor =
                CATEGORY_COLORS[engine.category] || "from-slate-500/20 to-slate-600/10 border-slate-500/30";

              return (
                <motion.div
                  layout
                  key={engine.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2, delay: index * 0.02 }}
                  className={`group relative rounded-3xl border bg-gradient-to-br p-5 backdrop-blur-md transition-all duration-300 ${
                    isOnline
                      ? `border-emerald-500/20 from-emerald-500/5 to-emerald-600/5 hover:border-emerald-400/40 hover:shadow-[0_0_30px_rgba(16,185,129,0.1)]`
                      : `border-red-500/20 from-red-500/5 to-red-600/5 hover:border-red-400/40 hover:shadow-[0_0_30px_rgba(239,68,68,0.1)]`
                  }`}
                >
                  {/* Signal Indicator */}
                  <div className="flex items-start justify-between">
                    <span
                      className={`inline-flex h-12 w-12 items-center justify-center rounded-2xl border transition-colors ${
                        isOnline
                          ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-400"
                          : "border-red-400/20 bg-red-400/10 text-red-400"
                      }`}
                    >
                      <Icon className="h-6 w-6" />
                    </span>

                    {/* Traffic Signal */}
                    <div className="flex flex-col items-center gap-1.5">
                      <div
                        className={`h-4 w-4 rounded-full transition-all ${
                          isOnline
                            ? "bg-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.6)] animate-pulse"
                            : "bg-red-400 shadow-[0_0_12px_rgba(239,68,68,0.6)] animate-pulse"
                        }`}
                      />
                      <span
                        className={`text-[9px] font-bold uppercase tracking-widest ${
                          isOnline ? "text-emerald-400" : "text-red-400"
                        }`}
                      >
                        {isOnline ? "ON" : "OFF"}
                      </span>
                    </div>
                  </div>

                  {/* Engine Info */}
                  <div className="mt-4">
                    <h3
                      className={`text-lg font-semibold transition-colors ${
                        isOnline ? "text-white group-hover:text-emerald-200" : "text-white group-hover:text-red-200"
                      }`}
                    >
                      {engine.title}
                    </h3>
                    <p className="mt-1.5 text-xs leading-relaxed text-slate-400 group-hover:text-slate-300 transition-colors">
                      {ENGINES_LIST.find((e) => e.id === engine.id)?.description || ""}
                    </p>
                  </div>

                  {/* Status Bar */}
                  <div className="mt-5 flex items-center justify-between border-t border-white/5 pt-4">
                    <div className="flex items-center gap-3">
                      <span className={`rounded-lg px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${categoryColor}`}>
                        {engine.category}
                      </span>
                      {engine.responseTime !== undefined && (
                        <span className="text-[10px] text-slate-500">
                          {engine.responseTime}ms
                        </span>
                      )}
                    </div>
                    <Link
                      href={engine.href}
                      className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all ${
                        isOnline
                          ? "border border-emerald-400/20 bg-emerald-400/10 text-emerald-200 hover:bg-emerald-400/20 hover:text-white"
                          : "border border-white/10 bg-white/5 text-slate-500 cursor-not-allowed opacity-50"
                      }`}
                    >
                      {isOnline ? "Open" : "Unavailable"}
                    </Link>
                  </div>

                  {/* Last Checked */}
                  <div className="mt-3 flex items-center gap-1.5 text-[10px] text-slate-600">
                    <Clock className="h-3 w-3" />
                    Checked {new Date(engine.lastChecked).toLocaleTimeString()}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>
      )}

      {filteredStatuses.length === 0 && !loading && (
        <div className="rounded-2xl border border-white/5 bg-white/[0.01] p-10 text-center text-slate-400">
          <Activity className="mx-auto h-8 w-8 opacity-40 mb-3" />
          No engines match your search or filter criteria.
        </div>
      )}

      {/* Back Link */}
      <Link
        href="/admin/engines"
        className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Engine Launcher
      </Link>
    </div>
  );
}
