import { NextRequest, NextResponse } from "next/server";
import { isAllowedCloudinaryUrl } from "@/lib/cloudinary-hosts";
import { looksLikePdfUrl } from "@/lib/pdf-source";
import { isPrivateUrl, getCorsHeaders, sanitizeError } from "@/lib/security";

export const runtime = "nodejs";

const FETCH_TIMEOUT_MS = 15_000;

const ALLOWED_HOSTS = new Set([
  "res.cloudinary.com",
  "doon-scholars.s3.amazonaws.com",
  "storage.googleapis.com",
]);

function getFileNameFromUrl(url: URL) {
  const rawName = url.pathname.split("/").pop() || "lesson";
  return rawName.toLowerCase().endsWith(".pdf") ? rawName : `${rawName}.pdf`;
}

function isCloudinaryRawUpload(url: URL) {
  return isAllowedCloudinaryUrl(url.toString()) && url.pathname.includes("/raw/upload/");
}

function isLikelyPdfResponse(url: URL, headers: Headers) {
  const contentType = headers.get("content-type")?.toLowerCase() || "";
  if (contentType.includes("application/pdf")) return true;
  if (looksLikePdfUrl(url.toString())) return true;
  return isCloudinaryRawUpload(url) && contentType.includes("application/octet-stream");
}

export async function GET(request: NextRequest) {
  const source = request.nextUrl.searchParams.get("url")?.trim();
  const download = request.nextUrl.searchParams.get("download") === "1";
  const range = request.headers.get("range");

  if (!source) {
    return NextResponse.json({ message: "Missing url query parameter." }, { status: 400 });
  }

  let upstreamUrl: URL;
  try {
    upstreamUrl = new URL(source);
  } catch {
    return NextResponse.json({ message: "Invalid URL." }, { status: 400 });
  }

  if (!["http:", "https:"].includes(upstreamUrl.protocol)) {
    return NextResponse.json({ message: "Only http/https URLs are supported." }, { status: 400 });
  }

  if (isPrivateUrl(source)) {
    return NextResponse.json({ message: "Private/internal URLs are not allowed." }, { status: 403 });
  }

  if (!ALLOWED_HOSTS.has(upstreamUrl.hostname) && !isAllowedCloudinaryUrl(source)) {
    const isFromApp = request.headers.get("referer")?.includes("doonscholars.com") ||
                      request.headers.get("origin")?.includes("doonscholars.com");
    if (!isFromApp) {
      return NextResponse.json({ message: "URL not from allowed domain." }, { status: 403 });
    }
  }

  try {
    const upstream = await fetch(upstreamUrl.toString(), {
      method: "GET",
      headers: range ? { Range: range } : undefined,
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      cache: "force-cache",
    });

    if (!upstream.ok || !upstream.body) {
      return NextResponse.json({ message: "Failed to fetch PDF." }, { status: 502 });
    }

    if (!isLikelyPdfResponse(upstreamUrl, upstream.headers)) {
      return NextResponse.json({ message: "Upstream URL did not return a PDF." }, { status: 415 });
    }

    const headers = new Headers();
    headers.set("Content-Type", "application/pdf");
    headers.set(
      "Content-Disposition",
      `${download ? "attachment" : "inline"}; filename="${getFileNameFromUrl(upstreamUrl)}"`,
    );

    const contentLength = upstream.headers.get("content-length");
    if (contentLength) headers.set("Content-Length", contentLength);

    const contentRange = upstream.headers.get("content-range");
    if (contentRange) headers.set("Content-Range", contentRange);

    const acceptRanges = upstream.headers.get("accept-ranges");
    if (acceptRanges) headers.set("Accept-Ranges", acceptRanges);

    headers.set("Cache-Control", "public, max-age=3600");

    return new NextResponse(upstream.body, {
      status: upstream.status,
      headers,
    });
  } catch (error: unknown) {
    return NextResponse.json({ message: "Failed to proxy PDF." }, { status: 500 });
  }
}

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 204,
    headers: getCorsHeaders(request),
  });
}
