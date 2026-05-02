export default function MarqueeBar() {
  const items = [
    "Interactive Notes",
    "Python Programs",
    "AI Tutor",
    "Practice MCQs",
    "Class XI",
    "CBSE Aligned",
    "Smart Learning",
    "Chapter Guidance",
    "Code & Output",
    "Exam Ready",
  ];

  const text = items.join("  ·  ") + "  ·  ";

  return (
    <div className="overflow-hidden border-y border-[rgba(255,255,255,0.07)] py-3">
      <div className="flex animate-marquee whitespace-nowrap">
        {[...Array(4)].map((_, i) => (
          <span
            key={i}
            className="shrink-0 font-mono text-[10px] uppercase tracking-[0.22em] text-ink-400"
          >
            {text}
          </span>
        ))}
      </div>
    </div>
  );
}
