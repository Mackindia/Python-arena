import "dotenv/config";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { splitScenes } from "./scenes.js";
import { synthesize } from "./tts.js";
import { fetchSceneClip } from "./stock.js";
import { assemble } from "./assemble.js";
import { makeTitleCard } from "./cards.js";
import { ffprobeDuration } from "./util.js";

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

// load .env from the project folder even when launched from elsewhere
if (!process.env.GOOGLE_API_KEY) {
  try {
    const env = await fs.readFile(path.join(ROOT, ".env"), "utf8");
    for (const line of env.split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
    }
  } catch { /* no .env */ }
}

const VOICES = {
  en: "en-US-AriaNeural",
  hi: "hi-IN-SwaraNeural",
  "hi-male": "hi-IN-MadhurNeural",
};

function parseArgs(argv) {
  const args = {
    scripts: [], all: false, aspect: "9:16", out: path.join(ROOT, "output"), lang: "en",
    style: "cinematic", intro: true, outro: true, crossfade: true, video: undefined,
    musicStart: 0, musicEnd: null, musicFadeIn: 1, musicFadeOut: 2, musicVolume: 0.18, musicLoop: true,
    musicDuck: true, loudnorm: true,
  };
  const fade = (v, dflt) => { const n = Number(v); return Number.isFinite(n) && n >= 0 ? n : dflt; };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--all") args.all = true;
    else if (a === "--aspect") args.aspect = argv[++i];
    else if (a === "--out") args.out = path.resolve(argv[++i]);
    else if (a === "--music") args.music = argv[++i];
    else if (a === "--music-start") args.musicStart = Math.max(0, Number(argv[++i]) || 0);
    else if (a === "--music-end") { const n = Number(argv[++i]); args.musicEnd = Number.isFinite(n) && n > 0 ? n : null; }
    else if (a === "--music-fade-in") args.musicFadeIn = fade(argv[++i], 1);
    else if (a === "--music-fade-out") args.musicFadeOut = fade(argv[++i], 2);
    else if (a === "--music-volume") { const n = Number(argv[++i]); args.musicVolume = Number.isFinite(n) && n >= 0 ? n : 0.18; }
    else if (a === "--no-music-loop") args.musicLoop = false;
    else if (a === "--no-music-duck") args.musicDuck = false;
    else if (a === "--no-loudnorm") args.loudnorm = false;
    else if (a === "--lang") args.lang = argv[++i];
    else if (a === "--style") args.style = argv[++i];
    else if (a === "--title") args.title = argv[++i];
    else if (a === "--no-intro") args.intro = false;
    else if (a === "--no-outro") args.outro = false;
    else if (a === "--no-xfade") args.crossfade = false;
    else if (a === "--video") args.video = true;
    else if (a === "--no-video") args.video = false;
    else if (!a.startsWith("-")) args.scripts.push(path.resolve(a));
  }
  return args;
}

function dims(aspect) {
  if (aspect === "16:9") return { width: 1920, height: 1080 };
  if (aspect === "1:1") return { width: 1080, height: 1080 };
  return { width: 1080, height: 1920 };
}

function deriveTitle(script, name) {
  const first = script.split(/(?<=[.!?।])\s+/)[0] || script;
  return first.replace(/\s+/g, " ").trim().split(" ").slice(0, 8).join(" ");
}

async function makeVideo(scriptFile, args) {
  const name = path.basename(scriptFile).replace(/\.[^.]+$/, "");
  const script = (await fs.readFile(scriptFile, "utf8")).replace(/^\uFEFF/, "").trim();
  if (!script) throw new Error(`empty script: ${scriptFile}`);

  const { width, height } = dims(args.aspect);
  const workDir = path.join(ROOT, "work", name);
  await fs.mkdir(workDir, { recursive: true });
  await fs.mkdir(args.out, { recursive: true });

  const voice = process.env.TTS_VOICE || VOICES[args.lang] || VOICES.en;
  const captionLang = args.lang === "hi" || args.lang === "hi-male" ? "hi" : "en";
  const polKey = process.env.POLLINATIONS_API_KEY || process.env.POLLINATIONS_TOKEN;
  const pixKey = process.env.PIXAZO_API_KEY;
  const preferVideo = args.video === true || (args.video !== false && !!(polKey || pixKey));
  const baseSeed = Math.floor(Math.random() * 1e6);

  console.log(`\n=== ${name} (${args.lang}, ${voice}, style=${args.style}${preferVideo ? ", AI video ON" : ""}) ===`);
  const scenes = await splitScenes(script, process.env.GOOGLE_API_KEY);
  console.log(`scenes: ${scenes.length}`);
  scenes.forEach((s, i) => console.log(`  [${i + 1}] ${s.text.slice(0, 70)}`));

  const clips = [], audios = [], durations = [];
  for (let i = 0; i < scenes.length; i++) {
    const voiceDir = path.join(workDir, `voice${i}`);
    await fs.mkdir(voiceDir, { recursive: true });
    const mp3 = await synthesize(scenes[i].text, voiceDir, { voice });
    const dur = await ffprobeDuration(mp3);
    durations.push(dur);
    console.log(`  scene ${i + 1}: narration ${dur.toFixed(1)}s -> clip`);
    const clip = await fetchSceneClip({
      keywords: scenes[i].keywords,
      promptText: scenes[i].imagePrompt || scenes[i].text,
      index: i,
      duration: dur,
      width, height,
      workDir,
      style: args.style,
      seed: baseSeed + i * 17,
      preferVideo,
    });
    clips.push(clip);
    audios.push(mp3);
  }

  // intro / outro title cards
  let introDur = 0, outroDur = 0;
  const segClips = [];
  if (args.intro) {
    const title = args.title || deriveTitle(script, name);
    const introFile = path.join(workDir, "intro.mp4");
    console.log(`  intro card: "${title}"`);
    await makeTitleCard({ text: title, duration: 2.5, width, height, workDir, lang: captionLang, outFile: introFile });
    segClips.push(introFile);
    introDur = 2.5;
  }
  segClips.push(...clips);
  if (args.outro) {
    const outroText = captionLang === "hi" ? "देखने के लिए धन्यवाद" : "Thanks for watching";
    const outroFile = path.join(workDir, "outro.mp4");
    console.log(`  outro card: "${outroText}"`);
    await makeTitleCard({ text: outroText, duration: 2, width, height, workDir, lang: captionLang, outFile: outroFile, outro: true });
    segClips.push(outroFile);
    outroDur = 2;
  }

  let music = args.music ? path.resolve(args.music) : null;
  if (!music) {
    const musicDir = path.join(ROOT, "assets", "music");
    const files = (await fs.readdir(musicDir).catch(() => [])).filter(f => /\.(mp3|wav|m4a|ogg)$/i.test(f));
    if (files.length) music = path.join(musicDir, files[0]);
  }

  const starts = [];
  let acc = introDur;
  for (const d of durations) { starts.push(acc); acc += d; }
  const ends = starts.map((s, i) => s + durations[i]);

  const outFile = path.join(args.out, `${name}_${width}x${height}.mp4`);
  await assemble({
    clips: segClips, audios, music,
    width, height,
    outFile, workDir,
    captionTexts: scenes.map(s => s.text),
    sceneStarts: starts,
    sceneEnds: ends,
    lang: captionLang,
    introDur, outroDur,
    crossfade: args.crossfade,
    musicStart: args.musicStart,
    musicEnd: args.musicEnd,
    musicFadeIn: args.musicFadeIn,
    musicFadeOut: args.musicFadeOut,
    musicVolume: args.musicVolume,
    musicLoop: args.musicLoop,
    musicDuck: args.musicDuck,
    loudnorm: args.loudnorm,
  });

  const total = await ffprobeDuration(outFile);
  console.log(`  done: ${outFile} (${total.toFixed(1)}s)`);
  return { name, outFile, total, scenes: scenes.length };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  if (args.all) {
    const dir = path.join(ROOT, "scripts");
    const files = await fs.readdir(dir);
    args.scripts.push(...files.filter(f => f.endsWith(".txt")).map(f => path.join(dir, f)));
  }

  if (!args.scripts.length) {
    console.log("Usage:");
    console.log("  npm run make -- script.txt [--aspect 9:16|16:9|1:1] [--lang en|hi|hi-male] [--style cinematic|vibrant|soft|none]");
    console.log("                [--title \"My Title\"] [--no-intro] [--no-outro] [--no-xfade] [--video|--no-video]");
    console.log("                [--music bgm.mp3] [--music-start 45] [--music-end 105] [--music-fade-in 1]");
    console.log("                [--music-fade-out 2] [--music-volume 0.2] [--no-music-loop] [--out dir]");
    console.log("                [--no-music-duck] [--no-loudnorm]");
    console.log("  npm run make:all");
    console.log("");
    console.log("  AI video clips (real moving footage per scene) activate automatically when POLLINATIONS_API_KEY is set.");
    console.log("  Get a FREE key at https://enter.pollinations.ai/keys");
    process.exit(1);
  }

  const results = [];
  for (const s of args.scripts) {
    try {
      results.push(await makeVideo(s, args));
    } catch (e) {
      console.error(`  FAILED: ${e.message}`);
      results.push({ name: path.basename(s), error: e.message });
    }
  }

  console.log("\n--- summary ---");
  for (const r of results) {
    if (r.error) console.log(`  ${r.name}: ERROR ${r.error}`);
    else console.log(`  ${r.name}: ${r.total.toFixed(1)}s, ${r.scenes} scenes -> ${r.outFile}`);
  }
}

main().catch(e => { console.error(e); process.exit(1); });
