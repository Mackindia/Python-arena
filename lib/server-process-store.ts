import { ChildProcess } from "child_process";

interface RunningServer {
  id: string;
  name: string;
  port: number;
  process: ChildProcess;
  startedAt: number;
  logs: string[];
  listeners: Set<(line: string) => void>;
}

declare global {
  var __serverProcesses: Map<string, RunningServer> | undefined;
}

const processes: Map<string, RunningServer> =
  global.__serverProcesses ?? (global.__serverProcesses = new Map());

export function addServer(id: string, name: string, port: number, proc: ChildProcess) {
  const logs: string[] = [];
  const listeners = new Set<(line: string) => void>();

  const push = (line: string) => {
    const entry = `[${new Date().toLocaleTimeString()}] ${line}`;
    logs.push(entry);
    if (logs.length > 500) logs.shift();
    listeners.forEach((fn) => fn(entry));
  };

  proc.stdout?.on("data", (data: Buffer) => {
    data.toString().split("\n").filter(Boolean).forEach(push);
  });
  proc.stderr?.on("data", (data: Buffer) => {
    data.toString().split("\n").filter(Boolean).forEach(push);
  });
  proc.on("exit", (code) => {
    push(`[Process exited with code ${code}]`);
    listeners.forEach((fn) => fn("__EXIT__"));
  });
  proc.on("error", (err) => {
    push(`[Error: ${err.message}]`);
    listeners.forEach((fn) => fn("__EXIT__"));
  });

  processes.set(id, { id, name, port, process: proc, startedAt: Date.now(), logs, listeners });
}

export function getServer(id: string): RunningServer | undefined {
  return processes.get(id);
}

export function removeServer(id: string): boolean {
  const server = processes.get(id);
  if (!server) return false;
  try {
    server.process.kill("SIGTERM");
  } catch {}
  processes.delete(id);
  return true;
}

export function getAllServers() {
  return Array.from(processes.values()).map((s) => ({
    id: s.id,
    name: s.name,
    port: s.port,
    startedAt: s.startedAt,
    running: !s.process.killed,
    logs: s.logs,
  }));
}

export function getServerLogs(id: string): string[] {
  return processes.get(id)?.logs ?? [];
}

export function addLogListener(id: string, fn: (line: string) => void): () => void {
  const server = processes.get(id);
  if (!server) return () => {};
  server.listeners.add(fn);
  return () => server.listeners.delete(fn);
}
