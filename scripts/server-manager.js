/**
 * Server Manager — Standalone HTTP server on port 7777
 *
 * Start with: npm run servers
 * The ServerConsole frontend component talks to this.
 */

const http = require("http");
const { spawn } = require("child_process");
const fs = require("fs");
const { SERVERS } = require("./server-config");

const PORT = 7777;
const processes = {};

// ── Validate paths on startup ──
console.log("[Manager] Validating server paths...");
for (const [id, config] of Object.entries(SERVERS)) {
  if (config.port === null) continue; // skip opencode (no port)
  const exists = fs.existsSync(config.cwd);
  const status = exists ? "OK" : "MISSING";
  console.log(`  ${id.padEnd(14)} ${status.padEnd(8)} ${config.cwd}`);
  if (!exists && id !== "opencode") {
    console.warn(`  WARNING: ${config.name} CWD does not exist!`);
  }
}
console.log("");

function startServer(id) {
  const config = SERVERS[id];
  if (!config) return { error: "Unknown server" };
  if (processes[id] && !processes[id].killed) return { error: "Already running" };

  // Check cwd exists
  if (!fs.existsSync(config.cwd)) {
    return { error: `Directory not found: ${config.cwd}` };
  }

  // Windows fix: shell:true breaks paths with spaces (like "D:\downloads data\data")
  // npm needs shell:true to resolve npm.cmd, but python/node work with shell:false
  const isWin = process.platform === "win32";
  const needsShell = config.cmd === "npm" || config.cmd === "npm.cmd";
  const cmd = isWin && config.cmd === "npm" ? "npm.cmd" : config.cmd;

  let proc;
  if (needsShell) {
    // npm: use shell:true so npm.cmd resolves
    proc = spawn(cmd, config.args, {
      cwd: config.cwd,
      shell: true,
      stdio: ["ignore", "pipe", "pipe"],
      env: { ...process.env, FORCE_COLOR: "1" },
    });
  } else {
    // python, node: use shell:false to avoid space-splitting in paths
    proc = spawn(cmd, config.args, {
      cwd: config.cwd,
      shell: false,
      stdio: ["ignore", "pipe", "pipe"],
      env: { ...process.env, FORCE_COLOR: "1" },
    });
  }

  processes[id] = proc;
  proc._logs = [];
  proc._listeners = new Set();

  const pushLog = (line) => {
    const entry = `[${new Date().toLocaleTimeString()}] ${line}`;
    proc._logs.push(entry);
    if (proc._logs.length > 1000) proc._logs.shift();
    proc._listeners.forEach((fn) => fn(entry));
  };

  proc.stdout.on("data", (data) => {
    data.toString().split("\n").filter(Boolean).forEach(pushLog);
  });
  proc.stderr.on("data", (data) => {
    data.toString().split("\n").filter(Boolean).forEach(pushLog);
  });
  proc.on("exit", (code) => {
    pushLog(`[Process exited with code ${code}]`);
    proc._listeners.forEach((fn) => fn("__EXIT__"));
    processes[id] = null;
    console.log(`[Manager] ${config.name} exited (code ${code})`);
  });
  proc.on("error", (err) => {
    pushLog(`[Error: ${err.message}]`);
    proc._listeners.forEach((fn) => fn("__EXIT__"));
    processes[id] = null;
    console.log(`[Manager] ${config.name} error: ${err.message}`);
  });

  console.log(`[Manager] Started ${config.name} (PID: ${proc.pid}) on port ${config.port || "N/A"}`);
  return { ok: true, id, name: config.name, port: config.port, pid: proc.pid };
}

function killByPort(port) {
  try {
    const { execSync } = require("child_process");
    const output = execSync(`netstat -ano | findstr ":${port}" | findstr "LISTENING"`, {
      encoding: "utf-8",
      stdio: ["pipe", "pipe", "pipe"],
    });
    const pids = new Set();
    for (const line of output.split("\n")) {
      const match = line.trim().match(/\s+(\d+)\s*$/);
      if (match) pids.add(match[1]);
    }
    for (const pid of pids) {
      try {
        execSync(`taskkill /F /T /PID ${pid}`, { stdio: "ignore" });
        console.log(`[Manager] Killed PID ${pid} on port ${port}`);
      } catch {}
    }
    return pids.size;
  } catch {
    return 0;
  }
}

function stopServer(id) {
  const proc = processes[id];
  const config = SERVERS[id];

  if (!proc) {
    if (config && config.port) {
      const killed = killByPort(config.port);
      if (killed > 0) {
        processes[id] = null;
        console.log(`[Manager] Stopped ${config.name} via port kill`);
        return { ok: true, stopped: id };
      }
    }
    return { error: "Not running" };
  }

  try {
    if (process.platform === "win32" && proc.pid) {
      const { execSync } = require("child_process");
      try {
        execSync(`taskkill /F /T /PID ${proc.pid}`, { stdio: "ignore" });
      } catch {
        if (config && config.port) killByPort(config.port);
      }
    } else {
      proc.kill("SIGTERM");
      setTimeout(() => {
        try { proc.kill("SIGKILL"); } catch {}
      }, 3000);
    }
  } catch {}
  processes[id] = null;
  console.log(`[Manager] Stopped ${config?.name || id}`);
  return { ok: true, stopped: id };
}

function getStatus() {
  return Object.entries(SERVERS)
    .filter(([, c]) => c.port !== null) // exclude opencode from port-based status
    .map(([id, config]) => {
      const proc = processes[id];
      const running = proc && !proc.killed;
      return { id, name: config.name, port: config.port, running, pid: proc?.pid || null };
    });
}

// ── HTTP Server ──
const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);

  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") { res.writeHead(204); res.end(); return; }

  const json = (data, code = 200) => {
    res.writeHead(code, { "Content-Type": "application/json" });
    res.end(JSON.stringify(data));
  };

  // GET /status
  if (url.pathname === "/status" && req.method === "GET") {
    return json({ servers: getStatus() });
  }

  // GET /logs?id=xxx
  if (url.pathname === "/logs" && req.method === "GET") {
    const id = url.searchParams.get("id");
    if (!id) return json({ error: "Missing id" }, 400);

    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    });

    const proc = processes[id];
    if (!proc) {
      res.write(`data: ${JSON.stringify({ error: "Server not running" })}\n\n`);
      res.write("data: __EXIT__\n\n");
      return res.end();
    }

    proc._logs.forEach((line) => res.write(`data: ${line}\n\n`));

    const listener = (line) => {
      res.write(`data: ${line}\n\n`);
      if (line === "__EXIT__") {
        proc._listeners.delete(listener);
        res.end();
      }
    };
    proc._listeners.add(listener);
    req.on("close", () => proc._listeners.delete(listener));
    return;
  }

  // POST /start { id }
  if (url.pathname === "/start" && req.method === "POST") {
    let body = "";
    req.on("data", (c) => (body += c));
    req.on("end", () => {
      try {
        const { id } = JSON.parse(body);
        return json(startServer(id));
      } catch (e) {
        return json({ error: e.message }, 400);
      }
    });
    return;
  }

  // POST /stop { id }
  if (url.pathname === "/stop" && req.method === "POST") {
    let body = "";
    req.on("data", (c) => (body += c));
    req.on("end", () => {
      try {
        const { id } = JSON.parse(body);
        return json(stopServer(id));
      } catch (e) {
        return json({ error: e.message }, 400);
      }
    });
    return;
  }

  json({ error: "Not found" }, 404);
});

server.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════════════════╗
║           SERVER MANAGER running on :${PORT}            ║
╠══════════════════════════════════════════════════════╣
║  API:                                               ║
║    GET  /status            → server status          ║
║    POST /start  { id }     → start a server         ║
║    POST /stop   { id }     → stop a server          ║
║    GET  /logs?id=xxx       → SSE log stream         ║
╠══════════════════════════════════════════════════════╣
║  Servers:                                           ║
║    nextjs       → :3000   Next.js                   ║
║    ai-teacher   → :8000   FastAPI                   ║
║    claude-proxy → :8080   Antigravity Proxy         ║
║    timetable    → :5173   Vite Timetable            ║
║    ebook-proxy  → :9090   Ebook Proxy               ║
║    opencode     → CLI     OpenCode                  ║
╚══════════════════════════════════════════════════════╝
`);
});

process.on("SIGINT", () => {
  console.log("\n[Manager] Shutting down, killing all servers...");
  Object.keys(processes).forEach((id) => stopServer(id));
  process.exit(0);
});
process.on("SIGTERM", () => {
  Object.keys(processes).forEach((id) => stopServer(id));
  process.exit(0);
});
