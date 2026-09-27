// ============================================================
// CLASH SOLUTION MANAGER - the "brain" behind "Solution Manager"
//
// Pick a class + subject (optionally one specific day/period) and get
// EVERY legal way to move it, ranked. Four patterns are explored:
//   'move'      - slide the subject into an empty period of the same class
//   'within'    - swap two periods of the same class
//   'freeOther' - leave this class alone, swap two periods of the OTHER
//                 class that owns the clashing teacher (frees the teacher)
//   'exchange'  - swap contents with a period of another class
//                 (changes curriculum for both - last resort, flagged)
//
// Every candidate is applied to a copy of the master timetable and
// re-scanned with scanAllClashes, so a suggestion can never quietly
// move a clash somewhere else: `added` clashes are measured, and any
// candidate that creates one is marked unsafe.
// ============================================================

import { scanAllClashes } from './clashScanner.js';
import { keepRangeFor } from '../utils/filteredPrintHtml.js';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const KIND_ORDER = { move: 0, within: 1, freeOther: 2, exchange: 3 };
const KIND_LABEL = {
  move: 'Move',
  within: 'Same-class swap',
  freeOther: 'Free the teacher (other class)',
  exchange: 'Cross-class swap',
};

export const teachersOf = (slot) =>
  String((slot && slot.teacher) || '')
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean);

const ckey = (day, period) => `${day}|${parseInt(period, 10)}`;
const pnum = (p) => parseInt(p, 10);
const lower = (t) => String(t || '').trim().toLowerCase();
const classNum = (id) => parseInt(id, 10);

// day|period -> { teacherKey -> Set(classId) }
const buildOccupancy = (timetables) => {
  const occ = {};
  Object.entries(timetables || {}).forEach(([classId, schedule]) => {
    (schedule || []).forEach((slot) => {
      if (!slot || !slot.day || !slot.period) return;
      const k = ckey(slot.day, slot.period);
      occ[k] = occ[k] || {};
      teachersOf(slot).forEach((t) => {
        const tk = lower(t);
        occ[k][tk] = occ[k][tk] || new Set();
        occ[k][tk].add(classId);
      });
    });
  });
  return occ;
};

// Are all these teachers free at (day,period) for every class except `ignore`?
const freeAt = (occ, teachers, day, period, ignore) => {
  const bucket = occ[ckey(day, period)];
  if (!bucket) return true;
  return teachers.every((t) => {
    const set = bucket[lower(t)];
    if (!set) return true;
    for (const cid of set) if (!ignore.has(cid)) return false;
    return true;
  });
};

const slotAt = (schedule, day, period) =>
  (schedule || []).find((s) => s.day === day && pnum(s.period) === pnum(period)) || null;

// what a cell "holds" (subject + teacher + derived list), without its position
const payloadOf = (slot) => ({
  subject: slot.subject || '',
  teacher: slot.teacher || '',
  assignedTeachers:
    slot.assignedTeachers ||
    (slot.teacher ? slot.teacher.split(',').map((t) => t.trim()).filter(Boolean) : []),
  clashes: [],
});

const sameContent = (a, b) =>
  (a.subject || '') === (b.subject || '') && lower(a.teacher) === lower(b.teacher);

// ---- structural quality: back-to-back repeats, 3+ of one subject in a day ----
const structureCost = (schedule) => {
  let adj = 0;
  let over = 0;
  DAYS.forEach((day) => {
    const map = {};
    (schedule || []).forEach((s) => {
      if (s.day === day && s.subject) map[pnum(s.period)] = s.subject;
    });
    const counts = {};
    Object.values(map).forEach((sub) => {
      counts[sub] = (counts[sub] || 0) + 1;
    });
    Object.values(counts).forEach((n) => {
      if (n > 2) over += n - 2;
    });
    Object.keys(map).forEach((p) => {
      const np = Number(p) + 1;
      if (map[np] && map[np] === map[p]) adj++;
    });
  });
  return adj * 10 + over * 6;
};

// is this period inside the class's printed band (default filtered mode)?
const inPrintedBand = (classId, period, periodCount) => {
  const n = classNum(classId);
  if (!Number.isFinite(n)) return true;
  const { from, to } = keepRangeFor(n, 'default', periodCount);
  return pnum(period) >= from && pnum(period) <= to;
};

const cloneWithUpdates = (timetables, updates) => {
  const byClass = {};
  updates.forEach((u) => {
    (byClass[u.classId] = byClass[u.classId] || []).push(u);
  });
  const next = { ...timetables };
  Object.entries(byClass).forEach(([classId, ups]) => {
    let sched = (next[classId] || []).map((s) => ({ ...s }));
    ups.forEach((u) => {
      sched = sched.filter((s) => !(s.day === u.day && pnum(s.period) === pnum(u.period)));
      if (u.subject || u.teacher) {
        sched.push({
          day: u.day,
          period: pnum(u.period),
          subject: u.subject || '',
          teacher: u.teacher || '',
          assignedTeachers: u.assignedTeachers || [],
          clashes: [],
        });
      }
    });
    next[classId] = sched;
  });
  return next;
};

// ------------------------------------------------------------------
// enumerate every legal move for one source cell
// ------------------------------------------------------------------
const candidatesForSource = ({ timetables, occ, classId, src, periodCount }) => {
  const schedule = timetables[classId] || [];
  const srcPayload = payloadOf(src);
  const srcTeachers = teachersOf(src);
  const srcKey = ckey(src.day, src.period);
  const out = [];

  // 1. slide into an empty period of the same class
  const usedKeys = new Set(schedule.map((s) => ckey(s.day, s.period)));
  if (usedKeys.size < DAYS.length * periodCount) {
    DAYS.forEach((day) => {
      for (let p = 1; p <= periodCount; p++) {
        if (usedKeys.has(ckey(day, p))) continue;
        if (!freeAt(occ, srcTeachers, day, p, new Set([classId]))) continue;
        out.push({
          kind: 'move',
          src,
          other: { day, period: p, subject: '', teacher: '', classId },
          updates: [
            { classId, day, period: p, ...srcPayload },
            { classId, day: src.day, period: pnum(src.period), subject: '', teacher: '', assignedTeachers: [], clashes: [] },
          ],
        });
      }
    });
  }

  // 2. swap two periods of the same class
  schedule.forEach((o) => {
    if (ckey(o.day, o.period) === srcKey) return;
    if (sameContent(src, o)) return;
    const ignore = new Set([classId]);
    if (!freeAt(occ, teachersOf(o), src.day, src.period, ignore)) return;
    if (!freeAt(occ, srcTeachers, o.day, o.period, ignore)) return;
    out.push({
      kind: 'within',
      src,
      other: o,
      otherClassId: classId,
      updates: [
        { classId, day: src.day, period: pnum(src.period), ...payloadOf(o) },
        { classId, day: o.day, period: pnum(o.period), ...srcPayload },
      ],
    });
  });

  // 3. swap two periods of the OTHER class that owns the clashing teacher
  //    (this class's own cells are untouched - only the other class moves)
  Object.entries(timetables).forEach(([otherClassId, otherSched]) => {
    if (otherClassId === classId) return;
    const anchor = slotAt(otherSched, src.day, src.period);
    if (!anchor) return;
    if (!teachersOf(anchor).some((t) => srcTeachers.some((x) => lower(x) === lower(t)))) return;
    const ignore = new Set([otherClassId]);
    (otherSched || []).forEach((o) => {
      if (ckey(o.day, o.period) === srcKey) return;
      if (sameContent(anchor, o)) return;
      if (!freeAt(occ, srcTeachers, o.day, o.period, ignore)) return;
      if (!freeAt(occ, teachersOf(o), src.day, src.period, ignore)) return;
      out.push({
        kind: 'freeOther',
        src,
        other: o,
        otherClassId,
        anchor,
        updates: [
          { classId: otherClassId, day: src.day, period: pnum(src.period), ...payloadOf(o) },
          { classId: otherClassId, day: o.day, period: pnum(o.period), ...payloadOf(anchor) },
        ],
      });
    });
  });

  // 4. swap contents with a period of any other class (changes curriculum)
  Object.entries(timetables).forEach(([otherClassId, otherSched]) => {
    if (otherClassId === classId) return;
    (otherSched || []).forEach((o) => {
      if (sameContent(src, o)) return;
      if (!freeAt(occ, teachersOf(o), src.day, src.period, new Set([classId]))) return;
      if (!freeAt(occ, srcTeachers, o.day, o.period, new Set([otherClassId]))) return;
      out.push({
        kind: 'exchange',
        src,
        other: o,
        otherClassId,
        updates: [
          { classId, day: src.day, period: pnum(src.period), ...payloadOf(o) },
          { classId: otherClassId, day: o.day, period: pnum(o.period), ...srcPayload },
        ],
      });
    });
  });

  return out;
};

// ------------------------------------------------------------------
// verify + score one candidate against the FULL timetable
// ------------------------------------------------------------------
const evaluate = ({ timetables, candidate, before, periodCount }) => {
  const beforeIdSet = new Set(before.map((c) => c.id));
  const targetIds = new Set(
    before
      .filter(
        (c) =>
          c.classIds.includes(candidate.updates[0].classId) &&
          c.day === candidate.src.day &&
          pnum(c.period) === pnum(candidate.src.period)
      )
      .map((c) => c.id)
  );

  const next = cloneWithUpdates(timetables, candidate.updates);
  const after = scanAllClashes(next);
  const afterIds = new Set(after.map((c) => c.id));
  const added = [...afterIds].filter((id) => !beforeIdSet.has(id));
  const fixed = [...beforeIdSet].filter((id) => !afterIds.has(id));
  const fixedTarget = fixed.filter((id) => targetIds.has(id));

  const affected = [...new Set(candidate.updates.map((u) => u.classId))];
  let structureBefore = 0;
  let structureAfter = 0;
  affected.forEach((cid) => {
    structureBefore += structureCost(timetables[cid] || []);
    structureAfter += structureCost(next[cid] || []);
  });
  const structureDelta = Math.max(0, structureAfter - structureBefore);

  // did a subject leave (or enter) its class's printed band?
  let bandPenalty = 0;
  if (candidate.kind === 'move' || candidate.kind === 'within') {
    const cid = candidate.updates[0].classId;
    if (inPrintedBand(cid, candidate.src.period, periodCount) !== inPrintedBand(cid, candidate.other.period, periodCount)) {
      bandPenalty = 6;
    }
  } else if (candidate.kind === 'freeOther') {
    const cid = candidate.updates[0].classId;
    if (inPrintedBand(cid, candidate.src.period, periodCount) !== inPrintedBand(cid, candidate.other.period, periodCount)) {
      bandPenalty = 6;
    }
  } else if (candidate.kind === 'exchange') {
    const a = inPrintedBand(candidate.updates[0].classId, candidate.src.period, periodCount);
    const b = inPrintedBand(candidate.updates[1].classId, candidate.other.period, periodCount);
    if (a !== b) bandPenalty = 6;
  }

  let score = 100 * fixedTarget.length;
  score += 40 * (fixed.length - fixedTarget.length);
  score += 8 * (candidate.kind === 'move' ? 1 : 0);
  score -= 15 * (candidate.kind === 'exchange' ? 1 : 0);
  score -= 10 * (candidate.kind === 'freeOther' ? 1 : 0);
  score -= structureDelta;
  score -= bandPenalty;
  score -= 500 * added.length;

  return {
    ...candidate,
    kindLabel: KIND_LABEL[candidate.kind],
    added,
    fixed,
    fixedTarget,
    safe: added.length === 0,
    score,
    structureDelta,
    bandPenalty,
    targetClashes: targetIds.size,
    afterCount: after.length,
    beforeCount: before.length,
  };
};

// ------------------------------------------------------------------
// public API
// ------------------------------------------------------------------
export const proposeSwaps = ({
  timetables,
  classId,
  subject,
  day = null,
  period = null,
  beforeClashes = null,
  periodCount = 9,
  maxVerify = 170,
  limit = 30,
} = {}) => {
  if (!timetables || !classId) {
    return { ok: false, reason: 'No class selected.', suggestions: [] };
  }
  const schedule = timetables[classId] || [];
  if (!schedule.length) {
    return { ok: false, reason: 'That class has no timetable yet.', suggestions: [] };
  }

  let sources = schedule.filter((s) => s.subject && (!subject || s.subject === subject));
  if (day) sources = sources.filter((s) => s.day === day);
  if (period != null && period !== '') sources = sources.filter((s) => pnum(s.period) === pnum(period));

  if (!sources.length) {
    return {
      ok: false,
      reason: subject ? `No ${subject} period found in ${classId.toUpperCase()}.` : 'Nothing to move.',
      suggestions: [],
    };
  }

  const before = beforeClashes || scanAllClashes(timetables);
  const occ = buildOccupancy(timetables);

  let raw = [];
  let candidatesFound = 0;
  sources.forEach((src) => {
    const list = candidatesForSource({ timetables, occ, classId, src, periodCount });
    candidatesFound += list.length;
    raw = raw.concat(list);
  });

  const unique = new Map();
  raw.forEach((c) => {
    const k = `${c.kind}|${ckey(c.src.day, c.src.period)}|${c.other ? ckey(c.other.day, c.other.period) : '-'}`;
    if (!unique.has(k)) unique.set(k, c);
  });
  const queue = [...unique.values()];
  queue.sort((a, b) => {
    const ka = KIND_ORDER[a.kind];
    const kb = KIND_ORDER[b.kind];
    if (ka !== kb) return ka - kb;
    const sa = a.src.day === a.other.day ? 0 : 1;
    const sb = b.src.day === b.other.day ? 0 : 1;
    return sa - sb;
  });

  const targetClashes = before.filter((c) =>
    sources.some(
      (s) =>
        c.classIds.includes(classId) &&
        c.day === s.day &&
        pnum(c.period) === pnum(s.period)
    )
  ).length;

  const toVerify = queue.slice(0, maxVerify);
  const ranked = toVerify
    .map((candidate) => evaluate({ timetables, candidate, before, periodCount }))
    .sort((a, b) => {
      if (a.safe !== b.safe) return a.safe ? -1 : 1;
      return b.score - a.score;
    });

  // keep every strategy visible: best 2 of each pattern first, then fill by rank
  const diversified = [];
  const perKind = {};
  ranked.forEach((s) => {
    if ((perKind[s.kind] || 0) < 2) {
      diversified.push(s);
      perKind[s.kind] = (perKind[s.kind] || 0) + 1;
    }
  });
  ranked.forEach((s) => {
    if (!diversified.includes(s)) diversified.push(s);
  });
  const suggestions = diversified.slice(0, limit);

  const safeCount = suggestions.filter((s) => s.safe).length;
  const fixesTarget = suggestions.filter((s) => s.safe && s.fixedTarget.length > 0).length;

  let note;
  if (!queue.length) {
    note =
      'No legal move exists for this period: every other slot is already taken by one of ' +
      'its teachers, or the swap would clash somewhere else. Try another period of this ' +
      'subject, or free the teacher from the OTHER class involved.';
  } else if (!targetClashes) {
    note = 'No clash at this period right now - these are neutral relocations.';
  } else if (fixesTarget > 0) {
    note = `${fixesTarget} option(s) clear the clash without creating a new one.`;
  } else if (safeCount > 0) {
    note = 'No swap clears this clash outright; these are clash-free alternatives.';
  } else {
    note = 'No clash-free move found anywhere - every option would shift a clash somewhere else.';
  }

  return {
    ok: true,
    classId,
    subject: subject || '(any)',
    pinned: day && period != null && period !== '' ? `${day}|${pnum(period)}` : '',
    sources: sources.length,
    baselineClashes: before.length,
    targetClashes,
    candidatesFound,
    verified: toVerify.length,
    notVerified: Math.max(0, queue.length - toVerify.length),
    safeCount,
    suggestions,
    note,
  };
};

// subject -> cells (with a clash flag) for the Solution Manager dropdown
export const listSubjectCells = (timetables, classId, subject, beforeClashes = null) => {
  const schedule = (timetables || {})[classId] || [];
  const before = beforeClashes || scanAllClashes(timetables || {});
  return schedule
    .filter((s) => s.subject === subject)
    .map((s) => ({
      day: s.day,
      period: pnum(s.period),
      subject: s.subject,
      teachers: teachersOf(s),
      clashing: before.some(
        (c) =>
          c.classIds.includes(classId) &&
          c.day === s.day &&
          pnum(c.period) === pnum(s.period) &&
          teachersOf(s).some((t) => lower(t) === lower(c.teacherKey))
      ),
    }))
    .sort((a, b) => DAYS.indexOf(a.day) - DAYS.indexOf(b.day) || a.period - b.period);
};

// every distinct subject a class is running (for the dropdown)
export const subjectsOfClass = (timetables, classId) => {
  const schedule = (timetables || {})[classId] || [];
  const counts = {};
  schedule.forEach((s) => {
    if (s.subject) counts[s.subject] = (counts[s.subject] || 0) + 1;
  });
  return Object.entries(counts)
    .map(([subject, cells]) => ({ subject, cells }))
    .sort((a, b) => b.cells - a.cells || a.subject.localeCompare(b.subject));
};
