import { NextResponse } from "next/server";
import { exec } from "child_process";
import { writeFileSync } from "fs";
import { join } from "path";

export async function POST(req: Request) {
  try {
    const { command } = await req.json();

    if (!command) {
      return NextResponse.json({ error: "command required" }, { status: 400 });
    }

    const scriptPath = join("C:\\Users\\Doon Scholars\\Downloads", "claude-launch.ps1");
    writeFileSync(scriptPath, command, "utf-8");

    // Use cmd /c start to open a full interactive PowerShell with user profile (PATH intact)
    const psCommand = `cmd.exe /c start powershell -ExecutionPolicy Bypass -NoExit -File "${scriptPath}"`;
    exec(psCommand, { windowsHide: false });

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
