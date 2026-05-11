type LessonContentRendererProps = {
  content: string;
};

type ContentBlock =
  | { type: "heading"; text: string; level: 2 | 3 }
  | { type: "paragraph"; text: string }
  | { type: "list"; items: string[] };

function looksLikeHeading(text: string): boolean {
  const normalized = text.trim();
  if (!normalized) {
    return false;
  }

  if (normalized.length > 90) {
    return false;
  }

  const numberedHeading = /^(chapter|section|unit)?\s*\d+[\.:\)-]?\s+[a-z0-9]/i.test(normalized);
  if (numberedHeading) {
    return true;
  }

  const titleCaseHeading = /^[A-Z][A-Za-z0-9\s:,&'()/-]{2,}$/.test(normalized) && !/[.!?]$/.test(normalized);
  if (titleCaseHeading && normalized.split(/\s+/).length <= 10) {
    return true;
  }

  const uppercaseWords = normalized.replace(/[^A-Za-z]/g, "");
  if (uppercaseWords && uppercaseWords === uppercaseWords.toUpperCase() && normalized.split(/\s+/).length <= 8) {
    return true;
  }

  return false;
}

function parseBlocks(content: string): ContentBlock[] {
  const blocks = content
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean);

  return blocks.map((block) => {
    const lines = block.split("\n").map((line) => line.trim()).filter(Boolean);

    const listItems = lines
      .filter((line) => /^([-*•]|\d+[.)])\s+/.test(line))
      .map((line) => line.replace(/^([-*•]|\d+[.)])\s+/, "").trim())
      .filter(Boolean);

    if (listItems.length >= 2 && listItems.length === lines.length) {
      return { type: "list", items: listItems } satisfies ContentBlock;
    }

    if (lines.length === 1 && looksLikeHeading(lines[0])) {
      const headingLevel: 2 | 3 = /^\d+[\.:\)-]/.test(lines[0]) ? 3 : 2;
      return { type: "heading", text: lines[0], level: headingLevel } satisfies ContentBlock;
    }

    return {
      type: "paragraph",
      text: lines.join("\n"),
    } satisfies ContentBlock;
  });
}

export default function LessonContentRenderer({ content }: LessonContentRendererProps) {
  const trimmed = content.trim();

  if (!trimmed) {
    return (
      <div className="rounded-2xl border border-white/10 bg-slate-950/50 p-5 text-sm text-slate-400">
        No extracted lesson content available yet.
      </div>
    );
  }

  const blocks = parseBlocks(trimmed);

  return (
    <article className="rounded-2xl border border-white/10 bg-slate-950/50 p-5 sm:p-6 lg:p-8">
      <div className="mb-6 border-b border-white/10 pb-4">
        <h2 className="text-lg font-semibold tracking-wide text-cyan-100 sm:text-xl">Structured Lesson Content</h2>
        <p className="mt-1 text-xs text-slate-400 sm:text-sm">Generated from uploaded PDF text with preserved reading flow.</p>
      </div>

      <div className="space-y-4 text-slate-200">
        {blocks.map((block, index) => {
          if (block.type === "heading") {
            return block.level === 2 ? (
              <h3 key={`heading-${index}`} className="pt-2 text-xl font-semibold leading-snug text-white sm:text-2xl">
                {block.text}
              </h3>
            ) : (
              <h4 key={`heading-${index}`} className="pt-2 text-lg font-semibold leading-snug text-cyan-100 sm:text-xl">
                {block.text}
              </h4>
            );
          }

          if (block.type === "list") {
            return (
              <ul key={`list-${index}`} className="list-disc space-y-1 pl-5 text-[15px] leading-7 text-slate-200 sm:text-base">
                {block.items.map((item, itemIndex) => (
                  <li key={`list-item-${index}-${itemIndex}`}>{item}</li>
                ))}
              </ul>
            );
          }

          return (
            <p
              key={`paragraph-${index}`}
              className="whitespace-pre-line text-[15px] leading-7 text-slate-200 sm:text-base sm:leading-8"
            >
              {block.text}
            </p>
          );
        })}
      </div>
    </article>
  );
}
