"use client";

import { FormEvent, useEffect, useState } from "react";
import { BACKGROUND_PROMPT_PRESETS, isPromptCategory } from "@/lib/social-engine/promptPresets";

type Post = {
  _id: string;
  title: string;
  date: string;
  venue: string;
  tagline: string;
  category: string;
  seed: number;
  graphics: string;
  backgroundPrompt: string;
  status: string;
  imageUrl: string;
  caption: string;
  hashtags: string[];
  error: string;
  attempts: number;
  igPermalink: string;
  publishedAt: string | null;
  createdAt: string;
};

type IgCheck = { ok: boolean; configured: boolean; username?: string; error: string };

const FILTERS = ["all", "pending_review", "approved", "published", "failed", "draft"] as const;

const STATUS_STYLES: Record<string, string> = {
  draft: "border-slate-400/30 bg-slate-400/10 text-slate-200",
  generating: "border-amber-300/30 bg-amber-400/10 text-amber-200",
  pending_review: "border-amber-300/30 bg-amber-400/10 text-amber-200",
  approved: "border-emerald-300/30 bg-emerald-400/10 text-emerald-200",
  publishing: "border-cyan-300/30 bg-cyan-400/10 text-cyan-200",
  published: "border-cyan-300/30 bg-cyan-400/10 text-cyan-200",
  failed: "border-rose-300/30 bg-rose-400/10 text-rose-200",
};

export default function SocialPostsPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [filter, setFilter] = useState<string>("all");
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState("");
  const [generating, setGenerating] = useState(false);
  const [ig, setIg] = useState<IgCheck | null>(null);
  const [preview, setPreview] = useState<Post | null>(null);
  const [captionDrafts, setCaptionDrafts] = useState<Record<string, string>>({});
  const [promptDrafts, setPromptDrafts] = useState<Record<string, string>>({});
  const [form, setForm] = useState({
    title: "",
    date: "",
    venue: "",
    tagline: "",
    category: "generic",
    graphics: "svg",
    backgroundPrompt: "",
  });

  async function load() {
    const response = await fetch("/api/admin/social");
    const data = await response.json();
    if (!response.ok) {
      setError(data.message || "Failed to load posts");
      return;
    }
    setPosts(data.posts || []);
  }

  async function checkIg() {
    try {
      const response = await fetch("/api/admin/social/instagram/check");
      setIg(await response.json());
    } catch {
      setIg({ ok: false, configured: true, error: "Network error" });
    }
  }

  useEffect(() => {
    load();
    checkIg();
  }, []);

  useEffect(() => {
    if (!preview) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setPreview(null);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [preview]);

  async function onGenerate(event: FormEvent) {
    event.preventDefault();
    setError("");
    setGenerating(true);
    try {
      const response = await fetch("/api/admin/social/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || data.message || "Generation failed");
        return;
      }
      setForm({
        title: "",
        date: "",
        venue: "",
        tagline: "",
        category: "generic",
        graphics: form.graphics,
        backgroundPrompt: "",
      });
      await load();
    } finally {
      setGenerating(false);
    }
  }

  async function call(id: string, path: string, method: string, body?: unknown) {
    setError("");
    setBusyId(id);
    try {
      const response = await fetch(`/api/admin/social/${id}${path}`, {
        method,
        headers: body ? { "Content-Type": "application/json" } : undefined,
        body: body ? JSON.stringify(body) : undefined,
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(data.error || data.message || "Action failed");
      }
      await load();
    } finally {
      setBusyId("");
    }
  }

  async function saveCaption(post: Post) {
    const caption = captionDrafts[post._id] ?? post.caption;
    await call(post._id, "", "PATCH", { caption });
    setCaptionDrafts((prev) => {
      const next = { ...prev };
      delete next[post._id];
      return next;
    });
  }

  function deletePost(post: Post) {
    if (!window.confirm(`Delete "${post.title}" permanently?`)) return;
    call(post._id, "", "DELETE");
  }

  const counts: Record<string, number> = { all: posts.length };
  for (const p of posts) counts[p.status] = (counts[p.status] || 0) + 1;
  const visible = filter === "all" ? posts : posts.filter((p) => p.status === filter);

  const inputCls =
    "w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm";
  const btnCls =
    "rounded-lg border border-white/10 bg-white/10 px-3 py-1.5 text-xs font-semibold hover:bg-white/20 disabled:opacity-50";

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Social Poster</h1>
          <p className="mt-2 text-sm text-slate-300">
            Generate event posters, review them, then publish approved posts to Instagram.
          </p>
        </div>
        <button
          onClick={checkIg}
          className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${
            ig?.ok
              ? "border-emerald-300/30 bg-emerald-400/10 text-emerald-200"
              : ig?.configured
                ? "border-rose-300/30 bg-rose-400/10 text-rose-200"
                : "border-amber-300/30 bg-amber-400/10 text-amber-200"
          }`}
        >
          {ig === null
            ? "Checking Instagram..."
            : ig.ok
              ? `Instagram: @${ig.username}`
              : ig.configured
                ? `IG error: ${ig.error.slice(0, 60)}`
                : "Instagram: not configured"}
        </button>
      </div>

      <form onSubmit={onGenerate} className="mt-6 space-y-3 rounded-2xl border border-white/10 bg-white/5 p-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <input
            className={inputCls}
            placeholder="Event title *"
            value={form.title}
            onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
            required
          />
          <input
            className={inputCls}
            placeholder="Date (e.g. Sat, 26 Oct 2026)"
            value={form.date}
            onChange={(e) => setForm((prev) => ({ ...prev, date: e.target.value }))}
          />
          <input
            className={inputCls}
            placeholder="Venue"
            value={form.venue}
            onChange={(e) => setForm((prev) => ({ ...prev, venue: e.target.value }))}
          />
          <input
            className={inputCls}
            placeholder="Tagline (optional)"
            value={form.tagline}
            onChange={(e) => setForm((prev) => ({ ...prev, tagline: e.target.value }))}
          />
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <select
            className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm"
            value={form.category}
            onChange={(e) => setForm((prev) => ({ ...prev, category: e.target.value }))}
          >
            <option value="generic">General event</option>
            <option value="science">Science</option>
            <option value="sports">Sports</option>
            <option value="cultural">Cultural</option>
            <option value="exam">Exam</option>
          </select>
          <select
            title="Graphics style for the poster image"
            className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm"
            value={form.graphics}
            onChange={(e) => setForm((prev) => ({ ...prev, graphics: e.target.value }))}
          >
            <option value="svg">Design: Vector poster</option>
            <option value="ai">Design: AI background</option>
          </select>
          <button
            type="submit"
            disabled={generating}
            className="rounded-lg bg-cyan-500 px-4 py-2 text-sm font-semibold text-black disabled:opacity-60"
          >
            {generating ? "Generating..." : "Generate Poster"}
          </button>
        </div>

        {form.graphics === "ai" ? (
          <div className="rounded-xl border border-white/10 bg-black/20 p-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold text-slate-300">Background prompt:</span>
              {(isPromptCategory(form.category)
                ? BACKGROUND_PROMPT_PRESETS[form.category]
                : BACKGROUND_PROMPT_PRESETS.generic
              ).map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  title={preset.prompt}
                  onClick={() => setForm((prev) => ({ ...prev, backgroundPrompt: preset.prompt }))}
                  className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] text-slate-200 hover:bg-white/15"
                >
                  {preset.label}
                </button>
              ))}
              {form.backgroundPrompt ? (
                <button
                  type="button"
                  onClick={() => setForm((prev) => ({ ...prev, backgroundPrompt: "" }))}
                  className="text-[11px] text-slate-400 underline hover:text-slate-200"
                >
                  reset
                </button>
              ) : null}
            </div>
            <textarea
              className="mt-2 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-xs"
              rows={3}
              maxLength={600}
              placeholder="Describe the AI background you want (optional) — e.g. 'night stadium with floodlights and red smoke'. Leave empty to use the default theme for this category."
              value={form.backgroundPrompt}
              onChange={(e) => setForm((prev) => ({ ...prev, backgroundPrompt: e.target.value }))}
            />
          </div>
        ) : null}
      </form>

      {error ? <p className="mt-3 text-sm text-rose-300">{error}</p> : null}

      <div className="mt-6 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-full border px-3 py-1 text-xs font-semibold ${
              filter === f
                ? "border-cyan-300/50 bg-cyan-400/20 text-cyan-100"
                : "border-white/10 bg-white/5 text-slate-300"
            }`}
          >
            {f.replace("_", " ")} ({counts[f] || 0})
          </button>
        ))}
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        {visible.map((post) => {
          const busy = busyId === post._id;
          const draftCaption = captionDrafts[post._id] ?? post.caption;
          const captionDirty = draftCaption !== post.caption;
          const draftPrompt = promptDrafts[post._id] ?? post.backgroundPrompt ?? "";
          const promptDirty = draftPrompt !== post.backgroundPrompt;
          const canRegenerate = ["draft", "pending_review", "approved", "failed"].includes(post.status);
          const toAi = post.graphics !== "ai" && draftPrompt.trim().length > 0;
          return (
            <article key={post._id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="flex gap-4">
                {post.imageUrl ? (
                  <button
                    type="button"
                    onClick={() => setPreview(post)}
                    title="Click to preview full size"
                    className="group relative h-36 w-36 shrink-0 overflow-hidden rounded-xl"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={post.imageUrl}
                      alt={post.title}
                      className="h-36 w-36 object-cover transition group-hover:scale-105"
                    />
                    <span className="absolute inset-0 flex items-center justify-center bg-black/60 text-xs font-semibold text-white opacity-0 transition group-hover:opacity-100">
                      Preview
                    </span>
                  </button>
                ) : (
                  <div className="flex h-36 w-36 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-black/30 text-xs text-slate-400">
                    no image
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                        STATUS_STYLES[post.status] || STATUS_STYLES.draft
                      }`}
                    >
                      {post.status.replace("_", " ")}
                    </span>
                    <span className="text-[10px] uppercase tracking-[0.16em] text-cyan-200">
                      {post.category}
                    </span>
                    <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-slate-300">
                      {post.graphics === "ai" ? "AI art" : "vector"}
                    </span>
                  </div>
                  <h2 className="mt-1 truncate text-lg font-semibold">{post.title}</h2>
                  <p className="text-xs text-slate-400">
                    {[post.date, post.venue].filter(Boolean).join(" · ") || "\u00A0"}
                  </p>
                  {post.error ? (
                    <p className="mt-1 text-xs text-rose-300">{post.error}</p>
                  ) : null}
                  {post.graphics === "ai" && post.backgroundPrompt ? (
                    <p
                      className="mt-1 truncate text-[11px] text-slate-400"
                      title={post.backgroundPrompt}
                    >
                      prompt: {post.backgroundPrompt}
                    </p>
                  ) : null}
                  {post.igPermalink ? (
                    <a
                      href={post.igPermalink}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-1 block truncate text-xs text-cyan-300 underline"
                    >
                      View on Instagram
                    </a>
                  ) : null}
                </div>
              </div>

              {canRegenerate ? (
                <div className="mt-3">
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                      AI background prompt
                    </span>
                    <span className="flex items-center gap-2">
                      {promptDirty ? (
                        <span className="text-[11px] font-semibold text-amber-200">edited</span>
                      ) : null}
                      {promptDirty ? (
                        <button
                          disabled={busy}
                          onClick={() =>
                            setPromptDrafts((prev) => ({ ...prev, [post._id]: post.backgroundPrompt }))
                          }
                          className="text-[11px] text-slate-400 underline hover:text-slate-200"
                        >
                          restore
                        </button>
                      ) : null}
                    </span>
                  </div>
                  <textarea
                    className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-xs"
                    rows={2}
                    maxLength={600}
                    placeholder="Describe the AI background — leave empty for the category default"
                    value={draftPrompt}
                    onChange={(e) =>
                      setPromptDrafts((prev) => ({ ...prev, [post._id]: e.target.value }))
                    }
                  />
                </div>
              ) : null}

              <textarea
                className="mt-3 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-xs"
                rows={5}
                value={draftCaption}
                onChange={(e) =>
                  setCaptionDrafts((prev) => ({ ...prev, [post._id]: e.target.value }))
                }
                disabled={["publishing", "published"].includes(post.status)}
              />

              <div className="mt-2 flex flex-wrap gap-2">
                {post.imageUrl ? (
                  <button
                    disabled={busy}
                    onClick={() => setPreview(post)}
                    className={`${btnCls} border-cyan-300/30 bg-cyan-400/10 text-cyan-200`}
                  >
                    Preview
                  </button>
                ) : null}
                {["pending_review", "draft", "failed"].includes(post.status) && post.imageUrl ? (
                  <button
                    disabled={busy}
                    onClick={() => call(post._id, "/approve", "POST", { caption: draftCaption })}
                    className={`${btnCls} border-emerald-300/30 bg-emerald-400/10 text-emerald-200`}
                  >
                    Approve
                  </button>
                ) : null}
                {post.status === "pending_review" ? (
                  <button
                    disabled={busy}
                    onClick={() => call(post._id, "/reject", "POST")}
                    className={`${btnCls} border-amber-300/30 bg-amber-400/10 text-amber-200`}
                  >
                    Reject
                  </button>
                ) : null}
                {post.status === "approved" ? (
                  <button
                    disabled={busy}
                    onClick={() => call(post._id, "/publish", "POST")}
                    className={`${btnCls} border-cyan-300/30 bg-cyan-400/10 text-cyan-200`}
                  >
                    Publish to Instagram
                  </button>
                ) : null}
                {canRegenerate ? (
                  <button
                    disabled={busy}
                    onClick={async () => {
                      await call(
                        post._id,
                        "/regenerate",
                        "POST",
                        toAi
                          ? { graphics: "ai", backgroundPrompt: draftPrompt }
                          : { backgroundPrompt: draftPrompt },
                      );
                      setPromptDrafts((prev) => {
                        const next = { ...prev };
                        delete next[post._id];
                        return next;
                      });
                    }}
                    className={`${btnCls} border-violet-300/30 bg-violet-400/10 text-violet-200`}
                  >
                    {busy
                      ? "Working..."
                      : toAi
                        ? "✨ Generate AI poster"
                        : promptDirty
                          ? "↻ Regenerate with prompt"
                          : "↻ Regenerate"}
                  </button>
                ) : null}
                {captionDirty ? (
                  <button
                    disabled={busy}
                    onClick={() => saveCaption(post)}
                    className={`${btnCls} border-cyan-300/30 bg-cyan-400/10 text-cyan-200`}
                  >
                    Save caption
                  </button>
                ) : null}
                {post.status !== "publishing" ? (
                  <button
                    disabled={busy}
                    onClick={() => deletePost(post)}
                    className={`${btnCls} border-rose-300/30 bg-rose-400/10 text-rose-200`}
                  >
                    Delete
                  </button>
                ) : null}
              </div>
            </article>
          );
        })}
        {visible.length === 0 ? (
          <p className="text-sm text-slate-400">No posts in this filter.</p>
        ) : null}
      </div>

      {preview ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md"
          onClick={() => setPreview(null)}
        >
          <div
            className="relative flex max-h-[92vh] w-full max-w-3xl flex-col items-center gap-4 overflow-auto rounded-3xl border border-white/10 bg-slate-950 p-5 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex w-full items-start justify-between gap-3">
              <div className="min-w-0">
                <span className="rounded-full border border-amber-300/30 bg-amber-400/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-200">
                  {preview.status.replace("_", " ")}
                </span>
                <h2 className="mt-2 truncate text-lg font-semibold">{preview.title}</h2>
                <p className="text-xs text-slate-400">
                  {[preview.date, preview.venue].filter(Boolean).join(" · ")}
                </p>
              </div>
              <button
                onClick={() => setPreview(null)}
                aria-label="Close preview"
                className="shrink-0 rounded-lg border border-white/10 bg-white/10 px-3 py-1.5 text-xs font-semibold hover:bg-white/20"
              >
                Close (Esc)
              </button>
            </div>

            {preview.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={preview.imageUrl}
                alt={preview.title}
                className="max-h-[68vh] w-auto max-w-full rounded-2xl border border-white/10 object-contain"
              />
            ) : null}

            {preview.caption ? (
              <p className="w-full whitespace-pre-wrap rounded-xl border border-white/10 bg-black/30 p-3 text-xs leading-relaxed text-slate-300">
                {preview.caption}
              </p>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
