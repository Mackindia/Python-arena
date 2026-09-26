// Band-aware combined-section splitter for ONE class.
//
// Given the target class's slots:
//   Phase 1  de-combine  — move any slot of this class that shares a teacher
//            with ANOTHER class in the same day+period (combined section).
//   Phase 2  band repair — ensure EVERY day has Maths or Science in the first
//            half (P1–5) AND in the second half (P6–periodCount).
//
// Hard rules:
//   * ONLY the target class's slots ever move — juniors (1–5), 11/12, loads,
//     teacher mappings are never touched.
//   * A slot's teacher never changes (per-section teacher is preserved).
//   * A move is legal only if every teacher of the moved slot is free at the
//     target cell across ALL other classes (occupancy includes juniors, so
//     cross-wing teachers are respected automatically).
//   * Max 1 slot per cell per class; slots are only relocated within their own
//     class grid (relocate or swap with another slot of the same class).
//
// Pure module — no React, no localStorage — usable from UI and from node tests.

export const FIX_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const teachersOf = (slot) =>
  String((slot && slot.teacher) || '')
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean);

export const isMaths = (sub) => /^maths/i.test(String(sub || ''));
export const isScience = (sub) => /science|biology|physics|chemistry/i.test(String(sub || ''));
export const isMSc = (sub) => isMaths(sub) || isScience(sub);

const ckey = (day, period) => `${day}|${parseInt(period, 10)}`;
const halfOf = (period) => (parseInt(period, 10) <= 5 ? 'AM' : 'PM');
const pmRange = (periodCount) => {
  const out = [];
  for (let p = 6; p <= periodCount; p += 1) out.push(p);
  return out;
};

// Teacher -> Set("day|period") over every class EXCEPT the excluded one.
function buildOccupancy(timetables, excludeClass) {
  const occ = new Map();
  Object.entries(timetables || {}).forEach(([cid, slots]) => {
    if (cid === excludeClass) return;
    (slots || []).forEach((s) => {
      teachersOf(s).forEach((t) => {
        const k = t.toLowerCase();
        if (!occ.has(k)) occ.set(k, new Set());
        occ.get(k).add(ckey(s.day, s.period));
      });
    });
  });
  return occ;
}

// Can `slot` (with ITS teachers) sit at day+period?
// - class must not already have a different slot in that cell — unless that
//   other slot is `displaced` (we are swapping it away in this same step)
// - no teacher of the slot may be busy in any OTHER class at that cell
function canPlace(occ, cells, slot, day, period, displaced = null) {
  const k = ckey(day, period);
  const own = cells.get(k);
  if (own && own !== slot && own !== displaced) return false;
  for (const t of teachersOf(slot)) {
    const busy = occ.get(t.toLowerCase());
    if (busy && busy.has(k)) return false;
  }
  return true;
}

// ---------- diagnostics ----------

// Cells where the class's slot shares a teacher with another class
// (same teacher, same day+period) — i.e. combined / impossible cells.
export function detectCombined(classId, timetables) {
  const slots = (timetables && timetables[classId]) || [];
  const out = [];
  slots.forEach((s) => {
    const k = ckey(s.day, s.period);
    const conflicts = [];
    Object.entries(timetables || {}).forEach(([cid, other]) => {
      if (cid === classId) return;
      (other || []).forEach((x) => {
        if (ckey(x.day, x.period) !== k) return;
        const otherTeachers = teachersOf(x).map((t) => t.toLowerCase());
        teachersOf(s).forEach((t) => {
          if (otherTeachers.includes(t.toLowerCase())) conflicts.push(`${cid}(${t})`);
        });
      });
    });
    if (conflicts.length) {
      out.push({
        day: s.day,
        period: parseInt(s.period, 10),
        subject: s.subject,
        teacher: s.teacher,
        conflicts: [...new Set(conflicts)],
      });
    }
  });
  return out;
}

// Days missing Maths/Science in a half (rule: every day, BOTH halves).
export function bandViolations(classId, timetables, periodCount = 9) {
  const slots = (timetables && timetables[classId]) || [];
  const miss = [];
  FIX_DAYS.forEach((day) => {
    const daySlots = slots.filter((s) => s.day === day);
    const am = daySlots.some((s) => parseInt(s.period, 10) <= 5 && isMSc(s.subject));
    const pm = daySlots.some((s) => parseInt(s.period, 10) >= 6 && isMSc(s.subject));
    if (!am) miss.push({ day, half: 'P1-5' });
    if (!pm) miss.push({ day, half: `P6-${periodCount}` });
  });
  return miss;
}

export function subjectCounts(classId, timetables) {
  const counts = {};
  ((timetables && timetables[classId]) || []).forEach((s) => {
    counts[s.subject] = (counts[s.subject] || 0) + 1;
  });
  return counts;
}

export function verifyClass(classId, timetables, periodCount = 9) {
  return {
    combined: detectCombined(classId, timetables),
    band: bandViolations(classId, timetables, periodCount),
    loads: subjectCounts(classId, timetables),
  };
}

// ---------- the fixer ----------

export function fixClass(classId, timetables, periodCount = 9) {
  const original = (timetables && timetables[classId]) || [];
  const slots = original.map((s) => ({
    ...s,
    day: s.day,
    period: parseInt(s.period, 10),
  }));

  const occ = buildOccupancy(timetables, classId);
  const cells = new Map();
  slots.forEach((s) => cells.set(ckey(s.day, s.period), s));

  const moves = [];
  const manual = [];

  const recordMove = (s, fromDay, fromPeriod, toDay, toPeriod, reason) => {
    moves.push({
      reason,
      subject: s.subject,
      teacher: s.teacher,
      assignedTeachers: s.assignedTeachers || [],
      fromDay,
      fromPeriod,
      toDay,
      toPeriod,
    });
  };

  const relocate = (s, day, period, reason) => {
    const fromDay = s.day;
    const fromPeriod = s.period;
    cells.delete(ckey(fromDay, fromPeriod));
    s.day = day;
    s.period = period;
    cells.set(ckey(day, period), s);
    recordMove(s, fromDay, fromPeriod, day, period, reason);
  };

  const swapCells = (a, b, reason) => {
    const aDay = a.day;
    const aPeriod = a.period;
    const bDay = b.day;
    const bPeriod = b.period;
    cells.delete(ckey(aDay, aPeriod));
    cells.delete(ckey(bDay, bPeriod));
    a.day = bDay;
    a.period = bPeriod;
    b.day = aDay;
    b.period = aPeriod;
    cells.set(ckey(a.day, a.period), a);
    cells.set(ckey(b.day, b.period), b);
    recordMove(a, aDay, aPeriod, a.day, a.period, reason);
    recordMove(b, bDay, bPeriod, b.day, b.period, reason);
  };

  // candidate periods for relocation, in priority order
  const candidatesFor = (s) => {
    const sameDay = [];
    const otherDays = [];
    for (const d of FIX_DAYS) {
      for (let p = 1; p <= periodCount; p += 1) {
        if (d === s.day && p === s.period) continue;
        const sameBand = halfOf(p, periodCount) === halfOf(s.period, periodCount);
        if (d === s.day) {
          if (sameBand) sameDay.push([d, p, 0]);
          else sameDay.push([d, p, 1]);
        } else {
          if (sameBand) otherDays.push([d, p, 0]);
          else otherDays.push([d, p, 1]);
        }
      }
    }
    const rank = (a, b) => a[2] - b[2];
    sameDay.sort(rank);
    otherDays.sort(rank);
    return [...sameDay, ...otherDays];
  };

  // ---- Phase 1: de-combine ----
  // M/S slots move FIRST so the scarce free cells (P9) go to Maths/Science
  // and the daily both-halves rule is not broken by a non-M/S slot parking
  // in the only free PM cell.
  const combinedSlots = [...slots].filter((s) => {
    const k = ckey(s.day, s.period);
    return teachersOf(s).some((t) => {
      const busy = occ.get(t.toLowerCase());
      return busy && busy.has(k);
    });
  });
  combinedSlots.sort((a, b) => (isMSc(b.subject) ? 1 : 0) - (isMSc(a.subject) ? 1 : 0));

  combinedSlots.forEach((s) => {
    // 1) relocate to a legal free cell (same day / same band first)
    let done = false;
    for (const [d, p] of candidatesFor(s)) {
      if (!cells.has(ckey(d, p)) && canPlace(occ, cells, s, d, p)) {
        relocate(s, d, p, 'combined');
        done = true;
        break;
      }
    }
    if (done) return;

    // 2) swap with another slot of this class (both directions legal)
    for (const s2 of slots) {
      if (s2 === s) continue;
      if (canPlace(occ, cells, s, s2.day, s2.period, s2) &&
          canPlace(occ, cells, s2, s.day, s.period, s)) {
        swapCells(s, s2, 'combined-swap');
        done = true;
        break;
      }
    }
    if (!done) {
      manual.push({
        type: 'combined',
        day: s.day,
        period: s.period,
        subject: s.subject,
        teacher: s.teacher,
        note: 'no legal cell — fix by hand',
      });
    }
  });

  // ---- Phase 2: Maths/Science in both halves of every day ----
  const countViolations = () => bandViolations(classId, { [classId]: slots }, periodCount).length;

  let violations = countViolations();
  let progress = true;
  while (violations > 0 && progress) {
    progress = false;
    const missList = bandViolations(classId, { [classId]: slots }, periodCount);
    for (const miss of missList) {
      if (violations === 0) break;
      // bandViolations() labels halves 'P1-5' / 'P6-9'; normalise to AM/PM
      const isAM = miss.half === 'P1-5' || miss.half === 'AM';
      const missHalf = isAM ? 'AM' : 'PM';
      const targets = isAM
        ? [1, 2, 3, 4, 5].map((p) => [miss.day, p])
        : pmRange(periodCount).map((p) => [miss.day, p]);

      let fixedThis = false;
      for (const [tDay, tPeriod] of targets) {
        if (fixedThis) break;
        const tKey = ckey(tDay, tPeriod);
        const occupant = cells.get(tKey);

        for (const donor of slots) {
          if (!isMSc(donor.subject)) continue;
          if (donor.day === tDay && donor.period === tPeriod) continue;
          // donor must not already sit in the missing half of the missing day
          if (donor.day === miss.day && halfOf(donor.period, periodCount) === missHalf) {
            continue;
          }

          // Build candidate attempts:
          //  1. free target      -> just move the donor in
          //  2. occupied target  -> direct swap donor <-> occupant
          //  3. occupied target  -> STAGED: occupant to any free cell, donor in
          const attempts = [];
          if (!occupant) {
            if (canPlace(occ, cells, donor, tDay, tPeriod)) {
              attempts.push(() => relocate(donor, tDay, tPeriod, 'band'));
            }
          } else if (occupant !== donor) {
            if (
              canPlace(occ, cells, donor, tDay, tPeriod, occupant) &&
              canPlace(occ, cells, occupant, donor.day, donor.period, donor)
            ) {
              attempts.push(() => swapCells(donor, occupant, 'band-swap'));
            }
            // staged: empty the target cell first, then move the donor in
            for (let fd = 0; fd < FIX_DAYS.length; fd += 1) {
              for (let fp = 1; fp <= periodCount; fp += 1) {
                const fKey = ckey(FIX_DAYS[fd], fp);
                if (cells.has(fKey)) continue;
                if (!canPlace(occ, cells, occupant, FIX_DAYS[fd], fp)) continue;
                if (!canPlace(occ, cells, donor, tDay, tPeriod, occupant)) continue;
                const fDay = FIX_DAYS[fd];
                const fPeriod = fp;
                attempts.push(() => {
                  relocate(occupant, fDay, fPeriod, 'band-room');
                  relocate(donor, tDay, tPeriod, 'band');
                });
                break; // one free cell is enough per donor
              }
            }
          }

          for (const run of attempts) {
            const snapshot = slots.map((x) => [x, x.day, x.period]);
            const movesMark = moves.length;
            const revert = () => {
              moves.length = movesMark;
              snapshot.forEach(([x, d, p]) => {
                x.day = d;
                x.period = p;
              });
              cells.clear();
              slots.forEach((x) => cells.set(ckey(x.day, x.period), x));
            };

            run();
            const now = countViolations();
            if (now < violations) {
              violations = now;
              progress = true;
              fixedThis = true;
              break;
            }
            revert();
          }
          if (fixedThis) break;
        }
      }
      if (!fixedThis) continue;
      break; // violation count changed — restart with a fresh miss list
    }
  }

  if (violations > 0) {
    bandViolations(classId, { [classId]: slots }, periodCount).forEach((v) => {
      manual.push({ type: 'band', day: v.day, half: v.half, note: 'no legal swap — fix by hand' });
    });
  }

  // ---- expected post-state verification (pure, no side effects) ----
  const finalTimetables = { ...timetables, [classId]: slots };
  const expected = {
    combined: detectCombined(classId, finalTimetables),
    band: bandViolations(classId, finalTimetables, periodCount),
  };

  // ---- diff old cells vs new cells -> updateSlot() calls ----
  const beforeMap = new Map();
  original.forEach((s) => beforeMap.set(ckey(s.day, s.period), { ...s }));
  const afterMap = new Map();
  slots.forEach((s) => afterMap.set(ckey(s.day, s.period), { ...s }));

  const keys = new Set([...beforeMap.keys(), ...afterMap.keys()]);
  const updates = [];
  keys.forEach((k) => {
    const b = beforeMap.get(k);
    const a = afterMap.get(k);
    const same =
      (!!b && !!a && b.subject === a.subject && b.teacher === a.teacher) ||
      (!b && !a);
    if (same) return;
    const [day, period] = k.split('|');
    updates.push({
      day,
      period: parseInt(period, 10),
      subject: a ? a.subject : '',
      teacher: a ? a.teacher : '',
      assignedTeachers: a ? a.assignedTeachers || [] : [],
    });
  });

  // stable, readable order: moves by day/period
  moves.sort(
    (m) =>
      FIX_DAYS.indexOf(m.fromDay) - FIX_DAYS.indexOf(m.toDay) ||
      m.fromPeriod - m.toPeriod
  );

  return {
    classId,
    moves,
    manual,
    updates,
    expected,
    ok: expected.combined.length === 0 && expected.band.length === 0,
  };
}
