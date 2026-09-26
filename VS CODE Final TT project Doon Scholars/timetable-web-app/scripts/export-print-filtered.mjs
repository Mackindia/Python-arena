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
 *
 * HTML is built by src/utils/filteredPrintHtml.js — the SAME module the
 * live site's "Print Filtered" button uses.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildFilteredPrintHtml } from '../src/utils/filteredPrintHtml.js';

const here = dirname(fileURLToPath(import.meta.url));
const dataPath = resolve(here, '..', 'sync-data.json');
const outPath = resolve(
  process.argv[2] || resolve(here, '..', '..', '..', 'timetable_print_1-5_P6-9_6-11_P1-6.html')
);

const state = JSON.parse(readFileSync(dataPath, 'utf8'));

const html = buildFilteredPrintHtml(state.timetables, {
  periodCount: state.periodCount || 9,
  updatedAt: state.updatedAt ? new Date(state.updatedAt).toLocaleString() : 'unknown',
});

writeFileSync(outPath, html, 'utf8');

const classIds = Object.keys(state.timetables || {}).filter((id) => !/^12/.test(id));
console.log(`Wrote ${outPath}`);
console.log(`Classes: ${classIds.length} (${classIds.join(', ')})`);
