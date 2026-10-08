import sharp from "sharp";

export type PosterCategory = "science" | "sports" | "cultural" | "exam" | "generic";

export type PosterEvent = {
  title: string;
  date?: string;
  venue?: string;
  category?: PosterCategory;
  tagline?: string;
  seed?: number;
  brand?: string;
};

export type PosterRenderOptions = {
  background?: Buffer | null;
};

const W = 1080;
const H = 1080;
const M = 72;

const PALETTES: Record<PosterCategory, string[]> = {
  science: ["#071a49", "#312e81", "#7c3aed", "#22d3ee"],
  sports: ["#4c0519", "#b91c1c", "#f97316", "#fde047"],
  cultural: ["#4a044e", "#be185d", "#f59e0b", "#f0abfc"],
  exam: ["#022c22", "#0f766e", "#1e293b", "#5eead4"],
  generic: ["#0b1120", "#1d4ed8", "#0891b2", "#a5f3fc"],
};

const CATEGORY_LABEL: Record<PosterCategory, string> = {
  science: "SCIENCE & INNOVATION",
  sports: "SPORTS",
  cultural: "CULTURAL",
  exam: "EXAMINATION",
  generic: "EVENT",
};

const ICON_PATHS: Record<PosterCategory, string> = {
  science:
    "M9 3h6 M10 3v6.5 L4.8 18.6A2.2 2.2 0 0 0 6.7 22h10.6a2.2 2.2 0 0 0 1.9-3.4L14 9.5V3 M7.6 14h8.8 M9.5 17.5h.01 M14 17h.01",
  sports:
    "M7 4h10v4a5 5 0 0 1-10 0V4z M7 6H4.5a2.5 2.5 0 0 0 2.5 4.5 M17 6h2.5a2.5 2.5 0 0 1-2.5 4.5 M10 13.5h4 M12 13.5V17 M9 21h6 M12 17v4",
  cultural:
    "M9 18V6.5l11-2.2V16 M9 18a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0z M20 16a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0z M9 10l11-2.2",
  exam:
    "M6 3h9l4 4v14H6V3z M15 3v4h4 M9 12h7 M9 16h7 M9 8h3",
  generic: "M12 3.5l2.6 5.4 5.9.8-4.3 4.1 1 5.9L12 16.9 6.8 19.7l1-5.9L3.5 9.7l5.9-.8L12 3.5z",
};

function hashString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

const ADVANCE: Record<string, number> = {
  A: 722, B: 722, C: 722, D: 722, E: 667, F: 611, G: 778, H: 722, I: 278, J: 556,
  K: 722, L: 611, M: 833, N: 722, O: 778, P: 667, Q: 778, R: 722, S: 667, T: 611,
  U: 722, V: 667, W: 944, X: 667, Y: 667, Z: 611,
  "0": 556, "1": 556, "2": 556, "3": 556, "4": 556, "5": 556, "6": 556, "7": 556,
  "8": 556, "9": 556, " ": 278, ",": 278, ".": 278, "-": 333, ":": 333, "/": 278,
  "'": 238, "!": 333, "?": 611, "&": 722, "(": 333, ")": 333, "+": 584, "%": 889,
};

function measureText(text: string, fontPx: number): number {
  let units = 0;
  for (const ch of text.toUpperCase()) {
    units += ADVANCE[ch] ?? 620;
  }
  return (units / 1000) * fontPx;
}

function measureTracked(text: string, fontPx: number, tracking: number): number {
  return measureText(text, fontPx) + text.length * tracking;
}

function wrapText(text: string, fontPx: number, maxW: number): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let cur = "";
  for (const w of words) {
    const t = cur ? `${cur} ${w}` : w;
    if (measureText(t, fontPx) <= maxW) {
      cur = t;
    } else {
      if (cur) lines.push(cur);
      cur = w;
    }
  }
  if (cur) lines.push(cur);
  return lines;
}

function fitTitle(title: string): { size: number; lines: string[] } {
  const maxW = W - 200;
  const upper = title.toUpperCase().trim();
  for (let size = 104; size >= 44; size -= 4) {
    const lines = wrapText(upper, size, maxW);
    if (lines.length <= 3 && lines.every((l) => measureText(l, size) <= maxW)) {
      return { size, lines };
    }
  }
  const lines = wrapText(upper, 44, maxW).slice(0, 4);
  return { size: 44, lines };
}

function starPath(cx: number, cy: number, outer: number, points = 5): string {
  const inner = outer * 0.42;
  let d = "";
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? outer : inner;
    const angle = (Math.PI / points) * i - Math.PI / 2;
    const x = (cx + Math.cos(angle) * r).toFixed(1);
    const y = (cy + Math.sin(angle) * r).toFixed(1);
    d += `${i === 0 ? "M" : "L"}${x} ${y} `;
  }
  return d + "Z";
}

function iconGroup(category: PosterCategory, cx: number, cy: number, size: number, color: string): string {
  const scale = size / 24;
  const x = (cx - size / 2).toFixed(1);
  const y = (cy - size / 2).toFixed(1);
  return `<g transform="translate(${x} ${y}) scale(${scale.toFixed(3)})" fill="none" stroke="${color}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="${ICON_PATHS[category]}"/></g>`;
}

function confetti(seedBase: number, rand: () => number, palette: string[]): string {
  const pieces: string[] = [];
  const colors = ["#ffffff", palette[3], palette[2], "#ffffff"];
  let guard = 0;
  while (pieces.length < 34 && guard < 400) {
    guard++;
    const x = 60 + rand() * (W - 120);
    const y = 60 + rand() * (H - 120);
    const inTitleBand = y > 320 && y < 720;
    const inTopBand = y < 235 && x < 645;
    const inVenueBand = y > 900;
    if (inTitleBand || inTopBand || inVenueBand) continue;
    const color = colors[Math.floor(rand() * colors.length)];
    const opacity = (0.35 + rand() * 0.5).toFixed(2);
    const rot = Math.floor(rand() * 360);
    const kind = Math.floor(rand() * 4);
    const cx = x.toFixed(0);
    const cy = y.toFixed(0);
    if (kind === 0) {
      const r = (5 + rand() * 8).toFixed(1);
      pieces.push(`<circle cx="${cx}" cy="${cy}" r="${r}" fill="${color}" opacity="${opacity}"/>`);
    } else if (kind === 1) {
      const s = (8 + rand() * 14).toFixed(1);
      pieces.push(
        `<rect x="${cx}" y="${cy}" width="${s}" height="${(Number(s) * 0.45).toFixed(1)}" rx="3" fill="${color}" opacity="${opacity}" transform="rotate(${rot} ${cx} ${cy})"/>`,
      );
    } else if (kind === 2) {
      const s = (7 + rand() * 9).toFixed(1);
      pieces.push(
        `<path d="M${cx} ${cy} l${s} 0 l-${Number(s) / 2} -${(Number(s) * 0.9).toFixed(1)} Z" fill="${color}" opacity="${opacity}" transform="rotate(${rot} ${cx} ${cy})"/>`,
      );
    } else {
      const r = (7 + rand() * 6).toFixed(1);
      pieces.push(
        `<path d="${starPath(Number(cx), Number(cy), Number(r))}" fill="${color}" opacity="${opacity}" transform="rotate(${rot} ${cx} ${cy})"/>`,
      );
    }
  }
  void seedBase;
  return pieces.join("");
}

function decorativeRays(rand: () => number): string {
  const cx = W / 2;
  const cy = 470;
  const rays: string[] = [];
  const count = 22;
  const start = rand() * 30;
  for (let i = 0; i < count; i++) {
    const a = ((Math.PI * 2) / count) * i + start;
    const x1 = cx + Math.cos(a) * 150;
    const y1 = cy + Math.sin(a) * 150;
    const x2 = cx + Math.cos(a) * (520 + rand() * 120);
    const y2 = cy + Math.sin(a) * (520 + rand() * 120);
    rays.push(
      `<line x1="${x1.toFixed(0)}" y1="${y1.toFixed(0)}" x2="${x2.toFixed(0)}" y2="${y2.toFixed(0)}" stroke="#ffffff" stroke-width="${(1 + rand() * 2).toFixed(1)}" opacity="0.05"/>`,
    );
  }
  return rays.join("");
}

function blobs(rand: () => number, palette: string[]): string {
  const specs = [
    { cx: 140, cy: 160, rx: 300, ry: 240, c: palette[3], o: 0.32 },
    { cx: 940, cy: 260, rx: 260, ry: 300, c: palette[2], o: 0.35 },
    { cx: 880, cy: 940, rx: 320, ry: 260, c: palette[3], o: 0.22 },
    { cx: 220, cy: 900, rx: 280, ry: 240, c: palette[2], o: 0.28 },
  ];
  return specs
    .map(
      (s) =>
        `<ellipse cx="${s.cx}" cy="${s.cy}" rx="${(s.rx * (0.85 + rand() * 0.3)).toFixed(0)}" ry="${(s.ry * (0.85 + rand() * 0.3)).toFixed(0)}" fill="${s.c}" opacity="${s.o}" filter="url(#soft)"/>`,
    )
    .join("");
}

function cornerFlourish(x: number, y: number, sx: number, sy: number): string {
  const d = `M ${x} ${y + 70 * sy} Q ${x} ${y} ${x + 70 * sx} ${y} M ${x + 14 * sx} ${y + 84 * sy} Q ${x + 14 * sx} ${y + 14 * sy} ${x + 84 * sx} ${y + 14 * sy}`;
  return `<path d="${d}" fill="none" stroke="#ffffff" stroke-width="2.5" opacity="0.35" stroke-linecap="round"/>`;
}

function datePillMetrics(dateText: string): { x: number; w: number; h: number; y: number; font: number } {
  let font = 30;
  const maxW = 640;
  while (measureTracked(dateText, font, 2) + 76 > maxW && font > 17) font -= 1;
  const w = Math.min(maxW, Math.round(measureTracked(dateText, font, 2)) + 76);
  return { x: W - M - w, w, h: 62, y: 76, font };
}

function datePill(dateText: string, palette: string[]): string {
  const { x, w, h, y, font } = datePillMetrics(dateText);
  return `<g>
    <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${h / 2}" fill="#ffffff" opacity="0.95"/>
    <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${h / 2}" fill="none" stroke="${palette[3]}" stroke-width="3" opacity="0.9"/>
    <text x="${x + w / 2}" y="${y + h / 2 + font * 0.35}" font-family="Arial, Helvetica, sans-serif" font-size="${font}" font-weight="bold" fill="${palette[0]}" text-anchor="middle" letter-spacing="2">${escapeXml(dateText)}</text>
  </g>`;
}

function badge(category: PosterCategory, available: number): string {
  const cx = 132;
  const cy = 118;
  const label = CATEGORY_LABEL[category];
  let font = 23;
  while (measureTracked(label, font, 5) > available && font > 14) font -= 1;
  const labelW = Math.round(measureTracked(label, font, 5));
  return `<g>
    <circle cx="${cx}" cy="${cy}" r="46" fill="#ffffff" opacity="0.14"/>
    <circle cx="${cx}" cy="${cy}" r="46" fill="none" stroke="#ffffff" stroke-width="2" opacity="0.55"/>
    ${iconGroup(category, cx, cy, 46, "#ffffff")}
    <text x="${cx + 66}" y="${cy - 4}" font-family="Arial, Helvetica, sans-serif" font-size="${font}" font-weight="bold" fill="#ffffff" opacity="0.92" letter-spacing="5">${escapeXml(label)}</text>
    <rect x="${cx + 66}" y="${cy + 12}" width="${Math.max(60, labelW)}" height="3" rx="1.5" fill="#ffffff" opacity="0.5"/>
    <rect x="${cx + 66}" y="${cy + 12}" width="${Math.max(24, Math.round(labelW * 0.35))}" height="3" rx="1.5" fill="${PALETTES[category][3]}"/>
  </g>`;
}

function venueBar(venue: string): string {
  const text = venue.toUpperCase();
  let font = 25;
  while (measureTracked(text, font, 3) + 130 > W - M * 2 && font > 15) font -= 1;
  const w = Math.round(measureTracked(text, font, 3)) + 130;
  const x = (W - w) / 2;
  const y = H - 158;
  const h = 64;
  return `<g>
    <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${h / 2}" fill="#ffffff" opacity="0.12"/>
    <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${h / 2}" fill="none" stroke="#ffffff" stroke-width="1.5" opacity="0.4"/>
    <g transform="translate(${x + 34} ${y + h / 2 - 13})" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M12 1.5c-4 0-7 3-7 6.8C5 13 12 22 12 22s7-9 7-13.7c0-3.8-3-6.8-7-6.8z"/>
      <circle cx="12" cy="8.3" r="2.6"/>
    </g>
    <text x="${x + 72}" y="${y + h / 2 + font * 0.35}" font-family="Arial, Helvetica, sans-serif" font-size="${font}" font-weight="bold" fill="#ffffff" letter-spacing="3" opacity="0.95">${escapeXml(text)}</text>
  </g>`;
}

function ornament(y: number, color: string): string {
  const half = 190;
  const cx = W / 2;
  return `<g opacity="0.9">
    <rect x="${cx - half - 60}" y="${y}" width="${half}" height="3" rx="1.5" fill="#ffffff" opacity="0.55"/>
    <rect x="${cx + 60}" y="${y}" width="${half}" height="3" rx="1.5" fill="#ffffff" opacity="0.55"/>
    <path d="${starPath(cx, y + 1.5, 14, 4)}" fill="${color}"/>
    <path d="${starPath(cx, y + 1.5, 7, 4)}" fill="#ffffff"/>
  </g>`;
}

function starsRow(y: number): string {
  const out: string[] = [];
  for (let i = 0; i < 5; i++) {
    const cx = W / 2 - 68 + i * 34;
    out.push(`<path d="${starPath(cx, y, 11)}" fill="#ffffff" opacity="${i === 2 ? 0.95 : 0.6}"/>`);
  }
  return `<g>${out.join("")}</g>`;
}

function brandLine(brand: string, y: number): string {
  return `<text x="${W / 2}" y="${y}" font-family="Arial, Helvetica, sans-serif" font-size="22" font-weight="bold" fill="#ffffff" opacity="0.7" text-anchor="middle" letter-spacing="8">${escapeXml(brand.toUpperCase())}</text>`;
}

export function buildPosterSvg(event: PosterEvent, options: { overlay?: boolean } = {}): string {
  const category: PosterCategory =
    event.category && PALETTES[event.category] ? event.category : "generic";
  const palette = PALETTES[category];
  const overlay = options.overlay === true;

  const seedBase = (hashString((event.title || "event").toLowerCase()) ^ (event.seed ?? 0)) >>> 0;
  const rand = mulberry32(seedBase);

  const title = fitTitle(event.title || "Event");
  const lineGap = Math.round(title.size * 1.12);
  const blockHeight = (title.lines.length - 1) * lineGap;
  const titleCenter = 470;
  const firstBaseline = titleCenter - blockHeight / 2 + title.size * 0.34;

  const dateText = (event.date || "").toUpperCase().trim();
  const tagline = (event.tagline || "").trim().toUpperCase();
  const venue = (event.venue || "").trim().toUpperCase();
  const brand = (event.brand || "").trim();

  const dividerY = Math.round(firstBaseline + (title.lines.length - 1) * lineGap + 54);
  const taglineY = dividerY + 58;
  const showTagline = tagline.length > 0 && taglineY < 840;
  const accent = palette[3];

  const pill = dateText ? datePillMetrics(dateText) : null;
  const badgeAvailable = Math.max(200, (pill ? pill.x : W - M) - 198 - 40);

  let taglineFont = 29;
  while (showTagline && measureTracked(tagline, taglineFont, 4) > W - M * 2 && taglineFont > 15) {
    taglineFont -= 1;
  }

  const titleLines = title.lines
    .map(
      (line, i) =>
        `<text x="${W / 2}" y="${Math.round(firstBaseline + i * lineGap)}" font-family="Arial, Helvetica, sans-serif" font-size="${title.size}" font-weight="bold" fill="url(#titleGrad)" text-anchor="middle" letter-spacing="1.5" filter="url(#titleShadow)">${escapeXml(line)}</text>`,
    )
    .join("");

  const background = overlay
    ? `<rect width="${W}" height="${H}" fill="url(#scrim)"/>
  <rect width="${W}" height="${H}" fill="url(#vig)"/>`
    : `<rect width="${W}" height="${H}" fill="url(#bg)"/>
  ${decorativeRays(rand)}
  ${blobs(rand, palette)}
  <rect width="${W}" height="${H}" fill="url(#vig)"/>
  <rect width="${W}" height="${H}" filter="url(#grain)" opacity="0.06"/>`;

  return `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${palette[0]}"/>
      <stop offset="0.55" stop-color="${palette[1]}"/>
      <stop offset="1" stop-color="${palette[2]}"/>
    </linearGradient>
    <linearGradient id="titleGrad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#ffffff"/>
      <stop offset="1" stop-color="${accent}"/>
    </linearGradient>
    <linearGradient id="scrim" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#020617" stop-opacity="0.82"/>
      <stop offset="0.45" stop-color="#020617" stop-opacity="0.55"/>
      <stop offset="1" stop-color="#020617" stop-opacity="0.86"/>
    </linearGradient>
    <radialGradient id="vig" cx="0.5" cy="0.5" r="0.78">
      <stop offset="0.55" stop-color="#000000" stop-opacity="0"/>
      <stop offset="1" stop-color="#000000" stop-opacity="0.45"/>
    </radialGradient>
    <radialGradient id="halo" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0" stop-color="${accent}" stop-opacity="0.35"/>
      <stop offset="1" stop-color="${accent}" stop-opacity="0"/>
    </radialGradient>
    <filter id="soft" x="-60%" y="-60%" width="220%" height="220%">
      <feGaussianBlur stdDeviation="70"/>
    </filter>
    <filter id="titleShadow" x="-25%" y="-40%" width="150%" height="190%">
      <feDropShadow dx="0" dy="7" stdDeviation="12" flood-color="#000000" flood-opacity="0.5"/>
    </filter>
    <filter id="grain">
      <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="3" stitchTiles="stitch"/>
      <feColorMatrix type="saturate" values="0"/>
    </filter>
  </defs>
  ${background}
  <ellipse cx="${W / 2}" cy="${titleCenter}" rx="430" ry="300" fill="url(#halo)"/>
  ${confetti(seedBase, rand, palette)}
  <rect x="40" y="40" width="${W - 80}" height="${H - 80}" rx="46" fill="none" stroke="#ffffff" stroke-width="2.5" opacity="0.35"/>
  <rect x="58" y="58" width="${W - 116}" height="${H - 116}" rx="34" fill="none" stroke="#ffffff" stroke-width="2" stroke-dasharray="2 11" opacity="0.4"/>
  ${cornerFlourish(40, 40, 1, 1)}
  ${cornerFlourish(W - 40, 40, -1, 1)}
  ${cornerFlourish(40, H - 40, 1, -1)}
  ${cornerFlourish(W - 40, H - 40, -1, -1)}
  ${badge(category, badgeAvailable)}
  ${dateText ? datePill(dateText, palette) : ""}
  ${titleLines}
  ${ornament(dividerY, accent)}
  ${
    showTagline
      ? `<text x="${W / 2}" y="${taglineY}" font-family="Arial, Helvetica, sans-serif" font-size="${taglineFont}" font-weight="bold" fill="#ffffff" opacity="0.9" text-anchor="middle" letter-spacing="4">${escapeXml(tagline)}</text>`
      : ""
  }
  ${venue ? "" : starsRow(878)}
  ${venue ? venueBar(venue) : ""}
  ${brand ? brandLine(brand, H - 74) : ""}
</svg>`;
}

export async function renderPoster(
  event: PosterEvent,
  options: PosterRenderOptions = {},
): Promise<Buffer> {
  const svg = buildPosterSvg(event, { overlay: Boolean(options.background) });

  if (options.background) {
    return sharp(options.background)
      .resize(W, H, { fit: "cover", position: "attention" })
      .composite([{ input: Buffer.from(svg), top: 0, left: 0 }])
      .jpeg({ quality: 90, mozjpeg: true })
      .toBuffer();
  }

  return sharp(Buffer.from(svg)).jpeg({ quality: 90, mozjpeg: true }).toBuffer();
}
