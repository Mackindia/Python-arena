import "dotenv/config";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { fetchSceneClip } from "./stock.js";
import { run, ffmpegPath, ffprobeDuration } from "./util.js";
import { prepareMusic } from "./musicTrim.js";

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

export async function loadEnv() {
  if (!process.env.GOOGLE_API_KEY) {
    try {
      const env = await fs.readFile(path.join(ROOT, ".env"), "utf8");
      for (const line of env.split(/\r?\n/)) {
        const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
        if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
      }
    } catch { /* no .env */ }
  }
  return process.env;
}

const THEMES = {
  festive: {
    bg: ["0x2D0A4E", "0x6B0F3A", "0x1A0533"],
    gold: "&H0000D7FF", magenta: "&H00882EFF", orange: "&H00009AFF",
    grade: "eq=contrast=1.06:saturation=1.32:gamma=1.02,colorbalance=rs=0.06:gs=0.02:bs=-0.05",
  },
  gold: {
    bg: ["0x1A1200", "0x4A3000", "0x0D0A00"],
    gold: "&H0000D7FF", magenta: "&H0050C8FF", orange: "&H0000A5FF",
    grade: "eq=contrast=1.08:saturation=1.25:gamma=1.03,colorbalance=rs=0.08:gs=0.04:bs=-0.08",
  },
  neon: {
    bg: ["0x05001A", "0x1A0040", "0x000D1A"],
    gold: "&H00CCFFFF", magenta: "&H00FF2EE6", orange: "&H0000FFCC",
    grade: "eq=contrast=1.1:saturation=1.45:gamma=1.0,colorbalance=rs=-0.02:gs=0.0:bs=0.08",
  },
  sunset: {
    bg: ["0x2A0A10", "0x8A2E00", "0x1A0520"],
    gold: "&H0033CCFF", magenta: "&H003399FF", orange: "&H00148AFF",
    grade: "eq=contrast=1.05:saturation=1.3:gamma=1.02,colorbalance=rs=0.1:gs=0.02:bs=-0.08",
  },
  royal: {
    bg: ["0x0A0A2E", "0x1E1E6E", "0x050518"],
    gold: "&H0033CCFF", magenta: "&H00D4A017", orange: "&H008060FF",
    grade: "eq=contrast=1.07:saturation=1.2:gamma=1.02,colorbalance=rs=0.0:gs=0.02:bs=0.06",
  },
};

export function getTheme(name) {
  return THEMES[name] || THEMES.festive;
}

const WHITE = "&H00FFFFFF";
const BLACK = "&H00000000";

function assTime(sec) {
  const cs = Math.max(0, Math.round(sec * 100));
  const h = Math.floor(cs / 360000);
  const m = String(Math.floor((cs % 360000) / 6000)).padStart(2, "0");
  const s = String(Math.floor((cs % 6000) / 100)).padStart(2, "0");
  const c = String(cs % 100).padStart(2, "0");
  return `${h}:${m}:${s}.${c}`;
}

async function writeAssFile(file, styles, events, width, height) {
  const styleLines = Object.entries(styles).map(([name, s]) =>
    `Style: ${name},${s.font},${s.size},${s.color},${s.outlineColor || BLACK},&H00000000,1,0,0,0,100,100,0,0,1,${s.outline ?? 3},${s.shadow ?? 1},5,40,40,40,1`
  ).join("\n");
  const evLines = events.map(e =>
    `Dialogue: 0,${assTime(e.start)},${assTime(e.end)},${e.style},,0,0,0,,${e.text}`
  ).join("\n");
  const body = `[Script Info]
ScriptType: v4.00+
PlayResX: ${width}
PlayResY: ${height}
WrapStyle: 2
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
${styleLines}

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
${evLines}
`;
  await fs.writeFile(file, "﻿" + body, "utf8");
  return file;
}

function cardStyles(theme, scale = 1) {
  const s = v => Math.round(v * scale);
  return {
    TitleGold: { font: "Arial Black", size: s(104), color: theme.gold, outline: 5, shadow: 2 },
    SubMag: { font: "Arial Black", size: s(56), color: theme.magenta, outline: 3, shadow: 1 },
    SubWhite: { font: "Arial", size: s(48), color: WHITE, outline: 3, shadow: 1 },
    OutroGold: { font: "Arial Black", size: s(92), color: theme.gold, outline: 5, shadow: 2 },
    OutroWhite: { font: "Arial Black", size: s(46), color: WHITE, outline: 3, shadow: 1 },
    OutroOrange: { font: "Arial", size: s(42), color: theme.orange, outline: 3, shadow: 1 },
    OutroMag: { font: "Arial Black", size: s(48), color: theme.magenta, outline: 3, shadow: 1 },
  };
}

function overlayStyles(theme, scale = 1) {
  const s = v => Math.round(v * scale);
  return {
    A: { font: "Arial Black", size: s(62), color: theme.gold, outline: 4, shadow: 2 },
    B: { font: "Arial Black", size: s(58), color: WHITE, outline: 4, shadow: 2 },
    C: { font: "Arial", size: s(46), color: theme.orange, outline: 3, shadow: 1 },
    D: { font: "Arial Black", size: s(48), color: WHITE, outline: 3, shadow: 1 },
    E: { font: "Arial Black", size: s(60), color: theme.magenta, outline: 4, shadow: 2 },
    F: { font: "Arial Black", size: s(54), color: theme.gold, outline: 4, shadow: 2 },
  };
}

const OVERLAY_STYLE_CYCLE = ["A", "B", "E", "D", "F", "A"];

async function makeCard({ outFile, workDir, assName, events, duration, bg, theme, width, height, scale }) {
  const ass = path.join(workDir, assName);
  await writeAssFile(ass, cardStyles(theme, scale), events, width, height);
  const frames = Math.ceil((duration + 0.05) * 30);
  const [c0, c1, c2] = bg;
  await run(ffmpegPath(), [
    "-y",
    "-f", "lavfi",
    "-i", `gradients=s=${width}x${height}:c0=${c0}:c1=${c1}:c2=${c2}:n=3:speed=0.03:d=${(duration + 0.05).toFixed(2)}`,
    "-vf", `subtitles=${path.basename(ass)},fps=30,setsar=1`,
    "-frames:v", String(frames),
    "-an",
    "-c:v", "libx264", "-preset", "fast", "-crf", "18", "-pix_fmt", "yuv420p",
    outFile,
  ], { cwd: workDir });
  return outFile;
}

async function applyCameraMove(src, out, duration, mode, width, height) {
  const frames = Math.ceil((duration + 0.02) * 30);
  let z, x;
  if (mode === "zoomOut") {
    z = `1.38-0.38*on/${frames}`;
    x = `iw/2-(iw/zoom/2)`;
  } else if (mode === "zoomIn") {
    z = `1.0+0.32*on/${frames}`;
    x = `iw/2-(iw/zoom/2)`;
  } else {
    z = `1.18`;
    x = `(iw-iw/zoom)*on/${frames}`;
  }
  const y = `ih/2-(ih/zoom/2)`;
  const vf = `zoompan=z='${z}':x='${x}':y='${y}':d=1:s=${width}x${height}:fps=30,setsar=1`;
  await run(ffmpegPath(), [
    "-y", "-i", src,
    "-t", (duration + 0.02).toFixed(2),
    "-vf", vf,
    "-an",
    "-c:v", "libx264", "-preset", "fast", "-crf", "18", "-pix_fmt", "yuv420p",
    out,
  ]);
  return out;
}

const TRANSITIONS = ["wipeleft", "fadeblack", "slideleft", "dissolve", "wipeup"];
const okFile = p => fs.stat(p).then(s => s.size > 1000).catch(() => false);

async function assemblePromo({
  clips, durations, overlayAss, outFile, workDir, total, theme, width, height,
  music = null, musicStart = 0, musicEnd = null, musicFadeIn = 1, musicFadeOut = 2,
  musicLoop = true, musicVolume = 1.0, loudnorm = true,
}) {
  const TD = 0.18;
  const args = ["-y"];
  for (const c of clips) args.push("-i", c);

  const n = clips.length;
  const parts = [];
  for (let i = 0; i < n; i++) parts.push(`[${i}:v]setpts=PTS-STARTPTS,fps=30,setsar=1[v${i}]`);

  let prev = "v0";
  let acc = durations[0];
  for (let i = 1; i < n; i++) {
    const outL = `x${i}`;
    const tr = TRANSITIONS[(i - 1) % TRANSITIONS.length];
    const dur = Math.min(TD, Math.max(0.12, durations[i] * 0.45));
    const offset = Math.max(0.05, acc - dur);
    parts.push(`[${prev}][v${i}]xfade=transition=${tr}:duration=${dur.toFixed(3)}:offset=${offset.toFixed(3)}[${outL}]`);
    prev = outL;
    acc = acc + durations[i] - dur;
  }

  const spark =
    `life=s=${width}x${height}:mold=10:r=20:death_color=black:life_color=white:random_fill_ratio=0.018,` +
    `format=gray,lutyuv=y='if(gt(val,110),255,0)',format=yuv420p[spark]`;

  parts.push(
    `[${prev}]subtitles=${path.basename(overlayAss)},${theme.grade}[base]`
  );
  parts.push(spark);
  parts.push(`[base][spark]blend=all_mode=screen:all_opacity=0.26,vignette=PI/5,fps=30[vout]`);

  let vLabel = "vout";
  if (acc < total - 0.05) {
    parts.push(`[vout]tpad=stop_mode=clone:stop_duration=${(total - acc + 0.15).toFixed(3)}[vpad]`);
    vLabel = "vpad";
  }

  // music spans the whole promo (0:00..total) - same trimmer as assemble()
  let musicIdx = -1;
  let musChain = "";
  if (music) {
    const prep = await prepareMusic({
      file: music, start: musicStart, end: musicEnd,
      loop: musicLoop, volume: musicVolume,
      fadeIn: musicFadeIn, fadeOut: musicFadeOut,
      videoDur: total, workDir,
    });
    if (prep) {
      prep.warnings.forEach(w => console.log(`  music: ${w}`));
      if (prep.ok) {
        args.push(...prep.inputArgs);
        musicIdx = clips.length;
        musChain = prep.chain;
      }
    }
  }

  let aLabel = "aout";
  if (musicIdx >= 0) {
    parts.push(`[${musicIdx}:a]${musChain}[aout]`);
  } else {
    parts.push(`anullsrc=r=48000:cl=stereo:d=${total.toFixed(2)}[aout]`);
  }
  if (loudnorm) {
    parts.push(`[aout]loudnorm=I=-16:TP=-1.5:LRA=11[aFin]`);
    aLabel = "aFin";
  }

  args.push(
    "-filter_complex", parts.join(";"),
    "-map", `[${vLabel}]`, "-map", `[${aLabel}]`,
    "-t", String(total),
    "-c:v", "libx264", "-preset", "medium", "-crf", "18", "-pix_fmt", "yuv420p",
    "-c:a", "aac", "-b:a", "128k",
    "-movflags", "+faststart",
    outFile
  );
  await run(ffmpegPath(), args, { cwd: workDir });
  return outFile;
}

const MODES = ["zoomOut", "zoomIn", "pan"];

export async function renderPromo({
  name,
  intro,
  scenes,
  outro,
  theme: themeName = "festive",
  width = 1080,
  height = 1920,
  total = 10,
  introDur = 1.55,
  sceneDur = null,
  outroDur = 1.6,
  preferVideo = true,
  baseSeed = null,
  mediaFiles = [],
  musicFile = null,
  musicStart = 0,
  musicEnd = null,
  musicFadeIn = 1,
  musicFadeOut = 2,
  musicVolume = null,
  musicLoop = true,
  loudnorm = true,
}) {
  await loadEnv();
  const theme = getTheme(themeName);
  // scale fonts by the SHORTER side so landscape doesn't blow up text
  const scale = Math.min(width, height) / 1080;
  const nScenes = scenes.length;
  const sd = sceneDur ?? Math.max(1.2, (total - introDur - outroDur + nScenes * 0.18) / nScenes);

  // assign user media to scenes in order (file 1 -> scene 1, etc.) until media or scenes run out
  const mediaAssigned = new Array(nScenes).fill(null);
  const mediaQueue = Array.isArray(mediaFiles) ? [...mediaFiles] : [];
  for (let i = 0; i < nScenes && mediaQueue.length; i++) {
    mediaAssigned[i] = mediaQueue.shift();
  }
  const userMediaCount = mediaAssigned.filter(Boolean).length;
  if (userMediaCount) {
    console.log(`  user media: ${userMediaCount}/${nScenes} scenes will use your files`);
  }

  const workDir = path.join(ROOT, "work", name);
  const outDir = path.join(ROOT, "output");
  await fs.mkdir(workDir, { recursive: true });
  await fs.mkdir(outDir, { recursive: true });

  const seed = baseSeed ?? Math.floor(Math.random() * 1e6);
  console.log(`\n=== ${name} (${width}x${height}, ${total}s, ${nScenes} scenes, ${preferVideo ? "AI video" : "free images"}, theme=${themeName}) ===`);

  console.log("  intro card...");
  const introFile = path.join(workDir, "intro.mp4");
  const introEvents = [];
  const cx = Math.round(width / 2);
  let iy = Math.round(height * 0.40);
  const titleLen = (intro.title || "").length;
  const titleScale = titleLen > 28 ? 0.55 : titleLen > 22 ? 0.7 : titleLen > 16 ? 0.85 : 1;
  const introCardStyles = cardStyles(theme, scale);
  if (titleScale !== 1) introCardStyles.TitleGold.size = Math.round(introCardStyles.TitleGold.size * titleScale);
  introEvents.push({ start: 0, end: introDur + 0.6, style: "TitleGold", text: `{\\an5\\pos(${cx},${iy})\\fad(100,60)}${intro.title}` });
  iy += Math.round(150 * scale);
  if (intro.tagline) {
    introEvents.push({ start: 0.12, end: introDur + 0.6, style: "SubMag", text: `{\\an5\\pos(${cx},${iy})\\fad(120,60)}${intro.tagline}` });
    iy += Math.round(110 * scale);
  }
  if (intro.dateLine) {
    introEvents.push({ start: 0.25, end: introDur + 0.6, style: "SubWhite", text: `{\\an5\\pos(${cx},${iy})\\fad(120,60)}${intro.dateLine}` });
  }
  {
    const ass = path.join(workDir, "intro-promo.ass");
    await writeAssFile(ass, introCardStyles, introEvents, width, height);
    const frames = Math.ceil((introDur + 0.05) * 30);
    const [c0, c1, c2] = theme.bg;
    await run(ffmpegPath(), [
      "-y",
      "-f", "lavfi",
      "-i", `gradients=s=${width}x${height}:c0=${c0}:c1=${c1}:c2=${c2}:n=3:speed=0.03:d=${(introDur + 0.05).toFixed(2)}`,
      "-vf", `subtitles=${path.basename(ass)},fps=30,setsar=1`,
      "-frames:v", String(frames),
      "-an",
      "-c:v", "libx264", "-preset", "fast", "-crf", "18", "-pix_fmt", "yuv420p",
      introFile,
    ], { cwd: workDir });
  }

  const camClips = [];
  for (let i = 0; i < nScenes; i++) {
    const sc = scenes[i];
    const mode = sc.mode || MODES[i % MODES.length];
    const cam = path.join(workDir, `cam${i}.mp4`);
    const cached = path.join(workDir, `clip${i}.mp4`);
    const userMedia = mediaAssigned[i];
    // skip cache when this scene uses fresh user media (photos may differ between renders)
    if (!userMedia && await okFile(cam)) {
      console.log(`  scene ${i + 1}/${nScenes}: cached`);
      camClips.push(cam);
      continue;
    }
    const label = userMedia ? `your media ${path.basename(userMedia)}` : (sc.prompt || "").slice(0, 55);
    console.log(`  scene ${i + 1}/${nScenes} (${mode}): "${label}..."`);
    let raw;
    if (!userMedia && await okFile(cached)) {
      raw = cached;
    } else {
      raw = await fetchSceneClip({
        keywords: sc.keywords || [],
        promptText: sc.prompt,
        index: i,
        duration: sd + 0.35,
        width, height,
        workDir,
        style: sc.style || "cinematic",
        seed: seed + i * 31,
        preferVideo,
        mediaPath: userMedia,
      });
    }
    await applyCameraMove(raw, cam, sd, mode, width, height);
    camClips.push(cam);
  }

  console.log("  outro card...");
  const outroFile = path.join(workDir, "outro.mp4");
  const outroEvents = [];
  const outroLines = Array.isArray(outro) ? outro : (outro?.lines || []);
  const outroCardStyles = cardStyles(theme, scale);
  let oy = Math.round(height * 0.38);
  const outroStyle = ["OutroGold", "OutroGold", "OutroWhite", "OutroOrange", "OutroMag"];
  outroLines.forEach((line, i) => {
    const text = typeof line === "string" ? line : line.text;
    let style = (typeof line === "object" && line.style) || outroStyle[Math.min(i, outroStyle.length - 1)];
    if (text.length > 26 && (style === "OutroGold" || style === "OutroWhite" || style === "OutroMag")) {
      const k = text.length > 36 ? 0.6 : 0.75;
      const base = outroCardStyles[style];
      outroCardStyles[style] = { ...base, size: Math.round(base.size * k) };
    }
    outroEvents.push({
      start: i * 0.1,
      end: outroDur + 0.6,
      style,
      text: `{\\an5\\pos(${cx},${oy})\\fad(100,60)}${text}`,
    });
    oy += Math.round((style === "OutroGold" ? 120 : 90) * scale);
  });
  {
    const ass = path.join(workDir, "outro-promo.ass");
    await writeAssFile(ass, outroCardStyles, outroEvents, width, height);
    const frames = Math.ceil((outroDur + 0.05) * 30);
    const [c0, c1, c2] = [theme.bg[2], theme.bg[1], theme.bg[0]];
    await run(ffmpegPath(), [
      "-y",
      "-f", "lavfi",
      "-i", `gradients=s=${width}x${height}:c0=${c0}:c1=${c1}:c2=${c2}:n=3:speed=0.03:d=${(outroDur + 0.05).toFixed(2)}`,
      "-vf", `subtitles=${path.basename(ass)},fps=30,setsar=1`,
      "-frames:v", String(frames),
      "-an",
      "-c:v", "libx264", "-preset", "fast", "-crf", "18", "-pix_fmt", "yuv420p",
      outroFile,
    ], { cwd: workDir });
  }

  const overlayAss = path.join(workDir, "overlay-promo.ass");
  const clips = [introFile, ...camClips, outroFile];
  const durs = await Promise.all(clips.map(c => ffprobeDuration(c)));

  const starts = [0];
  let acc = durs[0];
  for (let i = 1; i < durs.length; i++) {
    const xd = Math.min(0.18, Math.max(0.12, durs[i] * 0.45));
    starts.push(Math.max(0, acc - xd));
    acc += durs[i] - xd;
  }

  const oStyles = overlayStyles(theme, scale);
  const events = [];
  for (let i = 0; i < nScenes; i++) {
    const sc = scenes[i];
    const ov = sc.overlay;
    if (!ov) continue;
    const items = Array.isArray(ov) ? ov : [{ text: ov }];
    const st = starts[i + 1];
    const en = st + durs[i + 1] - 0.08;
    items.forEach((item, j) => {
      const text = typeof item === "string" ? item : item.text;
      if (!text) return;
      const style = (typeof item === "object" && item.style) || OVERLAY_STYLE_CYCLE[(i + j) % OVERLAY_STYLE_CYCLE.length];
      const y = Math.round(height * (items.length > 1 ? 0.76 + j * 0.045 : 0.79));
      events.push({
        start: st + 0.08,
        end: en,
        style,
        text: `{\\an2\\pos(${cx},${y})\\fad(120,80)}${text}`,
      });
    });
  }
  await writeAssFile(overlayAss, oStyles, events, width, height);
  console.log(`  overlay events: ${events.length}`);

  const outFile = path.join(outDir, `${name}_${width}x${height}.mp4`);
  if (musicFile) {
    console.log(`  user music: ${path.basename(musicFile)}${Number(musicStart) > 0 ? ` (from ${musicStart}s)` : ""}${musicLoop ? "" : " (no loop)"}...`);
  }
  console.log("  assembling...");
  await assemblePromo({
    clips, durations: durs, overlayAss, outFile, workDir, total, theme, width, height,
    music: musicFile, musicStart, musicEnd, musicFadeIn, musicFadeOut,
    musicLoop, musicVolume: musicVolume ?? 1.0, loudnorm,
  });

  const outDur = await ffprobeDuration(outFile);
  console.log(`  done: ${outFile} (${outDur.toFixed(2)}s)`);
  return { outFile, duration: outDur, scenes: nScenes, mode: preferVideo ? "video" : "free" };
}
