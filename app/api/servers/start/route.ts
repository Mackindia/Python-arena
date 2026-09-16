import { NextResponse } from "next/server";
import { spawn, ChildProcess } from "child_process";
import { addServer, getAllServers } from "@/lib/server-process-store";
import { existsSync } from "fs";
import { join } from "path";

export const dynamic = "force-dynamic";

const ROOT = process.cwd();

// ── Find python with FastAPI installed ──
function findPython(): string {
  const candidates = [
    join(ROOT, ".vscode", "Python arena", "ai-teacher", ".venv", "Scripts", "python.exe"),
    join(ROOT, "ai-teacher", ".venv", "Scripts", "python.exe"),
    "python",
  ];
  for (const p of candidates) {
    if (existsSync(p)) return p;
  }
  return "python";
}

// ── Find antigravity proxy ──
function findAntigravity(): string {
  const candidates = [
    join(ROOT, "..", "antigravity-claude-proxy-main", "antigravity-claude-proxy-main"),
    join(ROOT, "..", "antigravity-claude-proxy-main"),
  ];
  for (const p of candidates) {
    if (existsSync(join(p, "src", "index.js"))) return p;
  }
  return join(ROOT, "..", "antigravity-claude-proxy-main");
}

const PYTHON = findPython();
const ANTIGRAVITY_CWD = findAntigravity();

const SERVERS: Record<string, { name: string; port: number; cmd: string; args: string[]; cwd: string }> = {
  nextjs: {
    name: "Next.js (Main App)",
    port: 3000,
    cmd: "npm",
    args: ["run", "dev"],
    cwd: ROOT,
  },
  "ai-teacher": {
    name: "Educational AI (FastAPI)",
    port: 8000,
    cmd: PYTHON,
    args: ["-m", "uvicorn", "main:app", "--reload", "--port", "8000"],
    cwd: join(ROOT, "ai-teacher"),
  },
  "claude-proxy": {
    name: "Antigravity Claude Proxy",
    port: 8080,
    cmd: "node",
    args: ["src/index.js"],
    cwd: ANTIGRAVITY_CWD,
  },
  timetable: {
    name: "Vite Timetable",
    port: 5173,
    cmd: "npm",
    args: ["run", "dev"],
    cwd: join(ROOT, "VS CODE Final TT project Doon Scholars", "timetable-web-app"),
  },
  "ebook-proxy": {
    name: "Ebook Proxy Server",
    port: 9090,
    cmd: PYTHON,
    args: [join(ROOT, "ebook-extractor", "proxy_server.py")],
    cwd: join(ROOT, "ebook-extractor"),
  },
  opencode: {
    name: "OpenCode CLI",
    port: 0,
    cmd: "opencode",
    args: [],
    cwd: ROOT,
  },
};

export async function POST(req: Request) {
  try {
    const { serverId } = await req.json();

    if (!serverId || !SERVERS[serverId]) {
      return NextResponse.json({ error: "Unknown server" }, { status: 400 });
    }

    const config = SERVERS[serverId];

    // Check if already running on that port
    if (config.port > 0) {
      const isRunning = getAllServers().find(
        (s) => s.port === config.port && s.running
      );
      if (isRunning) {
        return NextResponse.json(
          { error: `${config.name} already running on :${config.port}` },
          { status: 409 }
        );
      }
    }

    // Validate CWD exists
    if (!existsSync(config.cwd)) {
      return NextResponse.json(
        { error: `Directory not found: ${config.cwd}` },
        { status: 500 }
      );
    }

    const proc: ChildProcess = spawn(config.cmd, config.args, {
      cwd: config.cwd,
      shell: true,
      stdio: "pipe",
      detached: false,
    });

    addServer(serverId, config.name, config.port, proc);

    return NextResponse.json({
      ok: true,
      server: { id: serverId, name: config.name, port: config.port },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
