import crypto from "crypto";

export type NormalizedTimetableEntry = {
  class: string;
  section: string;
  group: string;
  day: string;
  period_no: number;
  subject: string;
  teacher_id: string;
  teacher_name?: string;
};

type ParsedSession = {
  subject: string;
  teacher_id: string;
};

const DAY_MAP: Record<string, string> = {
  mon: "Monday",
  monday: "Monday",
  tue: "Tuesday",
  tues: "Tuesday",
  tuesday: "Tuesday",
  wed: "Wednesday",
  weds: "Wednesday",
  wednesday: "Wednesday",
  thu: "Thursday",
  thur: "Thursday",
  thurs: "Thursday",
  thursday: "Thursday",
  fri: "Friday",
  friday: "Friday",
  sat: "Saturday",
  saturday: "Saturday",
  sun: "Sunday",
  sunday: "Sunday",
};

function splitCsvLine(line: string): string[] {
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
}

function normalizeSpaces(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function normalizeDay(value: string): string | null {
  const key = normalizeSpaces(value).toLowerCase();
  return DAY_MAP[key] || null;
}

function parseClassSection(value: string): { class: string; section: string } | null {
  const v = normalizeSpaces(value).toLowerCase();
  if (!v) return null;

  const m = v.match(/^(\d{1,2})\s*([a-z]{1,2})$/i);
  if (m) {
    return { class: m[1], section: m[2].toUpperCase() };
  }

  return null;
}

function toTeacherToken(value: string): string {
  return normalizeSpaces(value).toUpperCase().replace(/[^A-Z0-9./-]/g, "");
}

function toSubjectToken(value: string): string {
  return normalizeSpaces(value).replace(/\s*\)+\s*$/, "").replace(/\s*\(+\s*$/, "");
}

function splitSlashList(value: string): string[] {
  return value
    .split("/")
    .map((p) => toSubjectToken(p))
    .filter(Boolean);
}

function looksLikeTeacherToken(token: string): boolean {
  const t = token.trim();
  if (!t) return false;
  if (/^[A-Za-z.]{1,6}(\/[A-Za-z.]{1,6})+$/.test(t)) return true;
  return /^[A-Z.]{1,6}$/.test(t);
}

function teacherTokens(raw: string): string[] {
  return raw
    .split("/")
    .map((p) => toTeacherToken(p))
    .filter(Boolean);
}

function zipSubjectsAndTeachers(subjects: string[], teachers: string[]): ParsedSession[] {
  if (subjects.length === 0) return [];
  if (teachers.length === 0) {
    return subjects.map((subject) => ({ subject, teacher_id: "UNASSIGNED" }));
  }

  if (subjects.length === teachers.length) {
    return subjects.map((subject, i) => ({ subject, teacher_id: teachers[i] }));
  }

  if (subjects.length === 1) {
    return teachers.map((teacher_id) => ({ subject: subjects[0], teacher_id }));
  }

  return subjects.map((subject) => ({ subject, teacher_id: teachers[0] }));
}

function parseCellFragment(fragment: string): ParsedSession[] {
  const raw = normalizeSpaces(fragment);
  if (!raw) return [];

  const parenMatches = Array.from(raw.matchAll(/([^()]+?)\s*\(([^()]+)\)/g));
  if (parenMatches.length > 0) {
    const sessions: ParsedSession[] = [];
    for (const m of parenMatches) {
      const subjectPart = toSubjectToken(m[1]);
      const teacherPart = m[2];
      if (!subjectPart) continue;

      const subjects = splitSlashList(subjectPart);
      const teachers = teacherTokens(teacherPart);
      sessions.push(...zipSubjectsAndTeachers(subjects, teachers));
    }
    if (sessions.length > 0) return sessions;
  }

  const slashTailMatch = raw.match(/^(.*?)\s+([A-Za-z.]{1,6}(?:\/[A-Za-z.]{1,6})+)$/);
  if (slashTailMatch) {
    const subjectPart = toSubjectToken(slashTailMatch[1]);
    const teacherPart = slashTailMatch[2];
    const subjects = splitSlashList(subjectPart);
    const teachers = teacherTokens(teacherPart);
    const zipped = zipSubjectsAndTeachers(subjects, teachers);
    if (zipped.length > 0) return zipped;
  }

  const bits = raw.split(/\s+/);
  if (bits.length >= 2) {
    const tail = bits[bits.length - 1];
    if (looksLikeTeacherToken(tail)) {
      const subjectPart = toSubjectToken(bits.slice(0, -1).join(" "));
      if (subjectPart) {
        const subjects = splitSlashList(subjectPart);
        const teachers = teacherTokens(tail);
        const zipped = zipSubjectsAndTeachers(subjects, teachers);
        if (zipped.length > 0) return zipped;
      }
    }
  }

  return [{ subject: raw, teacher_id: "UNASSIGNED" }];
}

export function parseCellToSessions(cellRaw: string): ParsedSession[] {
  const cleaned = normalizeSpaces(cellRaw)
    .replace(/^[-]+$/, "")
    .replace(/^\s*nil\s*$/i, "")
    .trim();

  if (!cleaned) return [];

  const coarseParts = cleaned
    .split(/\n|;/)
    .map((p) => p.trim())
    .filter(Boolean);

  const parts = coarseParts.length > 0 ? coarseParts : [cleaned];
  const sessions: ParsedSession[] = [];

  for (const part of parts) {
    const parsed = parseCellFragment(part);
    if (parsed.length > 0) {
      sessions.push(...parsed);
      continue;
    }

    const commaParts = part
      .split(",")
      .map((p) => p.trim())
      .filter(Boolean);

    for (const cp of commaParts) {
      sessions.push(...parseCellFragment(cp));
    }
  }

  const dedup = new Map<string, ParsedSession>();
  for (const s of sessions) {
    const subject = toSubjectToken(s.subject);
    const teacher_id = toTeacherToken(s.teacher_id || "UNASSIGNED") || "UNASSIGNED";
    if (!subject) continue;
    const key = `${subject}__${teacher_id}`;
    if (!dedup.has(key)) {
      dedup.set(key, { subject, teacher_id });
    }
  }

  return Array.from(dedup.values());
}

function groupFromSubject(subject: string): string {
  const token = subject
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
  return token || "MAIN";
}

function normalizeDayFromSlot(slotDay: unknown): string {
  if (typeof slotDay !== "string") return "";
  return normalizeDay(slotDay) || normalizeSpaces(slotDay);
}

export function normalizeTimetablesObject(timetables: Record<string, unknown>): NormalizedTimetableEntry[] {
  const out: NormalizedTimetableEntry[] = [];

  for (const [classKey, schedule] of Object.entries(timetables || {})) {
    const parsedClass = parseClassSection(classKey);
    if (!parsedClass) continue;

    if (!Array.isArray(schedule)) continue;

    for (const slot of schedule) {
      const typedSlot = slot as Record<string, unknown>;
      const day = normalizeDayFromSlot(typedSlot.day);
      const periodNo = Number(typedSlot.period);
      if (!day || Number.isNaN(periodNo) || periodNo <= 0) continue;

      const subjectRaw = typeof typedSlot.subject === "string" ? typedSlot.subject : "";
      const teacherRaw = typeof typedSlot.teacher === "string" ? typedSlot.teacher : "";
      const combined = subjectRaw.includes("(") || !teacherRaw
        ? subjectRaw
        : `${subjectRaw} ${teacherRaw}`;

      const sessions = parseCellToSessions(combined);
      if (sessions.length === 0) continue;

      for (const session of sessions) {
        out.push({
          class: parsedClass.class,
          section: parsedClass.section,
          group: sessions.length > 1 ? groupFromSubject(session.subject) : "MAIN",
          day,
          period_no: periodNo,
          subject: session.subject,
          teacher_id: session.teacher_id,
          teacher_name: session.teacher_id,
        });
      }
    }
  }

  return out;
}

function detectTimeColumns(header: string[]): number[] {
  const cols: number[] = [];
  for (let i = 0; i < header.length; i += 1) {
    const v = normalizeSpaces(header[i]);
    if (/\d{1,2}:\d{2}\s*(am|pm)?\s*-\s*\d{1,2}:\d{2}\s*(am|pm)?/i.test(v)) {
      cols.push(i);
    }
  }
  return cols;
}

export function parseOnlineClassTimetableCsv(csvContent: string): NormalizedTimetableEntry[] {
  const lines = csvContent
    .split(/\r?\n/)
    .map((line) => line.trimEnd())
    .filter((line) => line.trim().length > 0);

  const entries: NormalizedTimetableEntry[] = [];

  let currentDay = "";
  let timeColumns: number[] = [2, 3, 4, 5, 6, 7];

  for (const line of lines) {
    const cols = splitCsvLine(line);
    const day = normalizeDay(cols[0] || "");
    if (day) {
      currentDay = day;
      const detected = detectTimeColumns(cols);
      if (detected.length > 0) timeColumns = detected;
    }

    if (!currentDay) continue;

    const classCell = cols[1] || "";
    const classParsed = parseClassSection(classCell);
    if (!classParsed) {
      const lower = normalizeSpaces(classCell).toLowerCase();
      if (lower === "class") {
        const detected = detectTimeColumns(cols);
        if (detected.length > 0) timeColumns = detected;
      }
      continue;
    }

    if (timeColumns.length === 0) continue;

    let cells = timeColumns.map((idx) => cols[idx] || "");

    const fallbackStart = 2;
    const fallbackCells = cols.slice(fallbackStart).filter((c) => c !== undefined);
    if (cells.every((c) => !c) && fallbackCells.length > 0) {
      cells = fallbackCells;
    }

    while (cells.length > timeColumns.length) {
      cells[0] = `${cells[0]}, ${cells[1]}`;
      cells.splice(1, 1);
    }

    for (let i = 0; i < Math.min(cells.length, timeColumns.length); i += 1) {
      const periodNo = i + 1;
      const sessions = parseCellToSessions(cells[i] || "");
      if (sessions.length === 0) continue;

      for (const session of sessions) {
        entries.push({
          class: classParsed.class,
          section: classParsed.section,
          group: sessions.length > 1 ? groupFromSubject(session.subject) : "MAIN",
          day: currentDay,
          period_no: periodNo,
          subject: session.subject,
          teacher_id: session.teacher_id,
          teacher_name: session.teacher_id,
        });
      }
    }
  }

  return entries;
}

export function buildTimetablePreviewToken(entries: NormalizedTimetableEntry[]): string {
  const normalized = [...entries].sort((a, b) => {
    const left = `${a.day}__${a.class}__${a.section}__${a.period_no}__${a.subject}__${a.teacher_id}__${a.group}`;
    const right = `${b.day}__${b.class}__${b.section}__${b.period_no}__${b.subject}__${b.teacher_id}__${b.group}`;
    return left.localeCompare(right);
  });

  return crypto.createHash("sha256").update(JSON.stringify(normalized)).digest("hex");
}
