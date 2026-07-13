"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import {
  Globe, Brain, Database, Cpu, Shield, Cloud, Zap,
  BookOpen, FileText, Upload, BarChart3, MessageSquare,
  Code, Calendar, ClipboardList, Download, TrendingUp,
  X, Radio, AlertTriangle, Settings,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

/* ─── Service Definitions ───────────────────────────────────────────────── */

type ServiceStatus = "operational" | "high_load" | "warning" | "critical" | "offline";
type ServicePriority = "core" | "engine" | "platform";

interface ServiceMetric {
  cpu: number;
  ram: number;
  latency: number;
  uptime: string;
  version: string;
  activity: string;
}

interface ServiceDef {
  id: string;
  name: string;
  priority: ServicePriority;
  icon: LucideIcon;
  status: ServiceStatus;
  metrics: ServiceMetric;
  connectsTo: string[];
  description: string;
  suggestion?: string;
}

const SERVICES: ServiceDef[] = [
  // ═══════════════════════════════════════════════════════════════════════
  // CORE SERVICES (highest priority - system cannot run without these)
  // ═══════════════════════════════════════════════════════════════════════
  { id: "mongodb", name: "MongoDB Atlas", priority: "core", icon: Database, status: "operational",
    metrics: { cpu: 22, ram: 512, latency: 15, uptime: "99.99%", version: "7.0", activity: "2.4k r/s" },
    connectsTo: [], description: "Primary database — users, lessons, LMS state.",
    suggestion: "Enable auto-scaling to handle traffic spikes. Monitor connection pool usage." },
  { id: "clerk", name: "Clerk Auth", priority: "core", icon: Shield, status: "operational",
    metrics: { cpu: 5, ram: 40, latency: 20, uptime: "100%", version: "7.3.3", activity: "142 sessions" },
    connectsTo: [], description: "Authentication & session management for all roles.",
    suggestion: "Review session limits. Enable MFA for admin accounts." },
  { id: "faiss", name: "FAISS Vector DB", priority: "core", icon: Database, status: "operational",
    metrics: { cpu: 35, ram: 2400, latency: 8, uptime: "99.8%", version: "1.7", activity: "Index active" },
    connectsTo: [], description: "Multi-book vector index for semantic search.",
    suggestion: "Monitor memory usage — 2.4GB is high. Consider index compression or sharding." },
  { id: "gemini", name: "Google Gemini API", priority: "core", icon: Zap, status: "operational",
    metrics: { cpu: 0, ram: 0, latency: 850, uptime: "99.5%", version: "2.5", activity: "4.2k tok/s" },
    connectsTo: [], description: "Primary LLM for content generation.",
    suggestion: "High latency (850ms). Consider request batching or caching frequent prompts." },
  { id: "nextjs", name: "Next.js Frontend", priority: "core", icon: Globe, status: "operational",
    metrics: { cpu: 12, ram: 340, latency: 2, uptime: "99.9%", version: "16.2.5", activity: "Serving" },
    connectsTo: ["clerk", "mongodb"], description: "React SSR framework — entire student & admin UI.",
    suggestion: "Healthy. Consider edge caching for static assets." },

  // ═══════════════════════════════════════════════════════════════════════
  // ENGINE SERVICES (critical processing pipelines)
  // ═══════════════════════════════════════════════════════════════════════
  { id: "ebook-proxy", name: "Ebook Proxy", priority: "core", icon: Download, status: "operational",
    metrics: { cpu: 2, ram: 60, latency: 8, uptime: "99.9%", version: "1.0", activity: "Idle" },
    connectsTo: [], description: "Python HTTP proxy for ebook page extraction.",
    suggestion: "Healthy. Consider adding caching for frequent requests." },
  { id: "timetable", name: "Timetable Engine", priority: "core", icon: Calendar, status: "operational",
    metrics: { cpu: 8, ram: 180, latency: 5, uptime: "99.8%", version: "1.0", activity: "Idle" },
    connectsTo: [], description: "Vite + React standalone timetable builder.",
    suggestion: "Healthy. Consider pre-computing schedules during off-peak hours." },
  { id: "fastapi", name: "AI Teacher Backend", priority: "engine", icon: Brain, status: "operational",
    metrics: { cpu: 45, ram: 1200, latency: 180, uptime: "99.7%", version: "1.0", activity: "Processing" },
    connectsTo: ["faiss", "gemini"], description: "FastAPI server for retrieval and AI generation.",
    suggestion: "RAM at 1.2GB — monitor for leaks. Add request rate limiting." },
  { id: "sentence-transformers", name: "Sentence Transformers", priority: "engine", icon: Cpu, status: "operational",
    metrics: { cpu: 55, ram: 800, latency: 12, uptime: "99.8%", version: "MiniLM-L6", activity: "Embedding" },
    connectsTo: ["faiss"], description: "Local embedding model for vector conversion.",
    suggestion: "CPU at 55% — consider GPU acceleration or batch optimization." },
  { id: "reranker", name: "Cross-Encoder Reranker", priority: "engine", icon: TrendingUp, status: "operational",
    metrics: { cpu: 40, ram: 500, latency: 35, uptime: "99.7%", version: "MiniLM", activity: "Active" },
    connectsTo: ["gemini"], description: "Precision reranking before LLM generation.",
    suggestion: "Healthy. Cache frequent query results to reduce load." },
  { id: "llm-generation", name: "LLM Generation", priority: "engine", icon: Brain, status: "operational",
    metrics: { cpu: 10, ram: 50, latency: 1200, uptime: "99.5%", version: "2.5-flash", activity: "4 generated" },
    connectsTo: ["gemini"], description: "Structured content generation engine.",
    suggestion: "Latency 1.2s — implement streaming responses for better UX." },
  { id: "claude-proxy", name: "Claude Proxy", priority: "engine", icon: MessageSquare, status: "operational",
    metrics: { cpu: 3, ram: 90, latency: 12, uptime: "99.9%", version: "1.0", activity: "Relaying" },
    connectsTo: ["gemini"], description: "Anthropic-compatible proxy routing.",
    suggestion: "Healthy. Monitor rate limits on upstream Gemini API." },
  { id: "cloudinary", name: "Cloudinary CDN", priority: "engine", icon: Cloud, status: "operational",
    metrics: { cpu: 0, ram: 0, latency: 25, uptime: "99.99%", version: "2.10", activity: "CDN live" },
    connectsTo: [], description: "Image hosting and optimization.",
    suggestion: "Healthy. Review transformation costs monthly." },
  { id: "pdf-ingestion", name: "PDF Ingestion", priority: "engine", icon: FileText, status: "operational",
    metrics: { cpu: 40, ram: 350, latency: 0, uptime: "99.7%", version: "1.0", activity: "3 books" },
    connectsTo: ["pdf-chunking"], description: "PyPDFLoader parsing textbooks into pages.",
    suggestion: "Healthy. Monitor memory during large PDF processing." },
  { id: "pdf-chunking", name: "Text Chunking", priority: "engine", icon: FileText, status: "operational",
    metrics: { cpu: 15, ram: 200, latency: 2, uptime: "99.9%", version: "1.0", activity: "1.2k chunks" },
    connectsTo: ["vector-embedding"], description: "RecursiveCharacterTextSplitter for 1000-char chunks.",
    suggestion: "Healthy. Consider optimizing chunk size for better retrieval." },
  { id: "vector-embedding", name: "Vector Embedding", priority: "engine", icon: Cpu, status: "operational",
    metrics: { cpu: 65, ram: 900, latency: 45, uptime: "99.8%", version: "1.0", activity: "Batch embed" },
    connectsTo: ["faiss-indexing"], description: "Converting text chunks into 384-dim vectors.",
    suggestion: "CPU at 65% — consider GPU acceleration for batch processing." },
  { id: "faiss-indexing", name: "FAISS Indexing", priority: "engine", icon: Database, status: "operational",
    metrics: { cpu: 30, ram: 600, latency: 5, uptime: "99.8%", version: "1.0", activity: "Index stable" },
    connectsTo: ["faiss"], description: "Storing embeddings with metadata in FAISS index.",
    suggestion: "Healthy. Consider index compression for memory optimization." },

  // ═══════════════════════════════════════════════════════════════════════
  // PLATFORM SERVICES (supporting features)
  // ═══════════════════════════════════════════════════════════════════════
  { id: "lesson-manager", name: "Lesson Manager", priority: "platform", icon: BookOpen, status: "operational",
    metrics: { cpu: 3, ram: 60, latency: 5, uptime: "99.9%", version: "1.0", activity: "142 lessons" },
    connectsTo: ["mongodb"], description: "Lesson content management for LMS." },
  { id: "quiz-engine", name: "Quiz Engine", priority: "platform", icon: ClipboardList, status: "operational",
    metrics: { cpu: 7, ram: 90, latency: 10, uptime: "99.8%", version: "1.0", activity: "23 quizzes" },
    connectsTo: ["mongodb"], description: "Assessment creation and grading." },
  { id: "doc-writer", name: "Document Writer", priority: "platform", icon: FileText, status: "operational",
    metrics: { cpu: 5, ram: 120, latency: 10, uptime: "99.9%", version: "1.0", activity: "Ready" },
    connectsTo: ["fastapi"], description: "AI document creation for school admin." },
  { id: "lesson-upload", name: "Lesson Upload", priority: "platform", icon: Upload, status: "operational",
    metrics: { cpu: 10, ram: 200, latency: 15, uptime: "99.9%", version: "1.0", activity: "Ready" },
    connectsTo: ["fastapi"], description: "PDF upload and vector index generation." },
  { id: "practice-papers", name: "Practice Papers", priority: "platform", icon: ClipboardList, status: "operational",
    metrics: { cpu: 5, ram: 80, latency: 8, uptime: "99.9%", version: "1.0", activity: "5 papers" },
    connectsTo: ["fastapi"], description: "Practice question paper management." },
  { id: "timetable-system", name: "Timetable System", priority: "platform", icon: Calendar, status: "operational",
    metrics: { cpu: 4, ram: 70, latency: 8, uptime: "99.9%", version: "1.0", activity: "Grid active" },
    connectsTo: [], description: "Schedule management with teacher balancing." },
  { id: "ebook-extractor", name: "Ebook Extractor", priority: "platform", icon: Download, status: "operational",
    metrics: { cpu: 8, ram: 150, latency: 12, uptime: "99.8%", version: "1.0", activity: "Idle" },
    connectsTo: [], description: "Ebook page extraction for class 9-12." },
  { id: "analytics", name: "System Analytics", priority: "platform", icon: BarChart3, status: "operational",
    metrics: { cpu: 6, ram: 100, latency: 12, uptime: "99.9%", version: "1.0", activity: "Tracking" },
    connectsTo: ["mongodb"], description: "Platform activity logs and metrics." },
  { id: "announcements", name: "Announcements", priority: "platform", icon: Settings, status: "operational",
    metrics: { cpu: 1, ram: 20, latency: 3, uptime: "100%", version: "1.0", activity: "Idle" },
    connectsTo: ["mongodb"], description: "Campus notifications and email dispatch." },
  { id: "program-manager", name: "Code Lab", priority: "platform", icon: Code, status: "operational",
    metrics: { cpu: 15, ram: 250, latency: 20, uptime: "99.7%", version: "1.0", activity: "Sandbox" },
    connectsTo: [], description: "Python code execution sandbox." },
];

/* ─── Status Configuration ──────────────────────────────────────────────── */

const STATUS_COLORS: Record<ServiceStatus, { core: string; glow: string; label: string }> = {
  operational: { core: "#22d3ee", glow: "rgba(34,211,238,0.4)", label: "ONLINE" },
  high_load:   { core: "#facc15", glow: "rgba(250,204,21,0.4)", label: "HIGH LOAD" },
  warning:     { core: "#f97316", glow: "rgba(249,115,22,0.4)", label: "WARNING" },
  critical:    { core: "#ef4444", glow: "rgba(239,68,68,0.4)", label: "CRITICAL" },
  offline:     { core: "#334155", glow: "rgba(51,65,85,0.2)", label: "OFFLINE" },
};

const PRIORITY_CONFIG: Record<ServicePriority, { label: string; color: string; order: number }> = {
  core:     { label: "CORE", color: "#22d3ee", order: 0 },
  engine:   { label: "ENGINE", color: "#a78bfa", order: 1 },
  platform: { label: "PLATFORM", color: "#64748b", order: 2 },
};

/* ─── Fusion Core ───────────────────────────────────────────────────────── */

function FusionCore({ status, size = 12 }: { status: ServiceStatus; size?: number }) {
  const c = STATUS_COLORS[status];
  const isPulsing = status === "high_load" || status === "critical";
  const isGreen = status === "operational";
  const isRed = status === "critical" || status === "offline";

  return (
    <span className="relative inline-flex items-center justify-center" style={{ width: size * 2, height: size * 2 }}>
      <span className="absolute rounded-full" style={{
        width: size * 2, height: size * 2,
        background: `radial-gradient(circle, ${c.glow} 0%, transparent 70%)`,
        animation: isPulsing ? "fusionPulse 1.5s ease-in-out infinite" : "fusionStable 3s ease-in-out infinite",
      }} />
      <span className="relative rounded-full" style={{
        width: size, height: size, backgroundColor: c.core,
        boxShadow: `0 0 ${size}px ${c.glow}`,
        animation: isPulsing ? "corePulse 1.5s ease-in-out infinite" : undefined,
      }} />
      {/* Green/Red status indicator */}
      <span className="absolute rounded-full" style={{
        width: size * 0.4, height: size * 0.4,
        backgroundColor: isGreen ? "#22c55e" : isRed ? "#ef4444" : c.core,
        border: `1px solid rgba(0,0,0,0.3)`,
        top: 0, right: 0,
      }} />
    </span>
  );
}

/* ─── Circular Gauge ────────────────────────────────────────────────────── */

function CircularGauge({ value, max = 100, size = 32, label, unit = "" }: {
  value: number; max?: number; size?: number; label: string; unit?: string;
}) {
  const pct = Math.min(value / max, 1);
  const r = (size - 6) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - pct);
  const color = pct > 0.8 ? "#ef4444" : pct > 0.6 ? "#facc15" : "#22d3ee";
  return (
    <div className="flex flex-col items-center gap-0.5">
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={2.5} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={2.5}
          strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 0.8s ease, stroke 0.5s ease" }} />
      </svg>
      <span className="text-[8px] font-mono text-slate-400">{value}{unit}</span>
      <span className="text-[7px] uppercase tracking-wider text-slate-600">{label}</span>
    </div>
  );
}

/* ─── Status Light ──────────────────────────────────────────────────────── */

function StatusLight({ status, size = 6 }: { status: ServiceStatus; size?: number }) {
  const color = status === "operational" ? "#22c55e" :
                status === "high_load" ? "#facc15" :
                status === "warning" ? "#f97316" :
                status === "critical" ? "#ef4444" :
                "#334155";
  const isPulsing = status === "critical" || status === "high_load";

  return (
    <span className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <span className="absolute rounded-full" style={{
        width: size * 2, height: size * 2,
        background: `radial-gradient(circle, ${color}40 0%, transparent 70%)`,
        animation: isPulsing ? "corePulse 1s ease-in-out infinite" : undefined,
      }} />
      <span className="relative rounded-full" style={{
        width: size, height: size, backgroundColor: color,
        boxShadow: `0 0 ${size}px ${color}60`,
      }} />
    </span>
  );
}

/* ─── Service Module ────────────────────────────────────────────────────── */

function ServiceModule({ service, onClick }: {
  service: ServiceDef; onClick: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  const Icon = service.icon;
  const c = STATUS_COLORS[service.status];
  const p = PRIORITY_CONFIG[service.priority];

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="relative cursor-pointer rounded-xl border transition-all duration-300 overflow-hidden"
      style={{
        borderColor: hovered ? `${c.core}40` : "rgba(255,255,255,0.06)",
        background: hovered
          ? "linear-gradient(135deg, rgba(15,23,42,0.95), rgba(15,23,42,0.8))"
          : "linear-gradient(135deg, rgba(15,23,42,0.7), rgba(15,23,42,0.5))",
        transform: hovered ? "translateY(-1px)" : "translateY(0)",
        boxShadow: hovered ? `0 4px 20px ${c.glow}` : "none",
      }}
    >
      {/* Priority indicator bar */}
      <div className="h-0.5" style={{ background: `linear-gradient(90deg, ${p.color}, transparent)` }} />

      <div className="p-3">
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg border"
              style={{ borderColor: `${c.core}30`, background: `${c.core}10` }}>
              <Icon size={13} style={{ color: c.core }} />
            </div>
            <div>
              <h4 className="text-[11px] font-semibold text-white leading-tight">{service.name}</h4>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-[7px] font-mono uppercase tracking-wider px-1 py-0.5 rounded"
                  style={{ background: `${p.color}15`, color: p.color }}>
                  {p.label}
                </span>
                <StatusLight status={service.status} size={5} />
                <span className="text-[8px] font-mono uppercase tracking-wider" style={{ color: `${c.core}90` }}>
                  {c.label}
                </span>
              </div>
            </div>
          </div>
          <FusionCore status={service.status} size={6} />
        </div>

        {/* Metrics */}
        <div className="flex items-center justify-between gap-1 mb-2">
          <CircularGauge value={service.metrics.cpu} size={28} label="CPU" unit="%" />
          <CircularGauge value={service.metrics.ram} max={3000} size={28} label="RAM" unit="MB" />
          <div className="flex flex-col items-center gap-0.5">
            <span className="text-[8px] font-mono text-cyan-400">{service.metrics.latency}ms</span>
            <span className="text-[7px] uppercase tracking-wider text-slate-600">LAT</span>
          </div>
        </div>

        {/* Bottom */}
        <div className="flex items-center justify-between text-[8px] text-slate-500">
          <span className="font-mono">v{service.metrics.version}</span>
          <span className="flex items-center gap-1">
            <span className="h-1 w-1 rounded-full bg-emerald-500 animate-pulse" />
            {service.metrics.activity}
          </span>
        </div>
      </div>
    </div>
  );
}

/* ─── Suggestions Panel ─────────────────────────────────────────────────── */

function SuggestionsPanel({ services }: { services: ServiceDef[] }) {
  const criticalServices = services.filter(s => s.status === "critical" || s.status === "warning" || s.status === "high_load");

  if (criticalServices.length === 0) return null;

  return (
    <div className="mb-8 rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
      <div className="flex items-center gap-2 mb-3">
        <AlertTriangle size={14} className="text-amber-400" />
        <span className="text-[10px] font-bold tracking-[0.2em] text-amber-300 uppercase">
          System Recommendations
        </span>
      </div>
      <div className="space-y-2">
        {criticalServices.map(svc => {
          const c = STATUS_COLORS[svc.status];
          return (
            <div key={svc.id} className="flex items-start gap-3 rounded-lg border border-white/5 bg-white/[0.02] p-3">
              <FusionCore status={svc.status} size={5} />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-semibold text-white">{svc.name}</span>
                  <span className="text-[7px] font-mono px-1 py-0.5 rounded"
                    style={{ background: `${c.core}20`, color: c.core }}>
                    {c.label}
                  </span>
                </div>
                <p className="text-[9px] text-slate-400 leading-relaxed">
                  {svc.suggestion || "Monitor closely. Consider scaling resources."}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─── Diagnostics Modal ─────────────────────────────────────────────────── */

function DiagnosticsPanel({ service, onClose }: { service: ServiceDef; onClose: () => void }) {
  const c = STATUS_COLORS[service.status];
  const p = PRIORITY_CONFIG[service.priority];
  const Icon = service.icon;
  const connected = SVCS_FILTERED.filter(s => service.connectsTo.includes(s.id));

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
      <div className="relative w-full max-w-2xl rounded-2xl border overflow-hidden"
        style={{ borderColor: `${c.core}30`, background: "linear-gradient(135deg, rgba(10,15,30,0.98), rgba(15,23,42,0.98))",
          boxShadow: `0 0 60px ${c.glow}` }} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/5 p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border"
              style={{ borderColor: `${c.core}30`, background: `${c.core}10` }}>
              <Icon size={18} style={{ color: c.core }} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">{service.name}</h3>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[8px] font-mono px-1 py-0.5 rounded"
                  style={{ background: `${p.color}15`, color: p.color }}>{p.label}</span>
                <span className="text-[8px] font-mono" style={{ color: c.core }}>{c.label}</span>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg border border-white/10 p-2 text-slate-400 hover:text-white hover:bg-white/5 transition">
            <X size={14} />
          </button>
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-3 gap-3 p-5">
          {[
            { label: "CPU", value: `${service.metrics.cpu}%`, pct: service.metrics.cpu },
            { label: "RAM", value: `${service.metrics.ram}MB`, pct: (service.metrics.ram / 3000) * 100 },
            { label: "LATENCY", value: `${service.metrics.latency}ms`, pct: Math.min(service.metrics.latency / 20, 100) },
            { label: "UPTIME", value: service.metrics.uptime, pct: parseFloat(service.metrics.uptime) },
            { label: "VERSION", value: service.metrics.version, pct: 100 },
            { label: "ACTIVITY", value: service.metrics.activity, pct: 50 },
          ].map(m => (
            <div key={m.label} className="rounded-lg border border-white/5 bg-white/[0.02] p-3">
              <p className="text-[8px] text-slate-600 uppercase tracking-widest mb-1">{m.label}</p>
              <p className="text-sm font-bold font-mono text-white">{m.value}</p>
              <div className="mt-1.5 h-0.5 rounded-full bg-white/5 overflow-hidden">
                <div className="h-full rounded-full" style={{
                  width: `${Math.min(m.pct, 100)}%`,
                  background: `linear-gradient(90deg, ${c.core}, ${c.core}80)`,
                }} />
              </div>
            </div>
          ))}
        </div>

        {/* Suggestion */}
        {service.suggestion && (
          <div className="mx-5 mb-4 rounded-lg border border-amber-500/20 bg-amber-500/5 p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <AlertTriangle size={10} className="text-amber-400" />
              <span className="text-[8px] font-bold text-amber-300 uppercase tracking-wider">Recommendation</span>
            </div>
            <p className="text-[10px] text-slate-400 leading-relaxed">{service.suggestion}</p>
          </div>
        )}

        {/* Connected */}
        {connected.length > 0 && (
          <div className="border-t border-white/5 px-5 py-3">
            <p className="text-[8px] text-slate-600 uppercase tracking-widest mb-1.5">Connected Systems</p>
            <div className="flex flex-wrap gap-1.5">
              {connected.map(cn => {
                const cs = STATUS_COLORS[cn.status];
                return (
                  <span key={cn.id} className="text-[8px] font-mono px-2 py-0.5 rounded border"
                    style={{ borderColor: `${cs.core}30`, color: cs.core }}>
                    {cn.name}
                  </span>
                );
              })}
            </div>
          </div>
        )}

        {/* Description */}
        <div className="border-t border-white/5 px-5 py-3">
          <p className="text-[9px] text-slate-500">{service.description}</p>
        </div>
      </div>
    </div>
  );
}

/* ─── Background ────────────────────────────────────────────────────────── */

function BridgeBackground() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      <div className="absolute inset-0" style={{
        backgroundImage: "linear-gradient(rgba(34,211,238,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(34,211,238,0.03) 1px, transparent 1px)",
        backgroundSize: "60px 60px",
      }} />
    </div>
  );
}

/* ─── Main ──────────────────────────────────────────────────────────────── */

const SVCS_FILTERED = SERVICES;

export default function CommandCenter() {
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [expandedService, setExpandedService] = useState<ServiceDef | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const filters = [
    { id: "all", label: "ALL" },
    { id: "core", label: "CORE" },
    { id: "engine", label: "ENGINES" },
    { id: "platform", label: "PLATFORM" },
  ];

  const filtered = useMemo(() => {
    let svcs = activeFilter === "all" ? SERVICES : SERVICES.filter(s => s.priority === activeFilter);
    // Sort by priority order
    return svcs.sort((a, b) => PRIORITY_CONFIG[a.priority].order - PRIORITY_CONFIG[b.priority].order);
  }, [activeFilter]);

  const operationalCount = SERVICES.filter(s => s.status === "operational").length;
  const totalCount = SERVICES.length;
  const avgCpu = Math.round(SERVICES.reduce((a, s) => a + s.metrics.cpu, 0) / totalCount);
  const totalRam = Math.round(SERVICES.reduce((a, s) => a + s.metrics.ram, 0) / 1024 * 10) / 10;

  if (!mounted) return null;

  return (
    <section className="relative overflow-hidden bg-[#06080f] px-4 py-20 sm:px-6 lg:py-28">
      <BridgeBackground />

      <div className="relative mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-10 text-center relative z-10">
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/20 bg-cyan-500/5 px-4 py-1.5 mb-4">
            <Radio size={12} className="text-cyan-400 animate-pulse" />
            <span className="text-[10px] font-bold tracking-[0.3em] text-cyan-300 uppercase">
              Command Center
            </span>
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            AI Operating System
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm text-slate-400">
            {totalCount} subsystems organized by priority. Core services first, then engines, then platform features.
          </p>

          {/* Stats */}
          <div className="mt-5 inline-flex items-center gap-5 rounded-xl border border-white/5 bg-white/[0.02] px-5 py-2.5">
            <div className="flex items-center gap-2">
              <FusionCore status="operational" size={5} />
              <span className="text-[11px] text-slate-300">{operationalCount}/{totalCount}</span>
            </div>
            <div className="h-4 w-px bg-white/10" />
            <span className="text-[9px] font-mono text-slate-500">CPU {avgCpu}%</span>
            <span className="text-[9px] font-mono text-slate-500">RAM {totalRam}GB</span>
          </div>
        </div>

        {/* Suggestions */}
        <div className="relative z-10">
          <SuggestionsPanel services={SERVICES} />
        </div>

        {/* Filters */}
        <div className="mb-6 flex justify-center gap-2 relative z-10">
          {filters.map(f => (
            <button key={f.id} onClick={() => setActiveFilter(f.id)}
              className="rounded-lg px-3 py-1.5 text-[9px] font-bold uppercase tracking-[0.15em] transition-all duration-200 border"
              style={{
                borderColor: activeFilter === f.id ? "rgba(34,211,238,0.3)" : "rgba(255,255,255,0.06)",
                background: activeFilter === f.id ? "rgba(34,211,238,0.1)" : "transparent",
                color: activeFilter === f.id ? "#22d3ee" : "#64748b",
              }}>
              {f.label}
            </button>
          ))}
        </div>

        {/* Service Grid */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 relative z-10">
          {filtered.map(service => (
            <ServiceModule key={service.id} service={service} onClick={() => setExpandedService(service)} />
          ))}
        </div>

        {/* Legend */}
        <div className="mt-6 flex justify-center relative z-10">
          <div className="flex items-center gap-4 text-[8px] text-slate-500">
            {Object.entries(PRIORITY_CONFIG).map(([key, val]) => (
              <div key={key} className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full" style={{ background: val.color }} />
                <span className="uppercase tracking-wider">{val.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Modal */}
      {expandedService && (
        <DiagnosticsPanel service={expandedService} onClose={() => setExpandedService(null)} />
      )}

      {/* Keyframes */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes fusionPulse {
          0%, 100% { opacity: 0.6; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.3); }
        }
        @keyframes fusionStable {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 0.8; }
        }
        @keyframes corePulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.15); }
        }
      `}} />
    </section>
  );
}
