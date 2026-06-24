import { cp, rm, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

const viteAppDir = path.resolve(
  rootDir,
  "VS CODE Final TT project Doon Scholars",
  "timetable-web-app"
);
const distDir = path.resolve(viteAppDir, "dist");
const targetDir = path.resolve(rootDir, "public", "timetable");

function run(command, args, cwd) {
  return new Promise((resolve, reject) => {
    const isWindows = process.platform === "win32";
    const child = isWindows
      ? spawn("cmd.exe", ["/d", "/s", "/c", `${command} ${args.join(" ")}`], {
          cwd,
          stdio: "inherit",
          shell: false,
        })
      : spawn(command, args, {
          cwd,
          stdio: "inherit",
          shell: false,
        });

    child.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${command} ${args.join(" ")} failed with code ${code}`));
    });
  });
}

async function main() {
  console.log("Building timetable Vite app...");
  await run("npm.cmd", ["run", "build"], viteAppDir);

  if (!existsSync(distDir)) {
    throw new Error(`Build output not found at ${distDir}`);
  }

  console.log("Syncing dist to public/timetable...");
  await mkdir(targetDir, { recursive: true });
  await rm(targetDir, { recursive: true, force: true });
  await mkdir(targetDir, { recursive: true });
  await cp(distDir, targetDir, { recursive: true });

  console.log("Done. Timetable assets synced to public/timetable.");
}

main().catch((err) => {
  console.error("sync:timetable failed:", err.message);
  process.exit(1);
});
