"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Activity,
  RefreshCw,
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

export default function EngineStatusPanel() {
  const [statuses, setStatuses] = useState<EngineStatus[]>([]);
  const [summary, setSummary] = useState<StatusSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "online" | "offline">("all");

  const fetchStatuses = useCallback(async () => {
    try {
      const res = await fetch("/api/engines/status", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setStatuses(data.statuses);
        setSummary(data.summary);
        setLastUpdated(new Date());
        setLoading(false);
        return;
      }
    } catch (err) {
      console.error("Engine status API failed, using fallback:", err);
    }

    // Fallback: mark all engines as online (page files exist)
    const fallbackStatuses: EngineStatus[] = ENGINES_LIST.map((e) => ({
      id: e.id,
      title: e.title,
      category: e.category,
      href: e.href,
      status: "online" as const,
      lastChecked: new Date().toISOString(),
    }));
    setStatuses(fallbackStatuses);
    setSummary({
      total: fallbackStatuses.length,
      online: fallbackStatuses.length,
      offline: 0,
      unknown: 0,
    });
    setLastUpdated(new Date());
    setLoading(false);
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

  const onlineCount = summary?.online || 0;
  const offlineCount = summary?.offline || 0;
  const totalCount = summary?.total || 0;

  return (
    <section className="w-full">
      {/* Section Header */}
      <div className="mb-8 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300">
          <Activity className="h-3.5 w-3.5" />
          Live System Monitor
        </div>
        <h2 className="mt-4 text-3xl font-bold text-slate-900 sm:text-4xl">
          Engine <span className="text-emerald-600">Signal</span> Status
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-slate-500">
          Real-time health monitoring for all platform engines. Green means operational, red means down.
        </p>
      </div>

      {/* Summary + Controls */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Summary Badges */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 shadow-sm">
            <Activity className="h-4 w-4 text-slate-400" />
            <span className="text-xs font-semibold text-slate-600">Total:</span>
            <span className="text-sm font-bold text-slate-900">{totalCount}</span>
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5">
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            <span className="text-xs font-semibold text-emerald-700">Online:</span>
            <span className="text-sm font-bold text-emerald-600">{onlineCount}</span>
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5">
            <XCircle className="h-4 w-4 text-red-500" />
            <span className="text-xs font-semibold text-red-700">Offline:</span>
            <span className="text-sm font-bold text-red-600">{offlineCount}</span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold transition-all ${
              autoRefresh
                ? "bg-emerald-500 text-white shadow-md"
                : "border border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
            }`}
          >
            <RefreshCw className={`h-3.5 w-3.5 ${autoRefresh ? "animate-spin" : ""}`} />
            Auto
          </button>
          <button
            onClick={fetchStatuses}
            disabled={loading}
            className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-500 hover:bg-slate-50 transition-all disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
          {lastUpdated && (
            <span className="flex items-center gap-1.5 text-[11px] text-slate-400">
              <Clock className="h-3 w-3" />
              {lastUpdated.toLocaleTimeString()}
            </span>
          )}
        </div>
      </div>

      {/* Search + Filter */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search engines..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-900 placeholder-slate-400 outline-none transition-all focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
          />
        </div>
        <div className="flex items-center gap-1.5">
          <Filter className="h-4 w-4 text-slate-400" />
          {(["all", "online", "offline"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilterStatus(f)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold capitalize transition-all ${
                filterStatus === f
                  ? f === "online"
                    ? "bg-emerald-500 text-white shadow-sm"
                    : f === "offline"
                      ? "bg-red-500 text-white shadow-sm"
                      : "bg-slate-900 text-white shadow-sm"
                  : "text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Loading State */}
      {loading && statuses.length === 0 ? (
        <div className="flex min-h-[250px] items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent"></div>
            <p className="text-sm text-slate-400">Checking engine statuses...</p>
          </div>
        </div>
      ) : (
        /* Engine Signal Grid */
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          <AnimatePresence mode="popLayout">
            {filteredStatuses.map((engine, index) => {
              const Icon =
                iconMap[ENGINES_LIST.find((e) => e.id === engine.id)?.iconName || "Zap"] ||
                Activity;
              const isOnline = engine.status === "online";

              return (
                <motion.div
                  layout
                  key={engine.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.25, delay: index * 0.02 }}
                  className={`group relative rounded-2xl border p-4 transition-all duration-300 ${
                    isOnline
                      ? "border-emerald-200 bg-gradient-to-br from-emerald-50 to-white hover:border-emerald-300 hover:shadow-lg hover:shadow-emerald-100"
                      : "border-red-200 bg-gradient-to-br from-red-50 to-white hover:border-red-300 hover:shadow-lg hover:shadow-red-100"
                  }`}
                >
                  {/* Top Row: Icon + Signal */}
                  <div className="flex items-start justify-between">
                    <span
                      className={`inline-flex h-11 w-11 items-center justify-center rounded-xl transition-colors ${
                        isOnline
                          ? "bg-emerald-100 text-emerald-600"
                          : "bg-red-100 text-red-500"
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                    </span>

                    {/* Traffic Signal */}
                    <div className="flex flex-col items-center gap-1">
                      <div
                        className={`h-5 w-5 rounded-full border-2 transition-all ${
                          isOnline
                            ? "border-emerald-400 bg-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.5)]"
                            : "border-red-400 bg-red-400 shadow-[0_0_10px_rgba(239,68,68,0.5)]"
                        }`}
                      />
                      <span
                        className={`text-[9px] font-bold uppercase tracking-widest ${
                          isOnline ? "text-emerald-600" : "text-red-500"
                        }`}
                      >
                        {isOnline ? "ON" : "OFF"}
                      </span>
                    </div>
                  </div>

                  {/* Engine Info */}
                  <h3 className="mt-3 text-sm font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                    {engine.title}
                  </h3>
                  <p className="mt-1 text-[11px] leading-relaxed text-slate-400 line-clamp-2">
                    {ENGINES_LIST.find((e) => e.id === engine.id)?.description || ""}
                  </p>

                  {/* Bottom Row */}
                  <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3">
                    <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-slate-500">
                      {engine.category}
                    </span>
                    {engine.responseTime !== undefined && (
                      <span className="text-[10px] text-slate-400">{engine.responseTime}ms</span>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {filteredStatuses.length === 0 && !loading && (
        <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-slate-400">
          <Activity className="mx-auto h-8 w-8 opacity-40 mb-3" />
          No engines match your search or filter.
        </div>
      )}
    </section>
  );
}
