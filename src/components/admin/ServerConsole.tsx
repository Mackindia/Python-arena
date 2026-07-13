"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  Terminal, Play, Square, ChevronDown, ChevronRight, X, Server,
  Loader2, Trash2, Maximize2, Minimize2, AlertTriangle, GripVertical,
} from "lucide-react";

const MANAGER_URL = "http://localhost:7777";

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

export default function ServerConsole() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isLocalhost, setIsLocalhost] = useState(false);
  const [managerUp, setManagerUp] = useState(false);
  const [statuses, setStatuses] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState<string | null>(null);
  const [activeServer, setActiveServer] = useState<string | null>(null);
  const [logs, setLogs] = useState<Record<string, string[]>>({});
  const [expanded, setExpanded] = useState(false);
  const logEndRef = useRef<HTMLDivElement>(null);
  const eventSourcesRef = useRef<Record<string, EventSource>>({});
  const [claudeModel, setClaudeModel] = useState("gemini-3-flash");
  const [position, setPosition] = useState({ x: 8, y: 8 });
  const [isDragging, setIsDragging] = useState(false);
  const dragOffset = useRef({ x: 0, y: 0 });

  useEffect(() => {
    setIsLocalhost(
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1"
    );
  }, []);

  const checkManager = useCallback(async () => {
    try {
      const res = await fetch(`${MANAGER_URL}/status`, { signal: AbortSignal.timeout(2000) });
      if (res.ok) {
        setManagerUp(true);
        const data = await res.json();
        const map: Record<string, boolean> = {};
        for (const s of data.servers) map[s.id] = s.running;
        setStatuses(map);
      } else {
        setManagerUp(false);
      }
    } catch {
      setManagerUp(false);
    }
  }, []);

  useEffect(() => {
    if (!isLocalhost) return;
    checkManager();
    const interval = setInterval(checkManager, 3000);
    return () => clearInterval(interval);
  }, [isLocalhost, checkManager]);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs, activeServer]);

  useEffect(() => {
    if (!isDragging) return;
    const onMove = (e: MouseEvent) => {
      setPosition({
        x: Math.max(0, Math.min(window.innerWidth - 100, e.clientX - dragOffset.current.x)),
        y: Math.max(0, Math.min(window.innerHeight - 40, e.clientY - dragOffset.current.y)),
      });
    };
    const onUp = () => setIsDragging(false);
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [isDragging]);

  if (!isLocalhost) return null;

  const startServer = async (id: string) => {
    if (!managerUp) return;
    setLoading(id);
    try {
      const res = await fetch(`${MANAGER_URL}/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const data = await res.json();
      if (data.error) {
        setLogs((prev) => ({ ...prev, [id]: [...(prev[id] || []), `[Error: ${data.error}]`] }));
      }
      setTimeout(() => {
        checkManager();
        connectToLogs(id);
      }, 500);
    } catch (e: any) {
      setLogs((prev) => ({ ...prev, [id]: [...(prev[id] || []), `[Error: ${e.message}]`] }));
    }
    setLoading(null);
  };

  const stopServer = async (id: string) => {
    if (!managerUp) return;
    setLoading(id);
    // Optimistic update — immediately show as stopped
    setStatuses((prev) => ({ ...prev, [id]: false }));
    try {
      await fetch(`${MANAGER_URL}/stop`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      disconnectFromLogs(id);
      setLogs((prev) => ({ ...prev, [id]: [...(prev[id] || []), `[Server stopped]`] }));
      // Multiple polls to catch the state change
      setTimeout(checkManager, 300);
      setTimeout(checkManager, 1000);
    } catch {}
    setLoading(null);
  };

  const connectToLogs = (id: string) => {
    if (eventSourcesRef.current[id]) return;
    const es = new EventSource(`${MANAGER_URL}/logs?id=${id}`);
    eventSourcesRef.current[id] = es;
    es.onmessage = (e) => {
      if (e.data === "__EXIT__") {
        es.close();
        delete eventSourcesRef.current[id];
        checkManager();
        return;
      }
      try {
        const parsed = JSON.parse(e.data);
        if (parsed.error) return;
      } catch {}
      setLogs((prev) => ({
        ...prev,
        [id]: [...(prev[id] || []), e.data],
      }));
    };
    es.onerror = () => {
      es.close();
      delete eventSourcesRef.current[id];
    };
  };

  const disconnectFromLogs = (id: string) => {
    eventSourcesRef.current[id]?.close();
    delete eventSourcesRef.current[id];
  };

  const viewServer = (id: string) => {
    if (activeServer === id) {
      setActiveServer(null);
      return;
    }
    setActiveServer(id);
    if (statuses[id] && !eventSourcesRef.current[id]) {
      connectToLogs(id);
    }
  };

  const clearLogs = (id: string) => {
    setLogs((prev) => ({ ...prev, [id]: [] }));
  };

  const launchClaude = async () => {
    const cmd = `$env:ANTHROPIC_BASE_URL='http://localhost:8080'\n$env:ANTHROPIC_AUTH_TOKEN='dummy'\nclaude --model ${claudeModel}`;
    try {
      const res = await fetch("/api/servers/open-terminal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ command: cmd }),
      });
      const data = await res.json();
      if (data.error) console.error("Terminal error:", data.error);
    } catch (e: any) {
      console.error("Fetch failed:", e.message);
    }
  };

  const onDragStart = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    dragOffset.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    };
  };

  if (!isOpen) {
    return (
      <button
        onMouseDown={onDragStart}
        onClick={() => setIsOpen(true)}
        className="fixed z-[9999] flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-900/95 px-3 py-1.5 text-xs font-mono text-slate-300 shadow-xl backdrop-blur transition hover:border-cyan-600 hover:bg-slate-800 hover:text-cyan-300 cursor-move select-none"
        style={{ left: position.x, top: position.y }}
        title="Server Console (drag to move)"
      >
        <GripVertical size={12} className="text-slate-500" />
        <Terminal size={14} />
        <span className="hidden sm:inline">Servers</span>
      </button>
    );
  }

  return (
    <div
      className={`fixed z-[9999] flex flex-col rounded-xl border border-slate-700 bg-slate-900/95 shadow-2xl backdrop-blur-md transition-all select-none ${
        expanded
          ? "h-[80vh] w-[700px] max-w-[calc(100vw-16px)]"
          : activeServer
          ? "h-[500px] w-[520px] max-w-[calc(100vw-16px)]"
          : "w-[360px] max-w-[calc(100vw-16px)]"
      }`}
      style={{ left: position.x, top: position.y }}
    >
      {/* Header — drag handle */}
      <div
        onMouseDown={onDragStart}
        className="flex items-center justify-between border-b border-slate-700 px-3 py-2 cursor-move"
      >
        <div className="flex items-center gap-2">
          <GripVertical size={14} className="text-slate-500" />
          <Server size={14} className="text-cyan-400" />
          <span className="text-xs font-bold tracking-wide text-slate-200 uppercase">
            Server Console
          </span>
          <span
            className={`h-2 w-2 rounded-full ${managerUp ? "bg-green-400" : "bg-red-400"}`}
            title={managerUp ? "Manager running" : "Manager offline"}
          />
        </div>
        <div className="flex items-center gap-1">
          {activeServer && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="rounded p-1 text-slate-400 hover:bg-slate-700 hover:text-white"
            >
              {expanded ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
            </button>
          )}
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

      {!isMinimized && (
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          {/* Manager warning */}
          {!managerUp && (
            <div className="mx-2 mt-2 flex items-start gap-2 rounded-lg border border-amber-600/40 bg-amber-900/20 px-3 py-2">
              <AlertTriangle size={14} className="mt-0.5 flex-shrink-0 text-amber-400" />
              <div className="text-[11px] text-amber-200">
                <p className="font-semibold">Server Manager is offline</p>
                <p className="mt-0.5 text-amber-300/70">
                  Run in terminal: <code className="rounded bg-black/30 px-1 font-mono">npm run servers</code>
                </p>
              </div>
            </div>
          )}

          {/* Server List */}
          <div className="flex-shrink-0 overflow-y-auto p-2">
            {SERVERS.map((server) => {
              const isRunning = !!statuses[server.id];
              const isLoading = loading === server.id;
              const isActive = activeServer === server.id;

              return (
                <div
                  key={server.id}
                  className={`mb-1.5 rounded-lg border p-2 transition ${
                    isActive
                      ? "border-cyan-600/60 bg-slate-800"
                      : "border-slate-700/50 bg-slate-800/50 hover:border-slate-600"
                  }`}
                >
                  <div className="mb-1.5 flex items-center justify-between">
                    <button
                      onClick={() => viewServer(server.id)}
                      className="flex items-center gap-2 text-left"
                    >
                      <span
                        className={`inline-block h-2 w-2 rounded-full ${
                          isRunning
                            ? "bg-green-400 shadow-[0_0_6px_rgba(74,222,128,0.6)]"
                            : "bg-slate-600"
                        }`}
                      />
                      <span className={`text-xs font-semibold ${server.color}`}>
                        {server.name}
                      </span>
                    </button>
                    <span className="rounded bg-slate-700 px-1.5 py-0.5 font-mono text-[10px] text-slate-300">
                      :{server.port}
                    </span>
                  </div>

                  <div className="mb-1.5 text-[10px] text-slate-500">
                    📁 {server.dir}
                  </div>

                  <div className="flex items-center gap-2">
                    {isRunning ? (
                      <button
                        onClick={() => stopServer(server.id)}
                        disabled={isLoading || !managerUp}
                        className="flex flex-1 items-center justify-center gap-1.5 rounded-md bg-red-600/20 border border-red-600/40 px-3 py-1.5 text-[11px] font-semibold text-red-400 transition hover:bg-red-600/30 disabled:opacity-50"
                      >
                        {isLoading ? <Loader2 size={12} className="animate-spin" /> : <Square size={12} />}
                        Stop
                      </button>
                    ) : (
                      <button
                        onClick={() => startServer(server.id)}
                        disabled={isLoading || !managerUp}
                        className="flex flex-1 items-center justify-center gap-1.5 rounded-md bg-green-600/20 border border-green-600/40 px-3 py-1.5 text-[11px] font-semibold text-green-400 transition hover:bg-green-600/30 disabled:opacity-50"
                      >
                        {isLoading ? <Loader2 size={12} className="animate-spin" /> : <Play size={12} />}
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

                  {/* Claude model selector + Launch */}
                  {server.id === "claude-proxy" && isRunning && (
                    <div className="mt-2 flex items-center gap-1.5 border-t border-slate-700/50 pt-2">
                      <select
                        value={claudeModel}
                        onChange={(e) => setClaudeModel(e.target.value)}
                        className="flex-1 rounded-md border border-slate-600 bg-slate-900 px-2 py-1.5 text-[11px] text-slate-200 outline-none focus:border-orange-500"
                      >
                        <optgroup label="Google Gemini">
                          <option value="gemini-3-flash">gemini-3-flash</option>
                          <option value="gemini-pro-agent">gemini-pro-agent</option>
                          <option value="gemini-3-flash-agent">gemini-3-flash-agent</option>
                        </optgroup>
                        <optgroup label="Anthropic Claude">
                          <option value="claude-opus-4-20250514">claude-opus-4</option>
                          <option value="claude-sonnet-4-20250514">claude-sonnet-4</option>
                          <option value="claude-3-5-haiku-20241022">claude-3.5-haiku</option>
                        </optgroup>
                      </select>
                      <button
                        onClick={launchClaude}
                        className="flex items-center gap-1 rounded-md bg-orange-600/20 border border-orange-600/40 px-3 py-1.5 text-[11px] font-semibold text-orange-400 transition hover:bg-orange-600/30"
                      >
                        <Terminal size={12} />
                        Launch Claude
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Terminal Output */}
          {activeServer && (
            <div className="flex min-h-0 flex-1 flex-col border-t border-slate-700">
              <div className="flex items-center justify-between border-b border-slate-700/50 bg-slate-900 px-3 py-1.5">
                <div className="flex items-center gap-2">
                  <Terminal size={12} className="text-green-400" />
                  <span className="text-[11px] font-semibold text-slate-300">
                    {SERVERS.find((s) => s.id === activeServer)?.name}
                  </span>
                  <span className="text-[10px] text-slate-500">— terminal</span>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => clearLogs(activeServer)} className="rounded p-1 text-slate-500 hover:bg-slate-700 hover:text-white" title="Clear">
                    <Trash2 size={12} />
                  </button>
                  <button onClick={() => setActiveServer(null)} className="rounded p-1 text-slate-500 hover:bg-slate-700 hover:text-white" title="Close">
                    <X size={12} />
                  </button>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto bg-black p-3 font-mono text-[11px] leading-relaxed">
                {(logs[activeServer] || []).length === 0 ? (
                  <span className="text-slate-600">
                    {statuses[activeServer]
                      ? "Connecting to logs..."
                      : "Server not running. Click Run to start."}
                  </span>
                ) : (
                  (logs[activeServer] || []).map((line, i) => (
                    <div
                      key={i}
                      className={
                        line.includes("[Error") || line.includes("error")
                          ? "text-red-400"
                          : line.includes("exit") || line.includes("stopped")
                          ? "text-yellow-400"
                          : "text-green-300"
                      }
                    >
                      {line}
                    </div>
                  ))
                )}
                <div ref={logEndRef} />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
