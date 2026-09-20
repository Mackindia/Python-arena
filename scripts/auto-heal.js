#!/usr/bin/env node
/**
 * AUTO-HEAL — Server Health Monitor & Auto-Restart Daemon
 *
 * Monitors all services defined in server-config.js.
 * If a service is down → restart → log → notify admin.
 *
 * Usage:
 *   node scripts/auto-heal.js              # run with defaults
 *   node scripts/auto-heal.js --once       # single check, then exit
 *   node scripts/auto-heal.js --interval 15 # check every 15 seconds
 *
 * Environment:
 *   HEALTH_CHECK_INTERVAL=30000   ms between checks (default: 30000)
 *   HEALTH_MAX_RESTARTS=3         max restarts before cooldown (default: 3)
 *   HEALTH_COOLDOWN_MS=600000     cooldown period in ms (default: 600000 = 10min)
 *   HEALTH_WEBHOOK_URL=           optional Discord/Slack webhook URL
 *   HEALTH_LOG_DIR=logs           log directory (default: logs)
 */

const http = require("http");
const { spawn, execSync } = require("child_process");
const fs = require("fs");
const path = require("path");
const net = require("net");
const { SERVERS } = require("./server-config");

// ── Config ──────────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const getArg = (name) => {
  const idx = args.indexOf(name);
  return idx !== -1 ? args[idx + 1] : null;
};

const CONFIG = {
  port: 7778,
  checkInterval: parseInt(getArg("--interval") || process.env.HEALTH_CHECK_INTERVAL || "30000", 10),
  maxRestarts: parseInt(getArg("--max-restarts") || process.env.HEALTH_MAX_RESTARTS || "3", 10),
  cooldownMs: parseInt(getArg("--cooldown") || process.env.HEALTH_COOLDOWN_MS || "600000", 10),
  webhookUrl: getArg("--webhook") || process.env.HEALTH_WEBHOOK_URL || "",
  logDir: getArg("--log-dir") || process.env.HEALTH_LOG_DIR || "logs",
  once: args.includes("--once"),
};

// ── State ───────────────────────────────────────────────────────────────────
const state = {
  services: {},
  startedAt: Date.now(),
};

for (const [id, config] of Object.entries(SERVERS)) {
  state.services[id] = {
    id,
    name: config.name,
    port: config.port,
    status: "unknown",        // unknown | healthy | unhealthy | cooldown | skipped
    lastCheck: null,
    lastHealthy: null,
    lastRestart: null,
    restartCount: 0,
    consecutiveFails: 0,
    cooldownEndsAt: null,
    totalRestarts: 0,
    process: null,            // spawned process reference
  };
}

// ── Logging ─────────────────────────────────────────────────────────────────
const logsDir = path.resolve(__dirname, "..", CONFIG.logDir);
if (!fs.existsSync(logsDir)) fs.mkdirSync(logsDir, { recursive: true });

function getLogFile() {
  const date = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  return path.join(logsDir, `auto-heal-${date}.log`);
}

function log(level, id, msg) {
  const ts = new Date().toISOString().replace("T", " ").slice(0, 19);
  const tag = id.padEnd(14);
  const line = `[${ts}] [${level}] ${tag} ${msg}`;
  console.log(line);
  fs.appendFileSync(getLogFile(), line + "\n");
}

// ── Port Check (tries IPv4 then IPv6) ──────────────────────────────────────
function tryConnect(port, host) {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    socket.setTimeout(2000);
    socket.once("connect", () => { socket.destroy(); resolve(true); });
    socket.once("timeout", () => { socket.destroy(); resolve(false); });
    socket.once("error", () => { socket.destroy(); resolve(false); });
    socket.connect(port, host);
  });
}

async function isPortListening(port) {
  return await tryConnect(port, "127.0.0.1") || await tryConnect(port, "::1");
}

// ── HTTP Health Check (for services with healthPath, tries IPv4 then IPv6) ─
function httpGet(url, timeout = 5000) {
  return new Promise((resolve) => {
    const req = http.get(url, { timeout }, (res) => {
      let body = "";
      res.on("data", (chunk) => (body += chunk));
      res.on("end", () => resolve(res.statusCode >= 200 && res.statusCode < 400));
    });
    req.on("error", () => resolve(false));
    req.on("timeout", () => { req.destroy(); resolve(false); });
  });
}

async function httpHealthCheck(port, healthPath) {
  return await httpGet(`http://127.0.0.1:${port}${healthPath}`) ||
         await httpGet(`http://[::1]:${port}${healthPath}`);
}

// ── Kill Port ───────────────────────────────────────────────────────────────
function killPort(port) {
  try {
    const output = execSync(`netstat -ano | findstr ":${port}" | findstr "LISTENING"`, {
      encoding: "utf-8",
      timeout: 5000,
      stdio: ["pipe", "pipe", "pipe"],
    });
    const pids = new Set();
    for (const line of output.split("\n")) {
      const match = line.trim().match(/\s+(\d+)\s*$/);
      if (match) pids.add(match[1]);
    }
    for (const pid of pids) {
      try {
        execSync(`taskkill /F /T /PID ${pid}`, { stdio: "ignore", timeout: 5000 });
        log("INFO", "", `Killed PID ${pid} on port ${port}`);
      } catch {}
    }
    return pids.size;
  } catch {
    return 0;
  }
}

// ── Spawn Process ───────────────────────────────────────────────────────────
function spawnServer(id, config) {
  const isWin = process.platform === "win32";
  const needsShell = config.cmd === "npm" || config.cmd === "npm.cmd";
  const cmd = isWin && config.cmd === "npm" ? "npm.cmd" : config.cmd;

  const spawnOpts = {
    cwd: config.cwd,
    shell: needsShell,
    stdio: ["ignore", "pipe", "pipe"],
    env: { ...process.env, FORCE_COLOR: "1" },
    detached: false,
  };

  const proc = spawn(cmd, config.args, spawnOpts);

  state.services[id].process = proc;

  // Pipe stdout/stderr to log
  const pushLog = (line) => {
    const entry = `[${new Date().toLocaleTimeString()}] [child] ${line}`;
    fs.appendFileSync(getLogFile(), entry + "\n");
  };

  proc.stdout?.on("data", (data) => {
    data.toString().split("\n").filter(Boolean).forEach(pushLog);
  });
  proc.stderr?.on("data", (data) => {
    data.toString().split("\n").filter(Boolean).forEach(pushLog);
  });
  proc.on("exit", (code) => {
    pushLog(`${id} exited with code ${code}`);
    state.services[id].process = null;
  });
  proc.on("error", (err) => {
    pushLog(`${id} error: ${err.message}`);
    state.services[id].process = null;
  });

  return proc;
}

// ── Webhook Notify ──────────────────────────────────────────────────────────
async function notifyWebhook(id, event, details) {
  if (!CONFIG.webhookUrl) return;

  const payload = JSON.stringify({
    content: null,
    embeds: [
      {
        title: `Auto-Heal: ${event}`,
        description: `**${state.services[id].name}** (port ${state.services[id].port})`,
        color: event === "RESTARTED" ? 0x2ecc71 : event === "DOWN" ? 0xe74c3c : 0xf39c12,
        fields: [
          { name: "Service", value: id, inline: true },
          { name: "Port", value: String(state.services[id].port), inline: true },
          { name: "Details", value: details, inline: false },
        ],
        timestamp: new Date().toISOString(),
      },
    ],
  });

  try {
    const url = new URL(CONFIG.webhookUrl);
    const req = http.request(
      {
        hostname: url.hostname,
        path: url.pathname + url.search,
        method: "POST",
        headers: { "Content-Type": "application/json" },
        timeout: 5000,
      },
      (res) => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          log("INFO", id, "Webhook notification sent");
        } else {
          log("WARN", id, `Webhook returned status ${res.statusCode}`);
        }
      }
    );
    req.on("error", (err) => log("WARN", id, `Webhook error: ${err.message}`));
    req.write(payload);
    req.end();
  } catch (err) {
    log("WARN", id, `Webhook failed: ${err.message}`);
  }
}

// ── Core: Check & Heal ─────────────────────────────────────────────────────
async function checkAndHeal(id) {
  const config = SERVERS[id];
  const svc = state.services[id];

  // Skip services without ports (like opencode CLI)
  if (!config.port) {
    svc.status = "skipped";
    svc.lastCheck = Date.now();
    return;
  }

  // Check cooldown
  if (svc.cooldownEndsAt && Date.now() < svc.cooldownEndsAt) {
    svc.status = "cooldown";
    svc.lastCheck = Date.now();
    const remaining = Math.ceil((svc.cooldownEndsAt - Date.now()) / 1000);
    log("WARN", id, `In cooldown — ${remaining}s remaining`);
    return;
  }

  // Probe port
  const portAlive = await isPortListening(config.port);

  // Optionally verify HTTP health
  let httpOk = portAlive;
  if (portAlive && config.healthPath) {
    httpOk = await httpHealthCheck(config.port, config.healthPath);
  }

  svc.lastCheck = Date.now();

  if (portAlive && httpOk) {
    // ── Healthy ──
    svc.status = "healthy";
    svc.lastHealthy = Date.now();
    svc.consecutiveFails = 0;
    svc.restartCount = 0;
    log("INFO", id, `:${config.port} healthy`);
    return;
  }

  // ── Unhealthy ──
  svc.consecutiveFails++;
  svc.status = "unhealthy";
  log("WARN", id, `:${config.port} DOWN (fail #${svc.consecutiveFails}/${CONFIG.maxRestarts})`);

  if (svc.consecutiveFails < CONFIG.maxRestarts) {
    // Not enough fails yet — wait for next cycle
    return;
  }

  // ── Circuit breaker: open cooldown ──
  if (svc.restartCount >= CONFIG.maxRestarts) {
    svc.cooldownEndsAt = Date.now() + CONFIG.cooldownMs;
    const cooldownMin = Math.ceil(CONFIG.cooldownMs / 60000);
    log("WARN", id, `Circuit OPEN — cooldown ${cooldownMin}m (too many restarts)`);
    await notifyWebhook(id, "COOLDOWN", `Too many restarts. Cooldown ${cooldownMin} min.`);
    return;
  }

  // ── Restart ──
  log("WARN", id, `Restarting (attempt ${svc.restartCount + 1}/${CONFIG.maxRestarts})...`);

  // Kill stale processes
  killPort(config.port);

  // Small delay for port release
  await new Promise((r) => setTimeout(r, 1000));

  // Spawn
  const proc = spawnServer(id, config);

  // Wait for startup
  let healthy = false;
  for (let i = 0; i < 15; i++) {
    await new Promise((r) => setTimeout(r, 2000));
    const alive = await isPortListening(config.port);
    if (alive) {
      if (config.healthPath) {
        healthy = await httpHealthCheck(config.port, config.healthPath);
      } else {
        healthy = true;
      }
      if (healthy) break;
    }
  }

  svc.restartCount++;
  svc.totalRestarts++;
  svc.lastRestart = Date.now();
  svc.consecutiveFails = 0;

  if (healthy) {
    svc.status = "healthy";
    svc.lastHealthy = Date.now();
    log("OK", id, `Restarted successfully (PID ${proc.pid})`);
    await notifyWebhook(id, "RESTARTED", `Restarted successfully. PID: ${proc.pid}`);
  } else {
    svc.status = "unhealthy";
    log("ERR", id, `Restart FAILED — still unhealthy after 30s`);
    await notifyWebhook(id, "RESTART_FAILED", "Server failed to start after restart.");
  }
}

// ── Health API Server ───────────────────────────────────────────────────────
function createApiServer() {
  const server = http.createServer((req, res) => {
    const url = new URL(req.url, `http://localhost:${CONFIG.port}`);

    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
    if (req.method === "OPTIONS") {
      res.writeHead(204);
      res.end();
      return;
    }

    const json = (data, code = 200) => {
      res.writeHead(code, { "Content-Type": "application/json" });
      res.end(JSON.stringify(data, null, 2));
    };

    // GET /health — full status
    if (url.pathname === "/health" && req.method === "GET") {
      const uptimeMs = Date.now() - state.startedAt;
      const services = Object.values(state.services).map((s) => ({
        id: s.id,
        name: s.name,
        port: s.port,
        status: s.status,
        lastCheck: s.lastCheck ? new Date(s.lastCheck).toISOString() : null,
        lastHealthy: s.lastHealthy ? new Date(s.lastHealthy).toISOString() : null,
        lastRestart: s.lastRestart ? new Date(s.lastRestart).toISOString() : null,
        restartCount: s.restartCount,
        totalRestarts: s.totalRestarts,
        cooldownEndsAt: s.cooldownEndsAt ? new Date(s.cooldownEndsAt).toISOString() : null,
      }));

      const unhealthy = services.filter((s) => s.status === "unhealthy" || s.status === "cooldown");

      return json({
        ok: unhealthy.length === 0,
        uptime: `${Math.floor(uptimeMs / 60000)}m ${Math.floor((uptimeMs % 60000) / 1000)}s`,
        checkInterval: CONFIG.checkInterval,
        maxRestarts: CONFIG.maxRestarts,
        cooldownMs: CONFIG.cooldownMs,
        services,
        summary: {
          total: services.length,
          healthy: services.filter((s) => s.status === "healthy").length,
          unhealthy: unhealthy.length,
          skipped: services.filter((s) => s.status === "skipped").length,
        },
      });
    }

    // GET /health/summary — quick status
    if (url.pathname === "/health/summary" && req.method === "GET") {
      const services = Object.values(state.services);
      return json({
        ok: services.every((s) => s.status === "healthy" || s.status === "skipped"),
        healthy: services.filter((s) => s.status === "healthy").length,
        unhealthy: services.filter((s) => s.status === "unhealthy" || s.status === "cooldown").length,
        total: services.length,
      });
    }

    json({ error: "Not found" }, 404);
  });

  server.listen(CONFIG.port, () => {
    console.log(`\n  Auto-Heal API: http://localhost:${CONFIG.port}/health\n`);
  });

  return server;
}

// ── Main Loop ───────────────────────────────────────────────────────────────
async function runCheckCycle() {
  const ids = Object.keys(SERVERS);
  for (const id of ids) {
    await checkAndHeal(id);
  }
}

function printBanner() {
  const services = Object.entries(SERVERS)
    .filter(([, c]) => c.port)
    .map(([id, c]) => `  ${id.padEnd(14)} :${String(c.port).padEnd(5)} ${c.name}`)
    .join("\n");

  console.log(`
  \x1b[36m╔══════════════════════════════════════════════════════╗
  ║        AUTO-HEAL — Server Health Monitor             ║
  ╠══════════════════════════════════════════════════════╣
  ║  API       : http://localhost:${CONFIG.port}/health          ║
  ║  Interval  : ${String(CONFIG.checkInterval / 1000).padEnd(3)}s checks                           ║
  ║  Cooldown  : ${CONFIG.maxRestarts} fails → ${CONFIG.cooldownMs / 60000} min cooldown             ║
  ║  Webhook   : ${CONFIG.webhookUrl ? "enabled" : "disabled (set HEALTH_WEBHOOK_URL)"}                       ║
  ╠══════════════════════════════════════════════════════╣
  ║  Services:                                           ║
  ${services.split("\n").map((s) => `║  ${s.padEnd(50)}║`).join("\n  ")}
  ╠══════════════════════════════════════════════════════╣
  ║  Logs: ${getLogFile().padEnd(43)}║
  ╚══════════════════════════════════════════════════════╝\x1b[0m
  `);
}

async function main() {
  printBanner();

  // Start API server
  createApiServer();

  // Initial check
  log("INFO", "", "Running initial health check...");
  await runCheckCycle();

  if (CONFIG.once) {
    log("INFO", "", "Single check complete (--once mode). Exiting.");
    process.exit(0);
  }

  // Start monitoring loop
  log("INFO", "", `Monitoring every ${CONFIG.checkInterval / 1000}s...`);
  setInterval(runCheckCycle, CONFIG.checkInterval);
}

// ── Graceful Shutdown ───────────────────────────────────────────────────────
function cleanup() {
  log("INFO", "", "Shutting down auto-heal...");
  // Kill spawned processes
  for (const [id, svc] of Object.entries(state.services)) {
    if (svc.process && !svc.process.killed) {
      try {
        svc.process.kill("SIGTERM");
        log("INFO", id, `Killed spawned process`);
      } catch {}
    }
  }
  process.exit(0);
}

process.on("SIGINT", cleanup);
process.on("SIGTERM", cleanup);

main();
