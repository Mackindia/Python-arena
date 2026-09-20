"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play,
  Square,
  RefreshCw,
  Terminal,
  ChevronDown,
  ChevronUp,
  Zap,
} from "lucide-react";

type ServerInfo = {
  id: string;
  name: string;
  port: number;
  color: string;
  command: string;
  status: "running" | "stopped";
  pid?: string;
};

const COLOR_MAP: Record<string, { bg: string; border: string; glow: string; text: string; led: string }> = {
  cyan:    { bg: "from-cyan-950/80 to-cyan-900/30",    border: "border-cyan-500/40",    glow: "shadow-[0_0_15px_rgba(6,182,212,0.2)]",    text: "text-cyan-400",    led: "bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.8)]" },
  emerald: { bg: "from-emerald-950/80 to-emerald-900/30", border: "border-emerald-500/40", glow: "shadow-[0_0_15px_rgba(16,185,129,0.2)]", text: "text-emerald-400", led: "bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.8)]" },
  violet:  { bg: "from-violet-950/80 to-violet-900/30",  border: "border-violet-500/40",  glow: "shadow-[0_0_15px_rgba(139,92,246,0.2)]",  text: "text-violet-400",  led: "bg-violet-400 shadow-[0_0_8px_rgba(139,92,246,0.8)]" },
  amber:   { bg: "from-amber-950/80 to-amber-900/30",   border: "border-amber-500/40",   glow: "shadow-[0_0_15px_rgba(245,158,11,0.2)]",   text: "text-amber-400",   led: "bg-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.8)]" },
  rose:    { bg: "from-rose-950/80 to-rose-900/30",     border: "border-rose-500/40",    glow: "shadow-[0_0_15px_rgba(244,63,94,0.2)]",     text: "text-rose-400",    led: "bg-rose-400 shadow-[0_0_8px_rgba(244,63,94,0.8)]" },
};

function ServerSlot({
  server,
  onAction,
  working,
}: {
  server: ServerInfo;
  onAction: (id: string, action: "start" | "stop") => void;
  working: boolean;
}) {
  const isRunning = server.status === "running";
  const colors = COLOR_MAP[server.color] || COLOR_MAP.cyan;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className={`relative flex items-center gap-3 rounded-xl border p-2.5 transition-all duration-300 ${
        isRunning
          ? `${colors.border} bg-gradient-to-r ${colors.bg} ${colors.glow}`
          : "border-slate-700/50 bg-slate-800/40 hover:border-slate-600/50"
      }`}
    >
      {/* Animated LED */}
      <div className="relative flex flex-col items-center">
        <div
          className={`h-2.5 w-2.5 rounded-full transition-all duration-500 ${
            isRunning
              ? `${colors.led} animate-pulse`
              : "bg-slate-600"
          }`}
        />
        {isRunning && (
          <div className={`absolute inset-0 h-2.5 w-2.5 rounded-full ${colors.led} blur-sm opacity-60`} />
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <h4 className={`text-[11px] font-bold truncate ${isRunning ? colors.text : "text-slate-300"}`}>
          {server.name}
        </h4>
        <div className="flex items-center gap-1.5">
          <span className="font-mono text-[9px] text-slate-500">:{server.port}</span>
          {isRunning && server.pid && (
            <span className="font-mono text-[8px] text-slate-600">PID {server.pid}</span>
          )}
        </div>
      </div>

      {/* Power Button */}
      <button
        onClick={() => onAction(server.id, isRunning ? "stop" : "start")}
        disabled={working}
        className={`relative flex h-9 w-9 items-center justify-center rounded-lg border-2 transition-all duration-200 disabled:opacity-40 active:scale-90 ${
          isRunning
            ? "border-red-500/60 bg-red-500/20 text-red-400 hover:bg-red-500/30 hover:shadow-[0_0_12px_rgba(239,68,68,0.3)]"
            : `border-green-500/60 bg-green-500/20 text-green-400 hover:bg-green-500/30 hover:shadow-[0_0_12px_rgba(34,197,94,0.3)]`
        }`}
      >
        {working ? (
          <RefreshCw className="h-3.5 w-3.5 animate-spin" />
        ) : isRunning ? (
          <Square className="h-3.5 w-3.5 fill-current" />
        ) : (
          <Play className="h-3.5 w-3.5 fill-current" />
        )}
      </button>
    </motion.div>
  );
}

export default function GamingConsole() {
  const [isOpen, setIsOpen] = useState(true);
  const [servers, setServers] = useState<ServerInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [workingId, setWorkingId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: "ok" | "err" } | null>(null);

  const showToast = (msg: string, type: "ok" | "err") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/servers", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setServers(data.servers);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 5000);
    return () => clearInterval(interval);
  }, [fetchStatus]);

  const handleAction = async (serverId: string, action: "start" | "stop") => {
    setWorkingId(serverId);
    const serverName = servers.find((s) => s.id === serverId)?.name || serverId;
    try {
      const res = await fetch("/api/servers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, serverId }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(`${action === "start" ? "▶ Starting" : "■ Stopped"} ${serverName}`, "ok");
      } else {
        showToast(data.message || "Action failed", "err");
      }
    } catch (err) {
      showToast("Network error", "err");
    } finally {
      setWorkingId(null);
      setTimeout(fetchStatus, 2000);
    }
  };

  const runningCount = servers.filter((s) => s.status === "running").length;

  return (
    <div className="w-full">
      {/* Toggle Button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className={`flex w-full items-center justify-between rounded-t-2xl border-2 border-b-0 px-4 py-3 transition-all duration-300 ${
          isOpen
            ? "border-cyan-500/40 bg-gradient-to-r from-slate-800 to-slate-900 shadow-[0_0_20px_rgba(6,182,212,0.15)]"
            : "border-slate-700/50 bg-slate-800/80 rounded-b-2xl hover:border-slate-600/50"
        }`}
      >
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <Zap className="h-4 w-4 text-cyan-400" />
            <div className="absolute inset-0 h-4 w-4 text-cyan-400 blur-sm opacity-60">
              <Zap className="h-4 w-4" />
            </div>
          </div>
          <span className="font-mono text-xs font-bold tracking-wider text-cyan-400">
            SERVER CONSOLE
          </span>
        </div>

        <div className="flex items-center gap-3">
          {/* Running count badge */}
          <div className="flex items-center gap-1.5 rounded-full bg-slate-700/50 px-2.5 py-1">
            <div className="flex gap-0.5">
              {servers.map((s) => (
                <div
                  key={s.id}
                  className={`h-1.5 w-1.5 rounded-full transition-all ${
                    s.status === "running"
                      ? "bg-green-400 shadow-[0_0_4px_rgba(34,197,94,0.8)]"
                      : "bg-slate-600"
                  }`}
                />
              ))}
            </div>
            <span className="font-mono text-[9px] font-bold text-slate-400">
              {runningCount}/{servers.length}
            </span>
          </div>

          {/* Toggle icon */}
          <motion.div
            animate={{ rotate: isOpen ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronDown className="h-4 w-4 text-slate-400" />
          </motion.div>
        </div>
      </motion.button>

      {/* Console Body */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden rounded-b-2xl border-2 border-t-0 border-cyan-500/20 bg-gradient-to-b from-slate-900 to-slate-950 shadow-[0_20px_60px_rgba(0,0,0,0.5)]"
          >
            <div className="p-3">
              {loading ? (
                <div className="flex items-center justify-center py-6">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-cyan-400 border-t-transparent" />
                </div>
              ) : (
                <div className="space-y-1.5">
                  {servers.map((server) => (
                    <ServerSlot
                      key={server.id}
                      server={server}
                      onAction={handleAction}
                      working={workingId === server.id}
                    />
                  ))}
                </div>
              )}

              {/* Footer */}
              <div className="mt-3 flex items-center justify-between border-t border-slate-700/30 pt-2">
                <div className="flex items-center gap-1.5">
                  <Terminal className="h-3 w-3 text-slate-600" />
                  <span className="font-mono text-[9px] text-slate-600">LIVE</span>
                  <div className="h-1 w-1 rounded-full bg-green-500 animate-pulse" />
                </div>
                <button
                  onClick={fetchStatus}
                  className="flex items-center gap-1 rounded px-2 py-1 text-[9px] font-semibold text-slate-500 hover:bg-slate-800 hover:text-slate-300 transition-colors"
                >
                  <RefreshCw className="h-2.5 w-2.5" />
                  SYNC
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className={`absolute -bottom-12 left-0 right-0 z-50 rounded-lg border px-3 py-2 text-center text-[11px] font-bold shadow-lg ${
              toast.type === "ok"
                ? "border-green-500/30 bg-green-950 text-green-400"
                : "border-red-500/30 bg-red-950 text-red-400"
            }`}
          >
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
