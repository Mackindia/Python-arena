"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import GlassCard from "../../components/ui/GlassCard";
import { useRouter } from "next/navigation";
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

export default function TeacherDashboard({ timetable, activeSessions, periods, teacher, todayName }: any) {
  const [loading, setLoading] = useState<string | null>(null);
  const [selectedDay, setSelectedDay] = useState<string>(todayName || "Monday");
  const router = useRouter();

  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  const resolvedTodayName = todayName || days[new Date().getDay() - 1] || "Monday";

  const availableDaySet = new Set(
    (timetable || []).map((entry: any) => String(entry.day || "")).filter(Boolean)
  );
  const dayOptions = days.filter((day) => availableDaySet.has(day));

  useEffect(() => {
    if (dayOptions.length === 0) return;
    if (dayOptions.includes(selectedDay)) return;

    const defaultDay = dayOptions.includes(resolvedTodayName) ? resolvedTodayName : dayOptions[0];
    setSelectedDay(defaultDay);
  }, [dayOptions.join("|"), selectedDay, resolvedTodayName]);

  const filteredTimetable = (timetable || []).filter((entry: any) => {
    if (dayOptions.length === 0) return true;
    return entry.day === selectedDay;
  });

  const groupedByPeriod = filteredTimetable.reduce((acc: Record<number, any[]>, entry: any) => {
    const key = Number(entry.period_no || 0);
    if (!acc[key]) acc[key] = [];
    acc[key].push(entry);
    return acc;
  }, {});

  const sortedPeriods = Object.keys(groupedByPeriod)
    .map((k) => Number(k))
    .sort((a, b) => a - b);

  if (!teacher) {
    return <div className="p-6 text-red-400">Teacher profile not found. Please contact admin.</div>;
  }

  const handleAction = async (action: "start" | "end", entry: any) => {
    setLoading(entry._id);
    try {
      const res = await fetch(`/api/online-class/teacher/${action}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          class: entry.class, 
          section: entry.section, 
          group: entry.group || "MAIN",
          subject: entry.subject, 
          periodNo: entry.period_no,
          meetLink: teacher.meet_link
        }),
      });
      
      const data = await res.json();
      if (data.success) {
        if (action === "start") {
          window.open(teacher.meet_link, "_blank");
        }
        router.refresh();
      } else {
        alert(data.error || "Action failed");
      }
    } catch (err) {
      alert("Error performing action");
    } finally {
      setLoading(null);
    }
  };

  const getStatus = (entry: any) => {
    if (entry.day !== resolvedTodayName) return "SCHEDULED";

    const active = activeSessions.find(
      (s: any) =>
        s.period_no === entry.period_no &&
        s.subject === entry.subject &&
        s.class === entry.class &&
        s.section === entry.section &&
        s.group === (entry.group || "MAIN") &&
        s.teacher_id === teacher.teacher_id
    );
    if (active) return "LIVE";

    const period = periods.find((p: any) => p.period_no === entry.period_no);
    if (!period) return "UPCOMING";

    const start = parseTimeToMinutes(period.start_time);
    const end = parseTimeToMinutes(period.end_time);
    if (start === null || end === null) return "UPCOMING";

    const now = new Date();
    const nowMinutes = now.getHours() * 60 + now.getMinutes();

    if (nowMinutes > end) return "COMPLETED";
    if (nowMinutes < start) return "UPCOMING";
    return "ACTIVE";
  };

  return (
    <div className="mx-auto max-w-4xl p-6 text-white">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4 rounded-2xl border border-cyan-300/45 bg-gradient-to-r from-[#071423] via-[#0b1f33] to-[#0a2a2a] p-4 shadow-[0_10px_32px_rgba(34,211,238,0.22)]">
        <div>
          <h1 className="mb-1 text-2xl font-extrabold tracking-tight text-white">Teacher Dashboard</h1>
          <p className="text-sm font-semibold text-cyan-50">Welcome back, {teacher.teacher_name}</p>
        </div>
        <Link
          href="/online-class/upcoming"
          className="inline-flex items-center gap-2 rounded-xl border border-cyan-200/80 bg-cyan-500/45 px-4 py-2 text-sm font-semibold text-white transition hover:bg-cyan-400/55"
        >
          <CalendarDays className="h-4 w-4" />
          View Upcoming Schedule
        </Link>
      </div>

      {dayOptions.length > 0 ? (
        <div className="mb-6 flex items-center gap-3">
          <label className="rounded-md border border-cyan-300/60 bg-cyan-950/75 px-2 py-1 text-xs font-bold uppercase tracking-wide text-cyan-100">Day</label>
          <select
            value={selectedDay}
            onChange={(e) => setSelectedDay(e.target.value)}
            className="rounded-lg border border-cyan-300/80 bg-[#091626] px-3 py-2 text-sm font-semibold text-white outline-none focus:border-cyan-200"
          >
            {dayOptions.map((day) => (
              <option key={day} value={day}>{day}</option>
            ))}
          </select>
        </div>
      ) : null}

      <div className="space-y-4">
        {filteredTimetable.length === 0 ? (
          <p className="text-slate-100">No classes assigned for selected day.</p>
        ) : (
          sortedPeriods.map((periodNo) => {
            const periodMeta = periods.find((p: any) => p.period_no === periodNo);
            const items = groupedByPeriod[periodNo] || [];

            return (
              <div key={`period-group-${periodNo}`} className="space-y-2">
                <div className="rounded-lg border border-cyan-300/55 bg-gradient-to-r from-[#0a1728] to-[#13233a] px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-cyan-50">
                  Period {periodNo} {periodMeta ? `(${periodMeta.start_time} - ${periodMeta.end_time})` : ""}
                </div>

                {items.map((entry: any) => {
                  const activeSession = activeSessions.find(
                    (s: any) =>
                      s.period_no === entry.period_no &&
                      s.subject === entry.subject &&
                      s.class === entry.class &&
                      s.section === entry.section &&
                      s.group === (entry.group || "MAIN") &&
                      s.teacher_id === teacher.teacher_id
                  );
                  const status = getStatus(entry);
                  const isLive = status === "LIVE";

                  return (
                    <GlassCard key={entry._id} className="flex items-center justify-between border border-cyan-300/35 bg-[#081321]/95 p-4 border-l-4 border-l-cyan-300 hover:border-l-emerald-300 transition-all">
                      <div>
                        <div className="flex items-center gap-3">
                          <h3 className="rounded-md border border-cyan-300/55 bg-cyan-950/75 px-2 py-1 text-base font-bold tracking-wide text-cyan-100">{entry.subject}</h3>
                          <span className="rounded-md border border-emerald-300/50 bg-emerald-950/75 px-2 py-0.5 text-xs font-bold text-emerald-100">
                            Class {entry.class || "-"}{entry.section || ""} {entry.group && entry.group !== "MAIN" ? `(${entry.group})` : ""}
                          </span>
                        </div>
                        <div className="mt-1">
                          <span className="rounded-md border border-violet-300/50 bg-violet-950/70 px-2 py-0.5 text-xs font-semibold text-violet-100">
                            {entry.day}
                          </span>
                        </div>
                      </div>

                      <div>
                        {isLive ? (
                          <div className="flex items-center gap-3">
                            <span className="animate-pulse text-xs font-bold text-red-500">● LIVE</span>

                            <a
                              href={teacher.meet_link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-blue-500"
                            >
                              OPEN MEET
                            </a>

                            <button
                              onClick={() => handleAction("end", entry)}
                              disabled={loading === entry._id}
                              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-red-500 disabled:opacity-50"
                            >
                              {loading === entry._id ? "Processing..." : "END CLASS"}
                            </button>
                          </div>
                        ) : status === "ACTIVE" ? (
                          <button
                            onClick={() => handleAction("start", entry)}
                            disabled={loading === entry._id}
                            className="rounded-lg bg-emerald-600 px-6 py-2 text-sm font-bold text-white transition hover:bg-emerald-500 disabled:opacity-50"
                          >
                            {loading === entry._id ? "Processing..." : "START CLASS"}
                          </button>
                        ) : status === "SCHEDULED" ? (
                          <span className="rounded-full bg-indigo-900/40 px-3 py-1 text-xs font-semibold text-indigo-300">SCHEDULED</span>
                        ) : status === "COMPLETED" ? (
                          <span className="rounded-full bg-slate-800 px-3 py-1 text-xs font-semibold text-slate-300">CLASS ENDED</span>
                        ) : (
                          <span className="rounded-full bg-blue-900/40 px-3 py-1 text-xs font-semibold text-blue-300">UPCOMING</span>
                        )}
                      </div>
                    </GlassCard>
                  );
                })}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
