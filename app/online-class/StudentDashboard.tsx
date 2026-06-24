"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import GlassCard from "../../components/ui/GlassCard";
import { CalendarDays } from "lucide-react";

function parseTimeToMinutes(raw: string): number | null {
  if (!raw) return null;
  const value = raw.trim().toLowerCase();
  const m = value.match(/^(\d{1,2}):(\d{2})(?:\s*(am|pm))?$/i);
  if (!m) return null;

  let hours = Number(m[1]);
  const mins = Number(m[2]);
  const meridiem = m[3];

  if (Number.isNaN(hours) || Number.isNaN(mins)) return null;

  if (meridiem) {
    if (meridiem === "pm" && hours < 12) hours += 12;
    if (meridiem === "am" && hours === 12) hours = 0;
  }

  return hours * 60 + mins;
}

export default function StudentDashboard({ timetable, activeSessions, periods, userClass, userSection, userGroup }: any) {
  const [loading, setLoading] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleJoin = async (sessionId: string, subject: string, periodNo: number, group: string) => {
    setLoading(sessionId);
    try {
      const res = await fetch("/api/online-class/student/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, subject, periodNo, class: userClass, section: userSection, group }),
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
    const active = activeSessions.find(
      (s: any) =>
        s.period_no === entry.period_no &&
        s.subject === entry.subject &&
        s.teacher_id === entry.teacher_id &&
        s.class === entry.class &&
        s.section === entry.section
    );
    if (active) return "ACTIVE";

    const period = periods.find((p: any) => p.period_no === entry.period_no);
    if (!period) return "UNKNOWN";

    if (!mounted) return "UPCOMING";

    const start = parseTimeToMinutes(period.start_time);
    const end = parseTimeToMinutes(period.end_time);
    if (start === null || end === null) return "UPCOMING";

    const now = new Date();
    const nowMinutes = now.getHours() * 60 + now.getMinutes();

    if (nowMinutes > end) return "COMPLETED";
    if (nowMinutes < start) return "UPCOMING";
    return "ACTIVE";
  };

  const groupedByPeriod = (timetable || []).reduce((acc: Record<number, any[]>, entry: any) => {
    const key = Number(entry.period_no || 0);
    if (!acc[key]) acc[key] = [];
    acc[key].push(entry);
    return acc;
  }, {});

  const sortedPeriods = Object.keys(groupedByPeriod)
    .map((k) => Number(k))
    .sort((a, b) => a - b);

  return (
    <div className="mx-auto max-w-4xl p-6 text-white">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4 rounded-2xl border border-violet-300/45 bg-gradient-to-r from-[#1b1033] via-[#171f3d] to-[#102641] p-4 shadow-[0_10px_32px_rgba(167,139,250,0.22)]">
        <div>
          <h1 className="mb-1 text-2xl font-extrabold tracking-tight text-white">Online Class Dashboard</h1>
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className="font-semibold text-violet-50">Welcome,</span>
            <span className="rounded-md border border-emerald-300/50 bg-emerald-950/75 px-2 py-0.5 text-xs font-bold text-emerald-100">
              Class {userClass}{userSection} {userGroup && userGroup !== "MAIN" ? `(${userGroup})` : ""}
            </span>
          </div>
        </div>
        <Link
          href="/online-class/upcoming"
          className="inline-flex items-center gap-2 rounded-xl border border-violet-200/80 bg-violet-500/45 px-4 py-2 text-sm font-semibold text-white transition hover:bg-violet-400/55"
        >
          <CalendarDays className="h-4 w-4" />
          View Upcoming Schedule
        </Link>
      </div>

      <div className="space-y-4">
        {timetable.length === 0 ? (
          <p className="text-slate-100">No classes scheduled for today.</p>
        ) : (
          <>
            {timetable.length > 1 ? (
              <div className="rounded-xl border border-amber-200/55 bg-amber-500/28 p-3 text-sm text-amber-50">
                Multiple classes/subjects are listed for today. Choose the one that matches your allotted subject/group when active.
              </div>
            ) : null}
            {sortedPeriods.map((periodNo) => {
              const period = periods.find((p: any) => p.period_no === periodNo);
              const items = groupedByPeriod[periodNo] || [];

              return (
                <div key={`student-period-group-${periodNo}`} className="space-y-2">
                  <div className="rounded-lg border border-violet-300/55 bg-gradient-to-r from-[#1a1030] to-[#142745] px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-violet-50">
                    Period {periodNo} {period ? `(${period.start_time} - ${period.end_time})` : ""}
                  </div>

                  {items.map((entry: any) => {
                    const activeSession = activeSessions.find(
                      (s: any) =>
                        s.period_no === entry.period_no &&
                        s.subject === entry.subject &&
                        s.teacher_id === entry.teacher_id &&
                        s.class === entry.class &&
                        s.section === entry.section
                    );
                    const status = getStatus(entry);

                    return (
                      <GlassCard key={entry._id} className="flex items-center justify-between border border-violet-300/35 bg-[#110f24]/95 p-4 border-l-4 border-l-violet-300 hover:border-l-sky-300 transition-all">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="rounded-md border border-cyan-300/55 bg-cyan-950/75 px-2 py-1 text-base font-bold tracking-wide text-cyan-100">{entry.subject}</h3>
                            {entry.teacher_id && (
                              <span className="rounded-md border border-violet-200/45 bg-violet-500/25 px-1.5 py-0.5 text-[10px] font-semibold text-violet-50">
                                {entry.teacher_id}
                              </span>
                            )}
                            {entry.group && entry.group !== "MAIN" && (
                              <span className="rounded-md bg-amber-500/20 px-1.5 py-0.5 text-[10px] font-semibold text-amber-100 border border-amber-500/30">
                                {entry.group}
                              </span>
                            )}
                          </div>
                          <div className="mt-1 flex items-center gap-2">
                            <span className="rounded-md border border-emerald-300/50 bg-emerald-950/75 px-2 py-0.5 text-[11px] font-bold text-emerald-100">
                              Class {entry.class}{entry.section}
                              {entry.group && entry.group !== "MAIN" ? ` (${entry.group})` : ""}
                            </span>
                            <span className="rounded-md border border-violet-300/50 bg-violet-950/70 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-violet-100">
                              Today
                            </span>
                          </div>
                        </div>

                        <div>
                          {status === "ACTIVE" && activeSession ? (
                            <button
                              onClick={() => handleJoin(activeSession._id, entry.subject, entry.period_no, entry.group || "MAIN")}
                              disabled={loading === activeSession._id}
                              className="rounded-lg bg-emerald-600 px-6 py-2 text-sm font-bold text-white transition hover:bg-emerald-500 disabled:opacity-50"
                            >
                              {loading === activeSession._id ? "Joining..." : "JOIN NOW"}
                            </button>
                          ) : (
                            <span suppressHydrationWarning className={`rounded-full px-3 py-1 text-xs font-medium ${
                              status === "COMPLETED" ? "bg-slate-800 text-slate-400" : "bg-blue-900/40 text-blue-300"
                            }`}>
                              {status === "COMPLETED" ? "CLASS ENDED" : status}
                            </span>
                          )}
                        </div>
                      </GlassCard>
                    );
                  })}
                </div>
              );
            })}
          </>
        )}
      </div>
    </div>
  );
}