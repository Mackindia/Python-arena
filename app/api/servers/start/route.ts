import { NextResponse } from "next/server";
import { spawn, ChildProcess } from "child_process";
import { addServer, getAllServers } from "@/lib/server-process-store";

const BASE = "C:\\Users\\Doon Scholars\\Downloads\\data\\.vscode\\Python arena";

const SERVERS: Record<string, { name: string; port: number; cmd: string; args: string[]; cwd: string }> = {
  "nextjs": {
    name: "Next.js (Main App)",
    port: 3000,
    cmd: "npm",
    args: ["run", "dev"],
    cwd: BASE,
  },
  "ai-teacher": {
    name: "Educational AI (FastAPI)",
    port: 8000,
    cmd: "python",
    args: ["-m", "uvicorn", "main:app", "--reload", "--port", "8000"],
    cwd: `${BASE}\\ai-teacher`,
  },
  "claude-proxy": {
    name: "Claude Proxy (Node)",
    port: 8080,
    cmd: "node",
    args: ["src/index.js"],
    cwd: "C:\\Users\\Doon Scholars\\Downloads\\antigravity-claude-proxy-main\\antigravity-claude-proxy-main",
  },
  "timetable": {
    name: "Timetable Engine",
    port: 5173,
    cmd: "npm",
    args: ["run", "dev"],
    cwd: `${BASE}\\VS CODE Final TT project Doon Scholars\\timetable-web-app`,
  },
  "ebook-proxy": {
    name: "Ebook Proxy Server",
    port: 9090,
    cmd: "python",
    args: ["C:\\Users\\Doon Scholars\\Downloads\\data\\ebook-extractor\\proxy_server.py"],
    cwd: BASE,
  },
};

export async function POST(req: Request) {
  try {
    const { serverId } = await req.json();

    if (!serverId || !SERVERS[serverId]) {
      return NextResponse.json({ error: "Unknown server" }, { status: 400 });
    }

    const config = SERVERS[serverId];

    const isRunning = getAllServers().find(
      (s) => s.port === config.port && s.running
    );
    if (isRunning) {
      return NextResponse.json({ error: `${config.name} already running on :${config.port}` }, { status: 409 });
    }

    const proc: ChildProcess = spawn(config.cmd, config.args, {
      cwd: config.cwd,
      shell: true,
      stdio: "pipe",
      detached: false,
    });

    addServer(serverId, config.name, config.port, proc);

    proc.stdout?.on("data", (data: Buffer) => {
      console.log(`[${config.name}] ${data.toString().trim()}`);
    });
    proc.stderr?.on("data", (data: Buffer) => {
      console.error(`[${config.name}] ${data.toString().trim()}`);
    });
    proc.on("exit", () => {
      console.log(`[${config.name}] exited`);
    });

    return NextResponse.json({
      ok: true,
      server: { id: serverId, name: config.name, port: config.port },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
