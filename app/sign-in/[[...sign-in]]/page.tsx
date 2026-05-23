"use client";

import { useState } from "react";
import { SignIn } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import Link from "next/link";
import GlassCard from "../../../components/ui/GlassCard";

export default function SignInPage() {
  const [activeTab, setActiveTab] = useState<"school" | "clerk">("school");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLocalLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        // Force fully reload navigation and state
        window.location.href = "/online-class";
      } else {
        setError(data.error || "Invalid username or password");
      }
    } catch (err) {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-slate-950 px-4 py-10 text-white">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-cyan-400 to-indigo-400 bg-clip-text text-transparent">
            PYTHON ARENA
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            Welcome to the school class scheduling portal.
          </p>
        </div>

        {/* Tab switcher */}
        <div className="mb-6 flex rounded-xl bg-slate-900/80 p-1 border border-slate-800">
          <button
            onClick={() => setActiveTab("school")}
            className={`w-1/2 rounded-lg py-2.5 text-sm font-semibold transition ${
              activeTab === "school"
                ? "bg-cyan-600 text-white shadow"
                : "text-slate-450 hover:text-slate-200"
            }`}
          >
            School ID Login
          </button>
          <button
            onClick={() => setActiveTab("clerk")}
            className={`w-1/2 rounded-lg py-2.5 text-sm font-semibold transition ${
              activeTab === "clerk"
                ? "bg-cyan-600 text-white shadow"
                : "text-slate-450 hover:text-slate-200"
            }`}
          >
            Social Login
          </button>
        </div>

        {activeTab === "school" ? (
          <GlassCard className="border border-slate-800 bg-slate-900/60 p-6 shadow-xl">
            <h2 className="mb-4 text-lg font-bold text-white">School Sign In</h2>
            {error && (
              <div className="mb-4 rounded-lg bg-rose-950/40 border border-rose-800/40 p-3 text-xs text-rose-400">
                {error}
              </div>
            )}
            <form onSubmit={handleLocalLogin} className="space-y-4">
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-450">Username</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. ST24001, abhishek6342"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-2.5 text-sm text-white placeholder-slate-650 focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-450">Password</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-2.5 text-sm text-white placeholder-slate-650 focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="mt-6 w-full rounded-xl bg-cyan-600 py-3 text-sm font-bold text-white transition hover:bg-cyan-500 disabled:opacity-50 shadow-[0_0_20px_rgba(6,182,212,0.2)]"
              >
                {loading ? "Authenticating..." : "SIGN IN"}
              </button>
            </form>
          </GlassCard>
        ) : (
          <div className="flex justify-center">
            <SignIn forceRedirectUrl="/dashboard" fallbackRedirectUrl="/dashboard" />
          </div>
        )}

        <div className="mt-8 text-center">
          <p className="text-slate-500 text-sm">
            Forgot your password?{" "}
            <Link
              href="/forgot-password"
              className="text-cyan-400 hover:text-cyan-300 font-medium transition-colors"
            >
              Request a reset from Admin
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}