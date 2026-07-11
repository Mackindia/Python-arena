import { NextResponse } from "next/server";
import { getAllServers } from "@/lib/server-process-store";

export async function GET() {
  return NextResponse.json({ servers: getAllServers() });
}
