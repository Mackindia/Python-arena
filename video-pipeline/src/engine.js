import path from "node:path";
import { loadEnv, renderPromo } from "./promoRender.js";
import { renderCinematic, cinematicPlan, naiveCinematicPlan, isSingleShot } from "./cinematic.js";

function parseArgs(argv) {
  const args = {
    prompt: [],
    free: false,
    video: undefined,
    duration: 10,
    name: null,
    theme: null,
    lang: "en",
    media: [],
    aspect: "9:16",
    cinematic: false,
    noVoice: false,
    music: null,
    musicStart: 0,
    musicEnd: null,
    musicFadeIn: 1,
    musicFadeOut: 2,
    musicVolume: null,
    musicLoop: true,
    musicDuck: true,
    loudnorm: true,
  };
  const fade = (v, dflt) => { const n = Number(v); return Number.isFinite(n) && n >= 0 ? n : dflt; };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--free" || a === "--no-video") args.free = true;
    else if (a === "--video") args.video = true;
    else if (a === "--cinematic" || a === "--continuous") args.cinematic = true;
    else if (a === "--no-voice" || a === "--bg-only" || a === "--background-only") args.noVoice = true;
    else if (a === "--music") args.music = argv[++i];
    else if (a === "--music-start") args.musicStart = Math.max(0, Number(argv[++i]) || 0);
    else if (a === "--music-end") { const n = Number(argv[++i]); args.musicEnd = Number.isFinite(n) && n > 0 ? n : null; }
    else if (a === "--music-fade-in") args.musicFadeIn = fade(argv[++i], 1);
    else if (a === "--music-fade-out") args.musicFadeOut = fade(argv[++i], 2);
    else if (a === "--music-volume") { const n = Number(argv[++i]); args.musicVolume = Number.isFinite(n) && n >= 0 ? n : null; }
    else if (a === "--no-music-loop") args.musicLoop = false;
    else if (a === "--no-music-duck") args.musicDuck = false;
    else if (a === "--no-loudnorm") args.loudnorm = false;
    else if (a === "--lang") args.lang = argv[++i];
    else if (a === "--duration" || a === "-d") args.duration = Math.min(30, Math.max(6, Number(argv[++i]) || 10));
    else if (a === "--name" || a === "-n") args.name = argv[++i];
    else if (a === "--theme" || a === "-t") args.theme = argv[++i];
    else if (a === "--aspect" || a === "-a") args.aspect = argv[++i];
    else if (a === "--media" || a === "-m") {
      const val = argv[++i];
      if (val) {
        const parts = val.includes(",") ? val.split(",") : [val];
        for (const part of parts) {
          const p = part.trim();
          if (p) args.media.push(path.resolve(p));
        }
      }
    }
    else if (!a.startsWith("-")) args.prompt.push(a);
  }
  args.prompt = args.prompt.join(" ").trim();
  return args;
}

function dims(aspect) {
  if (aspect === "16:9") return { width: 1920, height: 1080 };
  if (aspect === "1:1") return { width: 1080, height: 1080 };
  return { width: 1080, height: 1920 };
}

function slugify(s) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40) || "video";
}

function naivePlan(prompt, nScenes) {
  const words = prompt.replace(/[^a-zA-Z0-9₹\s]/g, " ").split(/\s+/).filter(Boolean);
  const title = words.slice(0, 6).join(" ").toUpperCase() || "NEW EVENT";
  const angles = [
    "epic wide establishing shot, dramatic cinematic lighting",
    "close-up detail shot, shallow depth of field, vibrant colors",
    "energetic crowd or people scene, joyful motion",
    "night lights bokeh, festive atmosphere",
    "aerial or high angle view, grand scale",
    "golden hour glow, celebratory mood",
  ];
  const overlays = [
    "SAVE THE DATE",
    "EXPERIENCE THE MAGIC",
    "MUSIC  •  FUN  •  MEMORIES",
    "JOIN US",
    "DON'T MISS OUT",
    "SEE YOU THERE",
  ];
  const scenes = [];
  for (let i = 0; i < nScenes; i++) {
    scenes.push({
      prompt: `${prompt}, ${angles[i % angles.length]}, no text, no watermark, cinematic`,
      keywords: words.slice(i * 2, i * 2 + 3).map(w => w.toLowerCase()).filter(Boolean),
      overlay: [{ text: overlays[i % overlays.length] }],
      mode: ["zoomOut", "zoomIn", "pan"][i % 3],
    });
  }
  return {
    title,
    tagline: "YOU'RE INVITED",
    dateLine: "",
    outroLines: [title, "SEE YOU THERE"],
    theme: "festive",
    scenes,
  };
}

async function geminiPlan(prompt, nScenes, apiKey) {
  if (!apiKey) return null;
  const schema = `{
  "title": "SHORT UPPERCASE event name (max 5 words)",
  "tagline": "2-4 word punchy tagline in English, empty string if none",
  "dateLine": "date/time line if mentioned in the prompt (e.g. '16 OCTOBER | 6 PM'), else empty string",
  "outroLines": ["1 to 3 short uppercase lines for the ending card"],
  "theme": "one of: festive, gold, neon, sunset, royal",
  "scenes": [
    {
      "prompt": "ONE vivid ENGLISH visual description for an AI video generator - what the camera SEES (people, place, lights, action). No text/letters/watermark mentions except 'no text'.",
      "keywords": ["three", "english", "stock words"],
      "overlay": "SHORT UPPERCASE info line shown on this scene (venue, tickets, contact, vibe) or empty string",
      "mode": "one of: zoomOut, zoomIn, pan"
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
                text: `You plan short vertical (9:16) promo videos. From the user prompt, extract event details and invent ${nScenes} visual scenes (drone/opening, main activity, food/details, crowd/energy, people/friends - adapt to the event).\n\nReply ONLY with JSON matching exactly this schema:\n${schema}\n\nRules:\n- All scene prompts and keywords MUST be English (even if the user writes Hindi/other language - translate event facts).\n- overlay texts: use facts from the prompt (date, venue, price, phone). Max ~28 characters each.\n- Cycle modes: scene1 zoomOut, scene2 zoomIn, scene3 pan, then repeat.\n- title/outro: UPPERCASE.\n\nUser prompt:\n${prompt}`
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
      if (Array.isArray(plan.scenes) && plan.scenes.length >= 2) {
        plan.scenes = plan.scenes.slice(0, nScenes).map((s, i) => ({
          prompt: String(s.prompt || s.imagePrompt || prompt).slice(0, 300),
          keywords: Array.isArray(s.keywords) ? s.keywords.map(String).slice(0, 3) : [],
          overlay: s.overlay ? [{ text: String(s.overlay) }] : undefined,
          mode: ["zoomOut", "zoomIn", "pan"].includes(s.mode) ? s.mode : ["zoomOut", "zoomIn", "pan"][i % 3],
          style: "cinematic",
        }));
        while (plan.scenes.length < nScenes) {
          const i = plan.scenes.length;
          plan.scenes.push({
            prompt: `${prompt}, cinematic celebration, no text`,
            keywords: [],
            overlay: undefined,
            mode: ["zoomOut", "zoomIn", "pan"][i % 3],
          });
        }
        plan.title = String(plan.title || "NEW VIDEO").toUpperCase();
        plan.tagline = String(plan.tagline || "");
        plan.dateLine = String(plan.dateLine || "");
        plan.outroLines = Array.isArray(plan.outroLines) ? plan.outroLines.map(String).slice(0, 3) : [plan.title];
        plan.theme = ["festive", "gold", "neon", "sunset", "royal"].includes(plan.theme) ? plan.theme : "festive";
        return plan;
      }
    } catch { /* try next model */ }
  }
  return null;
}

async function main() {
  await loadEnv();
  const args = parseArgs(process.argv.slice(2));

  if (!args.prompt) {
    console.log("Usage:");
    console.log("  npm run engine -- \"your event prompt here\" [--free | --video] [--duration 10]");
    console.log("                [--cinematic]           one continuous film cut, no promo cards");
    console.log("                [--aspect 9:16|16:9|1:1]  9:16 portrait (default), 16:9 landscape");
    console.log("                [--lang en|hi|hi-male]   narration voice language");
    console.log("                [--name my-video] [--theme festive|gold|neon|sunset|royal]");
    console.log("                [--media photo.jpg,clip.mp4]   use YOUR files for scenes (free)");
    console.log("");
    console.log("Modes:");
    console.log("  --free       AI images + Ken Burns (0 pollen, default-safe)");
    console.log("  --video      Real AI video clips via Pollinations (~0.05 pollen/scene)");
    console.log("  --cinematic  Continuous film: no title cards, smooth crossfades, same color grade.");
    console.log("               Auto-adds Hindi/English TTS narration + ambient music if the prompt");
    console.log("               contains dialogue/audio cues (or add narration via Gemini plan).");
    console.log("               If the prompt says 'one continuous shot / no cuts / single take', it is");
    console.log("               NEVER split - one visual for the full duration (wardrobe stays consistent).");
    console.log("               Prompt mentions 'veena' -> uses assets/music/veena.mp3 (20s) as the track.");
    console.log("  --no-voice   (cinematic) background sound ONLY - never speaks, ambient at full volume.");
    console.log("               Also auto-on if prompt says 'no voice' / 'background sound only'.");
    console.log("");
    console.log("Music (all modes):");
    console.log("  --music file.mp3      use YOUR track instead of the auto ambient/veena bed.");
    console.log("  --music-start 45      skip the first 45s (start at the chorus).");
    console.log("  --music-end 105       stop the track at 105s (segment loops if shorter than video).");
    console.log("  --music-fade-in 1     fade-in seconds (default 1).");
    console.log("  --music-fade-out 2    fade-out seconds, always landing on the last frame (default 2).");
    console.log("  --music-volume 0.2    bed level under the voice (default 0.18 with voice, 1.0 background-only).");
    console.log("  --no-music-loop       play the segment once (silence after it ends) instead of looping.");
    console.log("  --no-music-duck       do not lower the music while the voice speaks (cinematic/make).");
    console.log("  --no-loudnorm         skip -16 LUFS loudness normalisation of the final mix.");
    console.log("");
    console.log("Examples:");
    console.log('  npm run engine -- "10 second promo for Diwali night party on 5 Nov at City Hall, tickets 200 rupees" --free');
    console.log('  npm run engine -- "school annual function promo, 20 Dec 6pm, contact 9876543210" --video --theme gold');
    console.log('  npm run engine -- "Diwali party" --free --media venue.jpg,crowd.mp4');
    console.log('  npm run engine -- "ancient gurukul scene" --free --aspect 16:9 --duration 20');
    console.log('  npm run engine -- "गुरुकुल में ऋषि विद्यार्थियों को पढ़ाते हैं। वत्स! शिक्षा सभी का अधिकार है।" --cinematic --aspect 16:9 --duration 20 --lang hi');
    process.exit(1);
  }

  const nScenes = args.duration <= 8 ? 4 : args.duration <= 14 ? 5 : 6;
  const preferVideo = args.free ? false : (args.video || !!(process.env.POLLINATIONS_API_KEY || process.env.PIXAZO_API_KEY));
  const { width, height } = dims(args.aspect);
  const name = args.name || slugify(args.prompt);

  // ---- CINEMATIC continuous mode: one film cut, no promo cards, auto TTS/ambient ----
  if (args.cinematic) {
    const single = isSingleShot(args.prompt);
    let cplan;
    if (single) {
      // prompt demands ONE uninterrupted shot: never split - one visual, full duration
      console.log(`plan: SINGLE continuous shot (prompt says no cuts) -> 1 scene, mode=cinematic continuous, ${width}x${height}${args.media.length ? `, media=${args.media.length} file(s)` : ""}`);
      cplan = { scenes: [{ prompt: `${args.prompt}, cinematic realism, photorealistic, no text, no watermark`, narration: "", keywords: [] }] };
    } else {
      console.log(`plan: ${nScenes} scenes, mode=cinematic continuous, ${width}x${height}${args.media.length ? `, media=${args.media.length} file(s)` : ""}`);
      cplan = await cinematicPlan(args.prompt, nScenes, process.env.GOOGLE_API_KEY);
      if (!cplan) {
        console.log("  gemini cinematic plan failed -> using naive plan");
        cplan = naiveCinematicPlan(args.prompt, nScenes);
      } else {
        console.log(`  gemini cinematic plan: ${cplan.scenes.length} scenes`);
        cplan.scenes.forEach((s, i) => console.log(`    [${i + 1}] ${s.narration ? "VOICE" : "visual"} | ${s.prompt.slice(0, 60)}`));
      }
    }
    const result = await renderCinematic({
      name,
      prompt: args.prompt,
      scenes: cplan.scenes,
      width, height,
      total: args.duration,
      lang: args.lang,
      mediaFiles: args.media,
      preferVideo,
      noVoice: args.noVoice,
      musicFile: args.music ? path.resolve(args.music) : null,
      musicStart: args.musicStart,
      musicEnd: args.musicEnd,
      musicFadeIn: args.musicFadeIn,
      musicFadeOut: args.musicFadeOut,
      musicVolume: args.musicVolume,
      musicLoop: args.musicLoop,
      musicDuck: args.musicDuck,
      loudnorm: args.loudnorm,
    });
    console.log("\n--- summary ---");
    console.log(`  ${result.outFile}`);
    const audioTag = !result.audio ? "silent" : result.voice ? "voice + ambient" : "background only";
    console.log(`  ${result.duration.toFixed(2)}s | ${result.scenes} scenes | ${result.mode} | ${audioTag}`);
    return;
  }

  // ---- PROMO mode (default): title cards + overlays + theme ----
  console.log(`plan: ${nScenes} scenes, mode=${preferVideo ? "AI video (pollen)" : "free (images)"}, ${width}x${height}${args.media.length ? `, media=${args.media.length} file(s)` : ""}`);
  let plan = await geminiPlan(args.prompt, nScenes, process.env.GOOGLE_API_KEY);
  if (!plan) {
    console.log("  gemini plan failed -> using naive plan");
    plan = naivePlan(args.prompt, nScenes);
  } else {
    console.log(`  gemini plan: "${plan.title}" | theme=${plan.theme} | scenes=${plan.scenes.length}`);
    plan.scenes.forEach((s, i) => console.log(`    [${i + 1}] ${s.mode} | ${(s.overlay?.[0]?.text || "").padEnd(30)} | ${s.prompt.slice(0, 50)}`));
  }

  const result = await renderPromo({
    name,
    intro: { title: plan.title, tagline: plan.tagline, dateLine: plan.dateLine },
    scenes: plan.scenes,
    outro: plan.outroLines,
    theme: args.theme || plan.theme,
    total: args.duration,
    preferVideo,
    mediaFiles: args.media,
    width,
    height,
    musicFile: args.music ? path.resolve(args.music) : null,
    musicStart: args.musicStart,
    musicEnd: args.musicEnd,
    musicFadeIn: args.musicFadeIn,
    musicFadeOut: args.musicFadeOut,
    musicVolume: args.musicVolume,
    musicLoop: args.musicLoop,
    loudnorm: args.loudnorm,
  });

  console.log("\n--- summary ---");
  console.log(`  ${result.outFile}`);
  console.log(`  ${result.duration.toFixed(2)}s | ${result.scenes} scenes | ${result.mode}`);
}

main().catch(e => { console.error(e); process.exit(1); });
