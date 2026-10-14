import path from "node:path";
import { run, ffmpegPath, ffprobeDuration } from "./util.js";

function num(v, fallback) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

/**
 * Pure planner: how the music input should be filtered so it syncs with the
 * rendered video (fills 0:00..videoDur, fades out ending exactly at videoDur).
 *
 * Returns filter steps (no input label) for `[<musicIdx>:a]`.
 */
export function planMusic({
  videoDur,
  availDur,
  loop = true,
  volume = 0.18,
  fadeIn = 1,
  fadeOut = 2,
} = {}) {
  const warnings = [];
  const v = num(videoDur, 0);
  const a = num(availDur, 0);
  if (v <= 0.05) return { ok: false, chain: "", cap: 0, warnings: ["video duration unknown - music skipped"] };
  if (a <= 0.05) return { ok: false, chain: "", cap: 0, warnings: ["music track has no audio - music skipped"] };

  let cap = loop ? v : Math.min(v, a);
  if (cap <= 0.05) return { ok: false, chain: "", cap: 0, warnings: ["music segment empty - music skipped"] };
  if (!loop && a < v - 0.05) {
    warnings.push(`music ends before video (${a.toFixed(1)}s < ${v.toFixed(1)}s): tail will be silent`);
  }

  const fi = Math.max(0, Math.min(num(fadeIn, 0), cap));
  const fo = Math.max(0, Math.min(num(fadeOut, 0), cap));
  const vol = Math.max(0, num(volume, 0.18));

  const chain = [
    `volume=${Number(vol.toFixed(4))}`,
    `atrim=0:${cap.toFixed(3)}`,
    "asetpts=PTS-STARTPTS",
    fi > 0 ? `afade=t=in:d=${fi.toFixed(3)}` : null,
    fo > 0 ? `afade=t=out:st=${Math.max(0, cap - fo).toFixed(3)}:d=${fo.toFixed(3)}` : null,
  ].filter(Boolean).join(",");

  return { ok: true, chain, cap, warnings };
}

/**
 * Cut [start, end) out of the music file into a wav so -stream_loop can loop
 * exactly that region (input-side seek + -stream_loop would restart from file
 * start, losing the offset). Returns null when nothing usable is left.
 */
export async function trimMusic({ file, start = 0, end = null, fileDur = 0, outFile }) {
  let s = Math.max(0, num(start, 0));
  let e = end == null || end === "" ? null : num(end, NaN);
  if (e != null && !Number.isFinite(e)) e = null;

  if (fileDur > 0) {
    if (s >= fileDur - 0.05) return null;
    if (e != null) e = Math.min(e, fileDur);
  }
  if (e != null && e <= s + 0.05) return null;

  const args = ["-y"];
  if (s > 0) args.push("-ss", s.toFixed(3));
  args.push("-i", file, "-vn");
  if (e != null) args.push("-t", (e - s).toFixed(3));
  args.push("-c:a", "pcm_s16le", outFile);
  await run(ffmpegPath(), args, {});
  return outFile;
}

/** Probe a music file's duration (0 when unreadable). */
export async function musicDuration(file) {
  try {
    const d = await ffprobeDuration(file);
    return Number.isFinite(d) ? d : 0;
  } catch {
    return 0;
  }
}

/**
 * One-stop preparation shared by assemble() and assemblePromo():
 * optional segment cut + plan against the final video duration.
 * Returns null (no file), { ok:false, warnings }, or
 * { ok:true, inputArgs, chain, warnings } - inputArgs go right after the
 * other -i inputs, chain is appended to `[<idx>:a]`.
 */
export async function prepareMusic({
  file, start = 0, end = null, loop = true,
  volume = 0.18, fadeIn = 1, fadeOut = 2,
  videoDur, workDir,
} = {}) {
  if (!file) return null;
  const srcDur = await musicDuration(file);
  let segFile = file;
  let segDur = srcDur;
  const wantSeg = Number(start) > 0 || (end != null && end !== "" && Number(end) > 0);
  if (wantSeg) {
    const seg = await trimMusic({
      file, start, end, fileDur: srcDur,
      outFile: path.join(workDir, "music-seg.wav"),
    });
    if (!seg) {
      return { ok: false, warnings: [`start ${start}s is past the end of the track (${srcDur.toFixed(1)}s) - music skipped`] };
    }
    segFile = seg;
    segDur = await musicDuration(seg).then(d => d || segDur);
  }
  const plan = planMusic({ videoDur, availDur: segDur, loop, volume, fadeIn, fadeOut });
  if (!plan.ok) return { ok: false, warnings: plan.warnings };
  return {
    ok: true,
    inputArgs: loop ? ["-stream_loop", "-1", "-i", segFile] : ["-i", segFile],
    chain: plan.chain,
    warnings: plan.warnings,
  };
}
