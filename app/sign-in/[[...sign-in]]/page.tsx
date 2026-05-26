"use client";

import { SignIn } from "@clerk/nextjs";
import Link from "next/link";
import GlassCard from "../../../components/ui/GlassCard";

export default function SignInPage() {
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

        <GlassCard className="border border-slate-800 bg-slate-900/60 p-6 shadow-xl mb-6">
          <div className="text-center">
             <h2 className="text-lg font-bold text-white mb-2">Student & Admin Login</h2>
             <p className="text-xs text-amber-400/90 font-medium bg-amber-950/30 p-3 rounded-lg border border-amber-900/50">
               <strong>Important Instruction:</strong><br />
               Please enter your Student ID (e.g. <strong>s1729</strong>) into the "Email address or username" box below.<br/>
               Use <strong>@doon</strong> at the end of your password.
             </p>
          </div>
        </GlassCard>

        <div className="flex justify-center">
          <SignIn forceRedirectUrl="/dashboard" fallbackRedirectUrl="/dashboard" />
        </div>

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