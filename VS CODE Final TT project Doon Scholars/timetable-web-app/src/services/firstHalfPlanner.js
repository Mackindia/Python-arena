// First-half (P1-5) timetable designer for classes 6-10 — JOINT over all 9
// classes, day by day, teacher-aware.
//
// Rules encoded:
//   * Every class: Maths, Science, SST in P1-5 EVERY day (10a SST load = 5 -> 5 days).
//   * First-half quotas per week (30 cells exactly):
//       Maths 6, Science 6 (6/7: Science; 8-10: Phy/Chem/Bio rotation 2+2+2),
//       SST 6 (or load), English 4 (Lang2+Lit2), Hindi 4 (Lang2+Lit2),
//       Computer 2, Skill 2 (+ filler to reach 30 when a load is short, e.g. 10a).
//   * Second half (P6-8, 18 cells): the remainder of every subject; P9 unused
//     (repair buffer).
//   * No same subject in adjacent periods of a day (incl. P5->P6 boundary).
//   * Science rotates for 8-10: a different subject than yesterday preferred,
//     never the same period as that subject yesterday.
//   * Per-section teachers FIXED (read from current data) — never changed.
//   * Junior (1-5) timetable fixed — its teachers block cells (all periods).
//   * Zero teacher double-booking across ALL classes.
//
// Pure module: no React, no localStorage.

export const PLAN_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const teachersOf = (slot) =>
  String((slot && slot.teacher) || '')
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean);

const isMaths = (s) => /^maths/i.test(String(s || ''));
const isSci = (s) => /science|biology|physics|chemistry/i.test(String(s || ''));
const isSst = (s) => /^sst$/i.test(String(s || ''));
const ckey = (day, period) => `${day}|${parseInt(period, 10)}`;

export const isSeniorClass = (id) => /^(?:[6-9]|10)[ab]$/i.test(String(id || ''));

// 11/12 are untouched by this planner; their cells do NOT block 6-10 teachers
// (user adjusts 11/12 manually if a cross-clash appears).
export const isClass11or12 = (id) => /^(?:11|12)[abc]$/i.test(String(id || ''));

// ---------- meta extraction ----------

function classMeta(timetables, classId) {
  const slots = timetables[classId] || [];
  const counts = {};
  const sigCount = {}; // subject -> { "teacherA|teacherB": times }
  slots.forEach((s) => {
    counts[s.subject] = (counts[s.subject] || 0) + 1;
    const sig = teachersOf(s).slice().sort().join('|');
    if (!sigCount[s.subject]) sigCount[s.subject] = {};
    sigCount[s.subject][sig] = (sigCount[s.subject][sig] || 0) + 1;
  });
  // majority teacher signature per subject: rotating single-teacher subjects
  // (Computer/HSC sometimes GA, sometimes AR) must NOT union into a joint
  // duty that locks both teachers at once — that starves everyone
  const teachers = {};
  Object.entries(sigCount).forEach(([sub, m]) => {
    const best = Object.entries(m).sort((a, b) => b[1] - a[1])[0][0];
    teachers[sub] = best ? best.split('|').filter(Boolean) : [];
  });
  const subs = Object.keys(counts);
  const pick = (fn) => subs.find(fn);
  return {
    classId,
    counts,
    teachers,
    subs,
    mathSub: pick(isMaths),
    sstSub: pick(isSst),
    sciSubs: subs.filter(isSci),
    langSub: (name) => subs.find((s) => s.toLowerCase() === name.toLowerCase()),
  };
}

// Weekly first-half quota per class (sums to 30; filler tops up short loads)
export function firstHalfQuota(meta) {
  const q = {};
  const add = (sub, n) => {
    if (!sub) return;
    const max = meta.counts[sub] || 0;
    q[sub] = Math.min(n, max);
  };
  add(meta.mathSub, 6);
  if (meta.sciSubs.length === 1) add(meta.sciSubs[0], 6);
  else meta.sciSubs.forEach((s) => add(s, Math.min(2, meta.counts[s])));
  add(meta.sstSub, Math.min(6, meta.counts[meta.sstSub] || 0));
  add(meta.langSub('English_Lang'), 2);
  add(meta.langSub('English_Lit'), 2);
  add(meta.langSub('Hindi_Lang'), 2);
  add(meta.langSub('Hindi_Lit'), 2);
  const comp = meta.subs.find((s) => /^computer/i.test(s));
  add(comp, 2);
  add(meta.langSub('Skill'), 2);

  // top up to exactly 30 with flexible subjects (Skill first, then others)
  let sum = Object.values(q).reduce((a, b) => a + b, 0);
  const fillerOrder = [
    'Skill', 'F/S', 'STEM', 'GK', 'Music', 'Dance', 'Library', 'A/C',
    'Games', 'VE', 'Computer', 'Computer/HSC',
  ];
  for (const sub of fillerOrder) {
    if (sum >= 30) break;
    const actual = meta.subs.find((s) => s === sub);
    if (!actual) continue;
    const cur = q[actual] || 0;
    const room = Math.min(meta.counts[actual] - cur, 30 - sum);
    if (room > 0) {
      q[actual] = cur + room;
      sum += room;
    }
  }
  return q;
}

// ---------- planner ----------

export function planFirstHalf(timetables, { periodCount = 9 } = {}) {
  const senClasses = Object.keys(timetables).filter(isSeniorClass);
  const shEnd = Math.min(8, periodCount);
  const allPeriods = Array.from({ length: periodCount }, (_, i) => i + 1);

  const meta = {};
  const quota = {};
  const fhRemaining = {};
  const shPool = {};
  senClasses.forEach((c) => {
    meta[c] = classMeta(timetables, c);
    quota[c] = firstHalfQuota(meta[c]);
    fhRemaining[c] = { ...quota[c] };
    shPool[c] = {};
    Object.entries(meta[c].counts).forEach(([sub, n]) => {
      const fh = quota[c][sub] || 0;
      if (n - fh > 0) shPool[c][sub] = n - fh;
    });
  });

  // junior occupancy (fixed): teacher -> day -> Set(period)
  const busy = {};
  const markBusy = (teacher, day, period) => {
    const t = teacher.toLowerCase();
    if (!busy[t]) busy[t] = {};
    if (!busy[t][day]) busy[t][day] = new Set();
    busy[t][day].add(parseInt(period, 10));
  };
  Object.entries(timetables).forEach(([c, slots]) => {
    if (isSeniorClass(c) || isClass11or12(c)) return;
    (slots || []).forEach((s) =>
      teachersOf(s).forEach((t) => markBusy(t, s.day, s.period))
    );
  });

  // placed[c][day] = Map(period -> {subject, teacher, assignedTeachers})
  const placed = {};
  senClasses.forEach((c) => {
    placed[c] = {};
    PLAN_DAYS.forEach((d) => { placed[c][d] = new Map(); });
  });
  const lastPeriodOf = {}; // `${c}|${sub}` -> {day, period}

  // Is every teacher in `teacherList` free at (day, period)?
  // Busy = fixed junior slots + OTHER senior classes already placed there.
  const teachersFree = (day, period, teacherList, exceptClass) => {
    const p = parseInt(period, 10);
    const lower = teacherList.map((t) => t.toLowerCase());
    for (const t of lower) {
      const b = busy[t];
      if (b && b[day] && b[day].has(p)) return false;
    }
    // senior-senior: any other class already using one of these teachers
    for (const c of senClasses) {
      if (c === exceptClass) continue;
      const cell = placed[c][day].get(p);
      if (!cell) continue;
      for (const ct of cell.assignedTeachers || []) {
        if (lower.includes(String(ct).toLowerCase())) return false;
      }
    }
    return true;
  };

  const dutyTeachers = (c, sub) => [...(meta[c].teachers[sub] || [])];

  const adjacentClash = (c, day, period, sub) => {
    const p = parseInt(period, 10);
    const m = placed[c][day];
    if (m.has(p - 1) && m.get(p - 1).subject === sub) return true;
    if (m.has(p + 1) && m.get(p + 1).subject === sub) return true;
    return false;
  };

  const put = (c, day, sub, period) => {
    const ts = dutyTeachers(c, sub);
    placed[c][day].set(period, {
      subject: sub,
      teacher: ts.join(', '),
      assignedTeachers: ts,
    });
    lastPeriodOf[`${c}|${sub}`] = { day, period };
  };

  const rotationPenalty = (c, day, sub, period) => {
    const idx = PLAN_DAYS.indexOf(day);
    if (idx <= 0) return 0;
    const prev = lastPeriodOf[`${c}|${sub}`];
    if (prev && prev.day === PLAN_DAYS[idx - 1] && prev.period === period) return 3;
    return 0;
  };

  const FH_PERIODS = allPeriods.filter((p) => p <= 5);
  const SH_PERIODS = [];
  for (let p = 6; p <= shEnd; p += 1) SH_PERIODS.push(p);
  if (periodCount >= 9) SH_PERIODS.push(9);

  // how many P1-5 cells are still usable for (class, subject) today
  const freeFhCount = (c, day, sub) => {
    const ts = dutyTeachers(c, sub);
    let n = 0;
    for (const p of FH_PERIODS) {
      if (placed[c][day].has(p)) continue;
      if (!teachersFree(day, p, ts, c)) continue;
      if (adjacentClash(c, day, p, sub)) continue;
      n += 1;
    }
    return n;
  };

  // teacher's TOTAL free P1-5 cells across a grid day (any class) — used to
  // decide which tight core gets the class's scarce cells first
  const teacherFhFree = (day, t) => {
    let n = 0;
    for (const p of FH_PERIODS) {
      if (teachersFree(day, p, [t], null)) n += 1;
    }
    return n;
  };
  const coreTightness = (c, day, sub) => {
    const local = freeFhCount(c, day, sub);
    const teacherFree = Math.min(...dutyTeachers(c, sub).map((t) => teacherFhFree(day, t)));
    return local * 100 + teacherFree;
  };

  // place a duty for class c on day within `order` periods; returns period or null
  const lastWhy = {}; // debug: why the most recent attempt for (c,day,sub) failed
  const placeDuty = (c, day, sub, order) => {
    const ts = dutyTeachers(c, sub);
    let best = null;
    const why = [];
    for (const p of order) {
      if (placed[c][day].has(p)) { why.push(`P${p}:own`); continue; }
      if (!teachersFree(day, p, ts, c)) { why.push(`P${p}:busy(${ts.join('/')})`); continue; }
      if (adjacentClash(c, day, p, sub)) { why.push(`P${p}:adj`); continue; }
      const score = rotationPenalty(c, day, sub, p);
      if (!best || score < best.score) best = { p, score };
      if (score === 0) break;
    }
    if (!best) { lastWhy[`${c}|${day}|${sub}`] = why.join(' '); return null; }
    put(c, day, sub, best.p);
    return best.p;
  };

  // day's science subject for classes 8-10 (rotate + honour remaining quota)
  const pickSciFor = (c, day) => {
    const m = meta[c];
    if (m.sciSubs.length === 1) {
      return (fhRemaining[c][m.sciSubs[0]] || 0) > 0 ? m.sciSubs[0] : null;
    }
    const idx = PLAN_DAYS.indexOf(day);
    const prevDay = idx > 0 ? PLAN_DAYS[idx - 1] : null;
    let prevSci = null;
    if (prevDay) {
      prevSci = [...placed[c][prevDay].entries()]
        .filter(([p]) => p <= 5)
        .map(([, v]) => v.subject)
        .find(isSci) || null;
    }
    const avail = m.sciSubs.filter(
      (s) =>
        (fhRemaining[c][s] || 0) > 0 &&
        ![...placed[c][day].values()].some((v) => v.subject === s)
    );
    if (!avail.length) return null;
    if (avail.length === 1) return avail[0];
    // lookahead: choosing s must not strand another sci-sub with more quota
    // left than the days remaining after today
    const rem = PLAN_DAYS.length - idx - 1;
    const strands = (s) =>
      m.sciSubs.some((x) => {
        const q = (fhRemaining[c][x] || 0) - (x === s ? 1 : 0);
        return q > rem;
      });
    const feasible = avail.filter((s) => !strands(s));
    const pool = feasible.length ? feasible : avail;
    // reserve capacity for classes whose science has NO alternative today
    // (single-sci classes, or multi-sci down to their last quota sub)
    const forcedDemand = {};
    senClasses.forEach((o) => {
      if (o === c) return;
      const om = meta[o];
      const oa = om.sciSubs.filter(
        (s) => (fhRemaining[o][s] || 0) > 0 &&
          ![...placed[o][day].values()].some((v) => v.subject === s)
      );
      if (oa.length === 1) {
        dutyTeachers(o, oa[0]).forEach((t) => {
          forcedDemand[t] = (forcedDemand[t] || 0) + 1;
        });
      }
    });
    const capAfterForced = (s) =>
      Math.min(...dutyTeachers(c, s).map((t) => teacherFhFree(day, t) - (forcedDemand[t] || 0)));
    pool.sort(
      (a, b) =>
        capAfterForced(b) - capAfterForced(a) ||
        freeFhCount(c, day, b) - freeFhCount(c, day, a) ||
        (b === prevSci ? 1 : 0) - (a === prevSci ? 1 : 0) ||
        (fhRemaining[c][b] || 0) - (fhRemaining[c][a] || 0)
    );
    return pool[0];
  };

  const manual = [];

  // ---------- snapshot / restore for day-level retries ----------
  const snapshotDay = (day) => {
    const snap = { fh: {}, sh: {}, placed: {}, lpo: { ...lastPeriodOf } };
    senClasses.forEach((c) => {
      snap.fh[c] = { ...fhRemaining[c] };
      snap.sh[c] = { ...shPool[c] };
      snap.placed[c] = new Map(placed[c][day]);
    });
    return snap;
  };
  const restoreDay = (day, snap) => {
    senClasses.forEach((c) => {
      Object.entries(snap.fh[c]).forEach(([k, v]) => { fhRemaining[c][k] = v; });
      Object.entries(snap.sh[c]).forEach(([k, v]) => { shPool[c][k] = v; });
      placed[c][day] = new Map(snap.placed[c]);
    });
    Object.keys(lastPeriodOf).forEach((k) => { delete lastPeriodOf[k]; });
    Object.entries(snap.lpo).forEach(([k, v]) => { lastPeriodOf[k] = v; });
  };

  const isCoreSub = (c, sub) =>
    sub === meta[c].mathSub ||
    sub === meta[c].sstSub ||
    meta[c].sciSubs.includes(sub);

  // Teacher week pressure: cap - demand for a sub's teachers in a band.
  // Negative/zero slack = zero-slack teacher (e.g. SW needs all 24 SH slots)
  // that must be scheduled first or the week cannot fit.
  const teacherWeekSlack = (c, day, sub, band) => {
    const ts = dutyTeachers(c, sub);
    const idx = PLAN_DAYS.indexOf(day);
    const daysAfter = PLAN_DAYS.length - idx - 1;
    const periods = band === 'FH' ? FH_PERIODS : SH_PERIODS;
    let worst = Infinity;
    for (const t of ts) {
      let dem = 0;
      const tl = String(t).toLowerCase();
      senClasses.forEach((o) => {
        const pool = band === 'FH' ? fhRemaining[o] : shPool[o];
        Object.entries(pool).forEach(([s2, n]) => {
          if (n > 0 && (meta[o].teachers[s2] || []).some((x) => String(x).toLowerCase() === tl)) {
            dem += n;
          }
        });
      });
      let todayFree = 0;
      for (const p of periods) if (teachersFree(day, p, [t], null)) todayFree += 1;
      worst = Math.min(worst, todayFree + daysAfter * periods.length - dem);
    }
    return worst;
  };

  const maxPerDayOf = (c, sub) => {
    const t = meta[c].counts[sub];
    return t >= 6 || t <= 2 ? 2 : 1;
  };

  // fill repair: when a class still has empty FH cells after the greedy fill,
  // try moving one of its placed cells to the empty cell (if the teacher can
  // move) so a fill subject's teacher becomes free at the vacated cell
  const swapFill = (day, c) => {
    let progress = true;
    while (progress) {
      progress = false;
      if (placed[c][day].size >= 5) return true;
      const freeCells = FH_PERIODS.filter((p) => !placed[c][day].has(p));
      const pref = [
        'English_Lang', 'English_Lit', 'Hindi_Lang', 'Hindi_Lit',
        'Computer', 'Computer/HSC', 'Skill',
      ];
      const subs = Object.keys(fhRemaining[c])
        .filter((s) => !isCoreSub(c, s) && fhRemaining[c][s] > 0)
        .sort((a, b) => {
          const ra = pref.findIndex((x) => x.toLowerCase() === a.toLowerCase());
          const rb = pref.findIndex((x) => x.toLowerCase() === b.toLowerCase());
          return (ra < 0 ? 99 : ra) - (rb < 0 ? 99 : rb);
        });
      for (const sub of subs) {
        const todayCount = [...placed[c][day].values()].filter((x) => x.subject === sub).length;
        if (todayCount >= maxPerDayOf(c, sub)) continue;
        for (const pStar of freeCells) {
          if (placed[c][day].has(pStar)) continue;
          for (const pOld of [...placed[c][day].keys()]) {
            const cell = placed[c][day].get(pOld);
            if (cell.subject === sub) continue;
            placed[c][day].delete(pOld);
            const ok =
              teachersFree(day, pStar, cell.assignedTeachers, c) &&
              !adjacentClash(c, day, pStar, cell.subject) &&
              teachersFree(day, pOld, dutyTeachers(c, sub), c) &&
              !adjacentClash(c, day, pOld, sub);
            if (ok) {
              placed[c][day].set(pStar, cell);
              lastPeriodOf[`${c}|${cell.subject}`] = { day, period: pStar };
              put(c, day, sub, pOld);
              fhRemaining[c][sub] -= 1;
              progress = true;
              break;
            }
            placed[c][day].set(pOld, cell);
          }
          if (progress) break;
        }
        if (progress) break;
      }
    }
    return placed[c][day].size >= 5;
  };

  // run cores + fill for one FH day in `prepend`-first class order
  const runFhDay = (day, prepend) => {
    const fails = [];
    const coreLoad = {};
    const coresOf = (c) => {
      const out = [];
      if ((fhRemaining[c][meta[c].mathSub] || 0) > 0) out.push(meta[c].mathSub);
      const sci = pickSciFor(c, day);
      if (sci) out.push(sci);
      if ((fhRemaining[c][meta[c].sstSub] || 0) > 0) out.push(meta[c].sstSub);
      return out.sort((a, b) => freeFhCount(c, day, a) - freeFhCount(c, day, b));
    };
    senClasses.forEach((c) =>
      coresOf(c).forEach((sub) =>
        dutyTeachers(c, sub).forEach((t) => { coreLoad[t] = (coreLoad[t] || 0) + 1; })
      )
    );
    // classes with only one usable science subject today (single-sci classes
    // with quota left, or multi-sci classes down to their last sub) go first
    // so they claim their teacher before greedy classes spend it
    const forcedSci = (c) => {
      const m = meta[c];
      const avail = m.sciSubs.filter(
        (s) => (fhRemaining[c][s] || 0) > 0 &&
          ![...placed[c][day].values()].some((v) => v.subject === s)
      );
      return avail.length === 1;
    };
    const priority = (c) =>
      (forcedSci(c) ? 100 : 0) +
      Math.max(
        0,
        ...coresOf(c).flatMap((sub) => dutyTeachers(c, sub).map((t) => coreLoad[t] || 0))
      );
    const base = [...senClasses].sort((a, b) => priority(b) - priority(a) || a.localeCompare(b));
    const order = [
      ...prepend.filter((c) => senClasses.includes(c)),
      ...base.filter((c) => !prepend.includes(c)),
    ];

    // 1) cores — dynamic: re-sort remaining cores by tightest teacher before
    // every placement so a roomier core can't steal the last usable cell
    for (const c of order) {
      let cores = coresOf(c);
      let guard = 0;
      while (cores.length && guard < 10) {
        guard += 1;
        cores.sort((a, b) => coreTightness(c, day, a) - coreTightness(c, day, b));
        const sub = cores.shift();
        if (placeDuty(c, day, sub, FH_PERIODS)) {
          fhRemaining[c][sub] -= 1;
        } else {
          fails.push({
            type: 'fh-core', classId: c, day, subject: sub,
            note: `no legal P1-5 cell [${lastWhy[`${c}|${day}|${sub}`] || '?'}]`,
          });
        }
      }
    }

    // 2) extras — fill each class to exactly 5 FH cells (NEVER core subjects:
    // their quota equals the daily core demand; eating it starves later days).
    // Sort by urgency = remaining/daysLeft so high-demand subjects (langs,
    // Computer/Skill) interleave across days instead of lang-first static pref
    // which pushes Computer/Skill onto the last days where GA saturates.
    const dayIdx = PLAN_DAYS.indexOf(day);
    const daysLeft = PLAN_DAYS.length - dayIdx;
    const prefIdx = (s) => {
      const pref = [
        'English_Lang', 'English_Lit', 'Hindi_Lang', 'Hindi_Lit',
        'Computer', 'Computer/HSC', 'Skill',
      ];
      const i = pref.findIndex((x) => x.toLowerCase() === s.toLowerCase());
      return i < 0 ? 99 : i;
    };
    for (const c of order) {
      let need = 5 - placed[c][day].size;
      if (need <= 0) continue;
      const subs = Object.keys(fhRemaining[c])
        .filter((s) => !isCoreSub(c, s) && (fhRemaining[c][s] || 0) > 0)
        .sort((a, b) =>
          teacherWeekSlack(c, day, a, 'FH') - teacherWeekSlack(c, day, b, 'FH') ||
          (fhRemaining[c][b] / daysLeft) - (fhRemaining[c][a] / daysLeft) ||
          prefIdx(a) - prefIdx(b)
        );
      const triedWhy = [];
      const failedOnce = new Set();
      let progress = true;
      while (need > 0 && progress) {
        progress = false;
        for (const sub of subs) {
          if (need <= 0) break;
          if ((fhRemaining[c][sub] || 0) <= 0) continue;
          const alreadyToday = [...placed[c][day].values()].filter((x) => x.subject === sub).length;
          if (alreadyToday >= maxPerDayOf(c, sub)) {
            if (!failedOnce.has(`${sub}:maxday`)) { failedOnce.add(`${sub}:maxday`); triedWhy.push(`${sub}:maxday`); }
            continue;
          }
          if (placeDuty(c, day, sub, FH_PERIODS)) {
            fhRemaining[c][sub] -= 1;
            need -= 1;
            progress = true;
          } else if (!failedOnce.has(sub)) {
            failedOnce.add(sub);
            triedWhy.push(`${sub}:[${lastWhy[`${c}|${day}|${sub}`] || '?'}]`);
          }
        }
      }
      if (need > 0) {
        swapFill(day, c);
        need = 5 - placed[c][day].size;
      }
      if (need > 0) {
        fails.push({
          type: 'fh-fill', classId: c, day,
          note: `${need} first-half cell(s) unfilled ${triedWhy.join('; ')}`,
        });
      }
    }
    return fails;
  };

  // run SH placement for one day in `prepend`-first class order
  const runShDay = (day, prepend) => {
    const fails = [];
    const order = [
      ...prepend.filter((c) => senClasses.includes(c)),
      ...senClasses.filter((c) => !prepend.includes(c)),
    ];
    for (const c of order) {
      const shPlaced = [...placed[c][day].keys()].filter((p) => p >= 6).length;
      let need = 3 - shPlaced;
      if (need <= 0) continue;

      const candidates = Object.keys(shPool[c]).filter((sub) => shPool[c][sub] > 0);
      // tightest teacher first: a subject whose teacher has 1 SH cell left
      // must claim a cell before roomier subjects fill them all
      const freeShCount = (sub) => {
        const ts = dutyTeachers(c, sub);
        let n = 0;
        for (const p of SH_PERIODS) {
          if (placed[c][day].has(p)) continue;
          if (!teachersFree(day, p, ts, c)) continue;
          if (adjacentClash(c, day, p, sub)) continue;
          n += 1;
        }
        return n;
      };
      candidates.sort((a, b) => {
        const ta = [...placed[c][day].values()].filter((x) => x.subject === a).length;
        const tb = [...placed[c][day].values()].filter((x) => x.subject === b).length;
        return (
          teacherWeekSlack(c, day, a, 'SH') - teacherWeekSlack(c, day, b, 'SH') ||
          freeShCount(a) - freeShCount(b) ||
          ta - tb ||
          shPool[c][b] - shPool[c][a]
        );
      });

      const triedWhy = [];
      const failedOnce = new Set();
      let progress = true;
      while (need > 0 && progress) {
        progress = false;
        for (const sub of candidates) {
          if (need <= 0) break;
          if (shPool[c][sub] <= 0) continue;
          const todayCount = [...placed[c][day].values()].filter((x) => x.subject === sub).length;
          // SH cap: never more than 3 of one subject in a day (2 FH + 1 SH
          // is legal for 3-load subjects like 9b's English_lang)
          if (todayCount >= 3) {
            if (!failedOnce.has(`${sub}:maxday`)) { failedOnce.add(`${sub}:maxday`); triedWhy.push(`${sub}:maxday`); }
            continue;
          }
          if (placeDuty(c, day, sub, SH_PERIODS)) {
            shPool[c][sub] -= 1;
            need -= 1;
            progress = true;
          } else if (!failedOnce.has(sub)) {
            failedOnce.add(sub);
            triedWhy.push(`${sub}:[${lastWhy[`${c}|${day}|${sub}`] || '?'}]`);
          }
        }
      }
      if (need > 0) {
        fails.push({
          type: 'sh-fill', classId: c, day,
          note: `${need} second-half cell(s) unfilled ${triedWhy.join('; ')}`,
        });
      }
    }
    return fails;
  };

  // run one day's phase, retrying with the failing classes forced to the front
  const attemptDay = (day, runner) => {
    const snap = snapshotDay(day);
    let prepend = [];
    let best = { fails: null, prepend: [] };
    let stateAttempt = null; // which prepend's result is currently in `placed`
    for (let att = 0; att < 10; att += 1) {
      const fails = runner(day, prepend);
      stateAttempt = prepend;
      if (best.fails === null || fails.length < best.fails.length) {
        best = { fails, prepend };
      }
      if (!fails.length) {
        best = { fails, prepend };
        break; // current state is the winner — keep it
      }
      restoreDay(day, snap);
      stateAttempt = null;
      // accumulate: keep earlier prepends, add newly failed classes — replacing
      // the list oscillates between starving class A and starving class B
      const failedClasses = [...new Set(fails.map((f) => f.classId))];
      const nextPrepend = [...new Set([...prepend, ...failedClasses])];
      if (nextPrepend.length === prepend.length) break; // same order -> same result
      prepend = nextPrepend;
    }
    if (best.fails !== null && stateAttempt !== best.prepend) {
      restoreDay(day, snap);
      best.fails = runner(day, best.prepend);
    }
    return best.fails || [];
  };

  // ---- FIRST HALF, day by day ----
  PLAN_DAYS.forEach((day) => {
    attemptDay(day, runFhDay).forEach((f) => manual.push(f));
  });

  // ---- SECOND HALF, day by day (P6-8, P9 buffer) ----
  PLAN_DAYS.forEach((day) => {
    attemptDay(day, runShDay).forEach((f) => manual.push(f));
  });

  // ---------- assemble ----------
  const newTimetables = {};
  senClasses.forEach((c) => {
    const slots = [];
    PLAN_DAYS.forEach((day) => {
      [...placed[c][day].keys()]
        .sort((a, b) => a - b)
        .forEach((p) => {
          const cell = placed[c][day].get(p);
          slots.push({
            day,
            period: p,
            subject: cell.subject,
            teacher: cell.teacher,
            assignedTeachers: cell.assignedTeachers,
            clashes: [],
          });
        });
    });
    newTimetables[c] = slots;
  });

  // diff vs original -> updateSlot calls (per class)
  const updates = [];
  senClasses.forEach((c) => {
    const before = new Map();
    (timetables[c] || []).forEach((s) => before.set(ckey(s.day, s.period), { ...s }));
    const after = new Map();
    newTimetables[c].forEach((s) => after.set(ckey(s.day, s.period), { ...s }));
    const keys = new Set([...before.keys(), ...after.keys()]);
    keys.forEach((k) => {
      const b = before.get(k);
      const a = after.get(k);
      if (!!b && !!a && b.subject === a.subject && b.teacher === a.teacher) return;
      if (!b && !a) return;
      const [day, period] = k.split('|');
      updates.push({
        classId: c,
        day,
        period: parseInt(period, 10),
        subject: a ? a.subject : '',
        teacher: a ? a.teacher : '',
        assignedTeachers: a ? a.assignedTeachers || [] : [],
      });
    });
  });

  const failures = verifyPlan(meta, quota, fhRemaining, shPool, placed, newTimetables, timetables, senClasses);

  return {
    classes: senClasses,
    newTimetables,
    updates,
    manual,
    report: { quota, failures, manual },
    ok: manual.length === 0 && failures.length === 0,
  };
}

// ---------- verification ----------

function verifyPlan(meta, quota, fhRemaining, shPool, placed, newTT, oldTT, senClasses) {
  const failures = [];

  senClasses.forEach((c) => {
    const oldCounts = {};
    (oldTT[c] || []).forEach((s) => { oldCounts[s.subject] = (oldCounts[s.subject] || 0) + 1; });
    const newCounts = {};
    (newTT[c] || []).forEach((s) => { newCounts[s.subject] = (newCounts[s.subject] || 0) + 1; });
    const sorted = (o) =>
      JSON.stringify(Object.keys(o).sort().map((k) => [k, o[k]]));
    if (sorted(oldCounts) !== sorted(newCounts)) {
      failures.push(`${c}: loads changed (${JSON.stringify(newCounts)})`);
    }
    const leftoverFh = Object.entries(fhRemaining[c]).filter(([, n]) => n > 0);
    if (leftoverFh.length) {
      failures.push(`${c}: unplaced first-half quota ${JSON.stringify(Object.fromEntries(leftoverFh))}`);
    }
    const leftoverSh = Object.entries(shPool[c]).filter(([, n]) => n > 0);
    if (leftoverSh.length) {
      failures.push(`${c}: unplaced second-half ${JSON.stringify(Object.fromEntries(leftoverSh))}`);
    }

    PLAN_DAYS.forEach((day) => {
      const dayEntries = [...placed[c][day].entries()].sort((a, b) => a[0] - b[0]);
      const fh = dayEntries.filter(([p]) => p <= 5);
      const sh = dayEntries.filter(([p]) => p >= 6);
      if (fh.length !== 5) failures.push(`${c} ${day}: ${fh.length}/5 first-half cells`);
      if (sh.length !== 3) failures.push(`${c} ${day}: ${sh.length}/3 second-half cells`);
      // adjacency
      for (let i = 1; i < dayEntries.length; i += 1) {
        const [pa, a] = dayEntries[i - 1];
        const [pb, b] = dayEntries[i];
        if (pb === pa + 1 && a.subject === b.subject) {
          failures.push(`${c} ${day}: ${a.subject} continuous P${pa}-P${pb}`);
        }
      }
      const fhSubs = fh.map(([, v]) => v.subject);
      if (!fhSubs.some(isMaths)) failures.push(`${c} ${day}: no Maths in P1-5`);
      if (!fhSubs.some(isSci)) failures.push(`${c} ${day}: no Science in P1-5`);
      const sstNeed = (meta[c].counts[meta[c].sstSub] || 0) >= 6;
      if (sstNeed && !fhSubs.some(isSst)) failures.push(`${c} ${day}: no SST in P1-5`);
    });
  });

  // teacher double-booking across rebuilt seniors + fixed juniors/others
  const occ = {};
  const addOcc = (c, s) =>
    teachersOf(s).forEach((t) => {
      const k = `${t.toLowerCase()}|${s.day}|${parseInt(s.period, 10)}`;
      (occ[k] = occ[k] || []).push(c);
    });
  Object.entries(newTT).forEach(([c, ss]) => ss.forEach((s) => addOcc(c, s)));
  Object.entries(oldTT).forEach(([c, ss]) => {
    if (senClasses.includes(c) || isClass11or12(c)) return;
    (ss || []).forEach((s) => addOcc(c, s));
  });
  Object.entries(occ).forEach(([k, cs]) => {
    if (new Set(cs).size > 1 && cs.some((c) => senClasses.includes(c))) {
      failures.push(`teacher clash: ${k} -> ${[...new Set(cs)].join('+')}`);
    }
  });

  return failures;
}
