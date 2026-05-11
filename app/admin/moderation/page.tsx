"use client";

import { useEffect, useState } from "react";

type Comment = {
  _id: string;
  userName: string;
  userEmail: string;
  userId: string;
  message: string;
  status: "pending" | "approved" | "rejected";
  isSpam: boolean;
};

export default function ModerationPage() {
  const [items, setItems] = useState<Comment[]>([]);
  const [status, setStatus] = useState("all");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);

  async function load() {
    setLoading(true);
    const params = new URLSearchParams({
      status,
      query,
      page: String(page),
      pageSize: "20",
    });

    const response = await fetch(`/api/admin/moderation/comments?${params.toString()}`);
    const data = await response.json();
    if (response.ok) {
      setItems(data.comments || []);
      setTotalPages(data.pagination?.totalPages ?? 1);
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, [status, query, page]);

  async function moderate(id: string, payload: Record<string, unknown>) {
    await fetch(`/api/admin/moderation/comments/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    load();
  }

  async function remove(id: string) {
    await fetch(`/api/admin/moderation/comments/${id}`, { method: "DELETE" });
    load();
  }

  return (
    <div>
      <h1 className="text-2xl font-bold">Moderation</h1>
      <p className="mt-2 text-sm text-slate-300">Approve content, remove spam and block users.</p>

      <div className="mt-4 grid gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 sm:grid-cols-3">
        <select
          value={status}
          onChange={(event) => {
            setStatus(event.target.value);
            setPage(1);
          }}
          className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm"
        >
          <option value="all">All statuses</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>

        <input
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setPage(1);
          }}
          placeholder="Search message or user"
          className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm"
        />

        <div className="flex items-center justify-end gap-2 text-xs text-slate-300">
          <button
            onClick={() => setPage((prev) => Math.max(1, prev - 1))}
            disabled={page <= 1}
            className="rounded border border-white/20 px-2 py-1 disabled:opacity-50"
          >
            Prev
          </button>
          <span>
            Page {page} / {totalPages}
          </span>
          <button
            onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
            disabled={page >= totalPages}
            className="rounded border border-white/20 px-2 py-1 disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>

      <div className="mt-6 space-y-3">
        {loading ? <p className="text-sm text-slate-400">Loading moderation queue...</p> : null}
        {items.map((item) => (
          <article key={item._id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-medium">{item.userName} <span className="text-xs text-slate-400">({item.userEmail})</span></p>
              <p className="text-xs uppercase tracking-[0.16em] text-cyan-200">{item.status}</p>
            </div>
            <p className="mt-2 text-sm text-slate-300">{item.message}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button onClick={() => moderate(item._id, { status: "approved", isSpam: false })} className="rounded bg-emerald-500 px-3 py-1 text-xs font-semibold text-black">Approve</button>
              <button onClick={() => moderate(item._id, { status: "rejected", isSpam: true })} className="rounded bg-amber-500 px-3 py-1 text-xs font-semibold text-black">Mark Spam</button>
              <button onClick={() => moderate(item._id, { status: "rejected", isSpam: true, blockUser: true, reason: "Spam activity" })} className="rounded bg-rose-500 px-3 py-1 text-xs font-semibold text-white">Ban User</button>
              <button onClick={() => remove(item._id)} className="rounded border border-white/20 px-3 py-1 text-xs">Delete</button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
