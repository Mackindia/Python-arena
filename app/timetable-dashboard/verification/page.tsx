"use client";

import { Suspense } from "react";
import AdminTimetablePage from "@/app/admin/timetable/page";

export default function TimetableVerificationPage() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center bg-black text-white text-sm">Loading verification…</div>}>
      <AdminTimetablePage defaultVerificationMode />
    </Suspense>
  );
}
