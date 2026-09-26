// Printable filtered timetable HTML (shared by the live-site Print buttons
// and scripts/export-print-filtered.mjs).
//
// modes:
//   'default' (classic):
//     - Classes 1-5 : keep P6..periodCount only (P1-P5 blanked)
//     - Classes 6-11: keep P1-P6 only (P7..periodCount blanked)
//   'split' (junior/senior halves):
//     - Classes 1-5 : keep P1-P5 only      (P6..periodCount blanked)
//     - Classes 6-11: keep P6..periodCount only (P1-P5 blanked)
//   Class 12 is skipped entirely in both modes.
//   Every cell without a printed subject shows "Practice": out-of-range
//   (grey band) cells and in-range free periods alike.

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const PRACTICE = 'Practice';

const SUBJECT_LABELS = {
  English_Lit: 'English',
  English_Lang: 'English',
  Hindi_Lit: 'Hindi',
  Hindi_Lang: 'Hindi',
  SSt: 'SST',
  ')Science': 'Science',
};

const label = (s) => {
  const t = String(s || '').trim();
  return SUBJECT_LABELS[t] || t.replace(/^_/, '');
};

const esc = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const teaOf = (t) =>
  typeof t === 'string' ? t.trim() : String((t && (t.teacher || t.name || t.initials)) || '').trim();

const classSort = (a, b) => {
  const na = parseInt(a, 10);
  const nb = parseInt(b, 10);
  if (na !== nb) return na - nb;
  return a.slice(String(na).length).localeCompare(b.slice(String(nb).length));
};

// Which periods a class keeps, per mode.
export const keepRangeFor = (classNum, mode, periodCount) => {
  const junior = classNum <= 5;
  if (mode === 'split') {
    return junior
      ? { from: 1, to: Math.min(5, periodCount), label: 'Periods 1-5' }
      : { from: 6, to: periodCount, label: `Periods 6-${periodCount}` };
  }
  return junior
    ? { from: 6, to: periodCount, label: `Periods 6-${periodCount}` }
    : { from: 1, to: Math.min(6, periodCount), label: 'Periods 1-6' };
};

const modeNote = (mode, periodCount) => {
  if (mode === 'split') {
    return `Classes 1-5: <b>P1-P5 only</b> &nbsp;|&nbsp; Classes 6-11: <b>P6-P${periodCount} only</b> &nbsp;|&nbsp; Class 12 not included.`;
  }
  return `Classes 1-5: <b>P6-P${periodCount} only</b> &nbsp;|&nbsp; Classes 6-11: <b>P1-P6 only</b> &nbsp;|&nbsp; Class 12 not included.`;
};

export const buildFilteredPrintHtml = (timetables, opts = {}) => {
  const periodCount = opts.periodCount || 9;
  const mode = opts.mode === 'split' ? 'split' : 'default';
  const periods = Array.from({ length: periodCount }, (_, i) => i + 1);
  const updatedAt = opts.updatedAt || new Date().toLocaleString();
  const modeTag = mode === 'split' ? ' - junior/senior split' : '';

  const classIds = Object.keys(timetables || {})
    .filter((id) => !/^12/.test(id))
    .sort(classSort);

  const sections = [];

  for (const id of classIds) {
    const num = parseInt(id, 10);
    const { from: keepFrom, to: keepTo, label: keepLabel } = keepRangeFor(num, mode, periodCount);

    const grid = new Map();
    for (const s of timetables[id] || []) {
      grid.set(`${s.day}-${s.period}`, s);
    }

    const rows = DAYS.map((day) => {
      const cells = periods
        .map((p) => {
          const outside = p < keepFrom || p > keepTo;
          const s = grid.get(`${day}-${p}`);
          // Every cell that would render blank prints "Practice":
          //   - outside the kept range (class not printed on this sheet)
          //   - inside the range but with no subject (free period)
          if (outside) return `<td class="out"><span class="free-txt">${PRACTICE}</span></td>`;
          const subject = String((s && s.subject) || '').trim();
          if (!subject) return `<td class="free"><span class="free-txt">${PRACTICE}</span></td>`;
          const teachers = [
            ...new Set(
              (s.assignedTeachers || [])
                .map(teaOf)
                .concat(String(s.teacher || '').split(',').map((t) => t.trim()))
                .filter(Boolean)
            ),
          ].join(', ');
          return `<td><span class="sub">${esc(label(subject))}</span>${
            teachers ? `<span class="tea">${esc(teachers)}</span>` : ''
          }</td>`;
        })
        .join('');
      return `<tr><th>${day}</th>${cells}</tr>`;
    }).join('');

    sections.push(`
  <section class="class-block">
    <div class="class-head">
      <span class="class-name">Class ${esc(id.toUpperCase())}</span>
      <span class="badge">${keepLabel}</span>
    </div>
    <table>
      <thead><tr><th class="day-col">Day</th>${periods.map((p) => `<th>P${p}</th>`).join('')}</tr></thead>
      <tbody>${rows}</tbody>
    </table>
  </section>`);
  }

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Doon Scholars Timetable - Classes 1-11 (filtered${modeTag})</title>
<style>
  * { box-sizing: border-box; }
  body { font-family: "Segoe UI", Arial, sans-serif; margin: 0; color: #1a1a1a; }
  .toolbar { padding: 10px 16px; background: #4f46e5; color: #fff; display: flex; justify-content: space-between; align-items: center; }
  .toolbar button { padding: 8px 18px; font-size: 14px; border: 0; border-radius: 6px; background: #fff; color: #4f46e5; font-weight: 700; cursor: pointer; }
  .note { margin: 14px 16px 0; font-size: 12px; color: #555; }
  .class-block { padding: 14px 16px 0; page-break-after: always; break-after: page; }
  .class-block:last-of-type { page-break-after: auto; break-after: auto; }
  .class-head { display: flex; align-items: center; gap: 10px; margin-bottom: 6px; }
  .class-name { font-size: 17px; font-weight: 800; }
  .badge { font-size: 11px; font-weight: 700; background: #eef2ff; color: #4338ca; border: 1px solid #c7d2fe; border-radius: 999px; padding: 2px 10px; }
  table { width: 100%; border-collapse: collapse; table-layout: fixed; }
  th, td { border: 1px solid #94a3b8; padding: 4px 5px; text-align: center; vertical-align: middle; }
  thead th { background: #1e293b; color: #fff; font-size: 12px; padding: 6px 3px; }
  th.day-col { width: 58px; }
  thead th:not(.day-col) { width: calc((100% - 58px) / ${periodCount}); }
  tbody th { background: #f1f5f9; font-size: 12px; font-weight: 700; }
  tbody td { height: 44px; background: #fff; }
  td.out { background: #e9ecef !important; }
  td.free { background: #fff; }
  .free-txt { display: block; font-size: 11px; font-weight: 600; font-style: italic; color: #64748b; letter-spacing: .02em; }
  td.out .free-txt { color: #475569; }
  .sub { display: block; font-size: 12px; font-weight: 700; line-height: 1.2; }
  .tea { display: block; font-size: 10px; color: #64748b; line-height: 1.2; }
  .legend { font-size: 11px; color: #666; margin: 8px 16px 0; }
  .legend .sw { display: inline-block; width: 14px; height: 11px; background: #e9ecef; border: 1px solid #94a3b8; vertical-align: -1px; margin-right: 4px; }
  .legend .sp { display: inline-block; margin-left: 14px; font-style: italic; font-weight: 600; color: #64748b; }
  @page { size: A4 landscape; margin: 10mm; }
  @media print {
    .toolbar { display: none; }
    .note { margin-top: 0; }
    .class-block { padding-top: 4px; }
  }
</style>
</head>
<body>
  <div class="toolbar">
    <span>Doon Scholars - Weekly Timetable (filtered${esc(modeTag)})</span>
    <button onclick="window.print()">Print / Save as PDF</button>
  </div>
  <div class="note">
    ${modeNote(mode, periodCount)}
    Any cell without a printed lesson shows <b>Practice</b> - including the grey cells outside the printed range.
    Generated ${esc(updatedAt)} (periods/day: ${periodCount}).
  </div>
  <div class="legend"><span class="sw"></span>Grey band = outside the printed range<span class="sp">Practice = no lesson printed here (free period or out of range)</span></div>
${sections.join('\n')}
</body>
</html>`;
};
