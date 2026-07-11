const http = require("http");
const { spawn } = require("child_process");
const path = require("path");
const fs = require("fs");

const PORT = 7777;
const BASE = "C:\\Users\\Doon Scholars\\Downloads\\data\\.vscode\\Python arena";

const SERVERS = {
  nextjs: {
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
    cwd: path.join(BASE, "ai-teacher"),
  },
  "claude-proxy": {
    name: "Claude Proxy (Node)",
    port: 8080,
    cmd: "node",
    args: ["src/index.js"],
    cwd: "C:\\Users\\Doon Scholars\\Downloads\\antigravity-claude-proxy-main\\antigravity-claude-proxy-main",
  },
  timetable: {
    name: "Timetable Engine",
    port: 5173,
    cmd: "npm",
    args: ["run", "dev"],
    cwd: path.join(BASE, "VS CODE Final TT project Doon Scholars", "timetable-web-app"),
  },
  "ebook-proxy": {
    name: "Ebook Proxy Server",
    port: 9090,
    cmd: "python",
    args: ["C:\\Users\\Doon Scholars\\Downloads\\data\\ebook-extractor\\proxy_server.py"],
    cwd: BASE,
  },
};

// Store running processes
const processes = {};

function startServer(id) {
  const config = SERVERS[id];
  if (!config) return { error: "Unknown server" };
  if (processes[id] && !processes[id].killed) return { error: "Already running" };

  // Check cwd exists
  if (!fs.existsSync(config.cwd)) {
    return { error: `Directory not found: ${config.cwd}` };
  }

  const proc = spawn(config.cmd, config.args, {
    cwd: config.cwd,
    shell: true,
    stdio: ["ignore", "pipe", "pipe"],
    env: { ...process.env, FORCE_COLOR: "1" },
  });

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
  });
  proc.on("error", (err) => {
    pushLog(`[Error: ${err.message}]`);
    proc._listeners.forEach((fn) => fn("__EXIT__"));
  });

  console.log(`[Manager] Started ${config.name} (PID: ${proc.pid}) on port ${config.port}`);
  return { ok: true, id, name: config.name, port: config.port, pid: proc.pid };
}

function stopServer(id) {
  const proc = processes[id];
  if (!proc) return { error: "Not running" };
  try {
    proc.kill("SIGTERM");
    // Force kill after 3s if still alive
    setTimeout(() => {
      try { proc.kill("SIGKILL"); } catch {}
    }, 3000);
  } catch {}
  console.log(`[Manager] Stopped ${SERVERS[id]?.name || id}`);
  return { ok: true, stopped: id };
}

function getStatus() {
  return Object.entries(SERVERS).map(([id, config]) => {
    const proc = processes[id];
    const running = proc && !proc.killed;
    return { id, name: config.name, port: config.port, running, pid: proc?.pid || null };
  });
}

function getLogs(id) {
  return processes[id]?._logs || [];
}

// HTTP Server
const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);

  // CORS
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

    // SSE stream
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

    // Send existing logs
    proc._logs.forEach((line) => res.write(`data: ${line}\n\n`));

    // Listen for new logs
    const listener = (line) => {
      res.write(`data: ${line}\n\n`);
      if (line === "__EXIT__") {
        proc._listeners.delete(listener);
        res.end();
      }
    };
    proc._listeners.add(listener);

    req.on("close", () => {
      proc._listeners.delete(listener);
    });
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
╔══════════════════════════════════════════════════╗
║         SERVER MANAGER running on :${PORT}          ║
╠══════════════════════════════════════════════════╣
║  API:                                           ║
║    GET  /status          → server status        ║
║    POST /start  { id }   → start a server       ║
║    POST /stop   { id }   → stop a server        ║
║    GET  /logs?id=xxx     → SSE log stream       ║
╠══════════════════════════════════════════════════╣
║  Servers:                                       ║
║    nextjs      → :3000  Next.js                 ║
║    ai-teacher  → :8000  FastAPI                 ║
║    claude-proxy→ :8080  Claude Proxy            ║
║    timetable   → :5173  Timetable Engine        ║
║    ebook-proxy → :9090  Ebook Proxy             ║
╚══════════════════════════════════════════════════╝
`);
});

// Cleanup on exit
process.on("SIGINT", () => {
  console.log("\n[Manager] Shutting down, killing all servers...");
  Object.keys(processes).forEach((id) => stopServer(id));
  process.exit(0);
});
process.on("SIGTERM", () => {
  Object.keys(processes).forEach((id) => stopServer(id));
  process.exit(0);
});
