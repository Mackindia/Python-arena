import { NextResponse } from "next/server";
import { ENGINES_LIST } from "@/src/constants/engines";
import { existsSync } from "fs";
import { join } from "path";

export const dynamic = "force-dynamic";

type EngineStatus = {
  id: string;
  title: string;
  category: string;
  href: string;
  status: "online" | "offline" | "unknown";
  lastChecked: string;
};

function checkPageExists(href: string): boolean {
  const appDir = join(process.cwd(), "app");

  // Skip external URLs
  if (href.startsWith("http")) return true;

  // Clean the href - remove query params, leading slash
  const cleanPath = href.split("?")[0].replace(/^\//, "");

  // Check for page.tsx or page.ts in the route directory
  const routeDir = join(appDir, cleanPath);
  const pageFiles = [
    join(routeDir, "page.tsx"),
    join(routeDir, "page.ts"),
    join(routeDir, "page.jsx"),
    join(routeDir, "page.js"),
  ];

  return pageFiles.some((f) => existsSync(f));
}

export async function GET() {
  try {
    const lastChecked = new Date().toISOString();

    const statuses: EngineStatus[] = ENGINES_LIST.map((engine) => {
      const exists = checkPageExists(engine.href);

      return {
        id: engine.id,
        title: engine.title,
        category: engine.category,
        href: engine.href,
        status: exists ? "online" : "offline",
        lastChecked,
      };
    });

    const summary = {
      total: statuses.length,
      online: statuses.filter((s) => s.status === "online").length,
      offline: statuses.filter((s) => s.status === "offline").length,
      unknown: statuses.filter((s) => s.status === "unknown").length,
    };

    return NextResponse.json({ statuses, summary });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to check engine statuses" },
      { status: 500 }
    );
  }
}
