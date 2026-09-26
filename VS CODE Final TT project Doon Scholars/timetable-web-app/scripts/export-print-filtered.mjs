#!/usr/bin/env node
/**
 * Generate a print-friendly HTML timetable with period filtering:
 *   - Classes 1-5 : keep P6-P9 only  (P1-P5 blanked)
 *   - Classes 6-11: keep P1-P6 only  (P7-P9 blanked)
 *   - Class 12    : skipped entirely
 *
 * Source: sync-data.json (local sync server state = freshest).
 * Usage : node scripts/export-print-filtered.mjs [outfile]
 * Then open the .html and Ctrl+P -> Save as PDF (landscape).
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const dataPath = resolve(here, '..', 'sync-data.json');
const outPath = resolve(
  process.argv[2] || resolve(here, '..', '..', '..', 'timetable_print_1-5_P6-9_6-11_P1-6.html')
);

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const PERIODS = [1, 2, 3, 4, 5, 6, 7, 8, 9];

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

const classSort = (a, b) => {
  const na = parseInt(a, 10);
  const nb = parseInt(b, 10);
  if (na !== nb) return na - nb;
  return a.slice(String(na).length).localeCompare(b.slice(String(nb).length));
};

const state = JSON.parse(readFileSync(dataPath, 'utf8'));
const timetables = state.timetables || {};
const periodCount = state.periodCount || 9;

const classIds = Object.keys(timetables)
  .filter((id) => !/^12/.test(id))
  .sort(classSort);

const sections = [];

for (const id of classIds) {
  const num = parseInt(id, 10);
  const keepFrom = num <= 5 ? 6 : 1;
  const keepTo = num <= 5 ? 9 : 6;
  const keepLabel = num <= 5 ? 'Periods 6-9' : 'Periods 1-6';

  const grid = new Map();
  for (const s of timetables[id] || []) {
    grid.set(`${s.day}-${s.period}`, s);
  }

  const rows = DAYS.map((day) => {
    const cells = PERIODS.map((p) => {
      const outside = p < keepFrom || p > keepTo;
      const s = grid.get(`${day}-${p}`);
      if (outside) return `<td class="out"></td>`;
      if (!s || !s.subject) return `<td></td>`;
      const teaOf = (t) =>
        typeof t === 'string' ? t.trim() : String((t && (t.teacher || t.name || t.initials)) || '').trim();
      const teachers = [...new Set(
        (s.assignedTeachers || [])
          .map(teaOf)
          .concat(String(s.teacher || '').split(',').map((t) => t.trim()))
          .filter(Boolean)
      )].join(', ');
      const sub = label(s.subject).replace(/</g, '&lt;');
      const tea = teachers.replace(/</g, '&lt;');
      return `<td><span class="sub">${sub}</span>${tea ? `<span class="tea">${tea}</span>` : ''}</td>`;
    }).join('');
    return `<tr><th>${day}</th>${cells}</tr>`;
  }).join('');

  sections.push(`
  <section class="class-block">
    <div class="class-head">
      <span class="class-name">Class ${id.toUpperCase()}</span>
      <span class="badge">${keepLabel}</span>
    </div>
    <table>
      <thead><tr><th class="day-col">Day</th>${PERIODS.map((p) => `<th>P${p}</th>`).join('')}</tr></thead>
      <tbody>${rows}</tbody>
    </table>
  </section>`);
}

const updatedAt = state.updatedAt ? new Date(state.updatedAt).toLocaleString() : 'unknown';

const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Doon Scholars Timetable - Classes 1-11 (filtered)</title>
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
  thead th:not(.day-col) { width: calc((100% - 58px) / 9); }
  tbody th { background: #f1f5f9; font-size: 12px; font-weight: 700; }
  tbody td { height: 44px; background: #fff; }
  td.out { background: #e9ecef !important; }
  .sub { display: block; font-size: 12px; font-weight: 700; line-height: 1.2; }
  .tea { display: block; font-size: 10px; color: #64748b; line-height: 1.2; }
  .legend { font-size: 11px; color: #666; margin: 8px 16px 0; }
  .legend .sw { display: inline-block; width: 14px; height: 11px; background: #e9ecef; border: 1px solid #94a3b8; vertical-align: -1px; margin-right: 4px; }
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
    <span>Doon Scholars - Weekly Timetable (filtered)</span>
    <button onclick="window.print()">Print / Save as PDF</button>
  </div>
  <div class="note">
    Classes 1-5: <b>P6-P9 only</b> &nbsp;|&nbsp; Classes 6-11: <b>P1-P6 only</b> &nbsp;|&nbsp; Class 12 not included.
    Grey cells = periods outside the kept range (left blank).
    Generated ${updatedAt} (periods/day: ${periodCount}, source: sync-data.json).
  </div>
  <div class="legend"><span class="sw"></span>Grey = intentionally blank (out of range)</div>
${sections.join('\n')}
  <script>window.addEventListener('load', () => {});</script>
</body>
</html>`;

writeFileSync(outPath, html, 'utf8');
console.log(`Wrote ${outPath}`);
console.log(`Classes: ${classIds.length} (${classIds.join(', ')})`);
