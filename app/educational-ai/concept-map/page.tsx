"use client";

import { useMemo, useState } from "react";
import { generateEducationalConceptMap, type EducationalBookRecord } from "@/lib/educational-ai";
import BookSelector from "@/src/components/educational-ai/BookSelector";

const NODE_STYLES: Record<string, { bg: string; border: string; text: string; glow: string; size: number }> = {
  core:       { bg: "#083344", border: "#06b6d4", text: "#ecfeff", glow: "#22d3ee", size: 24 },
  supporting: { bg: "#2e1065", border: "#8b5cf6", text: "#f5f3ff", glow: "#a78bfa", size: 18 },
  detail:     { bg: "#1e293b", border: "#64748b", text: "#e2e8f0", glow: "#94a3b8", size: 14 },
};

const EDGE_STYLES: Record<string, { color: string; width: number }> = {
  "requires":     { color: "#ef4444", width: 3 },
  "leads to":     { color: "#06b6d4", width: 3 },
  "is part of":   { color: "#8b5cf6", width: 2.5 },
  "contrasts with":{ color: "#f59e0b", width: 2.5 },
  "depends on":   { color: "#f97316", width: 2.5 },
  "involves":     { color: "#10b981", width: 2.5 },
  "uses":         { color: "#3b82f6", width: 2 },
  "applies":      { color: "#22c55e", width: 2 },
  "relates to":   { color: "#94a3b8", width: 2 },
  "builds on":    { color: "#e879f9", width: 2.5 },
  "contains":     { color: "#fbbf24", width: 2 },
  "implements":   { color: "#34d399", width: 2 },
};

function getEdgeStyle(rel: string) {
  const lower = rel.toLowerCase();
  for (const [key, style] of Object.entries(EDGE_STYLES)) {
    if (lower.includes(key)) return style;
  }
  return { color: "#64748b", width: 2 };
}

function ConceptGraph({ nodes, edges }: { nodes: any[]; edges: any[] }) {
  const nodeW = 180;
  const nodeH = 64;
  const svgW = 960;
  const svgH = 600;
  const pad = 40;

  const positions = useMemo(() => {
    const pos: Record<string, { x: number; y: number }> = {};
    const cx = svgW / 2;
    const cy = svgH / 2;

    const coreNodes = nodes.filter((n) => n.importance === "core");
    const supNodes = nodes.filter((n) => n.importance === "supporting");
    const detNodes = nodes.filter((n) => n.importance === "detail");

    coreNodes.forEach((n, i) => {
      const angle = (i / Math.max(coreNodes.length, 1)) * Math.PI * 2 - Math.PI / 2;
      pos[n.id] = { x: cx + Math.cos(angle) * 110 - nodeW / 2, y: cy + Math.sin(angle) * 90 - nodeH / 2 };
    });
    supNodes.forEach((n, i) => {
      const angle = (i / Math.max(supNodes.length, 1)) * Math.PI * 2 + 0.3;
      pos[n.id] = { x: cx + Math.cos(angle) * 280 - nodeW / 2, y: cy + Math.sin(angle) * 200 - nodeH / 2 };
    });
    detNodes.forEach((n, i) => {
      const angle = (i / Math.max(detNodes.length, 1)) * Math.PI * 2 + 0.7;
      pos[n.id] = { x: cx + Math.cos(angle) * 400 - nodeW / 2, y: cy + Math.sin(angle) * 260 - nodeH / 2 };
    });
    return pos;
  }, [nodes]);

  return (
    <svg viewBox={`0 0 ${svgW} ${svgH}`} className="w-full rounded-2xl border-2 border-slate-700 bg-[#0a0e1a]" style={{ maxHeight: 560 }}>
      <defs>
        {Object.entries(EDGE_STYLES).map(([key, s]) => (
          <marker key={key} id={`arr-${key.replace(/\s+/g, "-")}`} viewBox="0 0 12 12" refX="11" refY="6" markerWidth="10" markerHeight="10" orient="auto-start-reverse">
            <path d="M 0 1 L 12 6 L 0 11 z" fill={s.color} />
          </marker>
        ))}
        <marker id="arr-default" viewBox="0 0 12 12" refX="11" refY="6" markerWidth="10" markerHeight="10" orient="auto-start-reverse">
          <path d="M 0 1 L 12 6 L 0 11 z" fill="#64748b" />
        </marker>
        <filter id="nodeGlow">
          <feGaussianBlur stdDeviation="6" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        <filter id="nodeShadow">
          <feDropShadow dx="0" dy="3" stdDeviation="6" floodColor="#000" floodOpacity="0.5" />
        </filter>
        {Object.values(NODE_STYLES).map((s, i) => (
          <radialGradient key={i} id={`grad-${i}`} cx="30%" cy="30%">
            <stop offset="0%" stopColor={s.border} stopOpacity="0.25" />
            <stop offset="100%" stopColor={s.bg} stopOpacity="1" />
          </radialGradient>
        ))}
      </defs>

      {/* Grid dots for background */}
      {Array.from({ length: 20 }).map((_, i) =>
        Array.from({ length: 13 }).map((_, j) => (
          <circle key={`${i}-${j}`} cx={i * 50 + 25} cy={j * 50 + 20} r="1" fill="#1e293b" />
        ))
      )}

      {/* Edges */}
      {edges.map((e, i) => {
        const s = positions[e.source];
        const t = positions[e.target];
        if (!s || !t) return null;
        const sx = s.x + nodeW / 2;
        const sy = s.y + nodeH / 2;
        const tx = t.x + nodeW / 2;
        const ty = t.y + nodeH / 2;
        const style = getEdgeStyle(e.relationship || "");
        const markerKey = Object.keys(EDGE_STYLES).find((k) => (e.relationship || "").toLowerCase().includes(k));
        const markerId = markerKey ? `arr-${markerKey.replace(/\s+/g, "-")}` : "arr-default";

        const mx = (sx + tx) / 2;
        const my = (sy + ty) / 2;
        const dx = tx - sx;
        const dy = ty - sy;
        const curve = 0.18;
        const cx1 = mx - dy * curve;
        const cy1 = my + dx * curve;

        return (
          <g key={i}>
            <path
              d={`M ${sx} ${sy} Q ${cx1} ${cy1} ${tx} ${ty}`}
              fill="none"
              stroke={style.color}
              strokeWidth={style.width}
              strokeOpacity="0.75"
              strokeDasharray={style.width < 2.5 ? "8 4" : "none"}
              markerEnd={`url(#${markerId})`}
            />
            <rect
              x={cx1 - 44}
              y={cy1 - 11}
              width="88"
              height="22"
              rx="6"
              fill="#0a0e1a"
              stroke={style.color}
              strokeWidth="1"
              strokeOpacity="0.4"
            />
            <text x={cx1} y={cy1 + 4} textAnchor="middle" fill={style.color} fontSize="10" fontWeight="700" letterSpacing="0.5">
              {e.relationship?.length > 14 ? e.relationship.slice(0, 12) + ".." : e.relationship}
            </text>
          </g>
        );
      })}

      {/* Nodes */}
      {nodes.map((n) => {
        const p = positions[n.id];
        if (!p) return null;
        const style = NODE_STYLES[n.importance] || NODE_STYLES.detail;
        const gradIdx = n.importance === "core" ? 0 : n.importance === "supporting" ? 1 : 2;
        const isCore = n.importance === "core";
        const fontSize = isCore ? 14 : 12;
        const label = n.label || "";
        const line1 = label.length > 22 ? label.slice(0, 20) : label;
        const line2 = label.length > 22 ? label.slice(20, 40) : "";

        return (
          <g key={n.id} filter="url(#nodeShadow)">
            {isCore && (
              <rect
                x={p.x - 4}
                y={p.y - 4}
                width={nodeW + 8}
                height={nodeH + 8}
                rx={20}
                fill="none"
                stroke={style.glow}
                strokeWidth="2"
                opacity="0.4"
                filter="url(#nodeGlow)"
              />
            )}
            <rect
              x={p.x}
              y={p.y}
              width={nodeW}
              height={nodeH}
              rx={isCore ? 18 : 14}
              fill={`url(#grad-${gradIdx})`}
              stroke={style.border}
              strokeWidth={isCore ? 3 : 2}
            />
            <text
              x={p.x + nodeW / 2}
              y={p.y + nodeH / 2 - (line2 ? 6 : 2)}
              textAnchor="middle"
              fill={style.text}
              fontSize={fontSize}
              fontWeight={isCore ? "800" : "600"}
              letterSpacing="0.3"
            >
              {line1}
            </text>
            {line2 && (
              <text
                x={p.x + nodeW / 2}
                y={p.y + nodeH / 2 + 12}
                textAnchor="middle"
                fill={style.text}
                fontSize="11"
                fontWeight="500"
                opacity="0.8"
              >
                {line2}
              </text>
            )}
            <text
              x={p.x + nodeW / 2}
              y={p.y + nodeH - 6}
              textAnchor="middle"
              fill={style.border}
              fontSize="8"
              fontWeight="600"
              opacity="0.7"
              letterSpacing="1"
            >
              {n.bloom_level?.toUpperCase()}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function Legend() {
  return (
    <div className="rounded-2xl border-2 border-slate-700 bg-[#0a0e1a] p-5">
      <h4 className="text-sm font-bold text-white uppercase tracking-widest mb-4">Legend</h4>

      <div className="grid gap-6 sm:grid-cols-2">
        {/* Node Types */}
        <div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Node Types</p>
          <div className="space-y-3">
            {Object.entries(NODE_STYLES).map(([key, s]) => (
              <div key={key} className="flex items-center gap-3">
                <div className="flex-shrink-0">
                  <svg width="44" height="32">
                    <rect x="1" y="1" width="42" height="30" rx="10" fill={s.bg} stroke={s.border} strokeWidth="2.5" />
                  </svg>
                </div>
                <div>
                  <span className="text-sm font-bold text-white capitalize">{key}</span>
                  <span className="ml-2 text-xs text-slate-500">
                    {key === "core" ? "— Main concepts, large & bright" : key === "supporting" ? "— Secondary ideas, medium" : "— Details, small & muted"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Edge Types */}
        <div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Edge Types (Line Color = Relationship)</p>
          <div className="space-y-2">
            {Object.entries(EDGE_STYLES).slice(0, 8).map(([key, s]) => (
              <div key={key} className="flex items-center gap-3">
                <svg width="50" height="12">
                  <line x1="0" y1="6" x2="40" y2="6" stroke={s.color} strokeWidth={s.width} />
                  <polygon points="40,2 50,6 40,10" fill={s.color} />
                </svg>
                <span className="text-sm font-semibold" style={{ color: s.color }}>{key}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ConceptMapPage() {
  const [classLevel, setClassLevel] = useState("");
  const [subject, setSubject] = useState("");
  const [topic, setTopic] = useState("");
  const [bookId, setBookId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [data, setData] = useState<any>(null);

  function handleSelectBook(book: EducationalBookRecord) {
    setBookId(book.book_id);
    setClassLevel(book.class_level);
    setSubject(book.subject);
  }

  async function onGenerate(e: React.FormEvent) {
    e.preventDefault();
    if (!classLevel || !subject || !topic) {
      setError("Please select a book and enter a topic.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const result = await generateEducationalConceptMap({
        class_level: classLevel,
        subject,
        topic,
        book_id: bookId || undefined,
      });
      setData(result.concept_map || result);
    } catch (err: any) {
      setError(err?.name === "AbortError" ? "Timed out." : err instanceof Error ? err.message : "Failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
      <h2 className="text-2xl font-semibold">Concept Map Builder</h2>
      <p className="mt-1 text-sm text-slate-400">Visualize topic relationships with color-coded nodes, labeled edges, and learning paths.</p>

      <form className="mt-4 grid gap-4 sm:grid-cols-3" onSubmit={onGenerate}>
        <BookSelector selectedBookId={bookId} onSelectBook={handleSelectBook} />
        <input value={classLevel} onChange={(e) => setClassLevel(e.target.value)} className="rounded-xl border border-white/10 bg-slate-950 px-3 py-2.5" placeholder="Class (auto-filled)" />
        <input value={subject} onChange={(e) => setSubject(e.target.value)} className="rounded-xl border border-white/10 bg-slate-950 px-3 py-2.5" placeholder="Subject (auto-filled)" />
        <input value={topic} onChange={(e) => setTopic(e.target.value)} className="rounded-xl border border-white/10 bg-slate-950 px-3 py-2.5" placeholder="Topic" required />
        <button disabled={loading} className="sm:col-span-3 rounded-xl bg-cyan-400 px-4 py-2.5 font-semibold text-slate-950 disabled:opacity-70">{loading ? "Building concept map..." : "Generate Concept Map"}</button>
      </form>

      {error ? <p className="mt-4 text-sm text-rose-300">{error}</p> : null}

      {data ? (
        <div className="mt-6 space-y-5">
          <Legend />

          {data.nodes?.length ? (
            <div className="rounded-2xl border-2 border-slate-700 bg-[#0a0e1a] p-5">
              <h4 className="font-bold text-white text-sm uppercase tracking-widest mb-4">Interactive Concept Map</h4>
              <ConceptGraph nodes={data.nodes || []} edges={data.edges || []} />
            </div>
          ) : null}

          {data.nodes?.length ? (
            <div className="rounded-2xl border-2 border-slate-700 bg-[#0a0e1a] p-5">
              <h4 className="font-bold text-white text-sm uppercase tracking-widest mb-4">All Concepts</h4>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {data.nodes.map((n: any) => {
                  const s = NODE_STYLES[n.importance] || NODE_STYLES.detail;
                  return (
                    <div key={n.id} className="rounded-xl border-2 p-4" style={{ borderColor: s.border + "66", background: s.bg + "cc" }}>
                      <div className="flex items-center gap-2">
                        <svg width="20" height="16"><rect x="1" y="1" width="18" height="14" rx="5" fill={s.border} /></svg>
                        <span className="font-bold text-white text-sm">{n.label}</span>
                      </div>
                      <p className="mt-2 text-xs text-slate-300">{n.description}</p>
                      <div className="mt-2 flex gap-2">
                        <span className="rounded-full px-2 py-0.5 text-xs font-bold uppercase" style={{ background: s.border + "33", color: s.border }}>{n.importance}</span>
                        <span className="rounded-full px-2 py-0.5 text-xs font-bold uppercase bg-white/10 text-slate-300">{n.bloom_level}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : null}

          {data.edges?.length ? (
            <div className="rounded-2xl border-2 border-slate-700 bg-[#0a0e1a] p-5">
              <h4 className="font-bold text-white text-sm uppercase tracking-widest mb-4">All Relationships</h4>
              <div className="space-y-3">
                {data.edges.map((e: any, i: number) => {
                  const style = getEdgeStyle(e.relationship || "");
                  const src = data.nodes?.find((n: any) => n.id === e.source);
                  const tgt = data.nodes?.find((n: any) => n.id === e.target);
                  return (
                    <div key={i} className="flex flex-wrap items-center gap-2 rounded-lg border border-white/10 bg-white/5 p-3">
                      <span className="font-bold text-white text-sm">{src?.label || e.source}</span>
                      <svg width="40" height="14"><line x1="0" y1="7" x2="30" y2="7" stroke={style.color} strokeWidth="2.5" /><polygon points="30,3 40,7 30,11" fill={style.color} /></svg>
                      <span className="rounded-full px-3 py-1 text-xs font-bold" style={{ background: style.color + "22", color: style.color, border: `1px solid ${style.color}44` }}>{e.relationship}</span>
                      <svg width="40" height="14"><line x1="0" y1="7" x2="30" y2="7" stroke={style.color} strokeWidth="2.5" /><polygon points="30,3 40,7 30,11" fill={style.color} /></svg>
                      <span className="font-bold text-white text-sm">{tgt?.label || e.target}</span>
                      {e.description && <span className="ml-2 text-xs text-slate-400">— {e.description}</span>}
                    </div>
                  );
                })}
              </div>
            </div>
          ) : null}

          {data.learning_path?.length ? (
            <div className="rounded-2xl border-2 border-emerald-600 bg-emerald-950/50 p-5">
              <h4 className="font-bold text-emerald-300 text-sm uppercase tracking-widest mb-4">Learning Path</h4>
              <div className="space-y-3">
                {data.learning_path.map((step: string, i: number) => (
                  <div key={i} className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-emerald-500 text-white text-sm font-black flex items-center justify-center">{i + 1}</div>
                    <span className="text-sm text-slate-200 mt-1">{step}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {data.real_world_connections?.length ? (
            <div className="rounded-2xl border-2 border-amber-600 bg-amber-950/50 p-5">
              <h4 className="font-bold text-amber-300 text-sm uppercase tracking-widest mb-4">Real-World Connections</h4>
              <ul className="space-y-2">
                {data.real_world_connections.map((c: string, i: number) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-slate-200">
                    <span className="text-amber-400 mt-0.5">&#9679;</span>
                    {c}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          <button onClick={() => navigator.clipboard.writeText(JSON.stringify(data, null, 2))} className="rounded-lg border border-white/10 px-4 py-2 text-sm font-medium text-slate-300 hover:bg-white/5">Copy JSON</button>
        </div>
      ) : null}
    </section>
  );
}
