"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import toast from "react-hot-toast";

interface PendingUser {
  _id: string;
  clerkId: string;
  fullName: string;
  email: string;
  studentClass: string;
  status: string;
  createdAt: string;
}

export default function ApprovalsPage() {
  const { user } = useUser();
  const role = user?.publicMetadata?.role as string | undefined;
  const isAdmin = role === "admin" || role === "super_admin";

  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);

  useEffect(() => {
    if (isAdmin) {
      fetchPendingUsers();
    }
  }, [isAdmin]);

  const fetchPendingUsers = async () => {
    try {
      const res = await fetch("/api/admin/users?status=pending");
      const data = await res.json();
      setPendingUsers(data.users || []);
    } catch (error) {
      toast.error("Failed to fetch pending users");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (userId: string) => {
    setProcessing(userId);
    try {
      const res = await fetch("/api/admin/users/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, action: "approve" }),
      });

      if (res.ok) {
        toast.success("User approved!");
        setPendingUsers((prev) => prev.filter((u) => u._id !== userId));
      } else {
        toast.error("Failed to approve user");
      }
    } catch (error) {
      toast.error("Network error");
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (userId: string) => {
    setProcessing(userId);
    try {
      const res = await fetch("/api/admin/users/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, action: "reject" }),
      });

      if (res.ok) {
        toast.success("User rejected");
        setPendingUsers((prev) => prev.filter((u) => u._id !== userId));
      } else {
        toast.error("Failed to reject user");
      }
    } catch (error) {
      toast.error("Network error");
    } finally {
      setProcessing(null);
    }
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-red-400">Access Denied</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-2">User Approvals</h1>
        <p className="text-slate-400 mb-8">Review and approve new user registrations</p>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full mx-auto"></div>
            <p className="text-slate-400 mt-4">Loading pending users...</p>
          </div>
        ) : pendingUsers.length === 0 ? (
          <div className="bg-slate-900 rounded-2xl border border-white/10 p-12 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500/20 flex items-center justify-center">
              <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">All caught up!</h3>
            <p className="text-slate-400">No pending users to approve</p>
          </div>
        ) : (
          <div className="space-y-4">
            {pendingUsers.map((pendingUser) => (
              <div
                key={pendingUser._id}
                className="bg-slate-900 rounded-xl border border-white/10 p-6"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 rounded-full bg-cyan-500/20 flex items-center justify-center">
                        <span className="text-cyan-400 font-semibold">
                          {pendingUser.fullName?.charAt(0) || "?"}
                        </span>
                      </div>
                      <div>
                        <h3 className="font-semibold text-white">{pendingUser.fullName}</h3>
                        <p className="text-sm text-slate-400">{pendingUser.email}</p>
                      </div>
                    </div>
                    <div className="flex gap-4 text-sm text-slate-400 mt-2">
                      <span>Class: {pendingUser.studentClass || "Not set"}</span>
                      <span>Joined: {new Date(pendingUser.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleApprove(pendingUser._id)}
                      disabled={processing === pendingUser._id}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-500 transition disabled:opacity-50"
                    >
                      {processing === pendingUser._id ? "..." : "Approve"}
                    </button>
                    <button
                      onClick={() => handleReject(pendingUser._id)}
                      disabled={processing === pendingUser._id}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-500 transition disabled:opacity-50"
                    >
                      {processing === pendingUser._id ? "..." : "Reject"}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
