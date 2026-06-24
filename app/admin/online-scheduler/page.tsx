"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import GlassCard from "../../../components/ui/GlassCard";
import { Save, Calendar, Clock, RefreshCw } from "lucide-react";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const CLASSES = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"];
const SECTIONS = ["A", "B", "C", "D", "E"];
const PERIODS = [1, 2, 3, 4, 5, 6];

export default function OnlineSchedulerPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [adminChecked, setAdminChecked] = useState(false);
  const [saving, setSaving] = useState(false);
  const [remapping, setRemapping] = useState(false);
  const [importingTeachers, setImportingTeachers] = useState(false);
  const [importReport, setImportReport] = useState<any | null>(null);

  // Bell Timings State
  const [showBellModal, setShowBellModal] = useState(false);
  const [bellTimings, setBellTimings] = useState<any[]>([]);
  const [savingBells, setSavingBells] = useState(false);

  // Form State
  const [selectedClass, setSelectedClass] = useState("6");
  const [selectedSection, setSelectedSection] = useState("A");
  const [selectedDay, setSelectedDay] = useState("Monday");

  // Data
  const [teachers, setTeachers] = useState<any[]>([]);
  // Two assignment slots per period (slot-2 optional for combination subjects)
  const [schedule, setSchedule] = useState<any[]>(
    PERIODS.map(p => ({
      period_no: p,
      subject: "",
      teacher_id: "",
      teacher_name: "",
      subject2: "",
      teacher_id2: "",
      teacher_name2: "",
      subject3: "",
      teacher_id3: "",
      teacher_name3: "",
    }))
  );

  const teacherValueSet = new Set(
    teachers.map((t: any) => String(t.teacher_id || t.clerkId || t._id || "").trim()).filter(Boolean)
  );
  const csvTeacherInitials = Array.from(
    new Set(
      schedule
        .flatMap((slot: any) => [
          String(slot.teacher_id || "").trim(),
          String(slot.teacher_id2 || "").trim(),
          String(slot.teacher_id3 || "").trim(),
        ])
        .filter((id: string) => Boolean(id) && id !== "UNASSIGNED" && !teacherValueSet.has(id))
    )
  );

  // Settings State
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isActive, setIsActive] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);

  // Check admin status and load teachers
  useEffect(() => {
    async function init() {
      try {
        const res = await fetch("/api/auth/me");
        const data = await res.json();
        if (!data.user || !["admin", "super_admin"].includes(data.user.role)) {
          router.push("/online-class");
          return;
        }
        setAdminChecked(true);
        await Promise.all([fetchTeachers(), fetchPeriods(), fetchSettings()]);
      } catch (err) {
        router.push("/online-class");
      }
    }
    init();
  }, [router]);

  // Fetch schedule whenever class/section/day changes
  useEffect(() => {
    if (adminChecked) {
      fetchSchedule();
    }
  }, [adminChecked, selectedClass, selectedSection, selectedDay]);

  const fetchTeachers = async () => {
    try {
      const res = await fetch("/api/admin/users");
      const data = await res.json();
      if (data.users) {
        // Filter only teachers
        const teacherList = data.users.filter((u: any) => u.role === "teacher");
        setTeachers(teacherList);
      }
    } catch (err) {
      console.error("Failed to fetch teachers");
    } finally {
      setLoading(false);
    }
  };

  const fetchPeriods = async () => {
    try {
      const res = await fetch("/api/admin/periods");
      const data = await res.json();
      if (data.periods && data.periods.length > 0) {
        const filtered = data.periods
          .filter((p: any) => PERIODS.includes(Number(p.period_no)))
          .sort((a: any, b: any) => Number(a.period_no) - Number(b.period_no));
        setBellTimings(filtered);
      } else {
        // Fallback default (aligned with Online class TT 2026.csv)
        const defaultBells = [
          { period_no: 1, start_time: "08:15", end_time: "09:00" },
          { period_no: 2, start_time: "09:15", end_time: "10:00" },
          { period_no: 3, start_time: "10:15", end_time: "11:00" },
          { period_no: 4, start_time: "11:15", end_time: "12:00" },
          { period_no: 5, start_time: "12:15", end_time: "13:00" },
          { period_no: 6, start_time: "13:15", end_time: "14:00" },
        ];
        setBellTimings(defaultBells);
      }
    } catch (err) {
      console.error("Failed to fetch bell timings");
    }
  };

  const fetchSettings = async () => {
    try {
      const res = await fetch("/api/admin/online-settings");
      const data = await res.json();
      if (data.settings) {
        setStartDate(data.settings.startDate || "");
        setEndDate(data.settings.endDate || "");
        setIsActive(data.settings.isActive ?? false);
      }
    } catch (err) {
      console.error("Failed to fetch settings");
    }
  };

  const fetchSchedule = async () => {
    try {
      const res = await fetch(`/api/admin/online-scheduler?class=${selectedClass}&section=${selectedSection}&day=${selectedDay}`);
      const data = await res.json();
      
      // Reset to empty configured periods
      const newSchedule: any[] = PERIODS.map(p => ({
        period_no: p,
        subject: "",
        teacher_id: "",
        teacher_name: "",
        subject2: "",
        teacher_id2: "",
        teacher_name2: "",
        subject3: "",
        teacher_id3: "",
        teacher_name3: "",
      }));
      
      // Overlay fetched data; preserve parallel subjects in same period.
      if (data.timetable && data.timetable.length > 0) {
        const grouped = new Map<number, any[]>();
        data.timetable.forEach((slot: any) => {
          const slotPeriod = Number(slot.period_no);
          if (!PERIODS.includes(slotPeriod)) return;
          const existing = grouped.get(slotPeriod) || [];
          existing.push(slot);
          grouped.set(slotPeriod, existing);
        });

        PERIODS.forEach((period, idx) => {
          const slots = grouped.get(period) || [];
          if (slots.length === 0) return;

          const first = slots[0];
          const second = slots[1];
          const third = slots[2];
          newSchedule[idx] = {
            period_no: period,
            subject: first?.subject || "",
            teacher_id: first?.teacher_id || "",
            teacher_name: first?.teacher_name || "",
            subject2: second?.subject || "",
            teacher_id2: second?.teacher_id || "",
            teacher_name2: second?.teacher_name || "",
            subject3: third?.subject || "",
            teacher_id3: third?.teacher_id || "",
            teacher_name3: third?.teacher_name || "",
            sessions: slots.map((slot: any) => ({
              subject: slot.subject || "",
              teacher_id: slot.teacher_id || "",
              teacher_name: slot.teacher_name || "",
              group: slot.group || "MAIN",
            })),
          } as any;
        });
      }
      setSchedule(newSchedule);
    } catch (err) {
      console.error("Failed to fetch schedule");
    }
  };

  const handleSlotChange = (periodIndex: number, field: string, value: string) => {
    const newSchedule = [...schedule];
    newSchedule[periodIndex][field] = value;

    if (field === "subject" || field === "subject2" || field === "subject3") {
      delete newSchedule[periodIndex].sessions;
    }

    // If teacher_id changed, update teacher_name automatically
    if (field === "teacher_id" || field === "teacher_id2" || field === "teacher_id3") {
      if (value === "") {
        if (field === "teacher_id") newSchedule[periodIndex].teacher_name = "";
        if (field === "teacher_id2") newSchedule[periodIndex].teacher_name2 = "";
        if (field === "teacher_id3") newSchedule[periodIndex].teacher_name3 = "";
      } else {
        const t = teachers.find(t => t.teacher_id === value || t.clerkId === value || t._id === value);
        if (t) {
          if (field === "teacher_id") newSchedule[periodIndex].teacher_name = t.fullName;
          if (field === "teacher_id2") newSchedule[periodIndex].teacher_name2 = t.fullName;
          if (field === "teacher_id3") newSchedule[periodIndex].teacher_name3 = t.fullName;
        }
      }
    }

    setSchedule(newSchedule);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        class: selectedClass,
        section: selectedSection,
        day: selectedDay,
        periods: schedule.map((p: any) => {
          const sessions: any[] = [];

          if (String(p.subject || "").trim() && String(p.teacher_id || "").trim()) {
            sessions.push({
              subject: String(p.subject).trim(),
              teacher_id: String(p.teacher_id).trim(),
              teacher_name: String(p.teacher_name || p.teacher_id || "").trim(),
              group: "MAIN",
            });
          }

          if (String(p.subject2 || "").trim() && String(p.teacher_id2 || "").trim()) {
            sessions.push({
              subject: String(p.subject2).trim(),
              teacher_id: String(p.teacher_id2).trim(),
              teacher_name: String(p.teacher_name2 || p.teacher_id2 || "").trim(),
              group: "MAIN",
            });
          }

          if (String(p.subject3 || "").trim() && String(p.teacher_id3 || "").trim()) {
            sessions.push({
              subject: String(p.subject3).trim(),
              teacher_id: String(p.teacher_id3).trim(),
              teacher_name: String(p.teacher_name3 || p.teacher_id3 || "").trim(),
              group: "MAIN",
            });
          }

          return {
            period_no: p.period_no,
            sessions,
          };
        })
      };

      const res = await fetch("/api/admin/online-scheduler", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (data.success) {
        alert("Schedule saved successfully!");
      } else {
        alert("Error saving schedule: " + data.error);
      }
    } catch (err) {
      alert("Failed to save schedule.");
    } finally {
      setSaving(false);
    }
  };

  const handleBellChange = (index: number, field: string, value: string) => {
    const newBells = [...bellTimings];
    newBells[index][field] = value;
    setBellTimings(newBells);
  };

  const handleSaveBells = async () => {
    setSavingBells(true);
    try {
      const res = await fetch("/api/admin/periods", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ periods: bellTimings })
      });
      const data = await res.json();
      if (data.success) {
        alert("Bell Schedule saved successfully!");
        setShowBellModal(false);
      } else {
        alert("Error saving bells: " + data.error);
      }
    } catch (err) {
      alert("Failed to save bell timings.");
    } finally {
      setSavingBells(false);
    }
  };

  const handleSaveSettings = async () => {
    setSavingSettings(true);
    try {
      const res = await fetch("/api/admin/online-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ startDate, endDate, isActive })
      });
      const data = await res.json();
      if (data.success) {
        alert("Global Calendar Settings saved successfully!");
        setShowSettingsModal(false);
      } else {
        alert("Error saving settings: " + data.error);
      }
    } catch (err) {
      alert("Failed to save settings.");
    } finally {
      setSavingSettings(false);
    }
  };

  const handleRemapTeachers = async () => {
    setRemapping(true);
    try {
      const res = await fetch("/api/admin/online-scheduler/remap-teachers", {
        method: "POST",
      });
      const data = await res.json();
      if (data.success) {
        alert(`Teacher mapping updated: ${data.updatedRows} row(s) across ${data.teacherCount} teacher ID(s).`);
        await fetchSchedule();
      } else {
        alert("Error remapping teachers: " + data.error);
      }
    } catch (err) {
      alert("Failed to remap teachers.");
    } finally {
      setRemapping(false);
    }
  };

  const handleImportTeachersCsv = async () => {
    setImportingTeachers(true);
    setImportReport(null);
    try {
      const res = await fetch("/api/admin/users/import-teachers-csv", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileName: "teachers id and passwords.csv" }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setImportReport({ error: data.error || "Unknown error" });
        alert("Import failed: " + (data.error || "Unknown error"));
        return;
      }

      setImportReport(data);

      alert(
        `Import complete. Created: ${data.createdCount}, Skipped: ${data.skippedCount}, Failed: ${data.failedCount}`
      );

      await Promise.all([fetchTeachers(), fetchSchedule()]);
    } catch (err) {
      setImportReport({ error: "Failed to import teachers CSV." });
      alert("Failed to import teachers CSV.");
    } finally {
      setImportingTeachers(false);
    }
  };

  if (!adminChecked || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
        <div className="animate-pulse text-lg font-semibold">Loading scheduler...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 p-6 text-white md:p-10">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-cyan-400 to-indigo-400 bg-clip-text text-transparent">
              Online Class Scheduler
            </h1>
            <p className="mt-2 text-sm text-slate-400">
              Build and assign the online class schedule mapping directly to registered teachers.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowSettingsModal(true)}
              className="flex items-center gap-2 rounded-xl border border-indigo-500/50 bg-indigo-500/10 px-4 py-3 text-sm font-bold text-indigo-300 transition hover:bg-indigo-500 hover:text-white"
            >
              <Calendar className="h-5 w-5" />
              SET CALENDAR
            </button>
            <button
              onClick={() => setShowBellModal(true)}
              className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-sm font-bold text-slate-300 transition hover:bg-slate-700 hover:text-white"
            >
              <Clock className="h-5 w-5" />
              SET BELL TIMINGS
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 text-sm font-bold text-white transition hover:bg-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.3)] disabled:opacity-50"
            >
              {saving ? <RefreshCw className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
              {saving ? "SAVING..." : "SAVE SCHEDULE"}
            </button>
            <button
              onClick={handleRemapTeachers}
              disabled={remapping}
              className="flex items-center gap-2 rounded-xl border border-amber-500/50 bg-amber-500/10 px-4 py-3 text-sm font-bold text-amber-200 transition hover:bg-amber-500/20 disabled:opacity-50"
            >
              <RefreshCw className={`h-5 w-5 ${remapping ? "animate-spin" : ""}`} />
              {remapping ? "RE-MAPPING..." : "RE-MAP TEACHERS"}
            </button>
            <button
              onClick={handleImportTeachersCsv}
              disabled={importingTeachers}
              className="flex items-center gap-2 rounded-xl border border-cyan-500/50 bg-cyan-500/10 px-4 py-3 text-sm font-bold text-cyan-200 transition hover:bg-cyan-500/20 disabled:opacity-50"
            >
              <RefreshCw className={`h-5 w-5 ${importingTeachers ? "animate-spin" : ""}`} />
              {importingTeachers ? "IMPORTING..." : "IMPORT TEACHERS CSV"}
            </button>
          </div>
        </div>

        {importReport ? (
          <div className="mb-6 rounded-2xl border border-cyan-500/20 bg-cyan-500/10 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm font-semibold text-cyan-100">Teacher CSV Import Report</p>
              {importReport.error ? (
                <span className="text-xs font-semibold text-red-300">{importReport.error}</span>
              ) : (
                <span className="text-xs font-semibold text-cyan-200">
                  Created: {importReport.createdCount} | Skipped: {importReport.skippedCount} | Failed: {importReport.failedCount}
                </span>
              )}
            </div>

            {!importReport.error ? (
              <div className="mt-4 grid gap-4 lg:grid-cols-3">
                <div className="rounded-xl border border-emerald-400/20 bg-emerald-500/10 p-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-emerald-200">Created</p>
                  <div className="mt-2 max-h-40 overflow-auto text-xs text-emerald-100">
                    {(importReport.created || []).length === 0 ? (
                      <p className="text-emerald-200/80">No new users created.</p>
                    ) : (
                      (importReport.created || []).slice(0, 20).map((row: any) => (
                        <p key={`created-${row.row}`}>
                          Row {row.row}: {row.username} ({row.teacher_id})
                        </p>
                      ))
                    )}
                  </div>
                </div>

                <div className="rounded-xl border border-amber-400/20 bg-amber-500/10 p-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-amber-200">Skipped</p>
                  <div className="mt-2 max-h-40 overflow-auto text-xs text-amber-100">
                    {(importReport.skipped || []).length === 0 ? (
                      <p className="text-amber-200/80">No skipped rows.</p>
                    ) : (
                      (importReport.skipped || []).slice(0, 20).map((row: any) => (
                        <p key={`skipped-${row.row}`}>
                          Row {row.row}: {row.username || "-"} ({row.reason})
                        </p>
                      ))
                    )}
                  </div>
                </div>

                <div className="rounded-xl border border-red-400/20 bg-red-500/10 p-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-red-200">Failed</p>
                  <div className="mt-2 max-h-40 overflow-auto text-xs text-red-100">
                    {(importReport.failed || []).length === 0 ? (
                      <p className="text-red-200/80">No failed rows.</p>
                    ) : (
                      (importReport.failed || []).slice(0, 20).map((row: any) => (
                        <p key={`failed-${row.row}`}>
                          Row {row.row}: {row.username || "-"} ({row.reason})
                        </p>
                      ))
                    )}
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        ) : null}

        <GlassCard className="mb-6 border border-cyan-300/30 bg-[#0b1322]/90 p-6">
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <span className="rounded-md border border-emerald-300/50 bg-emerald-950/75 px-2 py-0.5 text-xs font-bold text-emerald-100">
              Class {selectedClass}{selectedSection}
            </span>
            <span className="rounded-md border border-violet-300/50 bg-violet-950/70 px-2 py-0.5 text-xs font-bold text-violet-100">
              {selectedDay}
            </span>
          </div>
          <div className="flex flex-wrap gap-6">
            <div className="flex-1 min-w-[200px]">
              <label className="mb-2 flex items-center gap-2 text-xs font-semibold text-cyan-100">
                <Calendar className="h-4 w-4" /> Class
              </label>
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="w-full rounded-xl border border-cyan-300/60 bg-[#0f1a2e] px-4 py-3 text-sm font-semibold text-white focus:border-cyan-200 focus:outline-none"
              >
                {CLASSES.map(c => <option key={c} value={c}>Class {c}</option>)}
              </select>
            </div>
            <div className="flex-1 min-w-[150px]">
              <label className="mb-2 flex items-center gap-2 text-xs font-semibold text-cyan-100">
                Section
              </label>
              <select
                value={selectedSection}
                onChange={(e) => setSelectedSection(e.target.value)}
                className="w-full rounded-xl border border-cyan-300/60 bg-[#0f1a2e] px-4 py-3 text-sm font-semibold text-white focus:border-cyan-200 focus:outline-none"
              >
                {SECTIONS.map(s => <option key={s} value={s}>Section {s}</option>)}
              </select>
            </div>
            <div className="flex-1 min-w-[200px]">
              <label className="mb-2 flex items-center gap-2 text-xs font-semibold text-cyan-100">
                Day
              </label>
              <select
                value={selectedDay}
                onChange={(e) => setSelectedDay(e.target.value)}
                className="w-full rounded-xl border border-cyan-300/60 bg-[#0f1a2e] px-4 py-3 text-sm font-semibold text-white focus:border-cyan-200 focus:outline-none"
              >
                {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
          </div>
        </GlassCard>

        <div className="space-y-3">
          {schedule.map((slot, index) => (
            <GlassCard key={index} className="flex flex-col sm:flex-row items-center gap-4 p-4 border border-slate-800/60 bg-slate-900/20 hover:bg-slate-900/40 transition-colors">
              <div className="flex w-full sm:w-auto items-center gap-3 pr-4 sm:border-r border-slate-800">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-950 text-cyan-400 font-bold">
                  {slot.period_no}
                </div>
                <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 w-16">
                  Period {slot.period_no}
                </div>
              </div>

              <div className="flex w-full flex-1 flex-col gap-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  <input
                    type="text"
                    placeholder="Subject 1 (e.g. Business Studies)"
                    value={slot.subject}
                    onChange={(e) => handleSlotChange(index, "subject", e.target.value)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:border-cyan-500 focus:outline-none"
                  />
                  <select
                    value={slot.teacher_id}
                    onChange={(e) => handleSlotChange(index, "teacher_id", e.target.value)}
                    className={`w-full rounded-lg border border-slate-700 px-4 py-2.5 text-sm focus:border-cyan-500 focus:outline-none ${slot.teacher_id ? 'bg-indigo-950 text-indigo-100' : 'bg-slate-950 text-slate-400'}`}
                  >
                    <option value="">-- Unassigned Teacher 1 --</option>
                    {csvTeacherInitials.map((initial) => (
                      <option key={`csv-1-${initial}`} value={initial}>
                        {initial} (from CSV, not mapped)
                      </option>
                    ))}
                    {teachers.map((t) => {
                      const idToUse = t.teacher_id || t.clerkId || t._id.toString();
                      return (
                        <option key={`t1-${t._id}`} value={idToUse}>
                          {t.fullName} {t.teacher_id ? `(${t.teacher_id})` : ""}
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <input
                    type="text"
                    placeholder="Subject 2 (optional, e.g. Political Science)"
                    value={slot.subject2 || ""}
                    onChange={(e) => handleSlotChange(index, "subject2", e.target.value)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:border-cyan-500 focus:outline-none"
                  />
                  <select
                    value={slot.teacher_id2 || ""}
                    onChange={(e) => handleSlotChange(index, "teacher_id2", e.target.value)}
                    className={`w-full rounded-lg border border-slate-700 px-4 py-2.5 text-sm focus:border-cyan-500 focus:outline-none ${slot.teacher_id2 ? 'bg-indigo-950 text-indigo-100' : 'bg-slate-950 text-slate-400'}`}
                  >
                    <option value="">-- Unassigned Teacher 2 --</option>
                    {csvTeacherInitials.map((initial) => (
                      <option key={`csv-2-${initial}`} value={initial}>
                        {initial} (from CSV, not mapped)
                      </option>
                    ))}
                    {teachers.map((t) => {
                      const idToUse = t.teacher_id || t.clerkId || t._id.toString();
                      return (
                        <option key={`t2-${t._id}`} value={idToUse}>
                          {t.fullName} {t.teacher_id ? `(${t.teacher_id})` : ""}
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <input
                    type="text"
                    placeholder="Subject 3 (optional, e.g. Economics)"
                    value={slot.subject3 || ""}
                    onChange={(e) => handleSlotChange(index, "subject3", e.target.value)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:border-cyan-500 focus:outline-none"
                  />
                  <select
                    value={slot.teacher_id3 || ""}
                    onChange={(e) => handleSlotChange(index, "teacher_id3", e.target.value)}
                    className={`w-full rounded-lg border border-slate-700 px-4 py-2.5 text-sm focus:border-cyan-500 focus:outline-none ${slot.teacher_id3 ? 'bg-indigo-950 text-indigo-100' : 'bg-slate-950 text-slate-400'}`}
                  >
                    <option value="">-- Unassigned Teacher 3 --</option>
                    {csvTeacherInitials.map((initial) => (
                      <option key={`csv-3-${initial}`} value={initial}>
                        {initial} (from CSV, not mapped)
                      </option>
                    ))}
                    {teachers.map((t) => {
                      const idToUse = t.teacher_id || t.clerkId || t._id.toString();
                      return (
                        <option key={`t3-${t._id}`} value={idToUse}>
                          {t.fullName} {t.teacher_id ? `(${t.teacher_id})` : ""}
                        </option>
                      );
                    })}
                  </select>
                </div>

                {Array.isArray(slot.sessions) && slot.sessions.length > 3 ? (
                  <p className="text-xs text-amber-200">
                    This period has {slot.sessions.length} combinations in source data. Editor currently supports 3 slots; extra combinations remain until you edit/save this period.
                  </p>
                ) : null}
              </div>
            </GlassCard>
          ))}
        </div>
      </div>

      {showSettingsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
            <h2 className="mb-2 text-xl font-bold text-white flex items-center gap-2">
              <Calendar className="h-5 w-5 text-indigo-400" /> Global Calendar Settings
            </h2>
            <p className="mb-6 text-sm text-slate-400">Online classes will ONLY appear on the Teacher and Student dashboards if the current date is between these dates and the system is Active.</p>
            
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Start Date</label>
                <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-2.5 text-white outline-none focus:border-indigo-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">End Date</label>
                <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-2.5 text-white outline-none focus:border-indigo-500" />
              </div>
              <div className="flex items-center gap-3 mt-4 pt-4 border-t border-slate-800">
                <input type="checkbox" id="activeToggle" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} className="h-5 w-5 rounded border-slate-700 bg-slate-950 text-indigo-600 focus:ring-indigo-600 focus:ring-offset-slate-900" />
                <label htmlFor="activeToggle" className="text-sm font-bold text-emerald-400 cursor-pointer">System is Active (Students can see classes)</label>
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t border-slate-800 pt-4">
              <button
                onClick={() => setShowSettingsModal(false)}
                className="rounded-xl border border-slate-700 px-4 py-2.5 text-sm font-bold text-slate-400 transition hover:bg-slate-800 hover:text-white"
              >
                CANCEL
              </button>
              <button
                onClick={handleSaveSettings}
                disabled={savingSettings}
                className="flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-bold text-white transition hover:bg-indigo-500 disabled:opacity-50"
              >
                {savingSettings ? "SAVING..." : "APPLY CALENDAR"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showBellModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
            <h2 className="mb-2 text-xl font-bold text-white flex items-center gap-2">
              <Clock className="h-5 w-5 text-cyan-400" /> Configure Bell Schedule
            </h2>
            <p className="mb-6 text-sm text-slate-400">Set the exact Start and End time for each period. Add your 10-minute gaps or breaks by adjusting the times.</p>
            
            <div className="space-y-3 mb-6 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
              {bellTimings.map((bell, index) => (
                <div key={index} className="flex items-center gap-4 p-3 rounded-xl border border-slate-800 bg-slate-950/50">
                  <div className="font-bold text-cyan-500 w-20">Period {bell.period_no}</div>
                  <div className="flex-1 flex items-center gap-2">
                    <input
                      type="time"
                      value={bell.start_time}
                      onChange={(e) => handleBellChange(index, "start_time", e.target.value)}
                      className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white focus:border-cyan-500 focus:outline-none"
                    />
                    <span className="text-slate-500 text-xs font-bold">TO</span>
                    <input
                      type="time"
                      value={bell.end_time}
                      onChange={(e) => handleBellChange(index, "end_time", e.target.value)}
                      className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white focus:border-cyan-500 focus:outline-none"
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-3 border-t border-slate-800 pt-4">
              <button
                onClick={() => setShowBellModal(false)}
                className="rounded-xl border border-slate-700 px-4 py-2.5 text-sm font-bold text-slate-400 transition hover:bg-slate-800 hover:text-white"
              >
                CANCEL
              </button>
              <button
                onClick={handleSaveBells}
                disabled={savingBells}
                className="flex items-center gap-2 rounded-xl bg-cyan-600 px-6 py-2.5 text-sm font-bold text-white transition hover:bg-cyan-500 disabled:opacity-50"
              >
                {savingBells ? "SAVING..." : "SAVE BELL TIMINGS"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
