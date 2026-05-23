"use client";

import GlassCard from "../../components/ui/GlassCard";

export default function AdminDashboard({ liveSessions }: any) {
  return (
    <div className="mx-auto max-w-5xl p-6">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Admin Monitor</h1>
          <p className="text-slate-400">Live Online Classes Overview</p>
        </div>
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm font-semibold text-red-400">
          <span className="mr-2 animate-pulse">●</span>
          {liveSessions.length} Live Classes
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {liveSessions.length === 0 ? (
          <div className="col-span-full p-8 text-center text-slate-500">
            No live classes running currently.
          </div>
        ) : (
          liveSessions.map((session: any) => (
            <GlassCard key={session._id} className="p-5 border-t-4 border-t-emerald-500">
              <h3 className="text-xl font-bold text-white">{session.subject}</h3>
              <p className="text-sm font-medium text-cyan-300 mb-4">
                Class {session.class} - {session.section} (Period {session.period_no})
              </p>
              
              <div className="text-xs text-slate-400 mb-6 space-y-1">
                <p>Teacher ID: {session.teacher_id}</p>
                <p suppressHydrationWarning>Started: {new Date(session.created_at || session.createdAt).toLocaleTimeString()}</p>
              </div>

              <a
                href={session.meet_link}
                target="_blank"
                rel="noreferrer"
                className="block w-full rounded-lg bg-blue-600 py-2 text-center text-sm font-bold text-white transition hover:bg-blue-500"
              >
                WATCH CLASS
              </a>
            </GlassCard>
          ))
        )}
      </div>
    </div>
  );
}
