/**
 * Video Engine HTTP server — port 4500
 *
 * Wraps src/engine.js so ServerConsole (port 7777 manager) can start it:
 *   npm run server
 *
 * Endpoints:
 *   GET  /health           -> { ok, name, running }
 *   POST /render           -> { prompt, mode:"free"|"video", duration, theme, name }
 *   GET  /status           -> { running, logs, lastResult }
 *   GET  /outputs          -> [{ name, size, mtime }]
 *   GET  /output/<file>    -> mp4 preview/download
 *   GET  /                 -> tiny UI form
 */

import http from "node:http";
import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import busboy from "busboy";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.join(__dirname, "output");
const UPLOAD_DIR = path.join(__dirname, "work", "uploads");
const ENGINE = path.join(__dirname, "src", "engine.js");
const PORT = 4500;

fs.mkdirSync(UPLOAD_DIR, { recursive: true });

function purgeOldUploads() {
  try {
    const cutoff = Date.now() - 24 * 60 * 60 * 1000;
    for (const d of fs.readdirSync(UPLOAD_DIR)) {
      const full = path.join(UPLOAD_DIR, d);
      try {
        const st = fs.statSync(full);
        if (st.isDirectory() && st.mtimeMs < cutoff) fs.rmSync(full, { recursive: true, force: true });
      } catch { /* ignore */ }
    }
  } catch { /* ignore */ }
}
purgeOldUploads();
setInterval(purgeOldUploads, 6 * 60 * 60 * 1000);

const state = {
  running: false,
  child: null,
  logs: [],
  lastResult: null,
  current: null,
};

function pushLog(line) {
  const entry = `[${new Date().toLocaleTimeString()}] ${line}`;
  state.logs.push(entry);
  if (state.logs.length > 500) state.logs.shift();
}

function slugify(s) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40) || "video";
}

function parseUpload(req) {
  return new Promise((resolve, reject) => {
    const bb = busboy({ headers: req.headers, limits: { fileSize: 100 * 1024 * 1024, files: 20 } });
    const uploadId = Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
    const dir = path.join(UPLOAD_DIR, uploadId);
    fs.mkdirSync(dir, { recursive: true });
    const files = [];
    let failed = null;
    let pending = 0;
    let closed = false;

    const finish = () => {
      if (closed || pending > 0) return;
      closed = true;
      if (failed) return reject(new Error(failed));
      if (!files.length) return reject(new Error("no files received"));
      resolve({ uploadId, files });
    };

    bb.on("file", (fieldName, stream, info) => {
      const rawName = path.basename(String(info.filename || "file"));
      const safe = rawName.replace(/[^a-zA-Z0-9._-]/g, "_") || "file";
      // music rides in the same upload dir but is tagged so /render can tell it apart
      const isMusic = fieldName === "music" || /\.(mp3|wav|m4a|ogg|aac|flac)$/i.test(safe);
      const dest = path.join(dir, isMusic ? `bgm-${safe}` : safe);
      const ws = fs.createWriteStream(dest);
      let size = 0;
      pending++;
      stream.on("data", (c) => { size += c.length; });
      stream.on("limit", () => { failed = "file too large (max 100MB)"; });
      stream.on("error", (e) => { failed = e.message; });
      ws.on("error", (e) => { failed = e.message; });
      ws.on("close", () => {
        if (size >= 1000 && !failed) files.push(dest);
        pending--;
        finish();
      });
      stream.pipe(ws);
    });
    bb.on("error", (e) => { failed = e.message; closed = true; reject(new Error(e.message)); });
    bb.on("close", () => { if (pending === 0) finish(); });
    req.pipe(bb);
  });
}

function startRender(body) {
  const prompt = String(body.prompt || "").trim();
  if (!prompt) return { error: "prompt is required" };
  if (state.running) return { error: "a render is already running" };

  const mode = ["video", "cinematic"].includes(body.mode) ? body.mode : "free";
  const duration = Math.min(30, Math.max(6, Number(body.duration) || 10));
  const theme = ["festive", "gold", "neon", "sunset", "royal"].includes(body.theme) ? body.theme : null;
  const name = slugify(String(body.name || prompt).slice(0, 60));
  const aspect = ["9:16", "16:9", "1:1"].includes(body.aspect) ? body.aspect : "9:16";
  const lang = ["en", "hi", "hi-male"].includes(body.lang) ? body.lang : "en";
  const noVoice = body.noVoice === true || body.noVoice === "true";

  const args = [ENGINE, prompt];
  if (mode === "cinematic") args.push("--cinematic");
  else if (mode === "video") args.push("--video");
  else args.push("--free");
  if (noVoice && mode === "cinematic") args.push("--no-voice");
  args.push("--duration", String(duration), "--name", name, "--aspect", aspect, "--lang", lang);
  if (theme) args.push("--theme", theme);

  const uploadId = String(body.uploadId || "").replace(/[^a-zA-Z0-9_-]/g, "");
  let mediaPaths = [];
  if (uploadId) {
    const dir = path.join(UPLOAD_DIR, uploadId);
    if (fs.existsSync(dir)) {
      mediaPaths = fs.readdirSync(dir).map((f) => path.join(dir, f)).filter((p) => {
        try { return fs.statSync(p).isFile() && fs.statSync(p).size >= 1000; } catch { return false; }
      });
    }
  }
  const isAudio = (p) => /^bgm-/i.test(path.basename(p)) || /\.(mp3|wav|m4a|ogg|aac|flac)$/i.test(p);
  const musicPaths = mediaPaths.filter(isAudio);
  mediaPaths = mediaPaths.filter((p) => !isAudio(p));
  const musicPath = musicPaths[musicPaths.length - 1] || null;
  for (const mp of mediaPaths) args.push("--media", mp);

  if (musicPath) args.push("--music", musicPath);
  const num = (v) => (v === undefined || v === null || v === "" ? null : Number(v));
  const ms = num(body.musicStart) || 0;
  const me = num(body.musicEnd);
  const mfi = num(body.musicFadeIn);
  const mfo = num(body.musicFadeOut);
  const mv = num(body.musicVolume);
  if (musicPath && ms > 0) args.push("--music-start", String(ms));
  if (musicPath && me !== null && me > 0) args.push("--music-end", String(me));
  if (musicPath && mfi !== null && Number.isFinite(mfi)) args.push("--music-fade-in", String(mfi));
  if (musicPath && mfo !== null && Number.isFinite(mfo)) args.push("--music-fade-out", String(mfo));
  if (musicPath && mv !== null && Number.isFinite(mv)) args.push("--music-volume", String(mv));
  if (body.musicLoop === false || body.musicLoop === "false") args.push("--no-music-loop");
  if (body.musicDuck === false || body.musicDuck === "false") args.push("--no-music-duck");
  if (body.loudnorm === false || body.loudnorm === "false") args.push("--no-loudnorm");

  state.logs = [];
  state.current = { prompt, mode, duration, theme, name, aspect, lang, noVoice, startedAt: Date.now(), mediaCount: mediaPaths.length, music: musicPath ? path.basename(musicPath) : null };
  state.running = true;

  pushLog(`POST /render -> mode=${mode} duration=${duration}s aspect=${aspect} lang=${lang}${noVoice && mode === "cinematic" ? " noVoice" : ""} theme=${theme || "auto"} name=${name}`);
  pushLog(`prompt: ${prompt}`);
  if (mediaPaths.length) pushLog(`attached media: ${mediaPaths.map((p) => path.basename(p)).join(", ")}`);
  if (musicPath) pushLog(`background music: ${path.basename(musicPath)}${ms > 0 ? ` from ${ms}s` : ""}${me ? ` to ${me}s` : ""} (fade ${mfi ?? 1}s/${mfo ?? 2}s${mv != null ? `, vol ${mv}` : ""}${body.musicLoop === false ? ", no loop" : ""})`);

  const runAttempt = (attempt) => {
    const child = spawn(process.execPath, args, {
      cwd: __dirname,
      shell: false,
      stdio: ["ignore", "pipe", "pipe"],
      env: { ...process.env, FORCE_COLOR: "1" },
    });
    state.child = child;

    const onData = (data) => {
      data.toString().split("\n").filter(Boolean).forEach(pushLog);
    };
    child.stdout.on("data", onData);
    child.stderr.on("data", onData);
    child.on("exit", (code) => {
      pushLog(`[engine exited with code ${code}]`);
      if (code === 0) {
        const outName = `${name}_1080x1920.mp4`;
        const outFile = path.join(OUT_DIR, outName);
        if (fs.existsSync(outFile)) {
          state.lastResult = {
            name: outName,
            url: `/output/${outName}`,
            size: fs.statSync(outFile).size,
            finishedAt: Date.now(),
          };
          pushLog(`done: ${outName} (${(state.lastResult.size / 1024 / 1024).toFixed(1)} MB)`);
        }
      } else if (attempt === 0) {
        // native crashes (0xC0000409 etc.) happen occasionally — retry once
        pushLog(`[engine failed (code ${code}) -> auto-retry 1/1]`);
        runAttempt(1);
        return;
      } else {
        state.lastResult = { error: `engine failed (code ${code})` };
    }
    state.running = false;
    state.child = null;
    state.current = null;
  });
  child.on("error", (err) => {
    pushLog(`[error: ${err.message}]`);
    state.lastResult = { error: err.message };
    state.running = false;
    state.child = null;
    state.current = null;
  });
  };

  runAttempt(0);
  return { ok: true, name, mode, duration };
}

async function listOutputs() {
  try {
    const files = await fsp.readdir(OUT_DIR);
    const out = [];
    for (const f of files.filter((f) => f.endsWith(".mp4"))) {
      const st = await fsp.stat(path.join(OUT_DIR, f));
      out.push({ name: f, size: st.size, mtime: st.mtimeMs, url: `/output/${f}` });
    }
    return out.sort((a, b) => b.mtime - a.mtime);
  } catch {
    return [];
  }
}

function json(res, code, data) {
  const buf = JSON.stringify(data);
  res.writeHead(code, { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(buf) });
  res.end(buf);
}

function readBody(req) {
  return new Promise((resolve) => {
    let data = "";
    req.on("data", (c) => {
      data += c;
      if (data.length > 1e6) req.destroy();
    });
    req.on("end", () => resolve(data));
  });
}

const HTML = `<!doctype html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Video Engine</title>
<style>
body{font-family:system-ui,sans-serif;background:#0f172a;color:#e2e8f0;margin:0;padding:24px;max-width:760px;margin:auto}
h1{font-size:20px}label{display:block;margin:12px 0 4px;color:#94a3b8;font-size:13px}
input,select,textarea{width:100%;padding:10px;border-radius:8px;border:1px solid #334155;background:#1e293b;color:#e2e8f0;box-sizing:border-box;font-size:14px}
button{margin-top:16px;padding:12px 24px;border:none;border-radius:8px;background:#6366f1;color:#fff;font-size:15px;cursor:pointer}
button:disabled{opacity:.5;cursor:wait}
pre{background:#020617;border:1px solid #1e293b;border-radius:8px;padding:12px;font-size:12px;max-height:300px;overflow:auto;white-space:pre-wrap}
a{color:#818cf8}video{width:100%;max-width:360px;border-radius:12px;margin-top:8px}
.badge{display:inline-block;padding:2px 8px;border-radius:99px;font-size:12px;background:#166534}
.chips{margin-top:8px;display:flex;flex-wrap:wrap;gap:6px}
.chip{background:#1e293b;border:1px solid #334155;border-radius:99px;padding:4px 12px;font-size:12px;color:#a5b4fc}
.hint{color:#64748b;font-size:12px;margin-top:4px}
.mrow{display:flex;gap:8px}.mrow>div{flex:1;min-width:0}.mrow label{margin-top:0}
</style></head><body>
<h1>&#127916; Video Engine <span id="st" class="badge">idle</span></h1>
<label>Event prompt</label>
<textarea id="p" rows="3" placeholder="Diwali night party on 5 Nov at City Hall, tickets 200, call 9876543210"></textarea>
<label>Your photos / videos (optional — used free in both modes)</label>
<input id="mu" type="file" multiple accept="image/*,video/*">
<div class="hint">Uploaded files are assigned to scenes 1, 2, 3... Remaining scenes use AI (free or pollen per mode).</div>
<label>Background music (optional — trimmed to fit the video)</label>
<input id="bgm" type="file" accept="audio/*">
<div class="hint">Loops to the video length, 1s fade-in / 2s fade-out ending on the last frame, ducks under the voice, -16 LUFS.</div>
<div class="mrow">
  <div><label>Music start (s)</label><input id="ms" type="number" min="0" step="0.5" placeholder="0"></div>
  <div><label>Music end (s)</label><input id="me" type="number" min="0" step="0.5" placeholder="auto"></div>
  <div><label>Fade in (s)</label><input id="mfi" type="number" min="0" step="0.1" value="1"></div>
  <div><label>Fade out (s)</label><input id="mfo" type="number" min="0" step="0.1" value="2"></div>
  <div><label>Music volume</label><input id="mv" type="number" min="0" max="4" step="0.01" placeholder="auto"></div>
</div>
<label style="display:flex;align-items:center;gap:8px;margin-top:8px">
  <input id="noloop" type="checkbox" style="width:auto"> Play music once (no loop)
</label>
<label style="display:flex;align-items:center;gap:8px;margin-top:4px">
  <input id="noduck" type="checkbox" style="width:auto"> Do not duck music under the voice
</label>
<label style="display:flex;align-items:center;gap:8px;margin-top:4px">
  <input id="noloud" type="checkbox" style="width:auto"> Skip loudness normalisation (-16 LUFS)
</label>
<div class="chips" id="chips"></div>
<label>Mode</label>
<select id="m"><option value="free">free (images, &#8377;0)</option><option value="video">video (pollen)</option><option value="cinematic">cinematic (continuous + auto audio)</option></select>
<label>Aspect ratio</label>
<select id="a"><option value="9:16">9:16 portrait (phone / Reels)</option><option value="16:9">16:9 landscape (YouTube / TV)</option><option value="1:1">1:1 square (Instagram)</option></select>
<label>Voice language (cinematic mode)</label>
<select id="l"><option value="en">English</option><option value="hi">Hindi (female)</option><option value="hi-male">Hindi (male)</option></select>
<label style="display:flex;align-items:center;gap:8px;margin-top:12px">
  <input id="nv" type="checkbox" style="width:auto"> Background sound only (no voice / dialogue) — cinematic mode
</label>
<label>Duration (6-30s)</label><input id="d" type="number" value="10" min="6" max="30">
<label>Theme</label>
<select id="t"><option value="">auto</option><option>festive</option><option>gold</option><option>neon</option><option>sunset</option><option>royal</option></select>
<label>Name (optional)</label><input id="n" placeholder="my-video">
<button id="go">Render video</button>
<h3 style="margin-top:24px">Log</h3><pre id="log">(empty)</pre>
<div id="out"></div>
<script>
const go=document.getElementById('go');
const mu=document.getElementById('mu');
const bgm=document.getElementById('bgm');
const chips=document.getElementById('chips');
function renderChips(){
  chips.innerHTML='';
  for(const f of mu.files){
    const c=document.createElement('span');
    c.className='chip';
    c.textContent=(f.type.startsWith('video')?'🎬 ':'📷 ')+f.name;
    chips.appendChild(c);
  }
  if(bgm.files[0]){
    const c=document.createElement('span');
    c.className='chip';
    c.textContent='🎵 '+bgm.files[0].name;
    chips.appendChild(c);
  }
}
mu.addEventListener('change',renderChips);
bgm.addEventListener('change',renderChips);
async function refresh(){
  try{
    const s=await (await fetch('/status')).json();
    const st=document.getElementById('st');
    st.textContent=s.running?'rendering':'idle';
    st.style.background=s.running?'#854d0e':'#166534';
    document.getElementById('log').textContent=s.logs.join('\\n')||'(empty)';
    const l=document.getElementById('log');l.scrollTop=l.scrollHeight;
    if(s.lastResult&&s.lastResult.url){
      document.getElementById('out').innerHTML='<h3>Last result</h3><video controls src="'+s.lastResult.url+'"></video><p><a href="'+s.lastResult.url+'">'+s.lastResult.name+'</a></p>';
    }
    go.disabled=s.running;
  }catch(e){}
}
setInterval(refresh,2000);refresh();
go.onclick=async()=>{
  go.disabled=true;
  let uploadId=null;
  if(mu.files.length||bgm.files.length){
    const fd=new FormData();
    for(const f of mu.files) fd.append('files',f);
    if(bgm.files[0]) fd.append('music',bgm.files[0]);
    try{
      const up=await (await fetch('/upload',{method:'POST',body:fd})).json();
      if(up.error){alert(up.error);go.disabled=false;return;}
      uploadId=up.uploadId;
    }catch(e){alert('upload failed: '+e.message);go.disabled=false;return;}
  }
  const g=id=>document.getElementById(id);
  const body={prompt:g('p').value,mode:g('m').value,duration:Number(g('d').value),theme:g('t').value||null,name:g('n').value,aspect:g('a').value,lang:g('l').value,noVoice:g('nv').checked,uploadId,
    musicStart:Number(g('ms').value)||0,
    musicEnd:g('me').value?Number(g('me').value):null,
    musicFadeIn:g('mfi').value===''?1:Number(g('mfi').value),
    musicFadeOut:g('mfo').value===''?2:Number(g('mfo').value),
    musicVolume:g('mv').value===''?null:Number(g('mv').value),
    musicLoop:!g('noloop').checked,
    musicDuck:!g('noduck').checked,
    loudnorm:!g('noloud').checked};
  const r=await (await fetch('/render',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)})).json();
  if(r.error)alert(r.error);
  refresh();
};
</script>
</body></html>`;

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  const p = url.pathname;

  if (req.method === "GET" && (p === "/" || p === "/index.html")) {
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    return res.end(HTML);
  }

  if (req.method === "GET" && p === "/health") {
    return json(res, 200, { ok: true, name: "Video Engine", running: state.running, port: PORT });
  }

  if (req.method === "GET" && p === "/status") {
    return json(res, 200, { running: state.running, logs: state.logs, lastResult: state.lastResult, current: state.current });
  }

  if (req.method === "POST" && p === "/upload") {
    try {
      const r = await parseUpload(req);
      return json(res, 200, { uploadId: r.uploadId, files: r.files.map((f) => path.basename(f)) });
    } catch (e) {
      return json(res, 400, { error: e.message });
    }
  }

  if (req.method === "POST" && p === "/render") {
    let body = {};
    try {
      body = JSON.parse((await readBody(req)) || "{}");
    } catch {
      return json(res, 400, { error: "invalid JSON" });
    }
    const r = startRender(body);
    return json(res, r.error ? 409 : 200, r);
  }

  if (req.method === "GET" && p === "/outputs") {
    return json(res, 200, await listOutputs());
  }

  if (req.method === "GET" && p.startsWith("/output/")) {
    const file = path.basename(p.slice("/output/".length));
    if (!file.endsWith(".mp4")) return json(res, 400, { error: "bad file" });
    const full = path.join(OUT_DIR, file);
    if (!fs.existsSync(full)) return json(res, 404, { error: "not found" });
    const st = fs.statSync(full);
    res.writeHead(200, { "Content-Type": "video/mp4", "Content-Length": st.size, "Accept-Ranges": "bytes" });
    return fs.createReadStream(full).pipe(res);
  }

  json(res, 404, { error: "not found" });
});

server.listen(PORT, () => {
  console.log(`[video-engine] http://localhost:${PORT} (UI + API)`);
  console.log(`[video-engine] POST /render {prompt, mode, duration, theme, name, uploadId?}`);
  console.log(`[video-engine] POST /upload (multipart files) -> {uploadId, files}`);
});
