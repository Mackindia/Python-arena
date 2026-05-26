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

        {/* Embedded Application or Dev Welcome */}
        <div className="flex-1 w-full bg-slate-900 rounded-xl overflow-hidden border border-white/10 shadow-2xl flex items-center justify-center" style={{ minHeight: 'calc(100vh - 160px)' }}>
          {process.env.NODE_ENV === "development" ? (
            <div className="text-center p-8">
              <h2 className="text-3xl font-bold text-white mb-4">Welcome to Doon Scholars Timetable Management System</h2>
              <p className="text-slate-400 mb-8 max-w-lg mx-auto">
                You are currently in Development Mode. Please use the standalone server window (localhost:5173) that just opened to make your edits.
              </p>
              <a
                href="http://localhost:5173"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-indigo-500"
              >
                Open Development Server <ExternalLink className="h-4 w-4" />
              </a>
            </div>
          ) : (
            <iframe 
              src={timetableUrl}
              className="w-full h-full border-none bg-white" 
              title="School Timetable System"
              style={{ width: '100%', height: '100%', minHeight: '800px' }}
            />
          )}
        </div>

      </div>
    </div>
  );
}
