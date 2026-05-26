"use client";

import Link from "next/link";
import { ArrowLeft, ExternalLink } from "lucide-react";

import { useState, useEffect } from "react";

export default function AdminTimetablePage() {
  const [timetableUrl, setTimetableUrl] = useState("/timetable/index.html");

  useEffect(() => {
    setTimetableUrl(`/timetable/index.html?v=${new Date().getTime()}`);
  }, []);

  return (
    <div className="min-h-screen bg-black px-4 py-8 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl h-full flex flex-col">
        
        {/* Header */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/admin"
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-400 transition hover:text-white hover:bg-white/10"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-white">School Timetable</h1>
              <p className="text-slate-400">Integrated Scheduling System</p>
            </div>
          </div>
          <a
            href={timetableUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/20"
          >
            Open Standalone <ExternalLink className="h-4 w-4" />
          </a>
        </div>

        {/* Full-Screen Launch Panel */}
        <div className="flex-1 w-full bg-slate-900 rounded-xl overflow-hidden border border-white/10 shadow-2xl flex flex-col items-center justify-center p-8 text-center" style={{ minHeight: 'calc(100vh - 160px)' }}>
          <div className="bg-slate-800 p-8 rounded-2xl border border-white/10 max-w-2xl w-full shadow-lg">
            <div className="w-16 h-16 bg-indigo-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <ExternalLink className="h-8 w-8 text-indigo-400" />
            </div>
            
            <h2 className="text-3xl font-bold text-white mb-4">Timetable Management Engine</h2>
            
            <p className="text-slate-400 mb-8 leading-relaxed">
              To provide you with the maximum screen space for the 8-period Mastersheet and to ensure the <strong>Print to PDF</strong> engine works flawlessly, the Timetable System runs in a dedicated fullscreen window.
            </p>

            <a
              href={process.env.NODE_ENV === "development" ? "http://localhost:5173" : timetableUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-3 w-full sm:w-auto rounded-xl bg-indigo-600 px-8 py-4 text-base font-bold text-white shadow-lg shadow-indigo-500/30 transition-all hover:bg-indigo-500 hover:scale-105 hover:shadow-indigo-500/50"
            >
              Launch Timetable System <ExternalLink className="h-5 w-5" />
            </a>

            <div className="mt-8 pt-8 border-t border-white/10 text-sm text-slate-500">
              <p>Data automatically synchronizes with the main LMS database.</p>
              <p>All updates apply instantly across the platform.</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
