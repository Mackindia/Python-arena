import { NextResponse } from "next/server";
import { removeServer } from "@/lib/server-process-store";

export async function POST(req: Request) {
  try {
    const { serverId } = await req.json();

    if (!serverId) {
      return NextResponse.json({ error: "serverId required" }, { status: 400 });
    }

    const removed = removeServer(serverId);
    if (!removed) {
      return NextResponse.json({ error: "Server not found or already stopped" }, { status: 404 });
    }

    return NextResponse.json({ ok: true, stopped: serverId });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
