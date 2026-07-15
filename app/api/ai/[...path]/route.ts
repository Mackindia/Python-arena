import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin-api";

const AI_BACKEND_URL = process.env.AI_BACKEND_URL || "http://127.0.0.1:8000";

async function proxyRequest(request: NextRequest, { params }: { params: Promise<{ path: string[] }> | { path: string[] } }) {
  const auth = await requireAdminApi();
  if (!auth.ok) {
    return auth.response;
  }

  try {
    // In Next.js 15, params is a Promise. We support both to be safe.
    const resolvedParams = await Promise.resolve(params);
    const pathArray = resolvedParams.path || [];
    const backendPath = pathArray.join("/");

    const url = new URL(`${AI_BACKEND_URL}/${backendPath}`);
    url.search = request.nextUrl.search;

    const headers = new Headers();
    const contentType = request.headers.get("content-type");
    if (contentType) {
      headers.set("content-type", contentType);
    }

    let body = null;
    if (request.method !== "GET" && request.method !== "HEAD") {
      body = await request.blob();
    }

    const response = await fetch(url.toString(), {
      method: request.method,
      headers,
      body,
      cache: "no-store",
    });

    const responseBody = await response.blob();

    const responseHeaders = new Headers();
    const resContentType = response.headers.get("content-type");
    if (resContentType) {
      responseHeaders.set("content-type", resContentType);
    }

    return new NextResponse(responseBody, {
      status: response.status,
      headers: responseHeaders,
    });
  } catch (error) {
    console.error("AI Proxy Error:", error);
    return NextResponse.json(
      {
        message: "Failed to connect to AI Teacher backend. Is the Python FastAPI server running?",
        error: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 502 }
    );
  }
}

export const GET = proxyRequest;
export const POST = proxyRequest;
export const PUT = proxyRequest;
export const DELETE = proxyRequest;
export const PATCH = proxyRequest;
