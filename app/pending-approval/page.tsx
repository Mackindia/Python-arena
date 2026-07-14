"use client";

import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function PendingApprovalPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "pending" | "approved" | "rejected">("loading");

  useEffect(() => {
    if (!isLoaded) return;

    if (!user) {
      router.push("/sign-in");
      return;
    }

    // Check user status from our database
    fetch("/api/auth/status")
      .then((res) => res.json())
      .then((data) => {
        if (data.status === "approved") {
          router.push("/dashboard");
        } else if (data.status === "rejected") {
          setStatus("rejected");
        } else {
          setStatus("pending");
        }
      })
      .catch(() => {
        setStatus("pending");
      });
  }, [user, isLoaded, router]);

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  if (status === "rejected") {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-900 rounded-2xl border border-red-500/30 p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/20 flex items-center justify-center">
            <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Access Denied</h1>
          <p className="text-slate-400 mb-6">
            Your account has been rejected. Please contact your administrator for more information.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-slate-900 rounded-2xl border border-amber-500/30 p-8 text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-amber-500/20 flex items-center justify-center">
          <svg className="w-8 h-8 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">Pending Approval</h1>
        <p className="text-slate-400 mb-4">
          Your account is waiting for admin approval. You will be able to access the dashboard once approved.
        </p>
        <div className="bg-slate-800/50 rounded-lg p-4 mb-6">
          <p className="text-sm text-slate-300">
            <span className="font-medium">Account:</span> {user?.emailAddresses?.[0]?.emailAddress}
          </p>
          <p className="text-sm text-slate-400 mt-1">
            Status: <span className="text-amber-400 font-medium">Pending</span>
          </p>
        </div>
        <p className="text-xs text-slate-500 mb-4">
          This usually takes 1-2 hours. Contact your administrator if it takes longer.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="px-6 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-500 transition"
        >
          Check Status
        </button>
      </div>
    </div>
  );
}
