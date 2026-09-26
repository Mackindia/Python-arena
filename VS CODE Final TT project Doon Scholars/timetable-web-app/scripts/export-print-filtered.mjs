#!/usr/bin/env node
/**
 * Generate a print-friendly HTML timetable with period filtering.
 *
 * modes (--mode):
 *   default : classes 1-5 keep P6-P9 only, classes 6-11 keep P1-P6 only
 *   split   : classes 1-5 keep P1-P5 only, classes 6-11 keep P6-P9 only
 *   Class 12    : skipped entirely (both modes)
 *
 * Source: sync-data.json (local sync server state = freshest).
 * Usage : node scripts/export-print-filtered.mjs [outfile] [--mode split]
 * Then open the .html and Ctrl+P -> Save as PDF (landscape).
 *
 * HTML is built by src/utils/filteredPrintHtml.js — the SAME module the
 * live site's "Print Filtered" / "Print Split" buttons use.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildFilteredPrintHtml } from '../src/utils/filteredPrintHtml.js';

const here = dirname(fileURLToPath(import.meta.url));
const dataPath = resolve(here, '..', 'sync-data.json');

const args = process.argv.slice(2);
const modeArg = args.find((a) => a.startsWith('--mode'));
let mode = 'default';
if (modeArg) {
  mode = modeArg.includes('=') ? modeArg.split('=')[1] : args[args.indexOf(modeArg) + 1];
}
mode = mode === 'split' ? 'split' : 'default';

const positional = args.filter((a) => !a.startsWith('--') && a !== mode);
const outPath = resolve(
  positional[0] ||
    resolve(
      here,
      '..',
      '..',
      '..',
      mode === 'split'
        ? 'timetable_print_split_1-5_P1-5_6-11_P6-9.html'
        : 'timetable_print_1-5_P6-9_6-11_P1-6.html'
    )
);

const state = JSON.parse(readFileSync(dataPath, 'utf8'));

const html = buildFilteredPrintHtml(state.timetables, {
  periodCount: state.periodCount || 9,
  mode,
  updatedAt: state.updatedAt ? new Date(state.updatedAt).toLocaleString() : 'unknown',
});

writeFileSync(outPath, html, 'utf8');

const classIds = Object.keys(state.timetables || {}).filter((id) => !/^12/.test(id));
console.log(`Wrote ${outPath}`);
console.log(`Mode: ${mode}`);
console.log(`Classes: ${classIds.length} (${classIds.join(', ')})`);
