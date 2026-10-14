import path from "node:path";
import { run, ffmpegPath, writeAss, subtitleFilter } from "./util.js";

export async function makeTitleCard({ text, duration = 2.5, width, height, workDir, lang, outFile, outro = false }) {
  const ass = path.join(workDir, outro ? "outro-card.ass" : "intro-card.ass");
  const font = lang === "hi" ? "Nirmala UI" : "Arial";
  // title ~7% of height, centered (Alignment=5), real pixels via PlayRes
  const fontSize = Math.round(height * 0.07);
  // text event outlives the clip so the final (frozen) frame still shows it
  await writeAss([{ text, start: 0, end: duration + 1 }], ass, {
    width, height, fontSize, alignment: 5, marginV: 0, font,
  });
  const c0 = outro ? "0x0a0a14" : "0x101018";
  const c1 = outro ? "0x1a1030" : "0x1c1c36";
  const frames = Math.ceil((duration + 0.05) * 30);
  await run(ffmpegPath(), [
    "-y",
    "-f", "lavfi",
    "-i", `gradients=s=${width}x${height}:c0=${c0}:c1=${c1}:speed=0.025:d=${(duration + 0.05).toFixed(2)}`,
    "-vf", `${subtitleFilter(ass, lang)},fps=30,setsar=1`,
    "-frames:v", String(frames),
    "-an",
    "-c:v", "libx264", "-preset", "veryfast", "-pix_fmt", "yuv420p",
    outFile,
  ], { cwd: workDir });
  return outFile;
}
