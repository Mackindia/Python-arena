"use client";

import { FormEvent, useEffect, useState } from "react";

type Announcement = {
  _id: string;
  title: string;
  message: string;
  level: "info" | "warning" | "exam";
  isActive: boolean;
};

export default function AdminAnnouncementsPage() {
  const [items, setItems] = useState<Announcement[]>([]);
  const [error, setError] = useState("");
  const [sendingId, setSendingId] = useState("");
  const [deletingId, setDeletingId] = useState("");
  const [form, setForm] = useState({
    title: "",
    message: "",
    level: "info",
    isActive: true,
  });

  async function load() {
    const response = await fetch("/api/admin/announcements");
    const data = await response.json();

    if (!response.ok) {
      setError(data.message || "Failed to load announcements");
      return;
    }

    setItems(data.announcements || []);
  }

  useEffect(() => {
    load();
  }, []);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");

    const response = await fetch("/api/admin/announcements", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    const data = await response.json();

    if (!response.ok) {
      setError(data.message || "Failed to post announcement");
      return;
    }

    setForm({ title: "", message: "", level: "info", isActive: true });
    load();
  }

  async function sendEmail(item: Announcement) {
    setSendingId(item._id);
    setError("");

    const usersRes = await fetch("/api/admin/stats");
    const usersData = await usersRes.json();

    if (!usersRes.ok) {
      setError(usersData.message || "Failed to load recipient list");
      setSendingId("");
      return;
    }

    const recipients = (usersData.recentUsers || [])
      .map((user: { email?: string }) => user.email)
      .filter(Boolean);

    const response = await fetch("/api/admin/announcements/email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        to: recipients,
        subject: item.title,
        html: `<h2>${item.title}</h2><p>${item.message}</p>`,
      }),
    });

    const data = await response.json();
    setSendingId("");

    if (!response.ok) {
      setError(data.message || "Failed to send announcement email");
    }
  }

  async function deleteAnnouncement(id: string) {
    setDeletingId(id);
    setError("");

    const response = await fetch(`/api/admin/announcements?id=${id}`, {
      method: "DELETE",
    });

    const data = await response.json();
    setDeletingId("");

    if (!response.ok) {
      setError(data.message || "Failed to delete announcement");
      return;
    }

    setItems((prev) => prev.filter((item) => item._id !== id));
  }

  return (
    <div>
      <h1 className="text-2xl font-bold">Announcements</h1>
      <p className="mt-2 text-sm text-slate-300">Post notices, updates and exam alerts for students and teachers.</p>

      <form onSubmit={onSubmit} className="mt-6 space-y-3 rounded-2xl border border-white/10 bg-white/5 p-4">
        <input className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm" placeholder="Title" value={form.title} onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))} required />
        <textarea className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm" rows={4} placeholder="Message" value={form.message} onChange={(e) => setForm((prev) => ({ ...prev, message: e.target.value }))} required />
        <div className="grid gap-3 sm:grid-cols-2">
          <select className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm" value={form.level} onChange={(e) => setForm((prev) => ({ ...prev, level: e.target.value as "info" | "warning" | "exam" }))}>
            <option value="info">Info</option>
            <option value="warning">Warning</option>
            <option value="exam">Exam Alert</option>
          </select>
          <label className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm">
            <input type="checkbox" checked={form.isActive} onChange={(e) => setForm((prev) => ({ ...prev, isActive: e.target.checked }))} />
            Active
          </label>
        </div>
        <button className="rounded-lg bg-cyan-500 px-4 py-2 text-sm font-semibold text-black">Publish Announcement</button>
      </form>

      {error ? <p className="mt-3 text-sm text-rose-300">{error}</p> : null}

      <div className="mt-6 space-y-3">
        {items.map((item) => (
          <article key={item._id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs uppercase tracking-[0.16em] text-cyan-200">{item.level}</p>
            <h2 className="mt-1 text-lg font-semibold">{item.title}</h2>
            <p className="mt-2 text-sm text-slate-300">{item.message}</p>
            <button
              onClick={() => sendEmail(item)}
              disabled={sendingId === item._id}
              className="mt-3 rounded-lg border border-cyan-300/30 bg-cyan-400/10 px-3 py-1 text-xs font-semibold text-cyan-100 disabled:opacity-60"
            >
              {sendingId === item._id ? "Sending..." : "Send Email Announcement"}
            </button>
            <button
              onClick={() => deleteAnnouncement(item._id)}
              disabled={deletingId === item._id}
              className="ml-2 mt-3 rounded-lg border border-rose-300/30 bg-rose-400/10 px-3 py-1 text-xs font-semibold text-rose-100 disabled:opacity-60"
            >
              {deletingId === item._id ? "Deleting..." : "Delete"}
            </button>
          </article>
        ))}
      </div>
    </div>
  );
}
