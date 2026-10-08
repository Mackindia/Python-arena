import { renderPoster, type PosterEvent } from "./poster";
import { buildCaption } from "./caption";
import { uploadBufferToCloudinary } from "@/lib/cloudinary";
import { generateAiBackground } from "./aiBackground";

export type PostGraphics = "svg" | "ai";

export type GeneratedPost = {
  imageUrl: string;
  imagePublicId: string;
  caption: string;
  hashtags: string[];
  graphics: PostGraphics;
};

export type GenerateOptions = {
  aiBackground?: boolean;
  backgroundPrompt?: string;
};

export async function generateEventPost(
  event: PosterEvent,
  options: GenerateOptions = {},
): Promise<GeneratedPost> {
  let background: Buffer | null = null;
  let graphics: PostGraphics = "svg";

  if (options.aiBackground) {
    const ai = await generateAiBackground(event.category || "generic", {
      seed: event.seed,
      prompt: options.backgroundPrompt,
    });
    if (ai) {
      background = ai.buffer;
      graphics = "ai";
    }
  }

  const buffer = await renderPoster(event, { background });

  const upload = await uploadBufferToCloudinary(buffer, {
    folder: "social_posts",
    resource_type: "image",
  });

  const { caption, hashtags } = buildCaption(event);

  return {
    imageUrl: upload.secure_url,
    imagePublicId: upload.public_id,
    caption,
    hashtags,
    graphics,
  };
}
