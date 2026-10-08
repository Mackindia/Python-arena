export type PromptCategory = "science" | "sports" | "cultural" | "exam" | "generic";

export type PromptPreset = { label: string; prompt: string };

export const BACKGROUND_PROMPT_PRESETS: Record<PromptCategory, PromptPreset[]> = {
  science: [
    {
      label: "Lab glow",
      prompt:
        "glowing beakers and test tubes on a dark laboratory bench, floating molecular models, soft cyan and violet light streaks, shallow depth of field",
    },
    {
      label: "Robotics & code",
      prompt:
        "futuristic robotics workshop, circuit board traces glowing teal, holographic gear and node diagram silhouettes, deep navy background",
    },
    {
      label: "Space & rockets",
      prompt:
        "deep space nebula in indigo and magenta, distant planets, a rocket exhaust trail arcing across the frame, subtle star field",
    },
  ],
  sports: [
    {
      label: "Stadium night",
      prompt:
        "floodlit stadium at night, empty track lanes in the foreground, dramatic light beams through mist, crimson and amber palette",
    },
    {
      label: "Motion energy",
      prompt:
        "abstract athletic motion light trails, dust particles kicked up from a running track, bold orange and charcoal palette, high contrast",
    },
    {
      label: "Cricket action",
      prompt:
        "evening cricket ground, blurred floodlights and green turf, dynamic speed lines and glowing ball trail, teal and gold palette",
    },
  ],
  cultural: [
    {
      label: "Festival lights",
      prompt:
        "warm festival bokeh lights, marigold petals falling, rangoli inspired mandala pattern softly glowing at the edges, magenta and gold",
    },
    {
      label: "Stage & dance",
      prompt:
        "theatre stage with rich red curtains and golden spotlights, confetti and sparkle particles in the air, cinematic warm tones",
    },
    {
      label: "Folk art",
      prompt:
        "indian folk art inspired backdrop, hand painted floral borders, earthy terracotta and indigo palette, textured handmade paper feel",
    },
  ],
  exam: [
    {
      label: "Calm study",
      prompt:
        "calm study desk atmosphere from above, open notebooks and pencils softly out of focus, warm desk lamp glow, muted teal palette",
    },
    {
      label: "Focus grid",
      prompt:
        "minimal geometric grid fading into darkness, a single bright path line leading forward, cool blue and slate palette, lots of clear middle space",
    },
    {
      label: "Morning motivation",
      prompt:
        "sunrise through a classroom window casting long soft shadows, floating dust motes, hopeful amber and blue gradient",
    },
  ],
  generic: [
    {
      label: "Confetti modern",
      prompt:
        "modern gradient waves in blue and cyan with soft confetti bokeh, gentle light rays, clean and celebratory",
    },
    {
      label: "Elegant invite",
      prompt:
        "elegant dark navy backdrop with delicate gold particle dust and soft vignette, premium invitation card feel",
    },
    {
      label: "Campus energy",
      prompt:
        "abstract campus architecture silhouettes at dusk, warm window lights, playful geometric shapes, teal and coral palette",
    },
  ],
};

export function isPromptCategory(value: unknown): value is PromptCategory {
  return value === "science" || value === "sports" || value === "cultural" || value === "exam" || value === "generic";
}
