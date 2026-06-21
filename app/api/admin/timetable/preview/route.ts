import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { auth } from "@clerk/nextjs/server";
import { cookies } from "next/headers";

import { connectDB } from "../../../../../lib/mongodb";
import User from "../../../../../models/User";
import {
  buildTimetablePreviewToken,
  normalizeTimetablesObject,
  parseOnlineClassTimetableCsv,
  type NormalizedTimetableEntry,
} from "../../../../../lib/onlineClassTimetableParser";

async function isAdmin() {
  await connectDB();
  const { userId } = await auth();
  if (userId) {
    const user = await User.findOne({ clerkId: userId });
    return user?.role === "admin" || user?.role === "super_admin";
  }

  const cookieStore = await cookies();
  const localUserId = cookieStore.get("local_user_id")?.value;
  if (localUserId) {
    const user = await User.findById(localUserId);
    return user?.role === "admin" || user?.role === "super_admin";
  }

  return false;
}

function groupPreview(entries: NormalizedTimetableEntry[]) {
  const byDayClassPeriod: Record<
    string,
    Record<string, Record<string, NormalizedTimetableEntry[]>>
  > = {};

  for (const entry of entries) {
    const day = entry.day;
    const classKey = `${entry.class}${entry.section}`;
    const periodKey = String(entry.period_no);

    byDayClassPeriod[day] ||= {};
    byDayClassPeriod[day][classKey] ||= {};
    byDayClassPeriod[day][classKey][periodKey] ||= [];

    byDayClassPeriod[day][classKey][periodKey].push(entry);
  }

  return byDayClassPeriod;
}

function buildSummary(entries: NormalizedTimetableEntry[]) {
  const uniqueDays = new Set<string>();
  const uniqueClasses = new Set<string>();
  const uniqueTeachers = new Set<string>();
  let parallelSlots = 0;

  const index = new Map<string, number>();

  for (const entry of entries) {
    uniqueDays.add(entry.day);
    uniqueClasses.add(`${entry.class}${entry.section}`);
    uniqueTeachers.add(entry.teacher_id);
    const key = `${entry.day}__${entry.class}__${entry.section}__${entry.period_no}`;
    index.set(key, (index.get(key) || 0) + 1);
  }

  for (const count of index.values()) {
    if (count > 1) {
      parallelSlots += 1;
    }
  }

  return {
    total_sessions: entries.length,
    total_days: uniqueDays.size,
    total_classes: uniqueClasses.size,
    total_teachers: uniqueTeachers.size,
    total_parallel_slots: parallelSlots,
  };
}

function buildDiagnostics(entries: NormalizedTimetableEntry[]) {
  const warnings: string[] = [];
  const errors: string[] = [];
  const seenSlots = new Map<string, NormalizedTimetableEntry[]>();

  for (const entry of entries) {
    const key = `${entry.day}__${entry.class}__${entry.section}__${entry.period_no}`;
    seenSlots.set(key, [...(seenSlots.get(key) || []), entry]);

    if (!entry.subject || !entry.teacher_id) {
      errors.push(`Missing subject or teacher in ${entry.day} ${entry.class}${entry.section} period ${entry.period_no}`);
    }

    if (entry.teacher_id === "UNASSIGNED" || entry.teacher_id === "TBD") {
      warnings.push(`Unassigned teacher detected for ${entry.subject} in ${entry.day} ${entry.class}${entry.section} period ${entry.period_no}`);
    }
  }

  for (const [key, slotEntries] of seenSlots.entries()) {
    if (slotEntries.length > 1) {
      const labels = slotEntries.map((entry) => `${entry.subject} - ${entry.teacher_id}`).join(", ");
      warnings.push(`Parallel slot ${key.replace(/__/g, " ")} contains ${slotEntries.length} sessions: ${labels}`);
    }
  }

  if (entries.length === 0) {
    errors.push("No sessions were parsed from the source timetable.");
  }

  return {
    warnings: Array.from(new Set(warnings)),
    errors: Array.from(new Set(errors)),
  };
}

function parseRequestTimetablePayload(body: unknown): Record<string, unknown> | null {
  if (!body || typeof body !== "object") return null;
  const typed = body as Record<string, unknown>;
  const timetables = typed.timetables;

  if (timetables && typeof timetables === "object") {
    return timetables as Record<string, unknown>;
  }

  return null;
}

function parseRawCsv(csvContent: string) {
  const lines = csvContent
    .replace(/\r/g, "")
    .split("\n")
    .map((line) => line.trimEnd())
    .filter((line) => line.trim().length > 0);

  if (lines.length === 0) {
    return { headers: [] as string[], rows: [] as string[][] };
  }

  const splitCsvLine = (line: string) => {
    const out: string[] = [];
    let curr = "";
    let inQuotes = false;

    for (let i = 0; i < line.length; i += 1) {
      const ch = line[i];
      if (ch === '"') {
        if (inQuotes && line[i + 1] === '"') {
          curr += '"';
          i += 1;
        } else {
          inQuotes = !inQuotes;
        }
        continue;
      }

      if (ch === "," && !inQuotes) {
        out.push(curr.trim());
        curr = "";
        continue;
      }

      curr += ch;
    }

    out.push(curr.trim());
    return out;
  };

  const headers = splitCsvLine(lines[0]);
  const rows = lines.slice(1).map((line) => splitCsvLine(line));
  return { headers, rows };
}

async function buildPreviewEntries(request?: Request) {
  const csvPath = path.join(process.cwd(), "Online class TT 2026.csv");
  const hasCsv = fs.existsSync(csvPath);

  if (hasCsv) {
    const csvContent = fs.readFileSync(csvPath, "utf-8");
    const raw = parseRawCsv(csvContent);
    return {
      source: "Online class TT 2026.csv",
      entries: parseOnlineClassTimetableCsv(csvContent),
      rawCsv: raw,
    };
  }

  if (request) {
    const body = await request.json();
    const timetablePayload = parseRequestTimetablePayload(body);
    if (timetablePayload) {
      return {
        source: "timetables payload",
        entries: normalizeTimetablesObject(timetablePayload),
        rawCsv: { headers: [], rows: [] as string[][] },
      };
    }
  }

  return {
    source: "none",
    entries: [],
    rawCsv: { headers: [], rows: [] as string[][] },
  };
}

export async function GET() {
  try {
    if (!(await isAdmin())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { source, entries, rawCsv } = await buildPreviewEntries();
    if (source === "none") {
      return NextResponse.json(
        {
          error:
            "No source timetable found. Upload Online class TT 2026.csv or call POST with timetables payload.",
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      source,
      summary: buildSummary(entries),
      diagnostics: buildDiagnostics(entries),
      previewToken: buildTimetablePreviewToken(entries),
      preview: groupPreview(entries),
      rawCsv,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    if (!(await isAdmin())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { source, entries, rawCsv } = await buildPreviewEntries(req);
    if (source === "none") {
      return NextResponse.json(
        {
          error:
            "No source timetable found. Upload Online class TT 2026.csv or provide timetables payload in POST body.",
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      source,
      summary: buildSummary(entries),
      diagnostics: buildDiagnostics(entries),
      previewToken: buildTimetablePreviewToken(entries),
      preview: groupPreview(entries),
      rawCsv,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
