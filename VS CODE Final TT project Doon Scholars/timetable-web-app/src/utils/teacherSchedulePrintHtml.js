// Printable teacher schedule HTML (popup window, A4 landscape).
// Used by the TeacherView print buttons.
//
// modes (same rules as the class timetable print - see filteredPrintHtml.js):
//   'all'     : whole week as-is (free period shows "Free").
//   'default' : classes 1-5 keep P6..periodCount, classes 6-11 keep P1-P5,
//               class 12 never prints - everything else prints "Practice".
//   'split'   : classes 1-5 keep P1-P5, classes 6-11 keep P6..periodCount.
//
// Two entry points:
//   buildTeacherSchedulePrintHtml  - one teacher, one sheet
//   buildAllTeachersPrintHtml      - every teacher, one teacher per page
//
// Input `schedule` is the shape TeacherView computes:
//   { Mon: { 1: { classIds, subjects, entries:[{classId,subject}],
//                  combined, clash, clashMark } | null, ... }, ... }

import { keepRangeFor, printModeNote, subjectLabel } from './filteredPrintHtml.js';

const PRACTICE = 'Practice';

const esc = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const uniq = (arr) => [...new Set((arr || []).filter(Boolean))];

const classNum = (id) => {
  const n = parseInt(id, 10);
  return Number.isFinite(n) ? n : 6;
};

// per-class {classId, subject} pairs (TeacherView keeps `entries` aligned
// with classIds; fall back to index pairing for older callers)
const pairsOf = (slot) => {
  if (Array.isArray(slot.entries) && slot.entries.length) return slot.entries;
  const ids = slot.classIds || [];
  const subs = slot.subjects || [];
  return ids.map((id, i) => ({ classId: id, subject: subs[i] || '' }));
};

const isPrinted = (classId, period, mode, periodCount) => {
  const n = classNum(classId);
  if (n >= 12) return false; // class 12 is never printed
  const { from, to } = keepRangeFor(n, mode, periodCount);
  return period >= from && period <= to;
};

const badgeFor = (slot) => {
  if (!slot.clash) return '';
  const mark = slot.clashMark ? slot.clashMark.status : null;
  const cls = mark === 'checked' ? 'checked' : mark === 'intentional' ? 'ok' : 'warn';
  const text = mark === 'checked' ? 'Checked' : mark === 'intentional' ? 'Combined' : 'Clash';
  return `<span class="badge ${cls}">${text}</span>`;
};

const normalizeMode = (mode) => (['default', 'split'].includes(mode) ? mode : 'all');

const validate = (opts) => {
  const days = opts.days && opts.days.length ? opts.days : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const periods =
    opts.periods && opts.periods.length ? opts.periods : [1, 2, 3, 4, 5, 6, 7, 8, 9];
  return {
    days,
    periods,
    mode: normalizeMode(opts.mode),
    periodCount: periods.length,
    updatedAt: opts.updatedAt || new Date().toLocaleString(),
  };
};

/** Day × period rows for one teacher. Returns { rows, lessons, practice }. */
const renderRows = (schedule, ctx) => {
  const { days, periods, mode, periodCount } = ctx;
  const acc = { lessons: 0, practice: 0 };

  const cellHtml = (day, p) => {
    const slot = schedule[day] && schedule[day][p];

    if (mode === 'all') {
      if (!slot) return `<td class="free"><span class="free-txt">Free</span></td>`;
      acc.lessons++;
      const classes = uniq(slot.classIds)
        .map((c) => String(c).toUpperCase())
        .join(' + ');
      const subjects = uniq(slot.subjects).map(subjectLabel).join(' / ');
      return `<td><span class="cls">${esc(classes)}</span>${
        subjects ? `<span class="sub">${esc(subjects)}</span>` : ''
      }${badgeFor(slot)}</td>`;
    }

    // ── filtered / split: only the printed range shows a lesson ──
    if (!slot) {
      acc.practice++;
      return `<td class="free"><span class="free-txt">${PRACTICE}</span></td>`;
    }

    const pairs = pairsOf(slot);
    const kept = pairs.filter((x) => isPrinted(x.classId, p, mode, periodCount));
    const dropped = pairs.filter((x) => !isPrinted(x.classId, p, mode, periodCount));

    if (kept.length === 0) {
      // every class in this cell is outside the printed range → grey band
      acc.practice++;
      const ids = dropped
        .map((x) => `<span class="cls out-cls">${esc(String(x.classId).toUpperCase())}</span>`)
        .join('');
      return `<td class="out">${ids}<span class="free-txt">${PRACTICE}</span></td>`;
    }

    acc.lessons++;
    const body =
      kept
        .map(
          (x) =>
            `<span class="cls">${esc(String(x.classId).toUpperCase())}</span>${
              x.subject ? `<span class="sub">${esc(subjectLabel(x.subject))}</span>` : ''
            }`
        )
        .join('') +
      dropped
        .map(
          (x) =>
            `<span class="cls out-cls">${esc(String(x.classId).toUpperCase())}</span>` +
            `<span class="free-txt">${PRACTICE}</span>`
        )
        .join('');

    return `<td>${body}${badgeFor(slot)}</td>`;
  };

  const rows = days
    .map((day) => {
      const cells = periods.map((p) => cellHtml(day, p)).join('');
      return `<tr><th>${esc(day)}</th>${cells}</tr>`;
    })
    .join('');

  return { rows, lessons: acc.lessons, practice: acc.practice };
};

const tableFor = (rows, periods) => `<table>
    <thead><tr><th class="day-col">Day</th>${periods.map((p) => `<th>P${p}</th>`).join('')}</tr></thead>
    <tbody>${rows}</tbody>
  </table>`;

const noteFor = (mode, periodCount, counts, updatedAt) =>
  mode === 'all'
    ? `Total load ${counts.totalClasses} periods/week &middot; periods/day ${periodCount}
       &middot; generated ${esc(updatedAt)}.`
    : `${printModeNote(mode, periodCount)}<br>
       Only lessons inside that range are printed; every other cell reads <b>${PRACTICE}</b>
       (grey band = outside the printed range).
       ${counts.lessons} lesson(s) printed &middot; ${counts.practice} ${PRACTICE} period(s).
       Generated ${esc(updatedAt)}.`;

const legendFor = (mode) =>
  mode === 'all'
    ? `<div class="legend">
       <span class="lg" style="background:#dc2626">Clash</span> allotted to 2+ classes, not reviewed yet &nbsp;
       <span class="lg" style="background:#d97706">Checked</span> reviewed, pending fix &nbsp;
       <span class="lg" style="background:#16a34a">Combined</span> intentional combined period &nbsp;
       Free = no class in this period
       </div>`
    : `<div class="legend"><span class="sw"></span>Grey band = outside the printed range
       <span class="sp">${PRACTICE} = no lesson printed here (free period or out of range)</span>
       <span class="sp">Clash = allotted to 2+ classes, not reviewed &middot; Checked = reviewed &middot; Combined = intentional</span></div>`;

const shellCss = (periods) => `  * { box-sizing: border-box; }
  body { font-family: "Segoe UI", Arial, sans-serif; margin: 0; color: #1a1a1a; }
  .toolbar { padding: 10px 16px; background: #4f46e5; color: #fff; display: flex; justify-content: space-between; align-items: center; }
  .toolbar button { padding: 8px 18px; font-size: 14px; border: 0; border-radius: 6px; background: #fff; color: #4f46e5; font-weight: 700; cursor: pointer; }
  h1 { font-size: 20px; margin: 16px 16px 4px; }
  .meta { margin: 0 16px 10px; font-size: 12px; color: #555; line-height: 1.5; }
  table { width: calc(100% - 32px); margin: 0 16px 12px; border-collapse: collapse; table-layout: fixed; }
  th, td { border: 1px solid #94a3b8; padding: 5px 4px; text-align: center; vertical-align: middle; }
  thead th { background: #1e293b; color: #fff; font-size: 12px; padding: 7px 3px; }
  th.day-col { width: 58px; }
  thead th:not(.day-col) { width: calc((100% - 58px) / ${periods.length}); }
  tbody th { background: #f1f5f9; font-size: 12px; font-weight: 700; }
  tbody td { height: 48px; background: #fff; }
  td.free { background: #fff; }
  td.out { background: #e9ecef !important; }
  .free-txt { display: block; font-size: 11px; font-weight: 600; font-style: italic; color: #94a3b8; letter-spacing: .02em; }
  td.out .free-txt { color: #475569; }
  .cls { display: block; font-size: 13px; font-weight: 800; line-height: 1.2; }
  .out-cls { color: #475569; }
  .sub { display: block; font-size: 11px; color: #475569; line-height: 1.2; }
  .badge { display: inline-block; margin-top: 3px; font-size: 9px; font-weight: 800; letter-spacing: .03em; padding: 1px 6px; border-radius: 8px; color: #fff; }
  .badge.warn { background: #dc2626; }
  .badge.checked { background: #d97706; }
  .badge.ok { background: #16a34a; }
  .teacher-block { page-break-after: always; break-after: page; }
  .teacher-block:last-of-type { page-break-after: auto; break-after: auto; }
  .teacher-head { display: flex; align-items: center; gap: 10px; margin: 14px 16px 6px; }
  .teacher-name { font-size: 17px; font-weight: 800; }
  .load { font-size: 11px; font-weight: 700; background: #eef2ff; color: #4338ca; border: 1px solid #c7d2fe; border-radius: 999px; padding: 2px 10px; }
  .legend { margin: 0 16px 16px; font-size: 11px; color: #666; }
  .legend .lg { display: inline-block; padding: 1px 7px; border-radius: 8px; color: #fff; font-size: 9px; font-weight: 800; margin-right: 4px; }
  .legend .sw { display: inline-block; width: 14px; height: 11px; background: #e9ecef; border: 1px solid #94a3b8; vertical-align: -1px; margin-right: 4px; }
  .legend .sp { display: inline-block; margin-left: 14px; font-style: italic; font-weight: 600; color: #64748b; }
  @page { size: A4 landscape; margin: 10mm; }
  @media print {
    .toolbar { display: none; }
    h1 { margin-top: 0; }
    .teacher-head { margin-top: 4px; }
  }`;

/** One teacher, one sheet (same layout as before). */
export const buildTeacherSchedulePrintHtml = (opts = {}) => {
  const teacher = String(opts.teacher || '').trim();
  const fullName = String(opts.fullName || '').trim();
  const ctx = validate(opts);
  const counts = { totalClasses: opts.totalClasses || 0, lessons: 0, practice: 0 };

  const { rows, lessons, practice } = renderRows(opts.schedule || {}, ctx);
  counts.lessons = lessons;
  counts.practice = practice;

  const modeTag = ctx.mode === 'split' ? ' - junior/senior split' : ctx.mode === 'default' ? ' - filtered' : '';
  const heading =
    fullName && fullName.toUpperCase() !== teacher.toUpperCase()
      ? `${esc(teacher)} - ${esc(fullName)}`
      : esc(teacher || 'Teacher');

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Teacher Schedule - ${esc(teacher)}${esc(modeTag)}</title>
<style>
${shellCss(ctx.periods)}
</style>
</head>
<body>
  <div class="toolbar">
    <span>Doon Scholars - Teacher Schedule${esc(modeTag)}</span>
    <button onclick="window.print()">Print / Save as PDF</button>
  </div>
  <h1>${heading}</h1>
  <div class="meta">${noteFor(ctx.mode, ctx.periodCount, counts, ctx.updatedAt)}</div>
  ${tableFor(rows, ctx.periods)}
  ${legendFor(ctx.mode)}
</body>
</html>`;
};

/**
 * Every teacher, one teacher per page (like Print All / Print Filtered
 * on the class timetable). `opts.teachers` = [{ teacher, schedule, totalClasses }].
 */
export const buildAllTeachersPrintHtml = (opts = {}) => {
  const ctx = validate(opts);
  const list = Array.isArray(opts.teachers) ? opts.teachers : [];
  const totals = { totalClasses: 0, lessons: 0, practice: 0 };

  const sections = list
    .map((entry) => {
      const name = String(entry.teacher || '').trim();
      const load = entry.totalClasses || 0;
      const { rows, lessons, practice } = renderRows(entry.schedule || {}, ctx);
      totals.totalClasses += load;
      totals.lessons += lessons;
      totals.practice += practice;
      const loadLabel = `${load} period${load === 1 ? '' : 's'}/week`;
      const countLabel =
        ctx.mode === 'all'
          ? ''
          : ` &middot; ${lessons} printed &middot; ${practice} ${PRACTICE}`;
      return `
  <section class="teacher-block">
    <div class="teacher-head">
      <span class="teacher-name">${esc(name || 'Teacher')}</span>
      <span class="load">${loadLabel}${countLabel}</span>
    </div>
    ${tableFor(rows, ctx.periods)}
  </section>`;
    })
    .join('');

  const modeTag = ctx.mode === 'split' ? ' - junior/senior split' : ctx.mode === 'default' ? ' - filtered' : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Teacher Schedules - all teachers${esc(modeTag)}</title>
<style>
${shellCss(ctx.periods)}
</style>
</head>
<body>
  <div class="toolbar">
    <span>Doon Scholars - All Teacher Schedules${esc(modeTag)}</span>
    <button onclick="window.print()">Print / Save as PDF</button>
  </div>
  <h1>All Teacher Schedules${esc(modeTag)} <span class="load">${list.length} teachers</span></h1>
  <div class="meta">
    ${noteFor(ctx.mode, ctx.periodCount, totals, ctx.updatedAt)}
    One teacher per page.
  </div>
  ${legendFor(ctx.mode)}
${sections}
</body>
</html>`;
};
