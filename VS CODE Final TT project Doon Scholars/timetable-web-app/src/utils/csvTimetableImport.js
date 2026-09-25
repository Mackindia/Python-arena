import { setPeriodCount } from '../config/periods.js';
import { rawCsvData } from '../data/csvData.js';
import teacherMapping from '../data/teacher_mapping.json' with { type: 'json' };

const DAY_MAP = {
  monday: 'Mon', tuesday: 'Tue', wednesday: 'Wed',
  thursday: 'Thu', friday: 'Fri', saturday: 'Sat',
  mon: 'Mon', tue: 'Tue', wed: 'Wed', thu: 'Thu', fri: 'Fri', sat: 'Sat',
};

const SUBJECT_ALIASES = {
  english: ['English_Lit', 'English_Lang', 'English'],
  hindi: ['Hindi_Lit', 'Hindi_Lang', 'Hindi'],
  maths: ['Maths'],
  math: ['Maths'],
  science: ['Science'],
  sst: ['SSt', 'SST'],
  's.st': ['SSt', 'SST'],
  'social studies': ['SSt', 'SST'],
  comp: ['Computer', 'Computer/HSC'],
  computer: ['Computer', 'Computer/HSC'],
  evs: ['EVS'],
  games: ['Games'],
  game: ['Games'],
  lib: ['Library'],
  library: ['Library'],
  bio: ['Biology', 'Bio'],
  biology: ['Biology'],
  phys: ['Physics'],
  physics: ['Physics'],
  chem: ['Chemistry'],
  chemistry: ['Chemistry'],
  acct: ['Accounts', 'Accounts/HIST'],
  accounts: ['Accounts', 'Accounts/HIST'],
  bst: ['BSt'],
  hsc: ['HSC', 'Computer/HSC'],
  copm: ['Computer', 'Computer/HSC'],
  hsc: ['HSC', 'Computer/HSC'],
  'phy edu': ['Phy_Edu'],
  'pol sc': ['Pol_Sc'],
  'pol sc': ['Pol_Sc'],
  music: ['Music'],
  gk: ['GK'],
};

const splitCsvLine = (line) => {
  const out = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }
    if (ch === ',' && !inQuotes) {
      out.push(cur);
      cur = '';
      continue;
    }
    cur += ch;
  }
  out.push(cur);
  return out.map((s) => s.replace(/\s+/g, ' ').trim());
};

const normalizeDay = (raw) => DAY_MAP[String(raw || '').trim().toLowerCase()] || null;

const parseClassCell = (raw) => {
  const cleaned = String(raw || '').trim();
  if (!cleaned || cleaned.toLowerCase() === 'class') return null;
  const m = cleaned.match(/^(\d+)\s*([A-Za-z]+)?$/);
  if (!m) return null;
  const className = m[1];
  const section = m[2] ? m[2].toUpperCase() : '';
  const classId = section
    ? section.length > 1
      ? `${className} ${section}`
      : `${className}${section.toLowerCase()}`
    : className;
  return { className, section, classId };
};

const toTeachers = (parts) =>
  parts
    .map((p) => String(p || '').trim().toUpperCase())
    .filter((t) => t && t !== 'NAN' && t !== '0');

const splitSlashList = (s) =>
  String(s || '')
    .split('/')
    .map((x) => x.trim())
    .filter(Boolean);

const isTeacherToken = (token) => {
  const t = String(token || '').trim();
  if (!t || /\s/.test(t) || t.length > 16) return false;
  if (t.includes('/')) {
    const parts = t.split('/').map((x) => x.trim()).filter(Boolean);
    return parts.length > 0 && parts.every((p) => /^[A-Za-z]{1,4}$/.test(p) && p === p.toUpperCase());
  }
  return /^[A-Za-z]{1,4}$/.test(t) && t === t.toUpperCase();
};

/** Map classId used in timetable ("1a", "11 PCM") → official map key ("1A", "11PCM") */
const officialClassKey = (classId) =>
  String(classId || '').replace(/\s+/g, '').toUpperCase();

/** Build subject → { "1A": "NM", ... } from the embedded subject-teacher map CSV */
const buildOfficialMap = () => {
  const map = {};
  const rows = rawCsvData.split('\n').filter((r) => r.trim()).slice(1);
  rows.forEach((row) => {
    const matches = row.match(/(".*?"|[^",]+)(?=\s*,|\s*$)/g);
    if (!matches || matches.length < 4) return;
    const [rawSubject, cls, section, rawTeacher] = matches.map((m) =>
      m.replace(/^"|"$/g, '').trim()
    );
    const classKey = `${cls}${section}`.toUpperCase();
    const subjectTokens =
      rawSubject.toUpperCase() === 'A/C' || rawSubject.toUpperCase() === 'F/S'
        ? [rawSubject]
        : rawSubject.split('/').map((t) => t.trim());
    const teacherTokens = rawTeacher.split(',').map((t) => t.trim());

    subjectTokens.forEach((subjectToken, index) => {
      if (!map[subjectToken]) map[subjectToken] = {};
      const teacherForSubject =
        teacherTokens.length > 1 && teacherTokens.length === subjectTokens.length
          ? teacherTokens[index]
          : rawTeacher;
      map[subjectToken][classKey] = toTeachers(
        String(teacherForSubject).split(/[,/]+/)
      ).join(',');
    });
  });
  return map;
};

const officialMap = buildOfficialMap();
const knownTeachers = new Set(
  (Array.isArray(teacherMapping) ? teacherMapping : [])
    .map((t) => String(t?.Teacher || '').trim().toUpperCase())
    .filter(Boolean)
);
// Official subject-teacher map may include initials not in teacher_mapping.json (e.g. P)
Object.values(officialMap).forEach((byClass) => {
  Object.values(byClass || {}).forEach((raw) => {
    toTeachers(String(raw || '').split(/[,/]+/)).forEach((t) => knownTeachers.add(t));
  });
});

const normalizeSubjectKey = (subject) =>
  String(subject || '').replace(/\s+/g, ' ').trim().toLowerCase();

/** Resolve a CSV subject to official subject name(s) present in the map */
const resolveOfficialSubjects = (subject, depth = 0) => {
  if (depth > 5) return [];
  const s = String(subject || '').replace(/\s+/g, ' ').trim();
  if (!s) return [];
  if (officialMap[s]) return [s];

  const lower = normalizeSubjectKey(s);
  if (SUBJECT_ALIASES[lower]) {
    for (const cand of SUBJECT_ALIASES[lower]) {
      if (officialMap[cand]) return [cand];
    }
  }

  // Try alias prefix (e.g. "sst oc" already split; "phy_edu")
  for (const [alias, candidates] of Object.entries(SUBJECT_ALIASES)) {
    if (lower === alias) {
      for (const cand of candidates) {
        if (officialMap[cand]) return [cand];
      }
    }
  }

  if (s.includes('/')) {
    const parts = s.split('/').map((p) => p.trim()).filter(Boolean);
    const resolved = [];
    parts.forEach((p) => {
      resolveOfficialSubjects(p, depth + 1).forEach((r) => {
        if (!resolved.includes(r)) resolved.push(r);
      });
    });
    if (resolved.length) return resolved;
  }

  // Case-insensitive exact match against official subjects
  const hit = Object.keys(officialMap).find(
    (k) => normalizeSubjectKey(k) === lower
  );
  return hit ? [hit] : [];
};

/** Collect official subject candidates for a CSV subject name */
const collectOfficialCandidates = (subject, depth = 0) => {
  if (depth > 5) return [];
  const s = String(subject || '').replace(/\s+/g, ' ').trim();
  if (!s) return [];
  const found = [];
  const push = (name) => {
    if (name && officialMap[name] && !found.includes(name)) found.push(name);
  };

  push(s);

  const lower = normalizeSubjectKey(s);
  if (SUBJECT_ALIASES[lower]) {
    SUBJECT_ALIASES[lower].forEach(push);
  }

  // Case-insensitive exact match against official subjects
  Object.keys(officialMap).forEach((k) => {
    if (normalizeSubjectKey(k) === lower) push(k);
  });

  // Lit/Lang pairs when subject is plain English/Hindi
  if (lower === 'english') {
    push('English_Lit');
    push('English_Lang');
  }
  if (lower === 'hindi') {
    push('Hindi_Lit');
    push('Hindi_Lang');
  }

  if (!found.length && s.includes('/')) {
    s.split('/').forEach((p) => {
      collectOfficialCandidates(p.trim(), depth + 1).forEach(push);
    });
  }

  return found;
};

/**
 * Look up official teacher(s) for subject + class.
 * Tries exact name, aliases, and Lit/Lang variants; uses first that has a teacher.
 */
const lookupOfficialTeacher = (subject, classId) => {
  const classKey = officialClassKey(classId);
  const candidates = collectOfficialCandidates(subject);
  if (!candidates.length || !classKey) {
    return { teacher: '', assignedTeachers: [], source: 'none', subjects: [] };
  }

  // Prefer candidates that actually have a teacher for this class
  const ordered = [
    ...candidates.filter((c) => officialMap[c]?.[classKey]),
    ...candidates.filter((c) => !officialMap[c]?.[classKey]),
  ];

  const assigned = [];
  const usedSubjects = [];
  for (const sub of ordered) {
    const raw = officialMap[sub]?.[classKey];
    if (!raw) continue;
    const list = toTeachers(String(raw).split(/[,/]+/));
    if (!list.length) continue;
    if (!usedSubjects.includes(sub)) usedSubjects.push(sub);
    list.forEach((t) => {
      if (!assigned.includes(t)) assigned.push(t);
    });
    // One subject with teachers is enough (English_Lit and English_Lang usually match)
    if (assigned.length) break;
  }

  return {
    teacher: assigned.join(','),
    assignedTeachers: assigned,
    source: assigned.length ? 'official' : 'none',
    subjects: usedSubjects.length ? usedSubjects : candidates,
  };
};

const pickTeacher = (subject, classId, csvAssigned) => {
  const official = lookupOfficialTeacher(subject, classId);
  const csv = (csvAssigned || []).filter((t) => knownTeachers.has(t));

  // 1) The imported CSV is the source of truth for the 9-period timetable.
  //    Whenever the cell itself names teacher(s), keep them as-is.
  //    (Previously the official map overrode the CSV and re-introduced
  //     teachers who have left the school.)
  if ((csvAssigned || []).length) {
    return {
      teacher: csvAssigned.join(','),
      assignedTeachers: csvAssigned,
      officialSubjects: official.subjects,
      fromOfficial: false,
      fromCsv: true,
    };
  }

  // 2) Cell has no teacher → fall back to the official subject-teacher map
  if (official.assignedTeachers.length) {
    return {
      teacher: official.teacher,
      assignedTeachers: official.assignedTeachers,
      officialSubjects: official.subjects,
      fromOfficial: official.assignedTeachers.join(',') !== (csvAssigned || []).join(','),
      fromCsv: false,
    };
  }

  // Fall back to CSV initials only if they are known teachers
  if (csv.length) {
    return {
      teacher: csv.join(','),
      assignedTeachers: csv,
      officialSubjects: official.subjects,
      fromOfficial: false,
      fromCsv: true,
    };
  }

  // Keep unknown CSV initials only if nothing else is available
  if (csvAssigned?.length) {
    return {
      teacher: csvAssigned.join(','),
      assignedTeachers: csvAssigned,
      officialSubjects: official.subjects,
      fromOfficial: false,
      fromCsv: true,
    };
  }

  return {
    teacher: '',
    assignedTeachers: [],
    officialSubjects: official.subjects,
    fromOfficial: false,
    fromCsv: false,
  };
};

export const parseTimetableCell = (raw) => {
  const text = String(raw || '').replace(/\s+/g, ' ').trim();
  if (!text || text.toLowerCase() === 'break') {
    return { subject: '', teacher: '', assignedTeachers: [] };
  }

  let subjectPart = text;
  let teacherPart = '';

  const paren = text.match(/^(.*?)\s*\(([^)]+)\)\s*$/);
  if (paren) {
    subjectPart = paren[1].trim();
    teacherPart = paren[2].trim();
  } else {
    const tokens = subjectPart.split(' ').filter(Boolean);
    const trailing = [];
    while (tokens.length && isTeacherToken(tokens[tokens.length - 1])) {
      const candidateSubject = tokens.slice(0, -1).join(' ').trim();
      if (!candidateSubject && tokens[tokens.length - 1].includes('/')) {
        break;
      }
      // Don't peel single-letter trailing tokens from short subjects like "SSt"
      if (!candidateSubject) break;
      trailing.unshift(tokens.pop());
    }
    if (trailing.length) {
      subjectPart = tokens.join(' ').trim();
      teacherPart = trailing.join(' ');
    }
  }

  if (!subjectPart) {
    subjectPart = text;
    teacherPart = '';
  }

  const subject = subjectPart.replace(/\s+/g, ' ').trim();
  let assigned = toTeachers(splitSlashList(teacherPart));
  if (!assigned.length && teacherPart) {
    assigned = toTeachers(teacherPart.split(/[\s,]+/));
  }

  const teacher = assigned.length
    ? assigned.join(',')
    : teacherPart
      ? teacherPart.trim()
      : '';
  return { subject, teacher, assignedTeachers: assigned };
};

const detectPeriodCols = (header) => {
  const pCols = {};
  let breakCol = -1;
  header.forEach((h, i) => {
    const key = String(h || '').trim().toLowerCase();
    const pm = key.match(/^p(\d+)$/);
    if (pm) {
      const n = parseInt(pm[1], 10);
      if (n >= 1 && n <= 12) pCols[n] = i;
      return;
    }
    if (key === 'break') breakCol = i;
  });
  const periodNums = Object.keys(pCols).map(Number).sort((a, b) => a - b);
  if (!periodNums.length) return null;
  return { pCols, breakCol, maxPeriod: periodNums[periodNums.length - 1] };
};

const sectionToClassId = (className, section) => {
  if (!section) return className;
  return section.length > 1
    ? `${className} ${section}`
    : `${className}${section.toLowerCase()}`;
};

const setTeacherSubject = (map, subject, classId, teacher) => {
  if (!subject) return;
  if (!map[subject]) map[subject] = {};
  // getAllowedSubjectsForClass looks up uppercased class keys without spaces
  const key = officialClassKey(classId);
  if (teacher) {
    map[subject][key] = teacher;
  } else if (map[subject][key] === undefined) {
    map[subject][key] = '';
  }
};

export const parseGridTimetableCsv = (csvText) => {
  const lines = String(csvText || '')
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .split('\n')
    .filter((l) => l.trim().length > 0);

  if (!lines.length) throw new Error('CSV is empty');

  const header = splitCsvLine(lines[0]);
  const detected = detectPeriodCols(header);
  if (!detected) {
    throw new Error('Could not find P1..P9 columns in the CSV header.');
  }

  const { pCols, maxPeriod } = detected;
  const periodCount = Math.min(Math.max(maxPeriod, 1), 9);
  const classColumnIndex = header.findIndex((h) => /class/i.test(h || ''));

  const timetables = {};
  const sectionsByClass = {};
  const loadCounts = {};
  const teacherSubjectMap = {};
  const teacherSet = new Set();
  let currentDay = normalizeDay(header[0]);
  let filledFromOfficial = 0;
  let correctedFromOfficial = 0;
  let fromCsv = 0;

  for (let r = 1; r < lines.length; r++) {
    const cols = splitCsvLine(lines[r]);
    if (cols.every((c) => !c)) continue;

    const dayFromCol0 = normalizeDay(cols[0]);
    if (dayFromCol0) currentDay = dayFromCol0;

    const classCellIndex = classColumnIndex >= 0 ? classColumnIndex : 1;
    const parsedClass = parseClassCell(cols[classCellIndex]);
    if (!parsedClass || !currentDay) continue;

    const { className, section, classId } = parsedClass;
    if (!sectionsByClass[className]) sectionsByClass[className] = new Set();
    if (section) sectionsByClass[className].add(section);

    if (!timetables[classId]) timetables[classId] = [];

    for (let p = 1; p <= periodCount; p++) {
      const colIdx = pCols[p];
      if (colIdx === undefined) continue;
      const cell = parseTimetableCell(cols[colIdx] || '');
      if (!cell.subject && !cell.teacher) continue;

      const resolved = pickTeacher(cell.subject, classId, cell.assignedTeachers);
      if (resolved.fromCsv) {
        fromCsv += 1;
      } else if (!cell.assignedTeachers.length && resolved.assignedTeachers.length) {
        filledFromOfficial += 1;
      } else if (
        resolved.fromOfficial &&
        cell.assignedTeachers.length &&
        resolved.teacher !== cell.assignedTeachers.join(',')
      ) {
        correctedFromOfficial += 1;
      }

      // Display subject: prefer official canonical name when available
      const displaySubject =
        resolved.officialSubjects[0] || cell.subject;

      const assigned = resolved.assignedTeachers;
      const teacher = resolved.teacher;

      timetables[classId].push({
        day: currentDay,
        period: p,
        subject: displaySubject,
        teacher,
        assignedTeachers: assigned,
        clashes: [],
      });

      const loadKey = `${classId}::${displaySubject}`;
      loadCounts[loadKey] = (loadCounts[loadKey] || 0) + 1;

      setTeacherSubject(teacherSubjectMap, displaySubject, classId, teacher);
      // Also map alias subjects so existing pickers keep working
      if (cell.subject && cell.subject !== displaySubject) {
        setTeacherSubject(teacherSubjectMap, cell.subject, classId, teacher);
      }
      resolved.officialSubjects.forEach((sub) => {
        setTeacherSubject(teacherSubjectMap, sub, classId, teacher);
      });

      assigned.forEach((t) => teacherSet.add(t));
    }
  }

  if (!Object.keys(timetables).length) {
    throw new Error('No class rows found in CSV. Expected rows like 1a, 2b, 11a…');
  }

  const masterClasses = Object.entries(sectionsByClass)
    .map(([className, set]) => ({
      className,
      sections: Array.from(set).sort(),
    }))
    .sort((a, b) => Number(a.className) - Number(b.className));

  const classes = masterClasses.flatMap((mc) =>
    mc.sections.length
      ? mc.sections.map((s) => sectionToClassId(mc.className, s))
      : [mc.className]
  );

  const loadMaster = Object.entries(loadCounts).map(([key, total]) => {
    const idx = key.indexOf('::');
    const classId = key.slice(0, idx);
    const subject = key.slice(idx + 2);
    const mc =
      masterClasses.find((c) =>
        c.sections.some((s) => sectionToClassId(c.className, s) === classId)
      ) ||
      masterClasses.find((c) => !c.sections.length && c.className === classId) ||
      masterClasses[0];
    const section =
      mc && classId.startsWith(mc.className)
        ? classId.slice(mc.className.length).toUpperCase()
        : '';
    return {
      subject,
      class_val: mc ? mc.className : classId,
      section,
      total_load: total,
      used_load: total,
      remaining_load: 0,
      class_id: classId,
    };
  });

  const teachers = Array.from(new Set([...teacherSet])).sort();

  return {
    timetables,
    masterClasses,
    classes,
    loadMaster,
    teacherSubjectMap,
    teachers,
    periodCount,
    stats: {
      fromCsv,
      filledFromOfficial,
      correctedFromOfficial,
      teacherSubjectMapKeys: Object.keys(teacherSubjectMap).length,
    },
  };
};

export const applyImportedPeriodCount = (periodCount) => {
  setPeriodCount(periodCount === 8 || periodCount === 9 ? periodCount : 9);
};
