/**
 * SERVER CONFIG — Single Source of Truth
 *
 * All server definitions live here. Both server-manager.js (port 7777)
 * and the Next.js API routes import from this file.
 *
 * To add a new server: add an entry below, then add it to the
 * SERVERS list in ServerConsole.tsx frontend component.
 */

const path = require("path");
const fs = require("fs");

// ── Project root (this file is at <root>/scripts/server-config.js) ──
const ROOT = path.resolve(__dirname, "..");

// ── Helper: find python with FastAPI installed ──
function findPython() {
  // Priority 1: venv in .vscode copy (has all packages)
  const venvPy = path.join(ROOT, ".vscode", "Python arena", "ai-teacher", ".venv", "Scripts", "python.exe");
  if (fs.existsSync(venvPy)) return venvPy;

  // Priority 2: venv in main ai-teacher dir
  const mainVenv = path.join(ROOT, "ai-teacher", ".venv", "Scripts", "python.exe");
  if (fs.existsSync(mainVenv)) return mainVenv;

  // Priority 3: system python (may not have packages)
  return "python";
}

// ── Helper: find antigravity proxy ──
function findAntigravity() {
  const candidates = [
    path.join(ROOT, "..", "antigravity-claude-proxy-main", "antigravity-claude-proxy-main"),
    path.join(ROOT, "..", "antigravity-claude-proxy-main"),
    "C:\\Users\\Doon Scholars\\Downloads\\antigravity-claude-proxy-main\\antigravity-claude-proxy-main",
  ];
  for (const p of candidates) {
    if (fs.existsSync(path.join(p, "src", "index.js"))) return p;
  }
  return null;
}

const PYTHON = findPython();
const ANTIGRAVITY_CWD = findAntigravity();

const SERVERS = {
  nextjs: {
    name: "Next.js (Main App)",
    port: 3000,
    cmd: "npm",
    args: ["run", "dev"],
    cwd: ROOT,
    healthPath: "/",
  },
  "ai-teacher": {
    name: "Educational AI (FastAPI)",
    port: 8000,
    cmd: PYTHON,
    args: ["-m", "uvicorn", "main:app", "--reload", "--port", "8000"],
    cwd: path.join(ROOT, "ai-teacher"),
    healthPath: "/docs",
  },
  "claude-proxy": {
    name: "Antigravity Claude Proxy",
    port: 8080,
    cmd: "node",
    args: ["src/index.js"],
    cwd: ANTIGRAVITY_CWD || path.join(ROOT, "..", "antigravity-claude-proxy-main"),
    healthPath: "/",
  },
  timetable: {
    name: "Vite Timetable",
    port: 5173,
    cmd: "npm",
    args: ["run", "dev"],
    cwd: path.join(ROOT, "VS CODE Final TT project Doon Scholars", "timetable-web-app"),
    healthPath: "/",
  },
  "ebook-proxy": {
    name: "Ebook Proxy Server",
    port: 9090,
    cmd: PYTHON,
    args: [path.join(ROOT, "ebook-extractor", "proxy_server.py")],
    cwd: path.join(ROOT, "ebook-extractor"),
    healthPath: "/",
  },
  opencode: {
    name: "OpenCode CLI",
    port: null, // no port — it's a CLI tool
    cmd: "opencode",
    args: [],
    cwd: ROOT,
    healthPath: null, // process-only, no HTTP
  },
};

module.exports = { ROOT, SERVERS, PYTHON, ANTIGRAVITY_CWD };
