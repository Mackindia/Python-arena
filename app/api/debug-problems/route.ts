import { NextResponse } from "next/server";
import { execSync } from "child_process";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const cmd = searchParams.get('cmd') || 'npx tsc --noEmit';
  try {
    const output = execSync(cmd, { encoding: 'utf-8', cwd: process.cwd() });
    return NextResponse.json({ success: true, output });
  } catch (error: any) {
    return NextResponse.json({ success: false, output: error.stdout || error.message });
  }
}
