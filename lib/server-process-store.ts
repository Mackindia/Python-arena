import { ChildProcess } from "child_process";

interface RunningServer {
  id: string;
  name: string;
  port: number;
  process: ChildProcess;
  startedAt: number;
}

declare global {
  var __serverProcesses: Map<string, RunningServer> | undefined;
}

const processes: Map<string, RunningServer> =
  global.__serverProcesses ?? (global.__serverProcesses = new Map());

export function addServer(id: string, name: string, port: number, proc: ChildProcess) {
  processes.set(id, { id, name, port, process: proc, startedAt: Date.now() });
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
  }));
}
