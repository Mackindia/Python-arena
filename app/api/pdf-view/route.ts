import { NextRequest, NextResponse } from "next/server";
import { isAllowedCloudinaryUrl } from "@/lib/cloudinary-hosts";
import { isValidHttpUrl, looksLikePdfUrl } from "@/lib/pdf-source";

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

function getFileNameFromUrl(url: URL) {
  const rawName = url.pathname.split("/").pop() || "lesson";
  return rawName.toLowerCase().endsWith(".pdf") ? rawName : `${rawName}.pdf`;
}

function isCloudinaryRawUpload(url: URL) {
  return isAllowedCloudinaryUrl(url.toString()) && url.pathname.includes("/raw/upload/");
}

function isLikelyPdfResponse(url: URL, headers: Headers) {
  const contentType = headers.get("content-type")?.toLowerCase() || "";
  if (contentType.includes("application/pdf")) {
    return true;
  }

  if (looksLikePdfUrl(url.toString())) {
    return true;
  }

  // Cloudinary raw uploads often serve PDFs as application/octet-stream
  // without a .pdf suffix. Those assets are still valid PDF sources here.
  return isCloudinaryRawUpload(url) && contentType.includes("application/octet-stream");
}

import { auth } from "@clerk/nextjs/server";

export async function GET(request: NextRequest) {
  // Check if user is authenticated (either Gmail or Admission No)
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ message: "Unauthorized. Please log in to view resources." }, { status: 401, headers: withCors() });
  }

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

    if (!isLikelyPdfResponse(upstreamUrl, upstream.headers)) {
      return NextResponse.json(
        { message: "Upstream URL did not return a PDF." },
        { status: 415, headers: withCors() },
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
