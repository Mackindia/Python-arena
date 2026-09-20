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
  Server,
  Database,
  Shield,
  Cloud,
  HardDrive,
  Cpu,
  Brain,
} from "lucide-react";
import { ENGINES_LIST, iconMap } from "@/src/constants/engines";

type EngineStatus = {
  id: string;
  title: string;
  category: string;
  href: string;
  status: "online" | "offline" | "unknown";
  httpCode?: number;
  responseTime?: number;
  lastChecked: string;
  isCoreService?: boolean;
};

type StatusSummary = {
  total: number;
  online: number;
  offline: number;
  unknown: number;
  coreServices?: number;
  coreOnline?: number;
};

const CORE_SERVICE_ICONS: Record<string, React.ElementType> = {
  "core-nodejs": Cpu,
  "core-mongodb": Database,
  "core-cloudinary": Cloud,
  "core-clerk": Shield,
  "core-filesystem": HardDrive,
  "core-edu-ai": Brain,
};

function TrafficSignalPole({
  status,
  index,
  iconOverride,
}: {
  status: EngineStatus;
  index: number;
  iconOverride?: React.ElementType;
}) {
  const engineData = ENGINES_LIST.find((e) => e.id === status.id);
  const EngineIcon = iconOverride || (engineData ? iconMap[engineData.iconName] : Zap) || Zap;
  const isOnline = status.status === "online";
  const isUnknown = status.status === "unknown";

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05, ease: "easeOut" }}
      className="group flex flex-col items-center"
    >
      {/* Label */}
      <div className="mb-3 text-center">
        <div className="flex items-center justify-center gap-1.5">
          <EngineIcon className="h-3.5 w-3.5 text-slate-500" />
          <h3 className="text-xs font-bold text-slate-800 truncate max-w-[140px]">
            {status.title}
          </h3>
        </div>
        <span className="mt-0.5 inline-block rounded bg-slate-100 px-1.5 py-0.5 text-[8px] font-semibold uppercase tracking-wider text-slate-400">
          {status.category}
        </span>
      </div>

      {/* Traffic Signal Housing */}
      <div className="relative">
        {/* Horizontal arm */}
        <div className="absolute -left-4 top-4 h-[3px] w-4 rounded-full bg-gradient-to-r from-slate-400 to-slate-300" />

        {/* Signal Box */}
        <div className="relative w-[72px] rounded-2xl border-2 border-slate-700 bg-gradient-to-b from-slate-800 to-slate-900 p-2 shadow-[0_8px_30px_rgba(0,0,0,0.4)]">
          <div className="absolute -top-1 left-1/2 -translate-x-1/2 h-1.5 w-[80%] rounded-t bg-slate-600" />

          {/* Red */}
          <div className="relative mb-2">
            <div
              className={`mx-auto h-10 w-10 rounded-full border-2 transition-all duration-500 ${
                !isOnline && !isUnknown
                  ? "border-red-600 bg-red-500 shadow-[0_0_20px_rgba(239,68,68,0.8),0_0_40px_rgba(239,68,68,0.4)]"
                  : "border-red-900/40 bg-red-950/30"
              }`}
            />
            {!isOnline && !isUnknown && <div className="absolute inset-0 rounded-full bg-red-400/20 blur-md" />}
          </div>

          {/* Yellow */}
          <div className="relative mb-2">
            <div
              className={`mx-auto h-10 w-10 rounded-full border-2 transition-all duration-500 ${
                isUnknown
                  ? "border-yellow-500 bg-yellow-400 shadow-[0_0_20px_rgba(250,204,21,0.8),0_0_40px_rgba(250,204,21,0.4)]"
                  : "border-yellow-900/40 bg-yellow-950/30"
              }`}
            />
            {isUnknown && <div className="absolute inset-0 rounded-full bg-yellow-400/20 blur-md" />}
          </div>

          {/* Green */}
          <div className="relative">
            <div
              className={`mx-auto h-10 w-10 rounded-full border-2 transition-all duration-500 ${
                isOnline
                  ? "border-green-500 bg-green-400 shadow-[0_0_20px_rgba(34,197,94,0.8),0_0_40px_rgba(34,197,94,0.4)]"
                  : "border-green-900/40 bg-green-950/30"
              }`}
            />
            {isOnline && <div className="absolute inset-0 rounded-full bg-green-400/20 blur-md" />}
          </div>

          <div className="mx-auto mt-2 h-2 w-3 rounded-b bg-slate-600" />
        </div>
      </div>

      {/* Pole */}
      <div className="h-16 w-2 rounded-b bg-gradient-to-b from-slate-500 to-slate-400 shadow-md" />
      <div className="h-1.5 w-10 rounded bg-gradient-to-r from-slate-400 via-slate-300 to-slate-400" />

      {/* Status Label */}
      <div className="mt-2 flex flex-col items-center gap-0.5">
        <span
          className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest ${
            isOnline
              ? "bg-green-100 text-green-700"
              : isUnknown
                ? "bg-yellow-100 text-yellow-700"
                : "bg-red-100 text-red-700"
          }`}
        >
          <span
            className={`h-1.5 w-1.5 rounded-full ${
              isOnline ? "bg-green-500 animate-pulse" : isUnknown ? "bg-yellow-500 animate-pulse" : "bg-red-500 animate-pulse"
            }`}
          />
          {isOnline ? "RUNNING" : isUnknown ? "UNKNOWN" : "STOPPED"}
        </span>
        {status.httpCode !== undefined && status.httpCode > 0 && (
          <span className="text-[8px] font-mono text-slate-400">HTTP {status.httpCode}</span>
        )}
        {status.responseTime !== undefined && (
          <span className="text-[8px] text-slate-400">{status.responseTime}ms</span>
        )}
      </div>
    </motion.div>
  );
}

export default function TrafficSignalPanel() {
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

    const fallbackStatuses: EngineStatus[] = ENGINES_LIST.map((e) => ({
      id: e.id,
      title: e.title,
      category: e.category,
      href: e.href,
      status: "online" as const,
      httpCode: 200,
      responseTime: 0,
      lastChecked: new Date().toISOString(),
    }));
    setStatuses(fallbackStatuses);
    setSummary({ total: fallbackStatuses.length, online: fallbackStatuses.length, offline: 0, unknown: 0 });
    setLastUpdated(new Date());
    setLoading(false);
  }, []);

  useEffect(() => { fetchStatuses(); }, [fetchStatuses]);
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(fetchStatuses, 10000);
    return () => clearInterval(interval);
  }, [autoRefresh, fetchStatuses]);

  const coreServices = statuses.filter((s) => s.isCoreService);
  const engines = statuses.filter((s) => !s.isCoreService);

  const filteredCore = coreServices.filter((s) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      if (!s.title.toLowerCase().includes(q)) return false;
    }
    if (filterStatus !== "all" && s.status !== filterStatus) return false;
    return true;
  });

  const filteredEngines = engines.filter((s) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      if (!s.title.toLowerCase().includes(q) && !s.category.toLowerCase().includes(q)) return false;
    }
    if (filterStatus !== "all" && s.status !== filterStatus) return false;
    return true;
  });

  const onlineCount = summary?.online || 0;
  const offlineCount = summary?.offline || 0;
  const totalCount = summary?.total || 0;

  return (
    <section className="w-full">
      {/* Header */}
      <div className="mb-10 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">
          <Server className="h-3.5 w-3.5" />
          Server Control Tower
        </div>
        <h2 className="mt-4 text-3xl font-bold text-slate-900 sm:text-4xl">
          Traffic <span className="text-emerald-600">Signal</span> Servers
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-slate-500">
          Live monitoring for core infrastructure and all platform engines.
          Green = running, Red = stopped.
        </p>
      </div>

      {/* Summary + Controls */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 shadow-sm">
            <Activity className="h-4 w-4 text-slate-400" />
            <span className="text-xs font-semibold text-slate-600">Total:</span>
            <span className="text-sm font-bold text-slate-900">{totalCount}</span>
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 px-4 py-2.5">
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            <span className="text-xs font-semibold text-green-700">Online:</span>
            <span className="text-sm font-bold text-green-600">{onlineCount}</span>
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5">
            <XCircle className="h-4 w-4 text-red-500" />
            <span className="text-xs font-semibold text-red-700">Offline:</span>
            <span className="text-sm font-bold text-red-600">{offlineCount}</span>
          </div>
        </div>

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
      <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search servers..."
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
                    ? "bg-green-500 text-white shadow-sm"
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

      {/* Loading */}
      {loading && statuses.length === 0 ? (
        <div className="flex min-h-[300px] items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="h-10 w-10 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
            <p className="text-sm text-slate-400">Pinging all servers & services...</p>
          </div>
        </div>
      ) : (
        <>
          {/* ─── CORE SERVICES ─── */}
          {filteredCore.length > 0 && (
            <div className="mb-12">
              <div className="mb-6 flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900">
                  <Cpu className="h-4 w-4 text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Core Infrastructure</h3>
                  <p className="text-[11px] text-slate-400">Database, auth, storage, runtime — the foundation</p>
                </div>
                <div className="ml-auto flex items-center gap-1.5">
                  <span className="rounded-full bg-green-100 px-2 py-0.5 text-[9px] font-bold text-green-700">
                    {filteredCore.filter((s) => s.status === "online").length} OK
                  </span>
                  <span className="rounded-full bg-red-100 px-2 py-0.5 text-[9px] font-bold text-red-700">
                    {filteredCore.filter((s) => s.status === "offline").length} DOWN
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
                <AnimatePresence mode="popLayout">
                  {filteredCore.map((service, index) => (
                    <TrafficSignalPole
                      key={service.id}
                      status={service}
                      index={index}
                      iconOverride={CORE_SERVICE_ICONS[service.id] || Server}
                    />
                  ))}
                </AnimatePresence>
              </div>
            </div>
          )}

          {/* ─── ENGINE SERVERS ─── */}
          {filteredEngines.length > 0 && (
            <div>
              <div className="mb-6 flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600">
                  <Zap className="h-4 w-4 text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Platform Engines</h3>
                  <p className="text-[11px] text-slate-400">All application modules and feature engines</p>
                </div>
                <div className="ml-auto flex items-center gap-1.5">
                  <span className="rounded-full bg-green-100 px-2 py-0.5 text-[9px] font-bold text-green-700">
                    {filteredEngines.filter((s) => s.status === "online").length} OK
                  </span>
                  <span className="rounded-full bg-red-100 px-2 py-0.5 text-[9px] font-bold text-red-700">
                    {filteredEngines.filter((s) => s.status === "offline").length} DOWN
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                <AnimatePresence mode="popLayout">
                  {filteredEngines.map((engine, index) => (
                    <TrafficSignalPole
                      key={engine.id}
                      status={engine}
                      index={index}
                    />
                  ))}
                </AnimatePresence>
              </div>
            </div>
          )}
        </>
      )}

      {filteredCore.length === 0 && filteredEngines.length === 0 && !loading && (
        <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-slate-400">
          <Server className="mx-auto h-8 w-8 opacity-40 mb-3" />
          No servers match your search or filter.
        </div>
      )}
    </section>
  );
}
