"use client";

import { useState, useEffect } from "react";
import GlassCard from "../../components/ui/GlassCard";

export default function StudentDashboard({ timetable, activeSessions, periods, userClass, userSection, userGroup }: any) {
  const [loading, setLoading] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleJoin = async (sessionId: string, subject: string, periodNo: number) => {
    setLoading(sessionId);
    try {
      const res = await fetch("/api/online-class/student/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, subject, periodNo, class: userClass, section: userSection, group: userGroup }),
      });
      const data = await res.json();
      if (data.meet_link) {
        window.open(data.meet_link, "_blank");
      } else {
        alert(data.error || "Failed to join class");
      }
    } catch (err) {
      alert("Error joining class");
    } finally {
      setLoading(null);
    }
  };

  const getStatus = (entry: any) => {
    const active = activeSessions.find((s: any) => s.period_no === entry.period_no && s.subject === entry.subject);
    if (active) return "ACTIVE";

    // Just basic logic for UPCOMING / COMPLETED (Phase 1)
    const period = periods.find((p: any) => p.period_no === entry.period_no);
    if (!period) return "UNKNOWN";

    if (!mounted) return "UPCOMING";

    const now = new Date();
    const [h, m] = period.end_time.split(":").map(Number);
    const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, m);
    
    if (now > end) return "COMPLETED";
    return "UPCOMING";
  };

  return (
    <div className="mx-auto max-w-4xl p-6">
      <h1 className="mb-2 text-2xl font-bold text-white">Online Class Dashboard</h1>
      <p className="mb-8 text-slate-400">Class {userClass} - Section {userSection} {userGroup && userGroup !== "MAIN" ? `(${userGroup} Elective)` : ""}</p>

      <div className="space-y-4">
        {timetable.length === 0 ? (
          <p className="text-slate-400">No classes scheduled for today.</p>
        ) : (
          timetable.map((entry: any) => {
            const period = periods.find((p: any) => p.period_no === entry.period_no);
            const activeSession = activeSessions.find((s: any) => s.period_no === entry.period_no && s.subject === entry.subject);
            const status = getStatus(entry);

            return (
              <GlassCard key={entry._id} className="flex items-center justify-between p-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-semibold text-cyan-100">{entry.subject}</h3>
                    {entry.group && entry.group !== "MAIN" && (
                      <span className="rounded-md bg-amber-500/20 px-1.5 py-0.5 text-[10px] font-medium text-amber-300 border border-amber-500/30">
                        {entry.group}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-slate-400">
                    Period {entry.period_no} ({period?.start_time} - {period?.end_time})
                  </p>
                </div>
                
                <div>
                  {status === "ACTIVE" && activeSession ? (
                    <button
                      onClick={() => handleJoin(activeSession._id, entry.subject, entry.period_no)}
                      disabled={loading === activeSession._id}
                      className="rounded-lg bg-emerald-600 px-6 py-2 text-sm font-bold text-white transition hover:bg-emerald-500 disabled:opacity-50"
                    >
                      {loading === activeSession._id ? "Joining..." : "JOIN NOW"}
                    </button>
                  ) : (
                    <span suppressHydrationWarning className={`rounded-full px-3 py-1 text-xs font-medium ${
                      status === "COMPLETED" ? "bg-slate-800 text-slate-400" : "bg-blue-900/40 text-blue-300"
                    }`}>
                      {status}
                    </span>
                  )}
                </div>
              </GlassCard>
            );
          })
        )}
      </div>
    </div>
  );
}