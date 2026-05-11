import { NextRequest, NextResponse } from "next/server";
import { isAllowedCloudinaryHost } from "@/lib/cloudinary-hosts";

export const runtime = "nodejs";

const FETCH_TIMEOUT_MS = 15_000;

function withCors(headers?: HeadersInit) {
  const merged = new Headers(headers);
  merged.set("Access-Control-Allow-Origin", "*");
  merged.set("Access-Control-Allow-Methods", "GET, OPTIONS");
  merged.set("Access-Control-Allow-Headers", "Range, Content-Type");
  merged.set("Access-Control-Expose-Headers", "Content-Length, Content-Disposition, Content-Range, Accept-Ranges");
  return merged;
}

function isAllowedPdfHost(hostname: string) {
  return isAllowedCloudinaryHost(hostname);
}

function getFileNameFromUrl(url: URL) {
  const rawName = url.pathname.split("/").pop() || "lesson";
  return rawName.toLowerCase().endsWith(".pdf") ? rawName : `${rawName}.pdf`;
}

export async function GET(request: NextRequest) {
  const source = request.nextUrl.searchParams.get("url")?.trim();
  const download = request.nextUrl.searchParams.get("download") === "1";
  const range = request.headers.get("range");

  if (!source) {
    return NextResponse.json({ message: "Missing url query parameter." }, { status: 400, headers: withCors() });
  }

  let upstreamUrl: URL;
  try {
    upstreamUrl = new URL(source);
  } catch {
    return NextResponse.json({ message: "Invalid URL." }, { status: 400, headers: withCors() });
  }

  if (!["http:", "https:"].includes(upstreamUrl.protocol)) {
    return NextResponse.json({ message: "Only http/https URLs are supported." }, { status: 400, headers: withCors() });
  }

  if (!isAllowedPdfHost(upstreamUrl.hostname)) {
    return NextResponse.json({ message: "Host is not allowed." }, { status: 403, headers: withCors() });
  }

  try {
    const upstream = await fetch(upstreamUrl.toString(), {
      method: "GET",
      headers: range ? { Range: range } : undefined,
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      cache: "force-cache",
    });

    if (!upstream.ok || !upstream.body) {
      return NextResponse.json(
        { message: `Failed to fetch PDF. HTTP ${upstream.status}` },
        { status: 502, headers: withCors() },
      );
    }

    const headers = new Headers();
    headers.set("Content-Type", "application/pdf");
    headers.set(
      "Content-Disposition",
      `${download ? "attachment" : "inline"}; filename=\"${getFileNameFromUrl(upstreamUrl)}\"`,
    );

    const contentLength = upstream.headers.get("content-length");
    if (contentLength) {
      headers.set("Content-Length", contentLength);
    }

    const contentRange = upstream.headers.get("content-range");
    if (contentRange) {
      headers.set("Content-Range", contentRange);
    }

    const acceptRanges = upstream.headers.get("accept-ranges");
    if (acceptRanges) {
      headers.set("Accept-Ranges", acceptRanges);
    }

    headers.set("Cache-Control", "public, max-age=3600");

    return new NextResponse(upstream.body, {
      status: upstream.status,
      headers: withCors(headers),
    });
  } catch (error) {
    return NextResponse.json(
      {
        message: "Failed to proxy PDF.",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500, headers: withCors() },
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: withCors(),
  });
}
