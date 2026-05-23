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

        {/* Embedded Application */}
        <div className="flex-1 w-full bg-white rounded-xl overflow-hidden border border-white/10 shadow-2xl" style={{ minHeight: 'calc(100vh - 160px)' }}>
          <iframe 
            src={timetableUrl}
            className="w-full h-full border-none" 
            title="School Timetable System"
            style={{ width: '100%', height: '100%', minHeight: '800px' }}
          />
        </div>

      </div>
    </div>
  );
}
