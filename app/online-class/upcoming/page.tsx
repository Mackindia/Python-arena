import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { cookies } from "next/headers";
import { connectDB } from "../../../lib/mongodb";
import User from "../../../models/User";
import Settings from "../../../models/Settings";
import Timetable from "../../../models/Timetable";
import Period from "../../../models/Period";
import Link from "next/link";
import { CalendarDays, ArrowLeft, Clock } from "lucide-react";

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const DEFAULT_ONLINE_PERIODS = [
  { period_no: 1, start_time: "08:15", end_time: "09:00" },
  { period_no: 2, start_time: "09:15", end_time: "10:00" },
  { period_no: 3, start_time: "10:15", end_time: "11:00" },
  { period_no: 4, start_time: "11:15", end_time: "12:00" },
  { period_no: 5, start_time: "12:15", end_time: "13:00" },
  { period_no: 6, start_time: "13:15", end_time: "14:00" },
];

function matchesCanonical(periods: any[]) {
  if (!Array.isArray(periods) || periods.length < DEFAULT_ONLINE_PERIODS.length) return false;

  for (const expected of DEFAULT_ONLINE_PERIODS) {
    const found = periods.find((p: any) => Number(p.period_no) === expected.period_no);
    if (!found) return false;
    if (String(found.start_time || "") !== expected.start_time) return false;
    if (String(found.end_time || "") !== expected.end_time) return false;
  }

  return true;
}

function getDateRange(startDate: string, endDate: string) {
  const dates: Array<{ date: string; dayName: string }> = [];
  const start = new Date(startDate + "T00:00:00Z");
  const end = new Date(endDate + "T00:00:00Z");
  if (isNaN(start.getTime()) || isNaN(end.getTime())) return dates;
  const cur = new Date(start);
  while (cur <= end) {
    dates.push({ date: cur.toISOString().split("T")[0], dayName: DAY_NAMES[cur.getUTCDay()] });
    cur.setUTCDate(cur.getUTCDate() + 1);
  }
  return dates;
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr + "T00:00:00Z");
  return d.toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric", timeZone: "UTC" });
}

export default async function UpcomingSchedulePage() {
  await connectDB();

  let user: any = null;
  const { userId } = await auth();
  if (userId) {
    user = await User.findOne({ clerkId: userId }).lean();
  } else {
    const cookieStore = await cookies();
    const localUserId = cookieStore.get("local_user_id")?.value;
    if (localUserId) user = await User.findById(localUserId).lean();
  }

  if (!user) redirect("/sign-in");

  const role: string = user.role || "student";

  // Load window settings
  const settingsDoc = await Settings.findOne({ key: "online_class_window" }).lean();
  const settings: any = settingsDoc ? (settingsDoc as any).value : {};

  // Load periods for time display
  const periodsDoc = await Period.find({}).sort({ period_no: 1 }).lean();
  const normalizedPeriods = periodsDoc.length > 0 && matchesCanonical(periodsDoc)
    ? periodsDoc
    : DEFAULT_ONLINE_PERIODS;
  const periods: any[] = JSON.parse(JSON.stringify(normalizedPeriods));

  const periodTimeMap: Record<number, { start: string; end: string }> = {};
  for (const p of periods) {
    periodTimeMap[Number(p.period_no)] = { start: p.start_time, end: p.end_time };
  }

  if (!settings.isActive || !settings.startDate || !settings.endDate) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-6">
        <div className="text-center space-y-4 max-w-md">
          <CalendarDays className="mx-auto h-12 w-12 text-slate-600" />
          <h1 className="text-2xl font-bold text-white">No Active Schedule</h1>
          <p className="text-slate-400">The admin has not activated any class schedule window yet. Please check back later.</p>
          <Link href="/online-class" className="inline-flex items-center gap-2 rounded-xl bg-slate-800 px-4 py-2 text-sm text-slate-300 hover:bg-slate-700 transition">
            <ArrowLeft className="h-4 w-4" /> Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const dateRange = getDateRange(settings.startDate, settings.endDate);

  // Build per-date schedule
  const schedule: Array<{ date: string; dayName: string; timetable: any[] }> = [];

  for (const { date, dayName } of dateRange) {
    let timetable: any[] = [];

    if (role === "teacher") {
      const teacherId = user.teacher_id || user.username;
      const docs = await Timetable.find({ day: dayName, teacher_id: teacherId }).sort({ period_no: 1 }).lean();
      timetable = JSON.parse(JSON.stringify(docs));
    } else if (role === "admin") {
      const docs = await Timetable.find({ day: dayName }).sort({ class: 1, section: 1, period_no: 1 }).lean();
      timetable = JSON.parse(JSON.stringify(docs));
    } else {
      const rawClass = user.class || user.studentClass || "";
      const normalizedClass = rawClass.replace(/class\s+/i, "").trim();
      const section = user.section || "A";
      const docs = await Timetable.find({
        day: dayName,
        class: new RegExp(`^${normalizedClass}$`, "i"),
        section: new RegExp(`^${section}$`, "i"),
      }).sort({ period_no: 1 }).lean();
      timetable = JSON.parse(JSON.stringify(docs));
    }

    schedule.push({ date, dayName, timetable });
  }

  const todayStr = new Date().toISOString().split("T")[0];

  return (
    <div className="min-h-screen bg-slate-950 text-white p-4 sm:p-8">
      <div className="mx-auto max-w-4xl">

        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Link href="/online-class" className="mb-3 inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white transition">
              <ArrowLeft className="h-4 w-4" /> Back to Dashboard
            </Link>
            <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-cyan-400 to-indigo-400 bg-clip-text text-transparent">
              Upcoming Class Schedule
            </h1>
            <p className="mt-1 text-sm text-slate-400">
              Active window: <span className="font-semibold text-white">{formatDate(settings.startDate)}</span> → <span className="font-semibold text-white">{formatDate(settings.endDate)}</span>
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-2xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-2 text-sm font-semibold text-emerald-300">
            <CalendarDays className="h-4 w-4" />
            {dateRange.length} day{dateRange.length !== 1 ? "s" : ""} scheduled
          </div>
        </div>

        {/* Date cards */}
        <div className="space-y-6">
          {schedule.map(({ date, dayName, timetable }) => {
            const isToday = date === todayStr;
            const isPast = date < todayStr;

            return (
              <div
                key={date}
                className={`rounded-2xl border p-5 transition ${
                  isToday
                    ? "border-cyan-400/40 bg-cyan-500/10 shadow-[0_0_24px_rgba(6,182,212,0.12)]"
                    : isPast
                    ? "border-white/5 bg-slate-900/30 opacity-60"
                    : "border-white/10 bg-slate-900/60"
                }`}
              >
                {/* Date header */}
                <div className="mb-4 flex flex-wrap items-center gap-3">
                  <div>
                    <p className="text-lg font-bold text-white">{formatDate(date)}</p>
                    {isToday && (
                      <span className="mt-1 inline-block rounded-full border border-cyan-300/30 bg-cyan-500/20 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-cyan-300">
                        Today
                      </span>
                    )}
                    {isPast && (
                      <span className="mt-1 inline-block rounded-full border border-slate-600 bg-slate-800/60 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                        Past
                      </span>
                    )}
                  </div>
                </div>

                {/* Classes for this day */}
                {timetable.length === 0 ? (
                  <p className="text-sm text-slate-500 italic">No classes scheduled for this day.</p>
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {timetable.map((entry: any, idx: number) => {
                      const time = periodTimeMap[Number(entry.period_no)];
                      return (
                        <div
                          key={`${date}-${entry._id || idx}`}
                          className="rounded-xl border border-white/10 bg-black/30 p-3"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-sm font-semibold text-cyan-100">{entry.subject}</p>
                            <span className="shrink-0 rounded-md bg-slate-800 px-2 py-0.5 text-[11px] font-bold text-slate-300">
                              P{entry.period_no}
                            </span>
                          </div>
                          {time && (
                            <p className="mt-1 flex items-center gap-1 text-xs text-slate-400">
                              <Clock className="h-3 w-3" />
                              {time.start} – {time.end}
                            </p>
                          )}
                          {role !== "teacher" && (
                            <div className="mt-1">
                              <span className="rounded-md border border-emerald-300/50 bg-emerald-950/75 px-2 py-0.5 text-[11px] font-bold text-emerald-100">
                                Class {entry.class}{entry.section}
                                {entry.group && entry.group !== "MAIN" ? ` (${entry.group})` : ""}
                              </span>
                            </div>
                          )}
                          {role !== "student" && (
                            <p className="mt-1 text-xs text-slate-500">{entry.teacher_name || entry.teacher_id}</p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
}
