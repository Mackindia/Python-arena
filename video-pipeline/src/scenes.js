const STOP = new Set("a an the and or of to in on for with is are was were be been at by from as it its this that these those you your we our i me my he she they them into about over under then than so if not no yes can could would should will just very really more most some any each every one two".split(" "));

function keywordsFrom(text, n = 3) {
  const words = text.toLowerCase().replace(/[^a-z0-9\s]/g, " ").split(/\s+/).filter(w => w.length > 2 && !STOP.has(w));
  const seen = new Set();
  const out = [];
  for (const w of words) {
    if (!seen.has(w)) { seen.add(w); out.push(w); }
  }
  return out.slice(0, n);
}

function naiveScenes(script, maxScenes = 4) {
  const sentences = script.replace(/\s+/g, " ").trim().split(/(?<=[.!?।])\s+/).filter(Boolean);
  const target = Math.min(Math.max(2, Math.ceil(sentences.length / 2)), maxScenes);
  const per = Math.ceil(sentences.length / target);
  const scenes = [];
  for (let i = 0; i < sentences.length; i += per) {
    const text = sentences.slice(i, i + per).join(" ").trim();
    const kw = keywordsFrom(text);
    scenes.push({
      text,
      keywords: kw.length ? kw : ["cinematic", "night", "celebration"],
      imagePrompt: text,
    });
  }
  return scenes.length ? scenes : [{ text: script.trim(), keywords: keywordsFrom(script).length ? keywordsFrom(script) : ["cinematic", "night", "celebration"], imagePrompt: script }];
}

export async function splitScenes(script, apiKey) {
  if (apiKey) {
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
                  text: `Split this short video script into 2-4 scenes. Reply ONLY with a JSON array. Each element must have exactly these keys: "text" (scene narration, keep the original language and words unchanged), "keywords" (exactly 3 ENGLISH search words for stock footage/images, e.g. ["fireworks","night sky","celebration"] - NEVER write keywords in Hindi/Chinese/other scripts), "imagePrompt" (one short ENGLISH visual description of what should appear on screen, e.g. "golden pikachu-shaped fireworks bursting in night sky"). Script:\n\n${script}`
                }]
              }],
              generationConfig: { responseMimeType: "application/json", temperature: 0.2 }
            })
          }
        );
        if (res.status === 404 || res.status === 429 || res.status === 503 || res.status === 500) continue;
        if (!res.ok) break;
        const data = await res.json();
        const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length && parsed.every(s => s && typeof s.text === "string")) {
          return parsed.map(s => {
            let kws = Array.isArray(s.keywords) ? s.keywords.map(String).filter(w => /[a-zA-Z]/.test(w)) : [];
            if (!kws.length) kws = keywordsFrom(s.imagePrompt || s.text);
            if (!kws.length) kws = ["cinematic", "night", "celebration"];
            return {
              text: s.text.trim(),
              keywords: kws.slice(0, 3),
              imagePrompt: typeof s.imagePrompt === "string" && s.imagePrompt ? s.imagePrompt : s.text,
            };
          });
        }
      } catch {
        /* try next model */
      }
    }
  }
  return naiveScenes(script);
}
