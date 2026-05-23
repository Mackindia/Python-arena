"use client";

import { useState } from "react";
import GlassCard from "../../components/ui/GlassCard";
import { useRouter } from "next/navigation";

export default function TeacherDashboard({ timetable, activeSessions, periods, teacher }: any) {
  const [loading, setLoading] = useState<string | null>(null);
  const router = useRouter();

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

  return (
    <div className="mx-auto max-w-4xl p-6">
      <h1 className="mb-2 text-2xl font-bold text-white">Teacher Dashboard</h1>
      <p className="mb-8 text-slate-400">Welcome, {teacher.teacher_name}</p>

      <div className="mb-6">
        <button
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-indigo-500"
          onClick={async () => {
            await fetch("/api/online-class/teacher/start", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                class: "6",
                section: "A",
                subject: "Math",
                teacher_id: "teacher1",
                meet_link: "https://meet.google.com/test",
                period_no: 1,
              }),
            });

            alert("Class Started");
            router.refresh();
          }}
        >
          START TEST CLASS
        </button>
      </div>

      <div className="space-y-4">
        {timetable.length === 0 ? (
          <p className="text-slate-400">No classes assigned for today.</p>
        ) : (
          timetable.map((entry: any) => {
            const period = periods.find((p: any) => p.period_no === entry.period_no);
            const activeSession = activeSessions.find((s: any) => s.period_no === entry.period_no && s.subject === entry.subject && s.class === entry.class);
            const isLive = !!activeSession;

            return (
              <GlassCard key={entry._id} className="flex items-center justify-between p-4 border-l-4 border-l-transparent hover:border-l-cyan-500 transition-all">
                <div>
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-semibold text-cyan-100">{entry.subject}</h3>
                    <span className="rounded-md bg-slate-800 px-2 py-0.5 text-xs text-slate-300">
                      Class {entry.class}{entry.section} {entry.group && entry.group !== "MAIN" ? `(${entry.group})` : ""}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-slate-400">
                    Period {entry.period_no} ({period?.start_time} - {period?.end_time})
                  </p>
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
                  ) : (
                    <button
                      onClick={() => handleAction("start", entry)}
                      disabled={loading === entry._id}
                      className="rounded-lg bg-emerald-600 px-6 py-2 text-sm font-bold text-white transition hover:bg-emerald-500 disabled:opacity-50"
                    >
                      {loading === entry._id ? "Processing..." : "START CLASS"}
                    </button>
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
