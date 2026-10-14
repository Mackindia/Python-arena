import { spawn } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";

export function run(cmd, args, opts = {}) {
  return new Promise((resolve, reject) => {
    const p = spawn(cmd, args, { windowsHide: true, ...opts });
    let out = "", err = "";
    p.stdout?.on("data", d => (out += d));
    p.stderr?.on("data", d => (err += d));
    p.on("error", reject);
    p.on("close", code => {
      if (code === 0) resolve({ out, err });
      else reject(new Error(`${cmd} exited ${code}\n${err.slice(-2000)}`));
    });
  });
}

export async function ffprobeDuration(file) {
  const { out } = await run("ffprobe", [
    "-v", "error",
    "-show_entries", "format=duration",
    "-of", "default=noprint_wrappers=1:nokey=1",
    file,
  ]);
  return parseFloat(out.trim());
}

export function ffmpegPath() {
  return process.env.FFMPEG_PATH || "ffmpeg";
}

export function ffprobePath() {
  return process.env.FFPROBE_PATH || "ffprobe";
}

function srtTime(sec) {
  const ms = Math.max(0, Math.round(sec * 1000));
  const h = String(Math.floor(ms / 3600000)).padStart(2, "0");
  const m = String(Math.floor((ms % 3600000) / 60000)).padStart(2, "0");
  const s = String(Math.floor((ms % 60000) / 1000)).padStart(2, "0");
  const f = String(ms % 1000).padStart(3, "0");
  return `${h}:${m}:${s},${f}`;
}

function wrapCaption(text, maxChars = 42) {
  const words = String(text).replace(/\s+/g, " ").trim().split(" ");
  const lines = [];
  let line = "";
  for (const w of words) {
    if ((line + " " + w).trim().length > maxChars) {
      if (line) lines.push(line.trim());
      line = w;
    } else {
      line = (line + " " + w).trim();
    }
  }
  if (line) lines.push(line.trim());
  return lines.slice(0, 2).join("\n");
}

export async function writeSrt(cues, file) {
  const body = cues.map((c, i) =>
    `${i + 1}\n${srtTime(c.start)} --> ${srtTime(c.end)}\n${wrapCaption(c.text)}\n`
  ).join("\n");
  await fs.writeFile(file, "﻿" + body, "utf8"); // BOM so libass reads UTF-8
  return file;
}

function assTime(sec) {
  const cs = Math.max(0, Math.round(sec * 100));
  const h = Math.floor(cs / 360000);
  const m = String(Math.floor((cs % 360000) / 6000)).padStart(2, "0");
  const s = String(Math.floor((cs % 6000) / 100)).padStart(2, "0");
  const c = String(cs % 100).padStart(2, "0");
  return `${h}:${m}:${s}.${c}`;
}

// Full ASS with explicit PlayResX/Y so FontSize is in real output pixels
export async function writeAss(cues, file, { width, height, fontSize = 16, alignment = 2, marginV = 28, font = "Arial" }) {
  const events = cues.map(c =>
    `Dialogue: 0,${assTime(c.start)},${assTime(c.end)},Default,,0,0,0,,${wrapCaption(c.text, 40).replace(/\n/g, "\\N")}`
  ).join("\n");
  const body =
`[Script Info]
ScriptType: v4.00+
PlayResX: ${width}
PlayResY: ${height}
WrapStyle: 0
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,${font},${fontSize},&H00FFFFFF,&H80000000,&H00000000,0,0,0,0,100,100,0,0,1,1.5,0,${alignment},40,40,${marginV},1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
${events}
`;
  await fs.writeFile(file, "﻿" + body, "utf8");
  return file;
}

export function subtitleFilter(srtFile, lang, opts = {}) {
  const name = path.basename(srtFile);
  // .ass files carry their own full style (PlayRes, alignment, size) — do not override
  if (/\.ass$/i.test(name)) return `subtitles=${name}`;
  const font = lang === "hi" ? "Nirmala UI" : "Arial";
  const fontSize = opts.fontSize ?? 16;
  const alignment = opts.alignment ?? 2;
  const marginV = opts.marginV ?? 28;
  return `subtitles=${name}:force_style='FontName=${font},FontSize=${fontSize},Alignment=${alignment},PrimaryColour=&H00FFFFFF&,OutlineColour=&H80000000&,BorderStyle=1,Outline=1,Shadow=0,MarginV=${marginV}'`;
}
