import "dotenv/config";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { fetchSceneClip } from "./stock.js";
import { synthesize } from "./tts.js";
import { assemble } from "./assemble.js";
import { run, ffmpegPath, ffprobeDuration } from "./util.js";

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

const VOICES = {
  en: "en-US-AriaNeural",
  hi: "hi-IN-SwaraNeural",
  "hi-male": "hi-IN-MadhurNeural",
};

// one gentle, identical grade on every scene so independent AI/stock clips blend
const GRADE = "eq=contrast=1.06:saturation=1.18:gamma=1.02,colorbalance=rs=0.04:gs=0.01:bs=-0.02,vignette=PI/6";

export function detectLang(text) {
  if (/[ऀ-ॿ]/.test(text || "")) return "hi";
  return "en";
}

export function wantsAudio(prompt) {
  // fully silent only when user explicitly bans ALL sound (not just voice)
  if (/without (audio|any sound)|no (audio|sound at all)|silent|बिना (किसी )?(आवाज|साउंड|ध्वनि)|नो ऑडियो|म्यूट/i.test(prompt || "")) return false;
  // "no voice" / "without voice" / "background only" still wants AMBIENT - just not TTS
  if (/only background|background (sound|music|audio) only|no (voice|dialogue|narration|speaking)|without (voice|dialogue|narration)|बिना (बोले|आवाज|संवाद)|केवल बैकग्राउंड|सिर्फ़ (बैकग्राउंड|संगीत)/i.test(prompt || "")) return true;
  return /audio|music|narrat|voice|dialogue|speak|singing|song|sound|background score|veena|flute|आवाज|संगीत|बोल|गान|संवाद|ध्वनि|वीणा|बांसुरी/i.test(prompt || "");
}

export function wantsVoice(prompt) {
  // explicit "no voice / background only" requests
  if (/no (voice|dialogue|narration|speaking)|without (voice|dialogue|narration)|background (sound|music|audio) only|only background|बिना (बोले|संवाद)|केवल बैकग्राउंड|सिर्फ़ बैकग्राउंड/i.test(prompt || "")) return false;
  return true;
}

export function isSingleShot(prompt) {
  return /one\s+(?:single\s+)?continuous\s+(?:shot|take|camera)|single\s+(?:continuous\s+)?(?:shot|take)|continuous\s+(?:shot|take|camera)\b|no\s+(?:cuts?|scene\s+changes?|zoom\s+jumps|transitions?)|one\s+uninterrupted|uninterrupted\s+(?:wide\w*\s+)?(?:shot|take)|one\s+take\b/i.test(prompt || "");
}

export function wantsVeena(prompt) {
  return /veena|वीणा|veenai/i.test(prompt || "");
}

// Pull every rule/restriction sentence out of the user prompt ("No modern...",
// "must be boys only", "Strict restrictions: ...") so it can be re-attached to
// EVERY scene generation - otherwise each scene re-imagines wardrobe freely.
// Hard wardrobe/restriction sentences always win over soft noise (camera rules).
export function extractConstraints(userPrompt) {
  if (!userPrompt) return "";
  const text = String(userPrompt).replace(/\*\*/g, "").replace(/\s+/g, " ").trim();
  const sentences = text.split(/(?<=[.!?।])\s+/);
  const hard = /\b(restrictions?\b|modern|uniforms?|female|watermark|logo|must\b|boys\b|no text|dhoti|traditional|hairstyles?|dress|attire|clothing|bare)\b/i;
  const soft = /\b(no|not|never|only|avoid|do not|don't|without|keep)\b/i;
  const pool = sentences.filter(s => s.length <= 450);
  const hardPicked = pool.filter(s => hard.test(s));
  const softPicked = pool.filter(s => !hardPicked.includes(s) && soft.test(s));
  let out = hardPicked.join(" ").trim();
  if (out.length < 900) {
    let len = out.length;
    const extra = [];
    for (const s of softPicked) {
      if (len + s.length > 900) break;
      extra.push(s);
      len += s.length + 1;
    }
    if (extra.length) out = [out, extra.join(" ")].filter(Boolean).join(" ");
  }
  if (out.length > 1000) out = out.slice(0, 1000).replace(/\s+\S*$/, "").trim();
  if (/ancient|vedic|treta|gurukul|rishi|प्राचीन|वैदिक|गुरुकुल|ऋषि/i.test(text)) {
    out += " Ancient historical India, Vedic period setting, period-accurate clothing, absolutely no modern elements.";
  }
  return out;
}

function applyConstraints(scenePrompt, constraints) {
  if (!constraints) return scenePrompt;
  // single-shot scenes already carry the full user prompt - do not duplicate
  if (String(scenePrompt).toLowerCase().includes(constraints.slice(0, 80).toLowerCase())) return scenePrompt;
  return `${scenePrompt}. STRICT REQUIREMENTS (must match the user's prompt exactly): ${constraints}`;
}

export async function cinematicPlan(prompt, nScenes, apiKey) {
  if (!apiKey) return null;
  const schema = `{
  "scenes": [
    {
      "prompt": "ONE vivid ENGLISH visual description of what the camera SEES (people, place, action, light). No text/letters/watermark except 'no text'.",
      "narration": "Text to SPEAK ALOUD during this scene, in the SAME language as the user prompt (Hindi if user wrote Hindi - keep their exact words for dialogue). Empty string if nobody speaks in this scene.",
      "keywords": ["three", "english", "stock", "words"]
    }
  ]
}`;
  for (const model of ["gemini-3.8-flash", "gemini-2.5-flash", "gemini-2.0-flash"]) {
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: `You plan a single continuous cinematic short video (no intro/outro cards, no title screens, no text overlays - just flowing scenes like a film).\n\nDivide the user's story/prompt into ${nScenes} visual scenes in chronological order.\n- Put any dialogue/speech the user wrote into the "narration" of the exact scene where it is spoken (keep the user's language and words for speech).\n- Scenes with no speech get "narration": "".\n- EVERY scene MUST show the people/characters the user described doing something - never plan empty landscape-only scenes.\n- Every scene prompt MUST repeat the user's clothing/period restrictions (e.g. "no modern clothes", "boys in white dhotis") so no scene drifts out of period.\n- All "prompt" and "keywords" fields MUST be English (translate if needed).\n- Keep total spoken text concise enough to fit the video duration.\n\nReply ONLY with JSON matching exactly this schema:\n${schema}\n\nUser prompt:\n${prompt}`
              }]
            }],
            generationConfig: { responseMimeType: "application/json", temperature: 0.3 }
          })
        }
      );
      if (res.status === 404 || res.status === 429 || res.status === 503 || res.status === 500) continue;
      if (!res.ok) break;
      const data = await res.json();
      const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
      const plan = JSON.parse(raw);
      if (Array.isArray(plan.scenes) && plan.scenes.length >= 1) {
        plan.scenes = plan.scenes.slice(0, nScenes).map((s) => ({
          prompt: String(s.prompt || s.imagePrompt || prompt).slice(0, 300),
          narration: String(s.narration || s.voice || s.dialogue || "").slice(0, 500),
          keywords: Array.isArray(s.keywords) ? s.keywords.map(String).slice(0, 3) : [],
        }));
        while (plan.scenes.length < nScenes) {
          plan.scenes.push({ prompt: `${prompt}, cinematic, no text`, narration: "", keywords: [] });
        }
        return plan;
      }
    } catch { /* try next model */ }
  }
  return null;
}

export function naiveCinematicPlan(prompt, nScenes) {
  const sentences = prompt.replace(/\s+/g, " ").trim().split(/(?<=[.!?।])\s+/).filter(Boolean);
  const scenes = [];
  for (let i = 0; i < nScenes; i++) {
    const text = sentences[i] || sentences[sentences.length - 1] || prompt;
    // a rule/instruction sentence ("No modern...", "Duration: ...") is not a
    // visual - fall back to the whole prompt so the scene still shows something
    const isVisual = !/^\s*(no\b|must\b|keep\b|duration|format|strict|camera|audio|all students|give them|use only)/i.test(text);
    const base = isVisual ? text : prompt;
    scenes.push({
      prompt: /[ऀ-ॿ]/.test(prompt) ? `${prompt}, cinematic, ancient india, no text` : `${base}, cinematic, no text`,
      narration: sentences[i] || "",
      keywords: ["cinematic", "traditional", "india"],
    });
  }
  return { scenes };
}

async function makeAmbientMusic(duration, outFile, workDir) {
  const d = Math.max(4, duration + 0.5).toFixed(2);
  const fadeSt = Math.max(0, duration - 2).toFixed(2);
  await run(ffmpegPath(), [
    "-y",
    "-f", "lavfi", "-i", `sine=frequency=196:duration=${d}`,
    "-f", "lavfi", "-i", `sine=frequency=247:duration=${d}`,
    "-f", "lavfi", "-i", `sine=frequency=294:duration=${d}`,
    "-f", "lavfi", "-i", `anoisesrc=duration=${d}:color=pink:amplitude=0.04`,
    "-filter_complex",
    `[0:a][1:a][2:a]amix=inputs=3:normalize=0,volume=0.45,tremolo=f=0.12:d=0.35[pad];` +
    `[3:a]lowpass=f=900,volume=0.3[wind];` +
    `[pad][wind]amix=inputs=2:normalize=0,afade=t=in:d=1.5,afade=t=out:st=${fadeSt}:d=2[out]`,
    "-map", "[out]", "-c:a", "libmp3lame", "-q:a", "4",
    outFile,
  ], { cwd: workDir });
  return outFile;
}

async function makeSilence(duration, outFile, workDir) {
  await run(ffmpegPath(), [
    "-y", "-f", "lavfi", "-i", `anullsrc=r=44100:cl=stereo:d=${Math.max(1, duration).toFixed(2)}`,
    "-c:a", "libmp3lame", "-q:a", "9", outFile,
  ], { cwd: workDir });
  return outFile;
}

const VEENA_FILE = path.join(ROOT, "assets", "music", "veena.mp3");

async function veenaAvailable() {
  try { await fs.access(VEENA_FILE); return true; } catch { return false; }
}

async function makeVeenaBed(duration, outFile, workDir) {
  // veena.mp3 is a clean 20s loopable cut; stretch/trim to bed length with fades
  const d = Math.min(Math.max(4, duration + 0.3), 20).toFixed(2);
  const fadeSt = Math.max(0, Math.min(duration - 2, 17.8)).toFixed(2);
  await run(ffmpegPath(), [
    "-y", "-i", VEENA_FILE,
    "-t", d,
    "-af", `afade=t=in:d=1,afade=t=out:st=${fadeSt}:d=2`,
    "-c:a", "libmp3lame", "-q:a", "2",
    outFile,
  ], { cwd: workDir });
  return outFile;
}

async function gradeAndMove(src, out, duration, width, height, variant) {
  const frames = Math.ceil((duration + 0.02) * 30);
  const moves = [
    { z: `1.02+0.05*on/${frames}`, x: `iw/2-(iw/zoom/2)` },
    { z: `1.07-0.05*on/${frames}`, x: `iw/2-(iw/zoom/2)` },
    { z: `1.05`, x: `(iw-iw/zoom)*on/${frames}` },
  ];
  const m = moves[Math.abs(variant) % moves.length];
  const y = `ih/2-(ih/zoom/2)`;
  // single-shot with a short AI video (models cap at ~8s): slow it down to
  // fill the full duration instead of cutting early - stays one continuous take
  let srcDur = 0;
  try { srcDur = await ffprobeDuration(src); } catch { /* unknown -> no stretch */ }
  const slow = srcDur > 0.5 && srcDur < duration * 0.9 ? (duration + 0.02) / srcDur : 1;
  const pre = slow > 1.05 ? `setpts=PTS*${slow.toFixed(4)},fps=30,` : "";
  await run(ffmpegPath(), [
    "-y", "-i", src,
    "-t", (duration + 0.02).toFixed(2),
    "-vf", `scale=${width}:${height}:force_original_aspect_ratio=increase,crop=${width}:${height},${pre}zoompan=z='${m.z}':x='${m.x}':y='${y}':d=1:s=${width}x${height}:fps=30,${GRADE},setsar=1`,
    "-an",
    "-c:v", "libx264", "-preset", "fast", "-crf", "18", "-pix_fmt", "yuv420p",
    out,
  ]);
  return out;
}

export async function renderCinematic({
  name,
  prompt,
  scenes,
  width = 1080,
  height = 1920,
  total = 20,
  lang = null,
  mediaFiles = [],
  preferVideo = false,
  baseSeed = null,
  audio = null,
  noVoice = false,
  musicFile = null,
  musicStart = 0,
  musicEnd = null,
  musicFadeIn = 1,
  musicFadeOut = 2,
  musicVolume = null,
  musicLoop = true,
  musicDuck = true,
  loudnorm = true,
}) {
  if (!process.env.GOOGLE_API_KEY) {
    try {
      const env = await fs.readFile(path.join(ROOT, ".env"), "utf8");
      for (const line of env.split(/\r?\n/)) {
        const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
        if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
      }
    } catch { /* no .env */ }
  }

  const captionLang = lang || detectLang(prompt);
  const voice = process.env.TTS_VOICE || VOICES[captionLang] || VOICES.en;
  const skipVoice = noVoice === true || !wantsVoice(prompt);
  // wantsSound: ambient bed. explicit --no-voice means "background sound, no speaking" -> always want ambient.
  // narration-in-plan only forces sound if voice is allowed.
  const wantsSound = audio === true || noVoice === true || (audio !== false && (!!musicFile || wantsAudio(prompt) || (!skipVoice && scenes.some((s) => s.narration))));
  const nScenes = scenes.length;
  const seed = baseSeed ?? Math.floor(Math.random() * 1e6);

  const workDir = path.join(ROOT, "work", name);
  const outDir = path.join(ROOT, "output");
  await fs.mkdir(workDir, { recursive: true });
  await fs.mkdir(outDir, { recursive: true });

  const mediaQueue = Array.isArray(mediaFiles) ? [...mediaFiles] : [];
  const mediaAssigned = new Array(nScenes).fill(null);
  for (let i = 0; i < nScenes && mediaQueue.length; i++) mediaAssigned[i] = mediaQueue.shift();

  console.log(`\n=== ${name} CINEMATIC (${width}x${height}, ~${total}s, ${nScenes} scenes, ${wantsSound ? (skipVoice ? "background sound only" : "with voice + ambient") : "silent"}, lang=${captionLang}) ===`);

  // 1) TTS first so narrated scenes get exact durations (skipped entirely for background-only)
  const audios = [];
  const narrations = [];
  const voiceDurs = [];
  let ttsFailed = false;
  for (let i = 0; i < nScenes; i++) {
    const text = (scenes[i].narration || "").trim();
    narrations.push(skipVoice ? "" : text);
    if (wantsSound && !skipVoice && text && !ttsFailed) {
      try {
        const voiceDir = path.join(workDir, `voice${i}`);
        await fs.mkdir(voiceDir, { recursive: true });
        const mp3 = await synthesize(text, voiceDir, { voice, name: `n${i}` });
        const d = await ffprobeDuration(mp3);
        audios.push(mp3);
        voiceDurs.push(d);
        console.log(`  scene ${i + 1}: narration ${d.toFixed(1)}s "${text.slice(0, 50)}"`);
      } catch (e) {
        console.log(`  scene ${i + 1}: TTS failed (${e.message}) -> ambient only`);
        ttsFailed = true;
        audios.push(null);
        voiceDurs.push(0);
      }
    } else {
      audios.push(null);
      voiceDurs.push(0);
    }
  }

  // 2) scene durations: narrated = voice length + breath; silent scenes share the rest
  const voiceTotal = voiceDurs.reduce((s, d) => s + d, 0);
  const narratedCount = voiceDurs.filter((d) => d > 0).length;
  const silentCount = nScenes - narratedCount;
  const silentShare = silentCount > 0 ? Math.max(2.2, (total - voiceTotal - narratedCount * 0.35) / silentCount) : 0;
  const sceneDurs = voiceDurs.map((d) => (d > 0 ? d + 0.35 : silentShare));

  // 3) fetch + grade every scene (user media -> AI/stock), same grade for seamless blend
  //    every AI generation gets the user's rule sentences appended - wardrobe,
  //    period and restrictions must match the prompt in EVERY scene, not just scene 1
  const constraints = extractConstraints(prompt);
  if (constraints) console.log(`  constraints enforced on every scene (+${constraints.length} chars)`);
  const clips = [];
  for (let i = 0; i < nScenes; i++) {
    const sc = scenes[i];
    const dur = sceneDurs[i];
    const userMedia = mediaAssigned[i];
    const scenePrompt = applyConstraints(sc.prompt, constraints);
    const label = userMedia ? `your media ${path.basename(userMedia)}` : scenePrompt.slice(0, 60);
    console.log(`  scene ${i + 1}/${nScenes} (${dur.toFixed(1)}s): "${label}"`);
    const raw = await fetchSceneClip({
      keywords: sc.keywords || [],
      promptText: scenePrompt,
      index: i,
      duration: dur + 0.3,
      width, height,
      workDir,
      style: "cinematic",
      seed: seed + i * 17,
      preferVideo,
      mediaPath: userMedia,
    });
    const graded = path.join(workDir, `grade${i}.mp4`);
    await gradeAndMove(raw, graded, dur, width, height, i);
    clips.push(graded);
  }

  // 4) audio bed: user music file (trim/sync applied in assemble) / veena / ambient + TTS (or clean silence)
  let music = null;
  let voiceTracks = audios.filter(Boolean);
  let bedVolume = 0.18;
  let skipSubtitles = skipVoice;
  const useVeena = !musicFile && wantsSound && wantsVeena(prompt) && await veenaAvailable();
  if (wantsSound) {
    // estimate full length for ambient bed (xfade eats ~0.3s per join)
    const approxVideo = sceneDurs.reduce((s, d) => s + d, 0) - (nScenes - 1) * 0.3;
    const bedDur = Math.max(approxVideo, voiceTotal + narratedCount * 0.35);
    if (musicFile) {
      music = musicFile;
      console.log(`  user music: ${path.basename(musicFile)}${Number(musicStart) > 0 ? ` (from ${musicStart}s)` : ""}${musicLoop ? "" : " (no loop)"}...`);
    } else {
      music = path.join(workDir, useVeena ? "veena-bed.mp3" : "ambient.mp3");
      console.log(`  ${useVeena ? "veena track" : "ambient bed"} ${bedDur.toFixed(1)}s${skipVoice ? " (background only - no voice)" : ""}...`);
      if (useVeena) await makeVeenaBed(bedDur, music, workDir);
      else await makeAmbientMusic(bedDur, music, workDir);
    }
    if (skipVoice || !voiceTracks.length) {
      // background-only (or TTS unavailable): no voice lane. synth pad is quiet
      // (ducked under voice) so boost it; user tracks / the veena mp3 are
      // full-level - keep them at 1.0 so they do not clip.
      voiceTracks = [];
      bedVolume = musicVolume ?? (musicFile ? 1.0 : useVeena ? 1.0 : 2.2);
    } else if (musicVolume != null) {
      bedVolume = musicVolume;
    }
    // captions follow the voice decision, not TTS availability (TTS may 403;
    // we still want the planned narration shown as subtitles in voiced mode)
    skipSubtitles = skipVoice;
  } else {
    const sil = path.join(workDir, "silence.mp3");
    await makeSilence(total, sil, workDir);
    voiceTracks = [sil];
    skipSubtitles = true;
  }

  // 5) timeline for subtitles (starts already at 0; no intro card)
  const starts = [];
  const ends = [];
  let acc = 0;
  // xfade shortens timeline by ~0.3 per join; mirror assemble's TD=0.35 minus slack
  const TD = 0.35;
  for (let i = 0; i < nScenes; i++) {
    starts.push(Math.max(0, acc - (i > 0 ? TD * 0.5 : 0)));
    acc += sceneDurs[i] - (i > 0 ? TD : 0);
    ends.push(starts[i] + sceneDurs[i]);
  }

  const outFile = path.join(outDir, `${name}_${width}x${height}.mp4`);
  console.log(`  assembling continuous cut...`);
  await assemble({
    clips,
    audios: voiceTracks,
    music,
    width, height,
    outFile, workDir,
    captionTexts: narrations,
    sceneStarts: starts,
    sceneEnds: ends,
    lang: captionLang,
    introDur: 0,
    outroDur: 0,
    crossfade: true,
    musicVolume: bedVolume,
    musicStart, musicEnd, musicFadeIn, musicFadeOut, musicLoop,
    musicDuck, loudnorm,
    skipSubtitles,
  });

  const outDur = await ffprobeDuration(outFile);
  console.log(`  done: ${outFile} (${outDur.toFixed(2)}s)`);
  return { outFile, duration: outDur, scenes: nScenes, mode: "cinematic", audio: wantsSound, voice: wantsSound && !skipVoice };
}
