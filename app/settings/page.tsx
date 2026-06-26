"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Check, ChevronDown, GraduationCap, Loader2 } from "lucide-react";

const CLASS_OPTIONS = ["6", "7", "8", "9", "10", "11", "12"];

type DbUser = {
  id: string;
  fullName: string;
  username?: string;
  role: string;
  class?: string;
  section?: string;
};

export default function SettingsPage() {
  const [user, setUser] = useState<DbUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedClass, setSelectedClass] = useState("");
  const [currentClass, setCurrentClass] = useState("");
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    async function fetchUser() {
      try {
        const res = await fetch("/api/auth/me");
        const data = await res.json();
        if (data.user) {
          setUser(data.user);
          const cls = data.user.class || "";
          const num = cls.replace("Class ", "");
          setSelectedClass(num);
          setCurrentClass(num);
        }
      } catch {
        setMessage({ type: "error", text: "Failed to load profile" });
      } finally {
        setLoading(false);
      }
    }
    fetchUser();
  }, []);

  const hasChanges = selectedClass && selectedClass !== currentClass;

  async function handleSave() {
    if (!hasChanges) return;

    setSaving(true);
    setMessage(null);

    try {
      const res = await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ class: selectedClass }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage({ type: "error", text: data.error || "Failed to update" });
        return;
      }

      setCurrentClass(selectedClass);
      setMessage({ type: "success", text: `Class updated to Class ${selectedClass}` });
    } catch {
      setMessage({ type: "error", text: "Something went wrong. Try again." });
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-black px-4 py-10 text-white sm:px-6 lg:px-10">
        <div className="mx-auto max-w-2xl space-y-6">
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-cyan-400" />
          </div>
        </div>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="min-h-screen bg-black px-4 py-10 text-white sm:px-6 lg:px-10">
        <div className="mx-auto max-w-2xl space-y-6">
          <section className="rounded-[2rem] border border-white/10 bg-white/5 p-8 text-center backdrop-blur-xl">
            <p className="text-slate-300">You are not logged in.</p>
            <Link href="/sign-in" className="mt-4 inline-block text-cyan-400 hover:underline">
              Sign in
            </Link>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black px-4 py-10 text-white sm:px-6 lg:px-10">
      <div className="mx-auto max-w-2xl space-y-6">
        {/* Header */}
        <section className="rounded-[2rem] border border-white/10 bg-white/5 p-6 shadow-[0_24px_80px_rgba(0,0,0,0.35)] backdrop-blur-xl sm:p-8">
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard"
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-400 transition hover:bg-white/10 hover:text-white"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <p className="text-sm uppercase tracking-[0.24em] text-cyan-200">Profile Settings</p>
              <h1 className="mt-1 text-2xl font-bold sm:text-3xl">{user.fullName}</h1>
            </div>
          </div>
        </section>

        {/* Class Editor */}
        <section className="rounded-[2rem] border border-white/10 bg-white/5 p-6 shadow-[0_24px_80px_rgba(0,0,0,0.35)] backdrop-blur-xl sm:p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-indigo-400/30 bg-indigo-500/10">
              <GraduationCap className="h-5 w-5 text-indigo-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Your Class</h2>
              <p className="text-sm text-slate-400">Select the correct class you are currently in</p>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-black/30 p-5 space-y-5">
            {/* Current class display */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-400">Currently set as</span>
              <span className="text-sm font-semibold text-white">
                Class {currentClass || "Not set"}
              </span>
            </div>

            {/* Class selector */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Change to
              </label>
              <div className="relative">
                <select
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                  className="w-full appearance-none rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition focus:border-cyan-400/50 focus:ring-2 focus:ring-cyan-400/20"
                >
                  {CLASS_OPTIONS.map((cls) => (
                    <option key={cls} value={cls} className="bg-slate-900 text-white">
                      Class {cls}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
              </div>
            </div>

            {/* Info note */}
            <div className="rounded-xl border border-cyan-400/20 bg-cyan-400/5 px-4 py-3">
              <p className="text-xs text-cyan-200">
                Your class determines which programs and content are shown to you in the Programs Library.
                If your class was entered incorrectly during registration, you can fix it here.
              </p>
            </div>

            {/* Message */}
            {message && (
              <div
                className={`rounded-xl px-4 py-3 text-sm ${
                  message.type === "success"
                    ? "border border-green-500/30 bg-green-500/10 text-green-300"
                    : "border border-red-500/30 bg-red-500/10 text-red-300"
                }`}
              >
                {message.text}
              </div>
            )}

            {/* Save button */}
            <button
              onClick={handleSave}
              disabled={!hasChanges || saving}
              className={`flex w-full items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold transition ${
                hasChanges
                  ? "bg-gradient-to-r from-indigo-500 to-blue-500 text-white shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40"
                  : "cursor-not-allowed bg-white/5 text-slate-500"
              }`}
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : hasChanges ? (
                <>
                  <Check className="h-4 w-4" />
                  Save Changes
                </>
              ) : (
                "No changes to save"
              )}
            </button>
          </div>
        </section>

        {/* Account info (read-only) */}
        <section className="rounded-[2rem] border border-white/10 bg-white/5 p-6 shadow-[0_24px_80px_rgba(0,0,0,0.35)] backdrop-blur-xl sm:p-8">
          <h2 className="text-lg font-semibold mb-4">Account Info</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between rounded-xl border border-white/5 bg-black/20 px-4 py-3">
              <span className="text-sm text-slate-400">Name</span>
              <span className="text-sm font-medium text-white">{user.fullName}</span>
            </div>
            {user.username && (
              <div className="flex items-center justify-between rounded-xl border border-white/5 bg-black/20 px-4 py-3">
                <span className="text-sm text-slate-400">Username</span>
                <span className="text-sm font-medium text-white">@{user.username}</span>
              </div>
            )}
            <div className="flex items-center justify-between rounded-xl border border-white/5 bg-black/20 px-4 py-3">
              <span className="text-sm text-slate-400">Role</span>
              <span className="text-sm font-medium text-white capitalize">{user.role}</span>
            </div>
            {user.section && (
              <div className="flex items-center justify-between rounded-xl border border-white/5 bg-black/20 px-4 py-3">
                <span className="text-sm text-slate-400">Section</span>
                <span className="text-sm font-medium text-white">{user.section}</span>
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
