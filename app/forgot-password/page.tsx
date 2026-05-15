"use client";

import { useState } from "react";
import AppButton from "@/src/components/ui/AppButton";
import AppInput from "@/src/components/ui/AppInput";
import AppCard from "@/src/components/ui/AppCard";
import AppAlert from "@/src/components/ui/AppAlert";
import { Loader2 } from "lucide-react";

export default function ForgotPasswordPage() {
  const [username, setUsername] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) return;

    setStatus("loading");
    
    // Ensure 's' is added if they just typed the number
    const finalUsername = /^\d+$/.test(username.trim()) ? `s${username.trim()}` : username.trim();

    try {
      const res = await fetch("/api/reset-password/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: finalUsername }),
      });

      const data = await res.json();

      if (res.ok) {
        setStatus("success");
        setMessage("Request submitted! Please ask your teacher to approve it. Your password will be reset to 'password@doon' once approved.");
      } else {
        setStatus("error");
        setMessage(data.error || data.message || "Failed to submit request.");
      }
    } catch (err) {
      setStatus("error");
      setMessage("An unexpected error occurred. Please try again.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4">
      <AppCard className="w-full max-w-md shadow-2xl border-white/10 bg-slate-900">
        <div className="space-y-2 text-center mb-6">
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Forgot Password
          </h1>
          <p className="text-slate-400 text-sm">
            Enter your Admission Number to request a reset from your teacher.
          </p>
        </div>

        {status === "success" ? (
          <AppAlert variant="success">
            {message}
          </AppAlert>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="username" className="text-sm font-medium text-slate-300">
                Admission Number
              </label>
              <AppInput
                id="username"
                placeholder="e.g., 1085 or s1085"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>

            {status === "error" && (
              <AppAlert variant="error">
                {message}
              </AppAlert>
            )}

            <AppButton 
              type="submit" 
              className="w-full h-11 bg-cyan-600 hover:bg-cyan-500 text-white font-medium transition-colors"
              disabled={status === "loading" || !username.trim()}
            >
              {status === "loading" ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                "Request Password Reset"
              )}
            </AppButton>
          </form>
        )}
      </AppCard>
    </div>
  );
}
