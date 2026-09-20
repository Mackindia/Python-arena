import { NextResponse } from "next/server";
import { ENGINES_LIST } from "@/src/constants/engines";
import { existsSync, writeFileSync, unlinkSync } from "fs";
import { join, resolve } from "path";

export const dynamic = "force-dynamic";

type EngineStatus = {
  id: string;
  title: string;
  category: string;
  href: string;
  status: "online" | "offline" | "unknown";
  httpCode?: number;
  responseTime?: number;
  lastChecked: string;
  isCoreService?: boolean;
};

// ─── URL Ping ───────────────────────────────────────────────
async function pingUrl(url: string): Promise<{ ok: boolean; code: number; ms: number }> {
  const start = Date.now();
  try {
    const res = await fetch(url, {
      method: "GET",
      signal: AbortSignal.timeout(8000),
      redirect: "follow",
      headers: { "User-Agent": "EngineMonitor/1.0" },
    });
    return { ok: true, code: res.status, ms: Date.now() - start };
  } catch {
    return { ok: false, code: 0, ms: Date.now() - start };
  }
}

function interpretStatus(code: number, ok: boolean): "online" | "offline" {
  if (!ok) return "offline";
  if (code >= 200 && code < 400) return "online";
  if (code === 401 || code === 403) return "online";
  return "offline";
}

// ─── Page File Check (for internal routes) ─────────────────
function checkPageExists(href: string): boolean {
  // External URLs - always consider them potentially available for HTTP ping
  if (href.startsWith("http")) return true;

  const appDir = join(process.cwd(), "app");
  const cleanPath = href.split("?")[0].replace(/^\//, "");
  const routeDir = join(appDir, cleanPath);

  const pageFiles = [
    join(routeDir, "page.tsx"),
    join(routeDir, "page.ts"),
    join(routeDir, "page.jsx"),
    join(routeDir, "page.js"),
  ];

  return pageFiles.some((f) => existsSync(f));
}

// ─── Core Service Checks ────────────────────────────────────

async function checkMongoDB(): Promise<EngineStatus> {
  const start = Date.now();
  const lastChecked = new Date().toISOString();
  try {
    const { default: mongoose } = await import("mongoose");
    const uri = process.env.MONGODB_URI;
    if (!uri) {
      return { id: "core-mongodb", title: "MongoDB", category: "Core Services", href: "#", status: "offline", lastChecked, isCoreService: true };
    }
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.db!.admin().ping();
      return { id: "core-mongodb", title: "MongoDB", category: "Core Services", href: "#", status: "online", responseTime: Date.now() - start, lastChecked, isCoreService: true };
    }
    const conn = await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000, connectTimeoutMS: 5000 });
    await conn.connection.db!.admin().ping();
    return { id: "core-mongodb", title: "MongoDB", category: "Core Services", href: "#", status: "online", responseTime: Date.now() - start, lastChecked, isCoreService: true };
  } catch {
    return { id: "core-mongodb", title: "MongoDB", category: "Core Services", href: "#", status: "offline", responseTime: Date.now() - start, lastChecked, isCoreService: true };
  }
}

async function checkCloudinary(): Promise<EngineStatus> {
  const start = Date.now();
  const lastChecked = new Date().toISOString();
  try {
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;
    if (!cloudName || !apiKey || !apiSecret) {
      return { id: "core-cloudinary", title: "Cloudinary CDN", category: "Core Services", href: "#", status: "offline", lastChecked, isCoreService: true };
    }
    // Ping Cloudinary API
    const timestamp = Math.round(Date.now() / 1000);
    const signature = require("crypto").createHash("sha1").update(`timestamp=${timestamp}${apiSecret}`).digest("hex");
    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/resources/image?type=upload&max_results=1&timestamp=${timestamp}&api_key=${apiKey}&signature=${signature}`,
      { signal: AbortSignal.timeout(5000) }
    );
    return { id: "core-cloudinary", title: "Cloudinary CDN", category: "Core Services", href: "#", status: res.ok ? "online" : "offline", httpCode: res.status, responseTime: Date.now() - start, lastChecked, isCoreService: true };
  } catch {
    return { id: "core-cloudinary", title: "Cloudinary CDN", category: "Core Services", href: "#", status: "offline", responseTime: Date.now() - start, lastChecked, isCoreService: true };
  }
}

async function checkClerkAuth(): Promise<EngineStatus> {
  const start = Date.now();
  const lastChecked = new Date().toISOString();
  try {
    const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
    const secretKey = process.env.CLERK_SECRET_KEY;
    if (!publishableKey || !secretKey) {
      return { id: "core-clerk", title: "Clerk Auth", category: "Core Services", href: "#", status: "offline", lastChecked, isCoreService: true };
    }
    // Ping Clerk frontend API
    const res = await fetch("https://api.clerk.com/v1/health", {
      signal: AbortSignal.timeout(5000),
      headers: { Authorization: `Bearer ${secretKey}` },
    });
    return { id: "core-clerk", title: "Clerk Auth", category: "Core Services", href: "#", status: res.ok ? "online" : "offline", httpCode: res.status, responseTime: Date.now() - start, lastChecked, isCoreService: true };
  } catch {
    return { id: "core-clerk", title: "Clerk Auth", category: "Core Services", href: "#", status: "offline", responseTime: Date.now() - start, lastChecked, isCoreService: true };
  }
}

async function checkFileSystem(): Promise<EngineStatus> {
  const start = Date.now();
  const lastChecked = new Date().toISOString();
  try {
    const testFile = join(process.cwd(), ".health-check-temp");
    writeFileSync(testFile, "ok");
    unlinkSync(testFile);
    return { id: "core-filesystem", title: "File System", category: "Core Services", href: "#", status: "online", responseTime: Date.now() - start, lastChecked, isCoreService: true };
  } catch {
    return { id: "core-filesystem", title: "File System", category: "Core Services", href: "#", status: "offline", responseTime: Date.now() - start, lastChecked, isCoreService: true };
  }
}

async function checkEducationalAI(): Promise<EngineStatus> {
  const start = Date.now();
  const lastChecked = new Date().toISOString();
  try {
    const url = process.env.NEXT_PUBLIC_EDUCATIONAL_AI_API_URL || "http://localhost:8000";
    const res = await fetch(url, { signal: AbortSignal.timeout(5000), redirect: "follow" });
    return { id: "core-edu-ai", title: "Educational AI", category: "Core Services", href: "#", status: res.ok ? "online" : "offline", httpCode: res.status, responseTime: Date.now() - start, lastChecked, isCoreService: true };
  } catch {
    return { id: "core-edu-ai", title: "Educational AI", category: "Core Services", href: "#", status: "offline", responseTime: Date.now() - start, lastChecked, isCoreService: true };
  }
}

async function checkNodeProcess(): Promise<EngineStatus> {
  const start = Date.now();
  const lastChecked = new Date().toISOString();
  try {
    const mem = process.memoryUsage();
    const uptime = process.uptime();
    return {
      id: "core-nodejs",
      title: "Node.js Runtime",
      category: "Core Services",
      href: "#",
      status: "online",
      responseTime: Date.now() - start,
      lastChecked,
      isCoreService: true,
    };
  } catch {
    return { id: "core-nodejs", title: "Node.js Runtime", category: "Core Services", href: "#", status: "offline", responseTime: Date.now() - start, lastChecked, isCoreService: true };
  }
}

// ─── Engine Check ───────────────────────────────────────────

async function checkEngine(engine: typeof ENGINES_LIST[0]): Promise<EngineStatus> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const lastChecked = new Date().toISOString();

  // External URLs (like Vite dev server) - HTTP ping
  if (engine.external || engine.href.startsWith("http")) {
    const result = await pingUrl(engine.href);
    return { id: engine.id, title: engine.title, category: engine.category, href: engine.href, status: interpretStatus(result.code, result.ok), httpCode: result.code || undefined, responseTime: result.ms, lastChecked };
  }

  // Internal routes - check if page file exists on disk
  const pageExists = checkPageExists(engine.href);
  if (pageExists) {
    return { id: engine.id, title: engine.title, category: engine.category, href: engine.href, status: "online", lastChecked };
  }

  // Page doesn't exist on disk - try HTTP ping as fallback
  const url = `${baseUrl}${engine.href}`;
  const result = await pingUrl(url);
  const status = interpretStatus(result.code, result.ok);
  return { id: engine.id, title: engine.title, category: engine.category, href: engine.href, status, httpCode: result.code || undefined, responseTime: result.ms, lastChecked };
}

// ─── Main Handler ───────────────────────────────────────────

export async function GET() {
  try {
    const lastChecked = new Date().toISOString();

    // 1. Check core services first (concurrently)
    const coreResults = await Promise.allSettled([
      checkNodeProcess(),
      checkMongoDB(),
      checkCloudinary(),
      checkClerkAuth(),
      checkFileSystem(),
      checkEducationalAI(),
    ]);

    const coreStatuses: EngineStatus[] = coreResults
      .filter((r): r is PromiseFulfilledResult<EngineStatus> => r.status === "fulfilled")
      .map((r) => r.value);

    // 2. Check engines in batches
    const BATCH_SIZE = 5;
    const engineStatuses: EngineStatus[] = [];

    for (let i = 0; i < ENGINES_LIST.length; i += BATCH_SIZE) {
      const batch = ENGINES_LIST.slice(i, i + BATCH_SIZE);
      const batchResults = await Promise.allSettled(
        batch.map((engine) => checkEngine(engine))
      );
      for (const result of batchResults) {
        if (result.status === "fulfilled") {
          engineStatuses.push(result.value);
        }
      }
    }

    // 3. Combine: core services first, then engines
    const allStatuses = [...coreStatuses, ...engineStatuses];

    const summary = {
      total: allStatuses.length,
      online: allStatuses.filter((s) => s.status === "online").length,
      offline: allStatuses.filter((s) => s.status === "offline").length,
      unknown: allStatuses.filter((s) => s.status === "unknown").length,
      coreServices: coreStatuses.length,
      coreOnline: coreStatuses.filter((s) => s.status === "online").length,
    };

    return NextResponse.json({ statuses: allStatuses, summary });
  } catch (error) {
    return NextResponse.json({ error: "Failed to check statuses" }, { status: 500 });
  }
}
