import fs from "node:fs/promises";
import path from "node:path";
import { run, ffmpegPath, ffprobeDuration, writeSrt, subtitleFilter } from "./util.js";
import { prepareMusic } from "./musicTrim.js";

const XFADES = ["fade", "dissolve", "wipeleft", "fadeblack"];
const TD = 0.35; // crossfade length in seconds

export async function assemble({
  clips, audios, music, width, height, outFile,
  captionTexts, sceneStarts, sceneEnds,
  workDir, lang = "en",
  introDur = 0, outroDur = 0, crossfade = true,
  musicVolume = 0.18, skipSubtitles = false,
  musicStart = 0, musicEnd = null, musicFadeIn = 1, musicFadeOut = 2, musicLoop = true,
  musicDuck = true, loudnorm = true,
}) {
  await fs.copyFile("C:/Windows/Fonts/Nirmala.ttc", path.join(workDir, "Nirmala.ttc")).catch(() => {});

  const args = ["-y"];
  for (const c of clips) args.push("-i", c);
  for (const a of audios) args.push("-i", a);

  const n = clips.length;
  const parts = [];
  for (let i = 0; i < n; i++) {
    parts.push(`[${i}:v]setpts=PTS-STARTPTS,fps=30,setsar=1[v${i}]`);
  }

  // probe all clip durations once (needed for xfade offsets AND for capping looping music)
  const durs = await Promise.all(clips.map(c => ffprobeDuration(c)));

  // join clips: xfade chain (smooth crossfades) or hard concat
  let vLabel;
  let videoDur;
  if (n === 1) {
    vLabel = "v0";
    videoDur = durs[0];
  } else if (crossfade) {
    let prev = "v0";
    let acc = durs[0];
    for (let i = 1; i < n; i++) {
      const outL = `x${i}`;
      // xfade offset = start of the join on the running stream; keep it inside the first input
      const safeOffset = Math.max(0.05, Math.min(acc - 0.05, acc - TD));
      const tr = XFADES[(i - 1) % XFADES.length];
      const dur = Math.min(TD, Math.max(0.1, (durs[i] || TD * 2) * 0.5));
      parts.push(`[${prev}][v${i}]xfade=transition=${tr}:duration=${dur.toFixed(3)}:offset=${safeOffset.toFixed(3)}[${outL}]`);
      prev = outL;
      acc = acc + durs[i] - TD;
    }
    // xfade shortens video but not audio - freeze the last frame to cover the gap
    const voiceTotal = audios.length ? (await Promise.all(audios.map(a => ffprobeDuration(a)))).reduce((s, d) => s + d, 0) : 0;
    const audioTotal = introDur + voiceTotal + outroDur;
    const pad = audioTotal - acc;
    if (pad > 0.05) {
      parts.push(`[${prev}]tpad=stop_mode=clone:stop_duration=${pad.toFixed(3)}[vcat]`);
      vLabel = "vcat";
      videoDur = acc + pad;
    } else {
      vLabel = prev;
      videoDur = acc;
    }
  } else {
    parts.push([...Array(n).keys()].map(i => `[v${i}]`).join("") + `concat=n=${n}:v=1:a=0[vcat]`);
    vLabel = "vcat";
    videoDur = durs.reduce((s, d) => s + d, 0);
  }

  // music: cut the requested segment (so the loop honours start/end), then plan
  // trim/fades against the FINAL video duration - music spans 0:00..videoDur
  // with the fade-out landing exactly on the last frame.
  let musicIdx = -1;
  let musChain = "";
  if (music) {
    const prep = await prepareMusic({
      file: music, start: musicStart, end: musicEnd,
      loop: musicLoop, volume: musicVolume,
      fadeIn: musicFadeIn, fadeOut: musicFadeOut,
      videoDur, workDir,
    });
    if (prep) {
      prep.warnings.forEach(w => console.log(`  music: ${w}`));
      if (prep.ok) {
        args.push(...prep.inputArgs);
        musicIdx = clips.length + audios.length;
        musChain = prep.chain;
      }
    }
  }

  // captions timed to scene narration (starts already shifted by intro)
  if (!skipSubtitles && captionTexts.some(t => t && String(t).trim())) {
    const srt = path.join(workDir, "subs.srt");
    const cues = captionTexts.map((t, i) => ({ text: t, start: sceneStarts[i], end: sceneEnds[i] }));
    await writeSrt(cues, srt);
    parts.push(`[${vLabel}]${subtitleFilter(srt, lang)}[vout]`);
  } else {
    parts.push(`[${vLabel}]null[vout]`);
  }

  // audio: silence for intro/outro + voice tracks (+ music)
  const audioLabels = [];
  if (introDur > 0) {
    parts.push(`anullsrc=r=44100:cl=stereo:d=${introDur.toFixed(3)}[aSil0]`);
    audioLabels.push("[aSil0]");
  }
  audios.forEach((_, i) => audioLabels.push(`[${n + i}:a]`));
  if (outroDur > 0) {
    parts.push(`anullsrc=r=44100:cl=stereo:d=${outroDur.toFixed(3)}[aSil1]`);
    audioLabels.push("[aSil1]");
  }

  let aLabel;
  const mus = musicIdx >= 0 ? `[${musicIdx}:a]${musChain}` : null;

  // normalise the voice lane to a single label (intro silence + TTS + outro)
  let voiceLabel = null;
  if (audioLabels.length === 1) {
    parts.push(`${audioLabels[0]}anull[aVoice]`);
    voiceLabel = "aVoice";
  } else if (audioLabels.length > 1) {
    parts.push(`${audioLabels.join("")}concat=n=${audioLabels.length}:v=0:a=1[voiceCat]`);
    voiceLabel = "voiceCat";
  }

  if (!voiceLabel && !mus) {
    // no voice and no music (music skipped/absent): silent track = video length
    parts.push(`anullsrc=r=44100:cl=stereo:d=${videoDur.toFixed(3)}[aout]`);
    aLabel = "aout";
  } else if (!voiceLabel && mus) {
    // background-only: no voice tracks. Music chain already caps the
    // -stream_loop input at videoDur so ffmpeg exits.
    parts.push(`${mus}[aout]`);
    aLabel = "aout";
  } else if (voiceLabel && mus) {
    if (musicDuck) {
      // duck the bed under the narration: voice = sidechain key, music is
      // compressed only while the voice speaks, then releases smoothly.
      // sidechaincompress ends at its SHORTEST input, so pad the (short) key
      // out to videoDur first or the music lane would be truncated to voice length.
      parts.push(`[${voiceLabel}]asplit=2[vMain][vKeyRaw]`);
      parts.push(`${mus}[musL]`);
      parts.push(`[vKeyRaw]apad=whole_dur=${videoDur.toFixed(3)}[vKey]`);
      parts.push(`[musL][vKey]sidechaincompress=threshold=0.02:ratio=12:attack=25:release=450[musDucked]`);
      parts.push(`[vMain][musDucked]amix=inputs=2:duration=longest:dropout_transition=2[aMix]`);
    } else {
      // longest (not first): music keeps playing to the end of the VIDEO even
      // when the voice lane stops earlier (xfade-padded tail stays scored).
      parts.push(`${mus}[mus];[${voiceLabel}][mus]amix=inputs=2:duration=longest:dropout_transition=2[aMix]`);
    }
    aLabel = "aMix";
  } else {
    aLabel = voiceLabel;
  }

  // loudness-normalise the final mix to web/YouTube standard (-16 LUFS)
  if (loudnorm) {
    parts.push(`[${aLabel}]loudnorm=I=-16:TP=-1.5:LRA=11[aFin]`);
    aLabel = "aFin";
  }

  args.push(
    "-filter_complex", parts.join(";"),
    "-map", "[vout]", "-map", `[${aLabel}]`,
    "-c:v", "libx264", "-preset", "medium", "-crf", "20", "-pix_fmt", "yuv420p",
    "-c:a", "aac", "-b:a", "160k",
    "-movflags", "+faststart",
    outFile
  );

  await run(ffmpegPath(), args, { cwd: workDir });
  return outFile;
}
