"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, Download, ExternalLink, RefreshCw, ShieldCheck, TriangleAlert, Lock, Unlock } from "lucide-react";

import { useState, useEffect, useCallback } from "react";

type PreviewEntry = {
  class: string;
  section: string;
  group: string;
  day: string;
  period_no: number;
  subject: string;
  teacher_id: string;
  teacher_name?: string;
};

type PreviewResponse = {
  source: string;
  summary: {
    total_sessions: number;
    total_days: number;
    total_classes: number;
    total_teachers: number;
    total_parallel_slots: number;
  };
  diagnostics: {
    warnings: string[];
    errors: string[];
  };
  previewToken: string;
  preview: Record<string, Record<string, Record<string, PreviewEntry[]>>>;
  rawCsv: {
    headers: string[];
    rows: string[][];
  };
};

type ComparisonResult = {
  currentCount: number;
  previewCount: number;
  added: PreviewEntry[];
  removed: PreviewEntry[];
  changed: Array<{ key: string; current: PreviewEntry[]; preview: PreviewEntry[] }>;
};

function flattenPreview(preview: PreviewResponse["preview"]) {
  const rows: Array<{ day: string; classKey: string; period: string; sessions: PreviewEntry[] }> = [];

  for (const [day, classMap] of Object.entries(preview || {})) {
    for (const [classKey, periodMap] of Object.entries(classMap || {})) {
      for (const [period, sessions] of Object.entries(periodMap || {})) {
        rows.push({ day, classKey, period, sessions });
      }
    }
  }

  rows.sort((a, b) => {
    if (a.day !== b.day) return a.day.localeCompare(b.day);
    if (a.classKey !== b.classKey) return a.classKey.localeCompare(b.classKey);
    return Number(a.period) - Number(b.period);
  });

  return rows;
}

function sortDays(days: string[]) {
  const order = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  return [...days].sort((a, b) => {
    const ai = order.indexOf(a);
    const bi = order.indexOf(b);
    if (ai === -1 && bi === -1) return a.localeCompare(b);
    if (ai === -1) return 1;
    if (bi === -1) return -1;
    return ai - bi;
  });
}

function normalizeCurrentTimetable(entries: Array<Record<string, any>>) {
  return entries.map((entry) => ({
    class: String(entry.class || ""),
    section: String(entry.section || ""),
    group: String(entry.group || "MAIN"),
    day: String(entry.day || ""),
    period_no: Number(entry.period_no || 0),
    subject: String(entry.subject || ""),
    teacher_id: String(entry.teacher_id || ""),
    teacher_name: String(entry.teacher_name || entry.teacher_id || ""),
  }));
}

function makeEntryKey(entry: PreviewEntry) {
  return `${entry.day}__${entry.class}__${entry.section}__${entry.period_no}__${entry.subject}__${entry.teacher_id}__${entry.group || "MAIN"}`;
}

function compareTimetables(currentEntries: PreviewEntry[], previewEntries: PreviewEntry[]): ComparisonResult {
  const currentMap = new Map<string, PreviewEntry>();
  const previewMap = new Map<string, PreviewEntry>();

  for (const entry of currentEntries) currentMap.set(makeEntryKey(entry), entry);
  for (const entry of previewEntries) previewMap.set(makeEntryKey(entry), entry);

  const added = previewEntries.filter((entry) => !currentMap.has(makeEntryKey(entry)));
  const removed = currentEntries.filter((entry) => !previewMap.has(makeEntryKey(entry)));

  const slotGroups = new Map<string, { current: PreviewEntry[]; preview: PreviewEntry[] }>();
  for (const entry of currentEntries) {
    const key = `${entry.day}__${entry.class}__${entry.section}__${entry.period_no}`;
    const existing = slotGroups.get(key) || { current: [], preview: [] };
    existing.current.push(entry);
    slotGroups.set(key, existing);
  }
  for (const entry of previewEntries) {
    const key = `${entry.day}__${entry.class}__${entry.section}__${entry.period_no}`;
    const existing = slotGroups.get(key) || { current: [], preview: [] };
    existing.preview.push(entry);
    slotGroups.set(key, existing);
  }

  const changed = Array.from(slotGroups.entries())
    .filter(([, value]) => JSON.stringify(value.current.map(makeEntryKey).sort()) !== JSON.stringify(value.preview.map(makeEntryKey).sort()))
    .map(([key, value]) => ({ key, current: value.current, preview: value.preview }));

  return {
    currentCount: currentEntries.length,
    previewCount: previewEntries.length,
    added,
    removed,
    changed,
  };
}

export default function AdminTimetablePage({ defaultVerificationMode = false }: { defaultVerificationMode?: boolean }) {
  const [timetableUrl, setTimetableUrl] = useState("/timetable/index.html");
  const [preview, setPreview] = useState<PreviewResponse | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(true);
  const [previewLoaded, setPreviewLoaded] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [approvalChecked, setApprovalChecked] = useState(false);
  const [message, setMessage] = useState<string>("");
  const [messageKind, setMessageKind] = useState<"success" | "error" | "info" | "">("");
  const [compareEnabled, setCompareEnabled] = useState(false);
  const [currentTimetableLoading, setCurrentTimetableLoading] = useState(false);
  const [comparison, setComparison] = useState<ComparisonResult | null>(null);
  const [activeTab, setActiveTab] = useState<"normalized" | "raw">("normalized");
  const [selectedClassKey, setSelectedClassKey] = useState<string>("");
  const searchParams = useSearchParams();
  const verificationMode = defaultVerificationMode || searchParams.get("view") === "verification";

  const [isTimetableLocked, setIsTimetableLocked] = useState<boolean>(false);
  const [lockLoading, setLockLoading] = useState<boolean>(false);

  const loadLockStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/timetable/lock", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setIsTimetableLocked(Boolean(data.isLocked));
      }
    } catch {
      // Silently ignore lock status load errors
    }
  }, []);

  useEffect(() => {
    void loadLockStatus();
  }, [loadLockStatus]);

  const toggleTimetableLock = async () => {
    try {
      setLockLoading(true);
      const newLocked = !isTimetableLocked;
      const res = await fetch("/api/admin/timetable/lock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isLocked: newLocked }),
      });
      if (res.ok) {
        const data = await res.json();
        setIsTimetableLocked(Boolean(data.isLocked));
      }
    } catch {
      // Silently ignore
    } finally {
      setLockLoading(false);
    }
  };

  useEffect(() => {
    setTimetableUrl(`/timetable/index.html?v=${new Date().getTime()}`);
  }, []);

  const loadPreview = async () => {
    setLoadingPreview(true);
    setMessage("");
    try {
      const res = await fetch("/api/admin/timetable/preview", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to load timetable preview");
      }
      setPreview(data);
      setPreviewLoaded(true);
      setMessageKind("info");
      setMessage(`Loaded preview from ${data.source}.`);
    } catch (error) {
      setMessageKind("error");
      setMessage(error instanceof Error ? error.message : "Failed to load timetable preview");
    } finally {
      setLoadingPreview(false);
    }
  };

  useEffect(() => {
    loadPreview();
  }, []);

  const downloadPreviewJson = () => {
    if (!preview) return;

    const payload = {
      source: preview.source,
      summary: preview.summary,
      diagnostics: preview.diagnostics,
      previewToken: preview.previewToken,
      preview: preview.preview,
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "normalized-timetable-preview.json";
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const handleSync = async () => {
    if (!previewLoaded || !preview?.previewToken) {
      setMessageKind("error");
      setMessage("Load the preview before deploying.");
      return;
    }

    if (!approvalChecked) {
      setMessageKind("error");
      setMessage("Admin approval is required before syncing.");
      return;
    }

    if (!window.confirm("Approve and sync the normalized timetable to the database?")) {
      return;
    }

    setSyncing(true);
    setMessage("");
    try {
      const res = await fetch("/api/admin/timetable/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ approved: true, previewToken: preview.previewToken }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Sync failed");
      }
      setMessageKind("success");
      setMessage(`Synced ${data.count} normalized sessions from ${data.source}.`);
      await loadPreview();
    } catch (error) {
      setMessageKind("error");
      setMessage(error instanceof Error ? error.message : "Failed to sync timetable");
    } finally {
      setSyncing(false);
    }
  };

  const handleCompare = async () => {
    if (!preview) {
      setMessageKind("error");
      setMessage("Load the preview before comparing.");
      return;
    }

    setCurrentTimetableLoading(true);
    setMessage("");
    try {
      const res = await fetch("/api/admin/timetable", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to load current timetable");
      }

      const currentRows = normalizeCurrentTimetable((data.timetable || []) as Array<Record<string, any>>);

      const previewRows = flattenPreview(preview.preview).flatMap((row) => row.sessions.map((session) => ({
        class: session.class,
        section: session.section,
        group: session.group,
        day: session.day,
        period_no: session.period_no,
        subject: session.subject,
        teacher_id: session.teacher_id,
        teacher_name: session.teacher_name,
      })));

      setComparison(compareTimetables(currentRows, previewRows));
      setCompareEnabled(true);
      setMessageKind("info");
      setMessage("Compared preview against the current deployed timetable.");
    } catch (error) {
      setMessageKind("error");
      setMessage(error instanceof Error ? error.message : "Failed to compare timetables");
    } finally {
      setCurrentTimetableLoading(false);
    }
  };

  const rows = preview ? flattenPreview(preview.preview) : [];
  const diagnostics = preview?.diagnostics ?? { warnings: [], errors: [] };
  const classKeys = Array.from(new Set(rows.map((r) => r.classKey))).sort((a, b) => a.localeCompare(b));

  useEffect(() => {
    if (classKeys.length === 0) {
      setSelectedClassKey("");
      return;
    }

    if (!selectedClassKey || !classKeys.includes(selectedClassKey)) {
      setSelectedClassKey(classKeys[0]);
    }
  }, [selectedClassKey, classKeys]);

  const selectedRows = rows.filter((row) => row.classKey === selectedClassKey);
  const gridDays = sortDays(Array.from(new Set(selectedRows.map((row) => row.day))));
  const gridPeriods = Array.from(new Set(selectedRows.map((row) => Number(row.period))))
    .filter((p) => Number.isFinite(p))
    .sort((a, b) => a - b);

  const slotMap = new Map<string, PreviewEntry[]>();
  for (const row of selectedRows) {
    slotMap.set(`${row.day}__${row.period}`, row.sessions);
  }

  return (
    <div className="fixed inset-0 z-[100] h-screen w-screen overflow-y-auto bg-black px-2 py-4 text-white sm:px-4 sm:py-6">
      <div className="mx-auto flex h-full w-full max-w-none flex-col">
        
        {/* Header */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/admin"
              title="Back to Admin"
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-400 transition hover:bg-white/10 hover:text-white"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <Link
              href="/"
              title="Go to Home"
              className="flex h-10 px-3 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-sm font-medium text-slate-300 transition hover:bg-white/10 hover:text-white gap-2"
            >
              Home
            </Link>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">Online Class Timetable Admin</h1>
              <p className="text-xs sm:text-sm text-slate-400">Verification, comparison, and sync for online classes</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleTimetableLock}
              disabled={lockLoading}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition ${
                isTimetableLocked
                  ? "border border-amber-400/20 bg-amber-500/10 text-amber-100 hover:bg-amber-500/20"
                  : "border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10"
              } disabled:opacity-50`}
              title={isTimetableLocked ? "Timetable is locked. Click to unlock." : "Timetable is unlocked. Click to lock."}
            >
              {lockLoading ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : isTimetableLocked ? (
                <Lock className="h-4 w-4" />
              ) : (
                <Unlock className="h-4 w-4" />
              )}
              {isTimetableLocked ? "Locked" : "Unlocked"}
            </button>
            <Link
              href={timetableUrl}
              className="flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/20"
            >
              Open School Timetable
            </Link>
            <Link
              href="/admin/online-scheduler"
              className="flex items-center gap-2 rounded-xl border border-cyan-300/20 bg-cyan-500/10 px-4 py-2 text-sm font-medium text-cyan-100 transition hover:bg-cyan-500/20"
            >
              Open Online Scheduler
            </Link>
          </div>
        </div>

        <div className={`grid gap-6 ${verificationMode ? "xl:grid-cols-1" : "xl:grid-cols-[1.2fr_0.8fr]"}`}>
          <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-5 shadow-2xl shadow-cyan-950/20">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-cyan-200/80">Normalized Preview</p>
                <h2 className="mt-2 text-2xl font-bold text-white">CSV-driven session breakdown</h2>
                <p className="mt-2 text-sm text-slate-400">
                  Parsed from the timetable source of truth. Parallel subjects stay separate, with teacher initials shown per session.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={loadPreview}
                  className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10"
                >
                  <RefreshCw className={`h-4 w-4 ${loadingPreview ? "animate-spin" : ""}`} />
                  Refresh Preview
                </button>
                <button
                  type="button"
                  onClick={downloadPreviewJson}
                  disabled={!preview}
                  className="inline-flex items-center gap-2 rounded-xl bg-cyan-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-cyan-500 disabled:opacity-50"
                >
                  <Download className="h-4 w-4" />
                  Download JSON
                </button>
                <button
                  type="button"
                  onClick={handleCompare}
                  disabled={!preview || currentTimetableLoading}
                  className="inline-flex items-center gap-2 rounded-xl border border-amber-400/20 bg-amber-500/10 px-4 py-2 text-sm font-semibold text-amber-100 transition hover:bg-amber-500/20 disabled:opacity-50"
                >
                  <RefreshCw className={`h-4 w-4 ${currentTimetableLoading ? "animate-spin" : ""}`} />
                  Compare With Current Timetable
                </button>
                {!verificationMode ? (
                  <Link
                    href="/timetable-dashboard/verification"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-xl border border-indigo-300/20 bg-indigo-500/10 px-4 py-2 text-sm font-semibold text-indigo-100 transition hover:bg-indigo-500/20"
                  >
                    Open Verification In New Tab <ExternalLink className="h-4 w-4" />
                  </Link>
                ) : null}
              </div>
            </div>

            {message ? (
              <div
                className={`mt-4 rounded-xl border px-4 py-3 text-sm ${
                  messageKind === "error"
                    ? "border-red-400/30 bg-red-500/10 text-red-100"
                    : messageKind === "success"
                      ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-100"
                      : "border-cyan-400/20 bg-cyan-500/10 text-cyan-100"
                }`}
              >
                {message}
              </div>
            ) : null}

            <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Total Sessions</p>
                <p className="mt-2 text-3xl font-semibold text-white">{preview?.summary.total_sessions ?? 0}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Parallel Slots</p>
                <p className="mt-2 text-3xl font-semibold text-white">{preview?.summary.total_parallel_slots ?? 0}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Classes</p>
                <p className="mt-2 text-3xl font-semibold text-white">{preview?.summary.total_classes ?? 0}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Teachers</p>
                <p className="mt-2 text-3xl font-semibold text-white">{preview?.summary.total_teachers ?? 0}</p>
              </div>
            </div>

            <div className="mt-6 rounded-2xl border border-white/10 bg-black/20 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-white">Timetable Verification</p>
                  <p className="text-xs text-slate-400">Switch between normalized session breakdown and raw uploaded CSV</p>
                </div>
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-300">
                  {preview?.source ?? "No source loaded"}
                </span>
              </div>

              <div className="mt-4 inline-flex rounded-xl border border-white/10 bg-slate-900 p-1">
                <button
                  type="button"
                  onClick={() => setActiveTab("normalized")}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.15em] transition ${
                    activeTab === "normalized"
                      ? "bg-cyan-600 text-white"
                      : "text-slate-300 hover:bg-white/5"
                  }`}
                >
                  Normalized
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("raw")}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.15em] transition ${
                    activeTab === "raw"
                      ? "bg-cyan-600 text-white"
                      : "text-slate-300 hover:bg-white/5"
                  }`}
                >
                  Raw CSV
                </button>
              </div>

              <div className={verificationMode ? "mt-4 space-y-3" : "mt-4 max-h-[620px] space-y-3 overflow-auto pr-1"}>
                {loadingPreview ? (
                  <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-slate-400">Loading preview...</div>
                ) : activeTab === "normalized" && rows.length === 0 ? (
                  <div className="rounded-xl border border-red-400/20 bg-red-500/10 p-4 text-sm text-red-100">
                    No parsed sessions available. Check parser warnings and the source CSV structure.
                  </div>
                ) : activeTab === "normalized" ? (
                  <div className="space-y-4">
                    <div className="flex flex-wrap items-center gap-3 rounded-xl border border-white/10 bg-slate-950/70 p-3">
                      <label className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Class Grid</label>
                      <select
                        value={selectedClassKey}
                        onChange={(e) => setSelectedClassKey(e.target.value)}
                        className="rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-cyan-400"
                      >
                        {classKeys.map((classKey) => (
                          <option key={classKey} value={classKey}>
                            {classKey}
                          </option>
                        ))}
                      </select>
                      <span className="rounded-full border border-cyan-300/20 bg-cyan-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-100">
                        Periods: {gridPeriods.length} | Days: {gridDays.length}
                      </span>
                    </div>

                    <div className="overflow-x-auto rounded-xl border border-white/10 bg-black/30">
                      <table className="min-w-full text-xs">
                        <thead className="bg-slate-900/90 text-slate-200">
                          <tr>
                            <th className="sticky left-0 z-10 border-b border-white/10 bg-slate-900 px-3 py-2 text-left font-semibold">Period</th>
                            {gridDays.map((day) => (
                              <th key={day} className="border-b border-white/10 px-3 py-2 text-left font-semibold">
                                {day}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {gridPeriods.map((period) => (
                            <tr key={`grid-period-${period}`} className="align-top odd:bg-black/20 even:bg-black/40">
                              <td className="sticky left-0 z-10 border-b border-white/10 bg-slate-900/95 px-3 py-3 font-semibold text-white">
                                P{period}
                              </td>
                              {gridDays.map((day) => {
                                const sessions = slotMap.get(`${day}__${period}`) || [];
                                return (
                                  <td key={`grid-cell-${day}-${period}`} className="min-w-[210px] border-b border-white/10 px-3 py-3">
                                    {sessions.length === 0 ? (
                                      <span className="text-slate-500">-</span>
                                    ) : (
                                      <div className="space-y-2">
                                        {sessions.map((session, index) => (
                                          <div key={`grid-session-${day}-${period}-${index}`} className="rounded-lg border border-white/10 bg-white/5 p-2">
                                            <p className="text-sm font-semibold text-white">{session.subject}</p>
                                            <p className="mt-1 text-[11px] text-slate-300">
                                              {session.teacher_name || session.teacher_id} ({session.teacher_id})
                                            </p>
                                            <p className="mt-1 text-[11px] text-cyan-100">Group: {session.group || "MAIN"}</p>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </td>
                                );
                              })}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <div className="rounded-xl border border-white/10 bg-slate-950/70 p-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Detailed Slot List</p>
                      <div className="mt-3 space-y-2">
                        {selectedRows.map((row) => (
                          <div key={`${row.day}-${row.classKey}-${row.period}`} className="rounded-lg border border-white/10 bg-white/5 p-3">
                            <p className="text-[11px] uppercase tracking-[0.16em] text-slate-400">
                              {row.day} | Period {row.period}
                            </p>
                            <p className="mt-1 text-sm text-white">
                              {row.sessions.map((session) => `${session.subject} (${session.teacher_id}${session.group ? `, ${session.group}` : ""})`).join(" | ")}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : !(preview?.rawCsv?.rows?.length) ? (
                  <div className="rounded-xl border border-amber-400/20 bg-amber-500/10 p-4 text-sm text-amber-100">
                    Raw CSV rows are not available for this source.
                  </div>
                ) : (
                  <div className="overflow-auto rounded-xl border border-white/10">
                    <table className="min-w-full text-xs">
                      <thead className="bg-slate-900/90 text-slate-300">
                        <tr>
                          {(preview.rawCsv.headers || []).map((header, idx) => (
                            <th key={`${header}-${idx}`} className="border-b border-white/10 px-3 py-2 text-left font-semibold">
                              {header || `Col ${idx + 1}`}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {(preview.rawCsv.rows || []).map((row, rowIdx) => (
                          <tr key={`raw-row-${rowIdx}`} className={rowIdx % 2 === 0 ? "bg-black/20" : "bg-black/40"}>
                            {row.map((cell, cellIdx) => (
                              <td key={`raw-cell-${rowIdx}-${cellIdx}`} className="border-b border-white/5 px-3 py-2 align-top text-slate-200">
                                {cell}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            {compareEnabled && comparison ? (
              <div className="mt-6 rounded-2xl border border-amber-400/20 bg-amber-500/10 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-amber-100">Compare Result</p>
                    <p className="text-xs text-amber-50/70">Preview versus current deployed timetable</p>
                  </div>
                  <span className="rounded-full border border-amber-200/20 bg-black/20 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-50">
                    Current: {comparison.currentCount} | Preview: {comparison.previewCount}
                  </span>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-xl border border-white/10 bg-black/20 p-3 text-sm text-slate-200">
                    Added Sessions: {comparison.added.length}
                  </div>
                  <div className="rounded-xl border border-white/10 bg-black/20 p-3 text-sm text-slate-200">
                    Removed Sessions: {comparison.removed.length}
                  </div>
                  <div className="rounded-xl border border-white/10 bg-black/20 p-3 text-sm text-slate-200">
                    Changed Slots: {comparison.changed.length}
                  </div>
                </div>

                <div className="mt-4 space-y-3 max-h-64 overflow-auto pr-1">
                  {comparison.changed.map((slot) => (
                    <div key={slot.key} className="rounded-xl border border-white/10 bg-black/20 p-3 text-xs text-slate-200">
                      <div className="font-semibold text-white">{slot.key.replace(/__/g, " ")}</div>
                      <div className="mt-2 grid gap-2 md:grid-cols-2">
                        <div>Current: {slot.current.map((item) => `${item.subject} - ${item.teacher_id}`).join(" | ") || "None"}</div>
                        <div>Preview: {slot.preview.map((item) => `${item.subject} - ${item.teacher_id}`).join(" | ") || "None"}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>

          {!verificationMode ? <div className="space-y-6">
            <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-5 shadow-2xl shadow-amber-950/10">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-amber-400/20 bg-amber-500/10 text-amber-200">
                  <TriangleAlert className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">Parser Diagnostics</p>
                  <p className="text-xs text-slate-400">Warnings and errors from normalization</p>
                </div>
              </div>

              <div className="mt-4 space-y-3">
                {(diagnostics.errors || []).length === 0 ? (
                  <div className="rounded-xl border border-emerald-400/20 bg-emerald-500/10 p-3 text-sm text-emerald-100">
                    No parser errors detected.
                  </div>
                ) : null}

                {(diagnostics.errors || []).map((entry) => (
                  <div key={entry} className="rounded-xl border border-red-400/20 bg-red-500/10 p-3 text-sm text-red-100">
                    {entry}
                  </div>
                ))}

                {(diagnostics.warnings || []).length === 0 ? (
                  <div className="rounded-xl border border-cyan-400/20 bg-cyan-500/10 p-3 text-sm text-cyan-100">
                    No parser warnings detected.
                  </div>
                ) : null}

                {(diagnostics.warnings || []).map((entry) => (
                  <div key={entry} className="rounded-xl border border-amber-400/20 bg-amber-500/10 p-3 text-sm text-amber-100">
                    {entry}
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-5 shadow-2xl shadow-emerald-950/10">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-emerald-400/20 bg-emerald-500/10 text-emerald-200">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">Sync Approval</p>
                  <p className="text-xs text-slate-400">Explicit admin confirmation required</p>
                </div>
              </div>

              <label className="mt-4 flex cursor-pointer items-start gap-3 rounded-xl border border-white/10 bg-black/20 p-4 text-sm text-slate-300">
                <input
                  type="checkbox"
                  checked={approvalChecked}
                  onChange={(e) => setApprovalChecked(e.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-white/20 bg-black text-cyan-500"
                />
                <span>
                  I have reviewed the normalized output, including parallel sessions and diagnostics, and approve syncing to the database.
                </span>
              </label>

              <button
                type="button"
                onClick={handleSync}
                disabled={syncing || !approvalChecked || !previewLoaded || !preview?.previewToken}
                className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <ShieldCheck className="h-4 w-4" />
                {syncing ? "Syncing..." : "Approve and Sync"}
              </button>

              <p className="mt-3 text-xs leading-relaxed text-slate-500">
                Sync is blocked until the preview has been loaded, reviewed, and approved. The backend also rejects requests without a matching preview token.
              </p>
            </div>
          </div> : null}
        </div>

      </div>
    </div>
  );
}
