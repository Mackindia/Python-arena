import fs from "node:fs/promises";
import path from "node:path";
import { run, ffmpegPath } from "./util.js";

const PALETTES = [
  ["0x0f2027", "0x2c5364"],
  ["0x232526", "0x414345"],
  ["0x1a2a6c", "0xb21f1f"],
  ["0x42275a", "0x734b6d"],
  ["0x141e30", "0x243b55"],
  ["0x2c3e50", "0x4ca1af"],
];

const STYLES = {
  cinematic: "cinematic film still, dramatic rim lighting, shallow depth of field, rich color grade, 35mm photography, high detail",
  vibrant: "vibrant colorful digital illustration, bold saturated colors, clean composition, high detail",
  soft: "soft dreamy watercolor illustration, gentle pastel light, high detail",
  none: "",
};

function styleSuffix(style) {
  return STYLES[style] ?? STYLES.cinematic;
}

function pollinationsKey() {
  return process.env.POLLINATIONS_API_KEY || process.env.POLLINATIONS_TOKEN || "";
}

function pixazoKey() {
  return process.env.PIXAZO_API_KEY || "";
}

// walk any JSON shape for a video/media URL
function findMediaUrl(obj, depth = 0) {
  if (!obj || depth > 6) return null;
  if (typeof obj === "string") return /^(https?:\/\/\S+)$/i.test(obj) ? obj : null;
  if (Array.isArray(obj)) {
    for (const v of obj) {
      const u = findMediaUrl(v, depth + 1);
      if (u) return u;
    }
    return null;
  }
  if (typeof obj === "object") {
    const prefer = ["media_url", "output_url", "video_url", "url", "download_url", "result_url", "file_url", "mp4", "video"];
    for (const k of prefer) {
      const v = obj[k];
      if (typeof v === "string" && /^https?:\/\//i.test(v)) return v;
      const nested = findMediaUrl(v, depth + 1);
      if (nested) return nested;
    }
    for (const [k, v] of Object.entries(obj)) {
      if (prefer.includes(k)) continue;
      const nested = findMediaUrl(v, depth + 1);
      if (nested) return nested;
    }
  }
  return null;
}

// Free LTX Video 2.5 via Pixazo (monthly free credit; needs card on file).
// Docs: https://www.pixazo.ai/models/ltx -> LTX Video 2.5 section.
async function pixazoVideo(promptText, dest, style = "cinematic", aspect = "16:9") {
  const key = pixazoKey();
  if (!key) throw new Error("no pixazo key");
  if (!isMostlyAscii(promptText)) throw new Error("prompt not english");
  const styleTail = styleSuffix(style);
  const full = [promptText, styleTail, "smooth cinematic motion"].filter(Boolean).join(", ");
  const body = {
    prompt: full,
    negative: "blurry, low quality, distorted, worst quality, jpeg artifacts, text, watermark, letters",
    aspect,
    steps: 8,
    cfg: 3.0,
  };
  const res = await fetch("https://gateway.pixazo.ai/ltx-video/v1/text-to-video", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Ocp-Apim-Subscription-Key": key },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(60000),
  });
  const text = await res.text();
  if (res.status === 402) {
    let m = "insufficient balance";
    try { m = JSON.parse(text).message || m; } catch {}
    throw new Error(`pixazo 402 ${m}`); // fail-fast: card_required or out of credit
  }
  if (!res.ok) throw new Error(`pixazo http ${res.status} ${text.slice(0, 200)}`);
  let data;
  try { data = JSON.parse(text); } catch { throw new Error(`pixazo bad json ${text.slice(0, 120)}`); }
  if (!data.request_id) {
    const url = findMediaUrl(data);
    if (!url) throw new Error(`pixazo: no request_id or media in ${JSON.stringify(data).slice(0, 200)}`);
    await download(url, dest);
    return "pixazo-ltx";
  }
  // async job: poll v2 status until COMPLETED / FAILED / ERROR
  const pollUrl = data.polling_url || `https://gateway.pixazo.ai/v2/requests/status/${data.request_id}`;
  for (let i = 0; i < 40; i++) {
    await sleep(5000);
    const pr = await fetch(pollUrl, {
      headers: { "Ocp-Apim-Subscription-Key": key },
      signal: AbortSignal.timeout(30000),
    });
    if (!pr.ok) continue;
    try { data = await pr.json(); } catch { continue; }
    const st = (data.status || "").toUpperCase();
    if (st === "COMPLETED") break;
    if (st === "FAILED" || st === "ERROR") throw new Error(`pixazo ${st}: ${data.error || "?"}`);
  }
  const url = findMediaUrl(data);
  if (!url) throw new Error(`pixazo: no media url in ${JSON.stringify(data).slice(0, 200)}`);
  await download(url, dest);
  return "pixazo-ltx";
}

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function pexelsVideo(keywords, orientation) {
  const key = process.env.PEXELS_API_KEY;
  if (!key) return null;
  for (const q of [keywords.join(" "), keywords[0] || "nature"]) {
    const url = new URL("https://api.pexels.com/videos/search");
    url.searchParams.set("query", q);
    url.searchParams.set("per_page", "5");
    url.searchParams.set("orientation", orientation);
    const res = await fetch(url, { headers: { Authorization: key } });
    if (!res.ok) continue;
    const data = await res.json();
    const vids = (data.videos || []).filter(v => v.duration >= 3);
    if (!vids.length) continue;
    const pick = vids[Math.floor(Math.random() * vids.length)];
    const files = (pick.video_files || [])
      .filter(f => f.link && f.width && (orientation === "portrait" ? f.width <= 1080 : f.width <= 1920))
      .sort((a, b) => b.width - a.width);
    const file = files[0] || (pick.video_files || [])[0];
    if (file?.link) return file.link;
  }
  return null;
}

async function pixabayVideo(keywords) {
  const key = process.env.PIXABAY_API_KEY;
  if (!key) return null;
  for (const q of [keywords.join(" "), keywords[0] || "nature"]) {
    const url = new URL("https://pixabay.com/api/videos/");
    url.searchParams.set("key", key);
    url.searchParams.set("q", q);
    url.searchParams.set("per_page", "5");
    url.searchParams.set("min_width", "960");
    const res = await fetch(url);
    if (!res.ok) continue;
    const data = await res.json();
    const hits = (data.hits || []).filter(h => h.videos?.medium?.url || h.videos?.small?.url);
    if (!hits.length) continue;
    const pick = hits[Math.floor(Math.random() * hits.length)];
    return pick.videos?.medium?.url || pick.videos?.small?.url || pick.videos?.tiny?.url;
  }
  return null;
}

async function download(url, dest) {
  const res = await fetch(url, { signal: AbortSignal.timeout(60000) });
  if (!res.ok) throw new Error(`download ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length < 15000) throw new Error("download too small");
  await fs.writeFile(dest, buf);
}

function isMostlyAscii(s) {
  const ascii = (s.match(/[\x20-\x7E]/g) || []).length;
  return ascii / Math.max(s.length, 1) > 0.8;
}

async function pixabayImage(query, dest) {
  const key = process.env.PIXABAY_API_KEY;
  if (!key) throw new Error("no pixabay key");
  const url = new URL("https://pixabay.com/api/");
  url.searchParams.set("key", key);
  url.searchParams.set("q", query);
  url.searchParams.set("image_type", "photo");
  url.searchParams.set("orientation", "vertical");
  url.searchParams.set("per_page", "7");
  url.searchParams.set("safesearch", "true");
  const res = await fetch(url, { signal: AbortSignal.timeout(30000) });
  if (!res.ok) throw new Error(`pixabay-img ${res.status}`);
  const data = await res.json();
  const hits = (data.hits || []).filter(h => h.imageWidth >= 800);
  if (!hits.length) throw new Error("pixabay-img no results");
  const pick = hits[Math.floor(Math.random() * hits.length)];
  await download(pick.largeImageURL || pick.webformatURL, dest);
  return "pixabay";
}

async function openverseImage(query, dest) {
  const url = new URL("https://api.openverse.org/v1/images/");
  url.searchParams.set("q", query);
  url.searchParams.set("page_size", "10");
  url.searchParams.set("category", "photograph");
  url.searchParams.set("size", "large");
  const res = await fetch(url, { signal: AbortSignal.timeout(30000) });
  if (!res.ok) throw new Error(`openverse ${res.status}`);
  const data = await res.json();
  const results = (data.results || []).filter(r => {
    const w = r.width || 0;
    const type = (r.filetype || r.url || "").toLowerCase();
    return r.url && w >= 700 && !type.includes("svg") && !type.includes("tif");
  });
  if (!results.length) throw new Error("openverse no results");
  results.sort((a, b) => {
    const score = r => {
      const s = r.source || "";
      if (s === "stocksnap" || s === "rawpixel") return 3;
      if (s === "flickr") return 2;
      return 0;
    };
    return score(b) - score(a);
  });
  const good = results.filter(r => ["stocksnap", "rawpixel", "flickr"].includes(r.source));
  if (!good.length) throw new Error("openverse only archive results");
  const pick = good[Math.floor(Math.random() * Math.min(good.length, 4))];
  await download(pick.url, dest);
  return `openverse(${pick.source})`;
}

async function wikimediaImage(query, dest) {
  const url = new URL("https://commons.wikimedia.org/w/api.php");
  url.searchParams.set("action", "query");
  url.searchParams.set("generator", "search");
  url.searchParams.set("gsrsearch", `${query} filemime:image/jpeg`);
  url.searchParams.set("gsrnamespace", "6");
  url.searchParams.set("gsrlimit", "10");
  url.searchParams.set("prop", "imageinfo");
  url.searchParams.set("iiprop", "url|size|mime");
  url.searchParams.set("iiurlwidth", "1280");
  url.searchParams.set("format", "json");
  const res = await fetch(url, { headers: { "User-Agent": "video-pipeline/1.0" }, signal: AbortSignal.timeout(30000) });
  if (!res.ok) throw new Error(`wikimedia ${res.status}`);
  const data = await res.json();
  const pages = Object.values(data?.query?.pages || {});
  const good = pages.filter(p => {
    const ii = p.imageinfo?.[0];
    return ii && ii.mime === "image/jpeg" && (ii.width || 0) >= 800 && !/logo|map|diagram|chart|flag|seal|coat of arms/i.test(p.title);
  });
  if (!good.length) throw new Error("wikimedia no results");
  const pick = good[Math.floor(Math.random() * good.length)].imageinfo[0];
  await download(pick.thumburl || pick.url, dest);
  return "wikimedia";
}

async function pollinationsImage(promptText, width, height, dest, { style = "cinematic", seed } = {}) {
  if (!isMostlyAscii(promptText)) throw new Error("prompt not english");
  const token = pollinationsKey();
  const styleTail = styleSuffix(style);
  const full = [promptText, styleTail, "no text, no watermark, no letters, no captions"].filter(Boolean).join(", ");
  const useSeed = Number.isFinite(seed) ? seed : Math.floor(Math.random() * 1e6);
  let lastErr = "unknown";
  for (let attempt = 0; attempt < 5; attempt++) {
    if (attempt > 0) await sleep(4000 * attempt);
    const prompt = encodeURIComponent(full);
    let url = `https://image.pollinations.ai/prompt/${prompt}?width=${width}&height=${height}&nologo=true&model=flux&seed=${useSeed}`;
    if (token) url += `&token=${token}`;
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(120000) });
      if (!res.ok) { lastErr = `http ${res.status}`; continue; }
      const buf = Buffer.from(await res.arrayBuffer());
      if (buf.length < 15000) { lastErr = "too small"; continue; }
      await fs.writeFile(dest, buf);
      return "pollinations-ai";
    } catch (e) {
      lastErr = e.message;
    }
  }
  throw new Error(lastErr);
}

// Real AI video clip via Pollinations (needs free key: enter.pollinations.ai)
async function pollinationsVideo(promptText, duration, width, height, dest, style = "cinematic") {
  const key = pollinationsKey();
  if (!key) throw new Error("no pollinations key");
  if (!isMostlyAscii(promptText)) throw new Error("prompt not english");
  const styleTail = styleSuffix(style);
  const full = [promptText, styleTail, "smooth cinematic camera motion"].filter(Boolean).join(", ");
  const aspect = height > width ? "9:16" : width > height ? "16:9" : "1:1";
  const want = Math.min(8, Math.max(4, Math.round(duration)));
  const attempts = [
    ["wan-fast", Math.min(8, Math.max(4, want))],
    ["seedance-2.0-fast", Math.min(5, Math.max(4, want))],
    ["wan", Math.min(12, Math.max(4, want))],
    ["veo", want <= 5 ? 4 : want <= 7 ? 6 : 8],
  ];
  let lastErr = "unknown";
  outer:
  for (const [model, d] of attempts) {
    for (let tryN = 0; tryN < 2; tryN++) {
      if (tryN > 0) await sleep(3000);
      const url = `https://gen.pollinations.ai/video/${encodeURIComponent(full)}?model=${model}&duration=${d}&aspectRatio=${aspect}&audio=false`;
      try {
        const res = await fetch(url, {
          headers: { Authorization: `Bearer ${key}` },
          signal: AbortSignal.timeout(180000),
        });
        if (res.status === 402) { lastErr = "insufficient pollen balance"; break outer; } // no point retrying
        if (!res.ok) { lastErr = `${model} http ${res.status}`; continue; }
        const buf = Buffer.from(await res.arrayBuffer());
        const head = buf.slice(0, 12).toString("latin1");
        if (buf.length < 30000 || !head.includes("ftyp")) {
          lastErr = `${model} not a video (${buf.length}b)`;
          continue;
        }
        await fs.writeFile(dest, buf);
        return model;
      } catch (e) {
        lastErr = `${model} ${e.message}`;
      }
    }
  }
  throw new Error(lastErr);
}

// 4 Ken Burns patterns: zoom-in, zoom-out, horizontal pan, diagonal drift
async function kenBurns(image, duration, width, height, out, variant = 0) {
  const fps = 30;
  const frames = Math.ceil((duration + 0.05) * fps);
  const patterns = [
    { z: `1.0+0.18*on/${frames}`, x: `iw/2-(iw/zoom/2)`, y: `ih/2-(ih/zoom/2)` },
    { z: `1.18-0.18*on/${frames}`, x: `iw/2-(iw/zoom/2)`, y: `ih/2-(ih/zoom/2)` },
    { z: `1.12+0.06*on/${frames}`, x: `(iw-iw/zoom)*on/${frames}`, y: `ih/2-(ih/zoom/2)` },
    { z: `1.10+0.08*on/${frames}`, x: `(iw-iw/zoom)*on/${frames}`, y: `(ih-ih/zoom)*on/${frames}` },
  ];
  const p = patterns[Math.abs(variant) % patterns.length];
  // free pollinations images burn a small "pollinations" mark into the bottom
  // strip even with nologo=true - drop ~5% of the bottom before the zoom so
  // no logo can ever appear in the output
  const strip2 = Math.max(60, Math.round(height * 0.1));
  await run(ffmpegPath(), [
    "-y", "-loop", "1", "-i", image,
    "-vf",
    `scale=${width * 2}:${height * 2}:force_original_aspect_ratio=increase,crop=${width * 2}:${height * 2 - strip2}:0:0,` +
    `zoompan=z='${p.z}':x='${p.x}':y='${p.y}':d=${frames}:s=${width}x${height}:fps=${fps},setsar=1`,
    "-frames:v", String(frames),
    "-an",
    "-c:v", "libx264", "-preset", "veryfast", "-pix_fmt", "yuv420p",
    out,
  ]);
}

async function normalizeVideoClip(raw, out, duration, width, height) {
  await run(ffmpegPath(), [
    "-y", "-stream_loop", "-1", "-i", raw,
    "-t", String(duration + 0.05),
    "-an",
    "-vf", `scale=${width}:${height}:force_original_aspect_ratio=increase,crop=${width}:${height},fps=30,setsar=1`,
    "-c:v", "libx264", "-preset", "veryfast", "-pix_fmt", "yuv420p",
    out,
  ]);
}

const VIDEO_EXTS = new Set([".mp4", ".mov", ".webm", ".m4v", ".avi", ".mkv"]);
const IMAGE_EXTS = new Set([".jpg", ".jpeg", ".png", ".bmp", ".webp"]);
const CONVERTIBLE_EXTS = new Set([".heic", ".heif", ".tiff", ".tif"]);

async function userMediaClip(mediaPath, duration, width, height, workDir, index) {
  const out = path.join(workDir, `clip${index}.mp4`);
  const jpg = path.join(workDir, `img${index}.jpg`);
  const st = await fs.stat(mediaPath);
  if (!st.isFile() || st.size < 1000) throw new Error("file missing or too small");
  const base = path.basename(mediaPath);
  const ext = path.extname(mediaPath).toLowerCase();

  if (VIDEO_EXTS.has(ext)) {
    await normalizeVideoClip(mediaPath, out, duration, width, height);
    console.log(`    source: YOUR VIDEO ${base}`);
    return out;
  }
  if (IMAGE_EXTS.has(ext)) {
    await kenBurns(mediaPath, duration, width, height, out, index);
    console.log(`    source: YOUR PHOTO ${base}`);
    return out;
  }
  if (CONVERTIBLE_EXTS.has(ext)) {
    await run(ffmpegPath(), ["-y", "-i", mediaPath, "-q:v", "2", jpg]);
    await kenBurns(jpg, duration, width, height, out, index);
    console.log(`    source: YOUR PHOTO ${base} (converted)`);
    return out;
  }
  // unknown ext: try video then image
  try {
    await normalizeVideoClip(mediaPath, out, duration, width, height);
    console.log(`    source: YOUR VIDEO ${base} (auto)`);
    return out;
  } catch { /* try image */ }
  await kenBurns(mediaPath, duration, width, height, out, index);
  console.log(`    source: YOUR PHOTO ${base} (auto)`);
  return out;
}

export async function fetchSceneClip({ keywords, promptText, index, duration, width, height, workDir, style = "cinematic", seed, preferVideo = false, mediaPath = null }) {
  const orientation = height > width ? "portrait" : "landscape";
  const raw = path.join(workDir, `raw${index}.mp4`);
  const out = path.join(workDir, `clip${index}.mp4`);
  const jpg = path.join(workDir, `img${index}.jpg`);

  // 0) USER MEDIA: local file provided -> skip all network fetching
  if (mediaPath) {
    try {
      return await userMediaClip(mediaPath, duration, width, height, workDir, index);
    } catch (e) {
      console.log(`    user media failed (${e.message}), falling back to AI/stock`);
    }
  }

  // 1) real stock VIDEO: Pexels then Pixabay (needs free key)
  for (const fetcher of [() => pexelsVideo(keywords, orientation), () => pixabayVideo(keywords)]) {
    try {
      const link = await fetcher();
      if (!link) continue;
      await download(link, raw);
      await normalizeVideoClip(raw, out, duration, width, height);
      console.log("    source: stock video");
      return out;
    } catch { /* next */ }
  }

  const englishQuery = (keywords || []).filter(k => k && isMostlyAscii(k)).join(" ");
  const englishPrompt = isMostlyAscii(promptText || "") ? promptText : englishQuery;

  // 2) AI VIDEO clips (free keys) - real moving footage per scene
  if (preferVideo && englishPrompt) {
    const aspect = height > width ? "9:16" : width > height ? "16:9" : "1:1";
    // Pixazo LTX Video 2.5 first (monthly free credit; needs card on file)
    if (pixazoKey()) {
      try {
        console.log(`    AI video (Pixazo LTX): "${englishPrompt.slice(0, 50)}"`);
        await pixazoVideo(englishPrompt, raw, style, aspect);
        await normalizeVideoClip(raw, out, duration, width, height);
        console.log("    source: AI video (pixazo-ltx)");
        return out;
      } catch (e) {
        console.log(`    Pixazo video failed (${e.message})`);
      }
    }
    // then Pollinations (needs pollen balance)
    try {
      console.log(`    AI video (Pollinations): "${englishPrompt.slice(0, 50)}"`);
      const model = await pollinationsVideo(englishPrompt, duration, width, height, raw, style);
      await normalizeVideoClip(raw, out, duration, width, height);
      console.log(`    source: AI video (${model})`);
      return out;
    } catch (e) {
      console.log(`    AI video failed (${e.message}), falling back to image`);
    }
  }

  // 3) AI-drawn image (free, English prompt) -> styled Ken Burns
  if (englishPrompt) {
    try {
      console.log(`    AI image: "${englishPrompt.slice(0, 55)}" [${style}]`);
      const useSeed = Number.isFinite(seed) ? seed : undefined;
      // cap the longer side (1920 for portrait, 1280 for landscape) to keep flux fast + correct aspect
      let imgW = width, imgH = height;
      if (imgW > 1280) { imgH = Math.round(imgH * 1280 / imgW); imgW = 1280; }
      if (imgH > 1920) { imgW = Math.round(imgW * 1920 / imgH); imgH = 1920; }
      await pollinationsImage(englishPrompt, imgW, imgH, jpg, { style, seed: useSeed });
      await kenBurns(jpg, duration, width, height, out, index);
      console.log("    source: pollinations-ai + ken burns");
      return out;
    } catch (e) {
      console.log(`    AI image failed after retries (${e.message})`);
    }
  }

  // 4) curated stock PHOTO only (StockSnap/Rawpixel via Openverse - skip archives)
  if (englishQuery) {
    try {
      const src = await openverseImage(englishQuery, jpg);
      await kenBurns(jpg, duration, width, height, out, index);
      console.log(`    source: ${src} photo`);
      return out;
    } catch (e) {
      console.log(`    photo fallback failed (${e.message})`);
    }
  }

  // 5) last resort gradient
  console.log("    source: gradient fallback");
  const [c0, c1] = PALETTES[index % PALETTES.length];
  await run(ffmpegPath(), [
    "-y",
    "-f", "lavfi",
    "-i", `gradients=s=${width}x${height}:c0=${c0}:c1=${c1}:speed=0.03:d=${(duration + 0.05).toFixed(2)}`,
    "-vf", "setsar=1",
    "-an",
    "-c:v", "libx264", "-preset", "veryfast", "-pix_fmt", "yuv420p",
    out,
  ]);
  return out;
}
