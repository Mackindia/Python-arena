"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import GlassCard from "../../../components/ui/GlassCard";
import { Save, Calendar, Clock, RefreshCw } from "lucide-react";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const CLASSES = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"];
const SECTIONS = ["A", "B", "C", "D", "E"];
const PERIODS = [1, 2, 3, 4, 5, 6, 7]; // Strict 7 period online format

export default function OnlineSchedulerPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [adminChecked, setAdminChecked] = useState(false);
  const [saving, setSaving] = useState(false);

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
  // We'll store periods in an array of objects: { period_no: 1, subject: "", teacher_id: "", teacher_name: "" }
  const [schedule, setSchedule] = useState<any[]>(
    PERIODS.map(p => ({ period_no: p, subject: "", teacher_id: "", teacher_name: "" }))
  );

  // Check admin status and load teachers
  useEffect(() => {
    async function init() {
      try {
        const res = await fetch("/api/auth/me");
        const data = await res.json();
        if (!data.user || data.user.role !== "admin") {
          router.push("/online-class");
          return;
        }
        setAdminChecked(true);
        await Promise.all([fetchTeachers(), fetchPeriods()]);
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
        setBellTimings(data.periods);
      } else {
        // Fallback default
        const defaultBells = PERIODS.map(p => ({ period_no: p, start_time: "08:00", end_time: "08:40" }));
        setBellTimings(defaultBells);
      }
    } catch (err) {
      console.error("Failed to fetch bell timings");
    }
  };

  const fetchSchedule = async () => {
    try {
      const res = await fetch(`/api/admin/online-scheduler?class=${selectedClass}&section=${selectedSection}&day=${selectedDay}`);
      const data = await res.json();
      
      // Reset to empty 7 periods
      const newSchedule = PERIODS.map(p => ({ period_no: p, subject: "", teacher_id: "", teacher_name: "" }));
      
      // Overlay fetched data
      if (data.timetable && data.timetable.length > 0) {
        data.timetable.forEach((slot: any) => {
          if (slot.period_no >= 1 && slot.period_no <= 7) {
            newSchedule[slot.period_no - 1] = {
              period_no: slot.period_no,
              subject: slot.subject || "",
              teacher_id: slot.teacher_id || "",
              teacher_name: slot.teacher_name || ""
            };
          }
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

    // If teacher_id changed, update teacher_name automatically
    if (field === "teacher_id") {
      if (value === "") {
        newSchedule[periodIndex].teacher_name = "";
      } else {
        const t = teachers.find(t => t.teacher_id === value || t.clerkId === value || t._id === value);
        if (t) {
          newSchedule[periodIndex].teacher_name = t.fullName;
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
        periods: schedule
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
              Build and assign the 7-period online class schedule mapping directly to registered teachers.
            </p>
          </div>
          <div className="flex items-center gap-3">
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
          </div>
        </div>

        <GlassCard className="mb-6 p-6 border border-slate-800 bg-slate-900/40">
          <div className="flex flex-wrap gap-6">
            <div className="flex-1 min-w-[200px]">
              <label className="mb-2 flex items-center gap-2 text-xs font-semibold text-slate-400">
                <Calendar className="h-4 w-4" /> Class
              </label>
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-sm font-medium text-white focus:border-cyan-500 focus:outline-none"
              >
                {CLASSES.map(c => <option key={c} value={c}>Class {c}</option>)}
              </select>
            </div>
            <div className="flex-1 min-w-[150px]">
              <label className="mb-2 flex items-center gap-2 text-xs font-semibold text-slate-400">
                Section
              </label>
              <select
                value={selectedSection}
                onChange={(e) => setSelectedSection(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-sm font-medium text-white focus:border-cyan-500 focus:outline-none"
              >
                {SECTIONS.map(s => <option key={s} value={s}>Section {s}</option>)}
              </select>
            </div>
            <div className="flex-1 min-w-[200px]">
              <label className="mb-2 flex items-center gap-2 text-xs font-semibold text-slate-400">
                Day
              </label>
              <select
                value={selectedDay}
                onChange={(e) => setSelectedDay(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-sm font-medium text-white focus:border-cyan-500 focus:outline-none"
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
              
              <div className="flex w-full flex-1 flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <input
                    type="text"
                    placeholder="Subject (e.g. Mathematics)"
                    value={slot.subject}
                    onChange={(e) => handleSlotChange(index, "subject", e.target.value)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:border-cyan-500 focus:outline-none"
                  />
                </div>
                <div className="flex-1">
                  <select
                    value={slot.teacher_id}
                    onChange={(e) => handleSlotChange(index, "teacher_id", e.target.value)}
                    className={`w-full rounded-lg border border-slate-700 px-4 py-2.5 text-sm focus:border-cyan-500 focus:outline-none ${slot.teacher_id ? 'bg-indigo-950 text-indigo-100' : 'bg-slate-950 text-slate-400'}`}
                  >
                    <option value="">-- Unassigned Teacher --</option>
                    {teachers.map(t => {
                      // We use teacher.teacher_id if they have a shortcode, otherwise use their clerkId/mongoId
                      // This ensures it matches TeacherDashboard exactly.
                      const idToUse = t.teacher_id || t.clerkId || t._id.toString();
                      return (
                        <option key={t._id} value={idToUse}>
                          {t.fullName} {t.teacher_id ? `(${t.teacher_id})` : ''}
                        </option>
                      );
                    })}
                  </select>
                </div>
              </div>
            </GlassCard>
          ))}
        </div>
      </div>

      {showBellModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
            <h2 className="mb-2 text-xl font-bold text-white flex items-center gap-2">
              <Clock className="h-5 w-5 text-cyan-400" /> Configure Bell Schedule
            </h2>
            <p className="mb-6 text-sm text-slate-400">Set the exact Start and End time for each of the 7 periods. Add your 10-minute gaps or breaks by adjusting the times.</p>
            
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
