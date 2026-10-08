export type AiBackgroundResult = {
  buffer: Buffer;
  model: string;
  mimeType: string;
};

const MODELS = ["gemini-3.1-flash-image", "gemini-2.5-flash-image", "gemini-3-pro-image"];
const GEMINI_COOLDOWN_MS = 30 * 60 * 1000;
let geminiCooldownUntil = 0;
let raceFinished = false;
const ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models";
const PLACEHOLDERS = new Set(["", "YOUR_GEMINI_API_KEY_HERE", "PASTE_REAL_KEY_HERE"]);
const FATAL_PATTERNS = [/quota/i, /billing/i, /RESOURCE_EXHAUSTED/i, /API key not valid/i, /PERMISSION_DENIED/i];

export function getAiImageKey(): string {
  const key = (process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || "").trim();
  return PLACEHOLDERS.has(key) ? "" : key;
}

function buildPrompt(category: string, custom?: string): string {
  const themes: Record<string, string> = {
    science: "glowing laboratory glassware silhouettes, molecular structures, nebula and circuit light streaks, deep indigo and violet",
    sports: "dynamic motion light trails, stadium floodlights, energetic geometric shards, crimson and orange",
    cultural: "festival colour bursts, marigold petals, festive bokeh lights and rangoli inspired mandala patterns, magenta and gold",
    exam: "calm study desk atmosphere, floating notebooks and pencil line art, subtle grid and teal glow",
    generic: "abstract celebration confetti bokeh, soft light rays and modern gradient waves, blue and cyan",
  };
  const customTheme = (custom || "").trim().slice(0, 600);
  const theme = customTheme || themes[category] || themes.generic;
  return [
    "Premium square social media poster background artwork, 1:1 aspect ratio.",
    `Visuals: ${theme}.`,
    "Style: rich cinematic lighting, layered depth, subtle grain, high contrast dark edges and a calmer darker middle area so white text stays readable.",
    "Absolutely NO text, NO letters, NO numbers, NO words, NO logos, NO watermarks, NO people faces.",
    "Modern editorial poster art, vibrant but not neon, print quality.",
  ].join(" ");
}

type PartShape = { inlineData?: { mimeType?: string; data?: string }; text?: string };

async function generateOnce(
  model: string,
  key: string,
  prompt: string,
  signal: AbortSignal,
): Promise<AiBackgroundResult> {
  const response = await fetch(`${ENDPOINT}/${model}:generateContent?key=${encodeURIComponent(key)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    signal,
    body: JSON.stringify({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: { responseModalities: ["TEXT", "IMAGE"] },
    }),
  });

  const data = (await response.json().catch(() => ({}))) as {
    error?: { message?: string };
    candidates?: { content?: { parts?: PartShape[] } }[];
  };

  if (!response.ok || data.error) {
    const message = data.error?.message || `HTTP ${response.status}`;
    const fatal =
      FATAL_PATTERNS.some((pattern) => pattern.test(message)) ||
      [400, 401, 403, 404].includes(response.status);
    const retriable = !fatal && (response.status === 429 || response.status === 503 || response.status === 500);
    const err = new Error(`${model}: ${message}`) as Error & { retriable?: boolean };
    err.retriable = retriable;
    throw err;
  }

  const parts = data.candidates?.[0]?.content?.parts || [];
  const imagePart = parts.find((p) => p.inlineData?.data);
  if (!imagePart?.inlineData?.data) {
    const text = parts.find((p) => p.text)?.text || "";
    const err = new Error(`${model}: no image returned${text ? ` (${text.slice(0, 120)})` : ""}`) as Error & {
      retriable?: boolean;
    };
    err.retriable = false;
    throw err;
  }

  return {
    buffer: Buffer.from(imagePart.inlineData.data, "base64"),
    model,
    mimeType: imagePart.inlineData.mimeType || "image/png",
  };
}

async function generateWithGemini(prompt: string, timeoutMs: number): Promise<AiBackgroundResult | null> {
  if (Date.now() < geminiCooldownUntil) return null;
  const key = getAiImageKey();
  if (!key) return null;

  let lastError = "";

  outer: for (const model of MODELS) {
    for (let attempt = 0; attempt < 2; attempt++) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);
      try {
        const result = await generateOnce(model, key, prompt, controller.signal);
        clearTimeout(timer);
        return result;
      } catch (error) {
        clearTimeout(timer);
        const message = error instanceof Error ? error.message : String(error);
        lastError = message;
        const retriable = (error as { retriable?: boolean })?.retriable !== false;
        if (!retriable) {
          if (FATAL_PATTERNS.some((pattern) => pattern.test(message))) {
            if (/quota|RESOURCE_EXHAUSTED/i.test(message)) {
              geminiCooldownUntil = Date.now() + GEMINI_COOLDOWN_MS;
              console.warn(
                `[social-engine] Gemini image quota exhausted — skipping it for ${Math.round(GEMINI_COOLDOWN_MS / 60000)} min`,
              );
            }
            break outer;
          }
          break;
        }
        if (message.includes("abort")) break;
        await new Promise((r) => setTimeout(r, 1200 * (attempt + 1)));
      }
    }
  }

  if (lastError) {
    console.warn("[social-engine] Gemini image models unavailable:", lastError.slice(0, 200));
  }
  return null;
}

const POLLINATIONS_URL = "https://image.pollinations.ai/prompt/";
const POLLINATIONS_MODEL = "sana";

async function generateWithPollinations(
  prompt: string,
  options: { seed?: number; timeoutMs?: number } = {},
): Promise<AiBackgroundResult | null> {
  const params = new URLSearchParams({
    width: "1080",
    height: "1080",
    nologo: "true",
    safe: "true",
    model: POLLINATIONS_MODEL,
  });
  if (Number.isFinite(options.seed)) params.set("seed", String(Math.floor(options.seed as number)));

  const url = `${POLLINATIONS_URL}${encodeURIComponent(prompt)}?${params.toString()}`;
  const deadline = Date.now() + (options.timeoutMs ?? 45000);
  const delays = [2500, 8000, 20000, 45000];
  let lastError = "";

  for (let attempt = 0; attempt <= delays.length && Date.now() < deadline; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), Math.max(4000, deadline - Date.now()));
    try {
      const response = await fetch(url, { signal: controller.signal });
      clearTimeout(timer);

      const contentType = response.headers.get("content-type") || "";
      if (response.ok && contentType.startsWith("image/")) {
        const buffer = Buffer.from(await response.arrayBuffer());
        if (buffer.length > 0) {
          return { buffer, model: POLLINATIONS_MODEL, mimeType: contentType.split(";")[0] };
        }
        lastError = "empty image body";
      } else {
        const body = (await response.text().catch(() => "")).slice(0, 120);
        lastError = `HTTP ${response.status}${body ? ` ${body}` : ""}`;
      }
    } catch (error) {
      clearTimeout(timer);
      lastError = error instanceof Error ? error.message : String(error);
      if (lastError.includes("abort")) lastError = "timeout";
    }

    if (attempt < delays.length) {
      const wait = Math.min(delays[attempt], Math.max(0, deadline - Date.now()));
      if (wait > 0) await sleep(wait);
    }
  }

  if (!raceFinished) console.warn("[social-engine] Pollinations background unavailable:", lastError);
  return null;
}

const HF_SPACE = "https://black-forest-labs-flux-1-schnell.hf.space";
const HF_MODEL = "flux-1-schnell";
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function generateWithHuggingFace(
  prompt: string,
  options: { seed?: number; timeoutMs?: number } = {},
): Promise<AiBackgroundResult | null> {
  const deadline = Date.now() + (options.timeoutMs ?? 60000);
  const seed = Number.isFinite(options.seed) ? Math.abs(Math.floor(options.seed as number)) % 100000 : 0;
  let lastError = "";

  for (let attempt = 0; attempt < 2 && Date.now() < deadline; attempt++) {
    try {
      const submit = await fetch(`${HF_SPACE}/gradio_api/call/infer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: [prompt, seed, true, 1080, 1080, 4] }),
      });
      const submitted = (await submit.json().catch(() => ({}))) as { event_id?: string; error?: string };
      if (!submit.ok || !submitted.event_id) {
        lastError = submitted.error || `submit HTTP ${submit.status}`;
        await sleep(2000);
        continue;
      }

      let imageUrl = "";
      while (Date.now() < deadline) {
        await sleep(1500);
        const poll = await fetch(`${HF_SPACE}/gradio_api/call/infer/${submitted.event_id}`);
        const text = await poll.text();
        if (text.startsWith("event: error")) {
          lastError = text.slice(0, 160).replace(/\s+/g, " ");
          break;
        }
        if (text.startsWith("event: complete")) {
          const dataLine = text.split("\n").find((line) => line.startsWith("data:"));
          if (dataLine) {
            const payload = JSON.parse(dataLine.slice(5)) as { url?: string }[];
            imageUrl = payload?.[0]?.url || "";
          }
          break;
        }
      }

      if (!imageUrl) {
        lastError = lastError || "timed out waiting for the image";
        await sleep(2000);
        continue;
      }

      const download = await fetch(imageUrl, { redirect: "follow" });
      const contentType = download.headers.get("content-type") || "";
      if (!download.ok || !contentType.startsWith("image/")) {
        lastError = `download HTTP ${download.status} (${contentType || "no type"})`;
        await sleep(2000);
        continue;
      }

      const buffer = Buffer.from(await download.arrayBuffer());
      if (buffer.length > 0) {
        return { buffer, model: HF_MODEL, mimeType: contentType.split(";")[0] };
      }
      lastError = "empty image body";
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
      await sleep(2000);
    }
  }

  if (!raceFinished) console.warn("[social-engine] Hugging Face FLUX background unavailable:", lastError);
  return null;
}

export async function generateAiBackground(
  category: string,
  options: { timeoutMs?: number; seed?: number; prompt?: string } = {},
): Promise<AiBackgroundResult | null> {
  const prompt = buildPrompt(category, options.prompt);
  const deadline = Date.now() + (options.timeoutMs ?? 90000);
  const remaining = () => Math.max(6000, deadline - Date.now());
  raceFinished = false;

  const fromGemini = await generateWithGemini(prompt, Math.min(25000, remaining()));
  if (fromGemini) return fromGemini;

  // Free sources throttle independently, so race them and take the first image.
  const budget = remaining();
  const firstImage = async (
    generator: (opts: { seed?: number; timeoutMs: number }) => Promise<AiBackgroundResult | null>,
  ): Promise<AiBackgroundResult> => {
    const result = await generator({ seed: options.seed, timeoutMs: budget });
    if (!result) throw new Error("no image");
    return result;
  };

  try {
    const winner = await Promise.any([
      firstImage((opts) => generateWithHuggingFace(prompt, opts)),
      firstImage((opts) => generateWithPollinations(prompt, opts)),
    ]);
    raceFinished = true;
    return winner;
  } catch {
    raceFinished = true;
    return null;
  }
}
