"use client";

import { useState, useEffect, useCallback } from "react";
import { Terminal, Play, Square, ChevronDown, ChevronRight, X, Server, Loader2 } from "lucide-react";

interface ServerConfig {
  id: string;
  name: string;
  port: number;
  dir: string;
  color: string;
}

const SERVERS: ServerConfig[] = [
  { id: "nextjs", name: "Next.js (Main App)", port: 3000, dir: "Current directory", color: "text-cyan-400" },
  { id: "ai-teacher", name: "Educational AI (FastAPI)", port: 8000, dir: "ai-teacher", color: "text-green-400" },
  { id: "claude-proxy", name: "Claude Proxy (Node)", port: 8080, dir: "antigravity-claude-proxy-main", color: "text-orange-400" },
  { id: "timetable", name: "Timetable Engine", port: 5173, dir: "timetable-web-app", color: "text-amber-400" },
  { id: "ebook-proxy", name: "Ebook Proxy Server", port: 9090, dir: "External", color: "text-violet-400" },
];

interface ServerStatus {
  id: string;
  name: string;
  port: number;
  running: boolean;
  startedAt: number;
}

export default function ServerConsole() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isLocalhost, setIsLocalhost] = useState(false);
  const [statuses, setStatuses] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState<string | null>(null);

  useEffect(() => {
    setIsLocalhost(
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1"
    );
  }, []);

  const pollStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/servers/status");
      const data = await res.json();
      const map: Record<string, boolean> = {};
      for (const s of data.servers) {
        map[s.id] = s.running;
      }
      setStatuses(map);
    } catch {}
  }, []);

  useEffect(() => {
    if (!isLocalhost) return;
    pollStatus();
    const interval = setInterval(pollStatus, 3000);
    return () => clearInterval(interval);
  }, [isLocalhost, pollStatus]);

  if (!isLocalhost) return null;

  const startServer = async (id: string) => {
    setLoading(id);
    try {
      await fetch("/api/servers/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ serverId: id }),
      });
      setTimeout(pollStatus, 1000);
    } catch {}
    setLoading(null);
  };

  const stopServer = async (id: string) => {
    setLoading(id);
    try {
      await fetch("/api/servers/stop", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ serverId: id }),
      });
      setTimeout(pollStatus, 500);
    } catch {}
    setLoading(null);
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed top-2 left-2 z-[9999] flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-900/95 px-3 py-1.5 text-xs font-mono text-slate-300 shadow-xl backdrop-blur transition hover:border-cyan-600 hover:bg-slate-800 hover:text-cyan-300"
        title="Server Console"
      >
        <Terminal size={14} />
        <span className="hidden sm:inline">Servers</span>
      </button>
    );
  }

  return (
    <div className="fixed top-2 left-2 z-[9999] w-[360px] max-w-[calc(100vw-16px)] rounded-xl border border-slate-700 bg-slate-900/95 shadow-2xl backdrop-blur-md">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-700 px-3 py-2">
        <div className="flex items-center gap-2">
          <Server size={14} className="text-cyan-400" />
          <span className="text-xs font-bold tracking-wide text-slate-200 uppercase">
            Server Console
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="rounded p-1 text-slate-400 hover:bg-slate-700 hover:text-white"
          >
            {isMinimized ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
          </button>
          <button
            onClick={() => setIsOpen(false)}
            className="rounded p-1 text-slate-400 hover:bg-slate-700 hover:text-red-400"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Server List */}
      {!isMinimized && (
        <div className="max-h-[60vh] overflow-y-auto p-2">
          {SERVERS.map((server) => {
            const isRunning = !!statuses[server.id];
            const isLoading = loading === server.id;

            return (
              <div
                key={server.id}
                className="mb-2 rounded-lg border border-slate-700/50 bg-slate-800/50 p-2.5 transition hover:border-slate-600"
              >
                {/* Server name + port + status */}
                <div className="mb-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-block h-2 w-2 rounded-full ${
                        isRunning ? "bg-green-400 shadow-[0_0_6px_rgba(74,222,128,0.6)]" : "bg-slate-600"
                      }`}
                    />
                    <span className={`text-xs font-semibold ${server.color}`}>
                      {server.name}
                    </span>
                  </div>
                  <span className="rounded bg-slate-700 px-1.5 py-0.5 font-mono text-[10px] text-slate-300">
                    :{server.port}
                  </span>
                </div>

                {/* Directory */}
                <div className="mb-2 text-[10px] text-slate-500">
                  📁 {server.dir}
                </div>

                {/* Run / Stop button */}
                <div className="flex items-center gap-2">
                  {isRunning ? (
                    <button
                      onClick={() => stopServer(server.id)}
                      disabled={isLoading}
                      className="flex flex-1 items-center justify-center gap-1.5 rounded-md bg-red-600/20 border border-red-600/40 px-3 py-1.5 text-[11px] font-semibold text-red-400 transition hover:bg-red-600/30 disabled:opacity-50"
                    >
                      {isLoading ? (
                        <Loader2 size={12} className="animate-spin" />
                      ) : (
                        <Square size={12} />
                      )}
                      Stop
                    </button>
                  ) : (
                    <button
                      onClick={() => startServer(server.id)}
                      disabled={isLoading}
                      className="flex flex-1 items-center justify-center gap-1.5 rounded-md bg-green-600/20 border border-green-600/40 px-3 py-1.5 text-[11px] font-semibold text-green-400 transition hover:bg-green-600/30 disabled:opacity-50"
                    >
                      {isLoading ? (
                        <Loader2 size={12} className="animate-spin" />
                      ) : (
                        <Play size={12} />
                      )}
                      Run
                    </button>
                  )}

                  {isRunning && (
                    <a
                      href={`http://localhost:${server.port}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-md bg-slate-700/50 border border-slate-600/40 px-2 py-1.5 text-[10px] text-slate-400 transition hover:bg-slate-700 hover:text-white"
                    >
                      Open ↗
                    </a>
                  )}
                </div>
              </div>
            );
          })}

          {/* Footer */}
          <div className="mt-1 border-t border-slate-700/50 pt-2 text-center text-[10px] text-slate-500">
            Green dot = running • Status auto-refreshes every 3s
          </div>
        </div>
      )}
    </div>
  );
}
