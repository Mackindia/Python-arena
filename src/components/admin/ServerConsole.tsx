"use client";

import { useState, useEffect } from "react";
import { Terminal, Copy, Check, ChevronDown, ChevronRight, X, Server } from "lucide-react";

interface ServerEntry {
  name: string;
  port: number;
  command: string;
  dir: string;
  color: string;
}

const servers: ServerEntry[] = [
  {
    name: "Next.js (Main App)",
    port: 3000,
    command: "npm run dev",
    dir: "Current directory",
    color: "text-cyan-400",
  },
  {
    name: "Educational AI (FastAPI)",
    port: 8000,
    command: "python -m uvicorn main:app --reload --port 8000",
    dir: "ai-teacher",
    color: "text-green-400",
  },
  {
    name: "Timetable Engine",
    port: 5173,
    command: "npm run dev",
    dir: "VS CODE Final TT project Doon Scholars/timetable-web-app",
    color: "text-amber-400",
  },
  {
    name: "Ebook Proxy Server",
    port: 9090,
    command: 'python "C:\\Users\\Doon Scholars\\Downloads\\data\\ebook-extractor\\proxy_server.py"',
    dir: "External",
    color: "text-violet-400",
  },
];

export default function ServerConsole() {
  const [isOpen, setIsOpen] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isLocalhost, setIsLocalhost] = useState(false);

  useEffect(() => {
    setIsLocalhost(
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1"
    );
  }, []);

  if (!isLocalhost) return null;

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
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
    <div className="fixed top-2 left-2 z-[9999] w-[340px] max-w-[calc(100vw-16px)] rounded-xl border border-slate-700 bg-slate-900/95 shadow-2xl backdrop-blur-md">
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
          {servers.map((server, i) => (
            <div
              key={i}
              className="mb-2 rounded-lg border border-slate-700/50 bg-slate-800/50 p-2.5 transition hover:border-slate-600"
            >
              {/* Server name + port */}
              <div className="mb-1.5 flex items-center justify-between">
                <span className={`text-xs font-semibold ${server.color}`}>
                  {server.name}
                </span>
                <span className="rounded bg-slate-700 px-1.5 py-0.5 font-mono text-[10px] text-slate-300">
                  :{server.port}
                </span>
              </div>

              {/* Directory */}
              <div className="mb-1.5 text-[10px] text-slate-500">
                📁 {server.dir}
              </div>

              {/* Command + Copy */}
              <div className="flex items-center gap-1">
                <div className="flex-1 truncate rounded bg-slate-950 px-2 py-1 font-mono text-[11px] text-green-400">
                  $ {server.command}
                </div>
                <button
                  onClick={() => copyToClipboard(server.command, i)}
                  className="flex-shrink-0 rounded bg-slate-700 p-1 text-slate-400 transition hover:bg-slate-600 hover:text-white"
                  title="Copy command"
                >
                  {copiedIndex === i ? (
                    <Check size={12} className="text-green-400" />
                  ) : (
                    <Copy size={12} />
                  )}
                </button>
              </div>
            </div>
          ))}

          {/* Footer tip */}
          <div className="mt-1 border-t border-slate-700/50 pt-2 text-center text-[10px] text-slate-500">
            Click copy → paste in terminal → run
          </div>
        </div>
      )}
    </div>
  );
}
