import { MsEdgeTTS, OUTPUT_FORMAT } from "msedge-tts";

export async function synthesize(text, outDir, { voice = process.env.TTS_VOICE || "en-US-AriaNeural", name = "scene" } = {}) {
  const tts = new MsEdgeTTS();
  await tts.setMetadata(voice, OUTPUT_FORMAT.AUDIO_24KHZ_96KBITRATE_MONO_MP3, { wordBoundaryEnabled: false });
  const { audioFilePath } = await tts.toFile(outDir, text);
  tts.close();
  return audioFilePath;
}
