"use client";

import { useEffect, useState } from "react";
import AppCard from "@/src/components/ui/AppCard";
import AppButton from "@/src/components/ui/AppButton";
import AppAlert from "@/src/components/ui/AppAlert";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import toast from "react-hot-toast";

type ResetRequest = {
  _id: string;
  username: string;
  createdAt: string;
  status: string;
};

export default function AdminResetsPage() {
  const [requests, setRequests] = useState<ResetRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [processingAction, setProcessingAction] = useState<"approve" | "reject" | null>(null);

  const fetchRequests = async () => {
    try {
      const res = await fetch("/api/reset-password/list");
      if (res.ok) {
        const data = await res.json();
        setRequests(data);
      }
    } catch (error) {
      console.error("Failed to fetch requests", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleApprove = async (id: string, username: string) => {
    setProcessingId(id);
    setProcessingAction("approve");
    try {
      const res = await fetch("/api/reset-password/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId: id, username }),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success(`Approved! Password reset to: ${data.tempPassword}`, {
          duration: 10000,
        });
        setRequests(requests.filter(r => r._id !== id));
      } else {
        toast.error(data.error || "Failed to approve request");
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
    } finally {
      setProcessingId(null);
      setProcessingAction(null);
    }
  };

  const handleReject = async (id: string) => {
    setProcessingId(id);
    setProcessingAction("reject");
    try {
      const res = await fetch("/api/reset-password/reject", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId: id }),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success("Password reset request cancelled successfully");
        setRequests(requests.filter(r => r._id !== id));
      } else {
        toast.error(data.error || "Failed to cancel request");
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
    } finally {
      setProcessingId(null);
      setProcessingAction(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 p-8">
      <div className="container mx-auto max-w-4xl">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white">Password Resets</h1>
            <p className="text-slate-400 mt-1">Manage student password reset requests.</p>
          </div>
          <AppButton onClick={fetchRequests} className="bg-slate-800 hover:bg-slate-700">
            Refresh List
          </AppButton>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-cyan-500" />
          </div>
        ) : requests.length === 0 ? (
          <AppCard className="bg-slate-900 border-dashed border-slate-700">
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <CheckCircle2 className="h-12 w-12 text-emerald-500 mb-4" />
              <p className="text-lg font-medium text-white">All caught up!</p>
              <p className="text-slate-400">There are no pending password reset requests.</p>
            </div>
          </AppCard>
        ) : (
          <div className="grid gap-4">
            {requests.map((request) => (
              <AppCard key={request._id} className="bg-slate-900 border-slate-800">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-white">
                      Username: {request.username}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">
                      Requested on: {new Date(request.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <AppButton
                      onClick={() => handleReject(request._id)}
                      disabled={processingId === request._id}
                      className="bg-rose-950/40 border border-rose-800/80 text-rose-300 hover:bg-rose-900/60"
                    >
                      {processingId === request._id && processingAction === "reject" ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <XCircle className="h-4 w-4 mr-2" />
                      )}
                      Cancel Request
                    </AppButton>
                    <AppButton
                      onClick={() => handleApprove(request._id, request.username)}
                      disabled={processingId === request._id}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white"
                    >
                      {processingId === request._id && processingAction === "approve" ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : "Approve Reset"}
                    </AppButton>
                  </div>
                </div>
              </AppCard>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

