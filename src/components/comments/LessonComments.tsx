"use client";

import { FormEvent, useEffect, useState } from "react";

type Comment = {
  _id: string;
  userName: string;
  message: string;
  createdAt: string;
};

type Props = {
  lessonPath: string;
  courseSlug: string;
  chapterSlug: string;
};

export default function LessonComments({ lessonPath, courseSlug, chapterSlug }: Props) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function loadComments() {
    const response = await fetch(`/api/comments?lessonPath=${encodeURIComponent(lessonPath)}`);
    const data = await response.json();
    if (response.ok) {
      setComments(data.comments || []);
    }
  }

  useEffect(() => {
    loadComments();
  }, [lessonPath]);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setSubmitting(true);

    const response = await fetch("/api/comments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lessonPath, courseSlug, chapterSlug, message }),
    });

    const data = await response.json();
    setSubmitting(false);

    if (!response.ok) {
      setError(data.message || "Failed to post comment");
      return;
    }

    setMessage("");
    loadComments();
  }

  return (
    <section className="mt-10 rounded-2xl border border-white/10 bg-black/20 p-5">
      <h2 className="text-lg font-semibold">Questions and Doubts</h2>
      <p className="mt-1 text-sm text-slate-300">Ask doubts under this lesson.</p>

      <form onSubmit={onSubmit} className="mt-4 space-y-3">
        <textarea
          className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm"
          rows={3}
          placeholder="Ask your question..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          required
        />
        <button disabled={submitting} className="rounded-lg bg-cyan-500 px-4 py-2 text-sm font-semibold text-black disabled:opacity-60">
          {submitting ? "Posting..." : "Post Comment"}
        </button>
      </form>

      {error ? <p className="mt-2 text-sm text-rose-300">{error}</p> : null}

      <div className="mt-5 space-y-3">
        {comments.length ? comments.map((item) => (
          <article key={item._id} className="rounded-xl border border-white/10 bg-white/5 p-3">
            <p className="text-sm font-medium">{item.userName}</p>
            <p className="mt-1 text-sm text-slate-300">{item.message}</p>
            <p className="mt-1 text-xs text-slate-500">{new Date(item.createdAt).toLocaleString()}</p>
          </article>
        )) : <p className="text-sm text-slate-400">No comments yet.</p>}
      </div>
    </section>
  );
}
