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
  'phy edu': ['Phy_Edu'],
  phy_edu: ['Phy_Edu'],
  'pol sc': ['Pol_Sc'],
  history: ['HIST'],
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

const toTeachers = (parts) => {
  const seen = new Set();
  const out = [];
  parts
    .map((p) => String(p || '').trim().toUpperCase())
    .filter((t) => t && t !== 'NAN' && t !== '0')
    .forEach((t) => {
      if (!seen.has(t)) {
        seen.add(t);
        out.push(t);
      }
    });
  return out;
};

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
    const cleaned = matches.map((m) => m.replace(/^"|"$/g, '').trim());
    const [rawSubject, cls, section] = cleaned;
    // Keep EVERY teacher token — rows like "Bio/Eco/Phy_Edu,11,A,SB,RD,DV"
    // produce 6 match groups; destructuring only the first 4 silently
    // dropped RD/DV (and MS/DP, AR/SP) from the map.
    const rawTeacher = cleaned.slice(3).join(',');
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
// Current-staff roster straight from teacher_mapping.json (35 codes).
export const rosterCodes = new Set(
  (Array.isArray(teacherMapping) ? teacherMapping : [])
    .map((t) => String(t?.Teacher || '').trim().toUpperCase())
    .filter(Boolean)
);

// Current-staff roster (teacher_mapping.json + every code the official map uses).
// Exported so the importer can drop departed codes saved in localStorage.
export const knownTeachers = new Set(rosterCodes);
// Official subject-teacher map may include initials not in teacher_mapping.json (e.g. P)
Object.values(officialMap).forEach((byClass) => {
  Object.values(byClass || {}).forEach((raw) => {
    toTeachers(String(raw || '').split(/[,/]+/)).forEach((t) => knownTeachers.add(t));
  });
});

const normalizeSubjectKey = (subject) =>
  String(subject || '').replace(/\s+/g, ' ').trim().toLowerCase();

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

/**
 * Resolve a composite cell such as "Bio/Eco/Phy_Edu" or "Maths/Hindi/Music".
 *
 * Each stream subject is looked up on its own against the official map so the
 * teacher follows the SUBJECT (Eco → RD, Phy_Edu → DV, Hindi → MS …) instead of
 * the position of the token inside the cell, which is what used to put MG on
 * Hindi and drop RD/DV entirely. Streams the map does not know fall back to the
 * CSV's positional teachers.
 */
const resolveCompositeCell = (subject, classId, csvTeachers) => {
  const streams = String(subject || '')
    .split('/')
    .map((s) => s.trim())
    .filter(Boolean);
  const positional = (csvTeachers || []).length === streams.length;

  const infos = streams.map((stream) => lookupOfficialTeacher(stream, classId));
  const officialClaims = new Set(infos.flatMap((i) => i.assignedTeachers));

  const streamTeachers = {};
  const streamSubjects = {};
  const officialSubjects = [];
  let officialStreams = 0;

  streams.forEach((stream, idx) => {
    const info = infos[idx];
    const official = info.assignedTeachers;
    let list;
    if (official.length) {
      officialStreams += 1;
      list = [...official];
      info.subjects.forEach((s) => {
        if (!officialSubjects.includes(s)) officialSubjects.push(s);
      });
      streamSubjects[stream] = info.subjects.length ? info.subjects : [stream];
      // Keep a CSV teacher the map doesn't cover (e.g. AD co-teaching HSC
      // alongside GA) unless another stream in this cell already claims them.
      const csvTeacher = positional ? csvTeachers[idx] : '';
      if (
        csvTeacher &&
        !list.includes(csvTeacher) &&
        !officialClaims.has(csvTeacher)
      ) {
        list.push(csvTeacher);
      }
    } else if (positional) {
      list = [csvTeachers[idx]];
      streamSubjects[stream] = [stream];
    } else if (csvTeachers.length) {
      list = csvTeachers;
      streamSubjects[stream] = [stream];
    } else {
      list = [];
      streamSubjects[stream] = [stream];
    }
    streamTeachers[stream] = toTeachers(list);
  });

  const assigned = toTeachers(streams.flatMap((s) => streamTeachers[s] || []));
  return {
    streams,
    streamTeachers,
    streamSubjects,
    officialSubjects,
    assigned,
    officialStreams,
  };
};

const pickTeacher = (subject, classId, csvAssigned) => {
  const csv = (csvAssigned || []).filter((t) => knownTeachers.has(t));
  const csvKey = (csvAssigned || []).join(',');

  // Composite cells (Bio/Eco/Phy_Edu, Maths/Hindi/Music, Acct/History …)
  if (String(subject || '').includes('/')) {
    const comp = resolveCompositeCell(subject, classId, csvAssigned || []);
    if (comp.assigned.length) {
      const teacher = comp.assigned.join(',');
      return {
        teacher,
        assignedTeachers: comp.assigned,
        officialSubjects: comp.officialSubjects,
        streamTeachers: comp.streamTeachers,
        streamSubjects: comp.streamSubjects,
        fromOfficial: comp.officialStreams > 0 && teacher !== csvKey,
        fromCsv: teacher === csvKey,
      };
    }
    return {
      teacher: '',
      assignedTeachers: [],
      officialSubjects: comp.officialSubjects,
      streamTeachers: comp.streamTeachers,
      streamSubjects: comp.streamSubjects,
      fromOfficial: false,
      fromCsv: false,
    };
  }

  const official = lookupOfficialTeacher(subject, classId);

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
  let compositeRepaired = 0;
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
      if (
        resolved.streamTeachers &&
        cell.assignedTeachers.length &&
        resolved.teacher !== cell.assignedTeachers.join(',')
      ) {
        compositeRepaired += 1;
      }

      // Display subject: keep the composite cell name intact
      // ("Bio/Eco/Phy_Edu", "Maths/Hindi/Music") so the grid, load master and
      // teacher map all talk about the same key. Only plain subjects are
      // normalised to the official canonical name.
      const displaySubject = String(cell.subject).includes('/')
        ? cell.subject
        : resolved.officialSubjects[0] || cell.subject;

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
      if (resolved.streamTeachers) {
        // Composite cell: map EVERY stream subject to its own teacher
        // (Bio → SB, Eco → RD, Phy_Edu → DV) instead of the whole union,
        // so auto-assign and clash checks stay per-subject.
        Object.entries(resolved.streamTeachers).forEach(([stream, list]) => {
          const streamTeacher = (list || []).join(',');
          if (!streamTeacher) return;
          const names = resolved.streamSubjects?.[stream] || [stream];
          names.forEach((name) =>
            setTeacherSubject(teacherSubjectMap, name, classId, streamTeacher)
          );
          setTeacherSubject(teacherSubjectMap, stream, classId, streamTeacher);
        });
      } else {
        resolved.officialSubjects.forEach((sub) => {
          setTeacherSubject(teacherSubjectMap, sub, classId, teacher);
        });
      }

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
      compositeRepaired,
      teacherSubjectMapKeys: Object.keys(teacherSubjectMap).length,
    },
  };
};

export const applyImportedPeriodCount = (periodCount) => {
  setPeriodCount(periodCount === 8 || periodCount === 9 ? periodCount : 9);
};
