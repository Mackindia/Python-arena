import type { PosterCategory, PosterEvent } from "./poster";

const HASHTAGS: Record<PosterCategory, string[]> = {
  science: ["#ScienceExpo", "#Innovation", "#STEM", "#Students", "#Learning"],
  sports: ["#SportsDay", "#Cricket", "#SchoolSports", "#Champions", "#TeamSpirit"],
  cultural: ["#CulturalFest", "#Music", "#Dance", "#SchoolLife", "#Celebration"],
  exam: ["#Exams", "#ExamPrep", "#Students", "#AllTheBest", "#Results"],
  generic: ["#SchoolEvent", "#CampusLife", "#Community", "#Students", "#Event"],
};

const OPENERS: Record<PosterCategory, string> = {
  science: "Get ready to explore, experiment, and be inspired!",
  sports: "The action is about to begin!",
  cultural: "An evening of art, colour, and celebration!",
  exam: "Preparation meets opportunity.",
  generic: "Save the date!",
};

export function buildCaption(event: PosterEvent): { caption: string; hashtags: string[] } {
  const category: PosterCategory =
    event.category && OPENERS[event.category] ? event.category : "generic";
  const hashtags = [...HASHTAGS[category]];
  if (event.title && hashtags.length < 7) {
    const firstWord = event.title.split(/\s+/).find((w) => w.length > 3);
    if (firstWord) {
      const tag = `#${firstWord.replace(/[^a-zA-Z0-9]/g, "")}`;
      if (tag.length > 4 && !hashtags.some((h) => h.toLowerCase() === tag.toLowerCase())) {
        hashtags.push(tag);
      }
    }
  }

  const lines: string[] = [`${OPENERS[category]}`, ""];
  if (event.date) lines.push(`📅 ${event.date}`);
  if (event.venue) lines.push(`📍 ${event.venue}`);
  if (event.tagline) lines.push("", `✨ ${event.tagline}`);
  lines.push("", "Follow us for updates!", "", hashtags.join(" "));

  return { caption: lines.join("\n"), hashtags };
}
