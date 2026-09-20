import { NextResponse } from "next/server";
import { execSync, exec } from "child_process";
import { existsSync } from "fs";
import { join } from "path";
import { requireSuperAdminApi } from "@/lib/admin-api";
import { sanitizeError } from "@/lib/security";

export const dynamic = "force-dynamic";

type ServerConfig = {
  id: string;
  name: string;
  port: number;
  command: string;
  cwd: string;
  color: string;
};

const ROOT = process.cwd();

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

function findAntigravity(): string {
  const candidates = [
    join(ROOT, "..", "antigravity-claude-proxy-main", "antigravity-claude-proxy-main"),
    join(ROOT, "..", "antigravity-claude-proxy-main"),
  ];
  for (const p of candidates) {
    if (existsSync(join(p, "src", "index.js"))) return p;
  }
  return "";
}

const PYTHON = findPython();
const ANTIGRAVITY_CWD = findAntigravity();

const SERVERS: ServerConfig[] = [
  {
    id: "nextjs",
    name: "Next.js Dev",
    port: 3000,
    command: "npm run dev",
    cwd: ROOT,
    color: "cyan",
  },
  {
    id: "ai-teacher",
    name: "AI Teacher (FastAPI)",
    port: 8000,
    command: `${PYTHON} -m uvicorn main:app --reload --port 8000`,
    cwd: join(ROOT, "ai-teacher"),
    color: "emerald",
  },
  {
    id: "antigravity",
    name: "Antigravity Proxy",
    port: 8080,
    command: ANTIGRAVITY_CWD ? "node src/index.js" : "",
    cwd: ANTIGRAVITY_CWD || ROOT,
    color: "violet",
  },
  {
    id: "ebook-extractor",
    name: "E-Book Extractor",
    port: 9090,
    command: `${PYTHON} ${join(ROOT, "ebook-extractor", "proxy_server.py")}`,
    cwd: join(ROOT, "ebook-extractor"),
    color: "amber",
  },
  {
    id: "vite-timetable",
    name: "Vite Timetable",
    port: 5173,
    command: "npm run dev",
    cwd: join(ROOT, "VS CODE Final TT project Doon Scholars", "timetable-web-app"),
    color: "rose",
  },
  {
    id: "opencode",
    name: "OpenCode CLI",
    port: 0,
    command: "opencode",
    cwd: ROOT,
    color: "sky",
  },
];

function isPortInUse(port: number): { running: boolean; pid?: string } {
  try {
    const output = execSync(`netstat -ano | findstr ":${port}" | findstr "LISTENING"`, {
      encoding: "utf-8",
      timeout: 5000,
    }).trim();
    if (output) {
      const lines = output.split("\n").filter((l) => l.includes("LISTENING"));
      if (lines.length > 0) {
        const match = lines[0].trim().match(/\s+(\d+)\s*$/);
        return { running: true, pid: match?.[1] };
      }
    }
  } catch {}
  return { running: false };
}

function killPort(port: number): boolean {
  try {
    const { running, pid } = isPortInUse(port);
    if (running && pid) {
      execSync(`taskkill /F /T /PID ${pid}`, { stdio: "ignore" });
      return true;
    }
  } catch {}
  return false;
}

function startServer(config: ServerConfig): { success: boolean; message: string } {
  if (!config.command) {
    return { success: false, message: "Server has no start command configured" };
  }

  if (!existsSync(config.cwd)) {
    return { success: false, message: "Directory not found" };
  }

  const { running } = isPortInUse(config.port);
  if (running) {
    return { success: false, message: "Server already running" };
  }

  try {
    exec(`cmd /c start "" /min cmd /c "cd /d ${config.cwd} && ${config.command}"`, {
      cwd: config.cwd,
      windowsHide: true,
    });
    return { success: true, message: "Starting server..." };
  } catch {
    return { success: false, message: "Failed to start server" };
  }
}

function stopServer(config: ServerConfig): { success: boolean; message: string } {
  if (config.port === 0) {
    return { success: false, message: "Server cannot be stopped by port" };
  }
  const killed = killPort(config.port);
  return killed
    ? { success: true, message: "Server stopped" }
    : { success: false, message: "Server was not running" };
}

export async function GET() {
  try {
    const auth = await requireSuperAdminApi();
    if (!auth.ok) return auth.response;

    const servers = SERVERS.map((s) => {
      if (s.port === 0) {
        return { id: s.id, name: s.name, port: s.port, running: false, color: s.color };
      }
      const { running, pid } = isPortInUse(s.port);
      return { id: s.id, name: s.name, port: s.port, running, pid, color: s.color };
    });
    return NextResponse.json({ servers });
  } catch (error: unknown) {
    return NextResponse.json({ error: sanitizeError(error) }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const auth = await requireSuperAdminApi();
    if (!auth.ok) return auth.response;

    const { action, serverId } = await req.json();

    const config = SERVERS.find((s) => s.id === serverId);
    if (!config) {
      return NextResponse.json({ error: "Unknown server" }, { status: 400 });
    }

    if (action === "start") {
      return NextResponse.json(startServer(config));
    }
    if (action === "stop") {
      return NextResponse.json(stopServer(config));
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error: unknown) {
    return NextResponse.json({ error: sanitizeError(error) }, { status: 500 });
  }
}
