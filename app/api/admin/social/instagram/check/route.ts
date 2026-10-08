import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin-api";
import { checkInstagramConnection } from "@/lib/instagram";

export const runtime = "nodejs";

export async function GET() {
  try {
    const access = await requireAdminApi();
    if (!access.ok) {
      return access.response;
    }

    const result = await checkInstagramConnection();
    return NextResponse.json(result, { status: result.ok ? 200 : 503 });
  } catch (error) {
    return NextResponse.json(
      { ok: false, configured: true, error: error instanceof Error ? error.message : "Unknown" },
      { status: 500 },
    );
  }
}
