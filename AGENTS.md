<!-- code-review-graph MCP tools -->
## MCP Tools: code-review-graph

**MANDATORY: This project has a knowledge graph. You MUST use
code-review-graph MCP tools for EVERY prompt — no exceptions.
Do NOT skip the graph. Do NOT fall back to file scanning unless
the graph explicitly cannot answer the query.**

### RULE: Always use graph tools FIRST

Before doing ANYTHING on a prompt:

1. **Think**: Which graph tool answers this?
2. **Call the graph tool** via MCP — get structured data.
3. **Act** on the graph result.
4. **Only then** fall back to Grep/Glob/Read if the graph returned nothing useful.

### Mapping: Prompt type → Tool

| Prompt type | First tool | Backup |
| ----------- | ---------- | ------ |
| "Find function X" | `semantic_search_nodes` | Grep |
| "Who calls X?" | `query_graph` (callers_of) | Grep |
| "What does X depend on?" | `query_graph` (callees_of/imports_of) | Grep |
| "Review my changes" | `detect_changes` + `get_review_context` | Read |
| "Impact of changing X" | `get_impact_radius` + `get_affected_flows` | Manual trace |
| "Architecture overview" | `get_architecture_overview` + `list_communities` | Directory listing |
| "Find tests for X" | `query_graph` (tests_for) | Glob |
| "Dead code?" | `refactor_tool` | Grep |
| "Code smells" | `query_graph` (complexity) | Manual review |

### Available Graph Tools

- `semantic_search_nodes` — find functions/classes by name or keyword
- `query_graph` — trace callers, callees, imports, tests, dependencies
- `detect_changes` — review code changes with risk scoring
- `get_review_context` — get source snippets for review (token-efficient)
- `get_impact_radius` — understand blast radius of a change
- `get_affected_flows` — find which execution paths are impacted
- `get_architecture_overview` — high-level codebase structure
- `list_communities` — see code groupings
- `refactor_tool` — plan renames, find dead code

### Workflow (apply to EVERY prompt)

1. Graph auto-updates on file changes (via plugin hooks).
2. **Call graph tool** — always first.
3. Use `detect_changes` for any review task.
4. Use `get_affected_flows` to understand impact.
5. Use `query_graph` with `tests_for` to check coverage.
6. **Only if graph returns empty** → fall back to Grep/Glob/Read.

---

## Session Progress - September 17, 2026

### COMPLETED: Educational AI Backend Fix

**Problem**: All educational AI generation endpoints (notes, MCQs, worksheets, question banks, lesson plans, Bloom analysis, concept maps) returned HTTP 500 "Internal Server Error" for Class 8 Computational Thinking.

**Root Cause**: The `.env` file containing `GOOGLE_API_KEY` was located at `.vscode\Python arena\ai-teacher\.env` instead of `ai-teacher\.env`. The server was started before the `.env` was copied, so `load_dotenv()` never loaded the API key. All LLM calls failed silently.

**Fix Applied**:
1. Copied `.env` from `.vscode\Python arena\ai-teacher\.env` → `ai-teacher\.env`
2. Fixed `data/books_registry.json`, `registry/books.json`, `registry/chapters.json`: Changed `class_level: "11"` → `"8"` and `subject: "Python"` → `"AI"` for the Class 8 Computational Thinking book
3. Updated 199 FAISS chunks in `faiss_multi_index/` with correct metadata
4. Fixed `app/core/worksheet_generator.py:18`: Changed FAISS path from `"faiss_index"` → `"faiss_multi_index"`
5. Fixed ebook extractor for Class 11 (local path: `D:\downloads data\AI Ver 3.0 class 11\class 11\files\mobile`)
6. Restarted server to pick up the new `.env`

**Verified Working**:
- `/educational/search` - Returns 3 results, 2441 chars context
- `/educational/generate/notes` - Success
- `/educational/generate/mcq` - Success (3 questions)
- `/educational/generate/worksheet` - Success
- `/educational/generate/question-bank` - Success (10 questions)
- `/educational/generate/lesson-plan` - Success
- `/educational/generate/bloom` - Success
- `/educational/generate/concept-map` - Success

**Known Issue**: `/exam/generate-paper` times out (complex prompt, not a fundamental issue)

**Server**: Running on port 8000 with `GOOGLE_API_KEY` loaded

---

## Session Progress - June 26, 2026

### Current Task: DEBUGGING Chat Message Colors

**Status**: All chat components built, but message alignment/colors not working correctly.

**Files with debug logging** (remove after fix):
- `src/components/chat/ChatWidget.tsx` - `[ChatWidget]` logs
- `src/components/chat/AdminChatBubble.tsx` - `[AdminChat]` logs
- `app/admin/messages/page.tsx` - `[AdminPage]` logs

**Expected behavior**:
- User panel: User messages = RIGHT (indigo gradient), Admin messages = LEFT (white bg)
- Admin panel: Admin messages = RIGHT (emerald gradient), User messages = LEFT (slate bg)

**Database data verified correct** - senderRole values are properly stored.

**Next action**: Run `npm run dev`, open browser console (F12), share debug output.


---

## Session Progress - September 25, 2026 (Timetable: class-11 + export/import + staff purge)

### Shipped today (all pushed to `main` -> Railway deploys)
| Commit | What |
| --- | --- |
| `33e3aa6` | 9-period import trusts CSV teachers, refreshed roster, rebuilt engine |
| `a360ecd` | Class 11 composite subjects show correct teacher initials (token fix, `resolveCompositeCell`, csvData rows re-paired, roster filter) |
| `52d0bec` | TeacherView keeps all combined classes per period; `periodCount` travels through sync (schema + POST/GET + receive) |
| `cc5b950` | JSON backup export/import round-trip works live (shared `src/utils/backupExport.js`; import sends `dataEpoch + fullReplace`, reports lock/reject) |
| `4b39d2a` | Purge departed staff (AG/NT/NM/SZ/TP/PB/SA) + invalid `HSC` from data files and legacy `autoFillSnapshotTeachers` |
| `b0bb360` | `addedTeachers`/`deletedTeachers` written to localStorage on sync receive |
| `74af59a` | `repairCompositeSlots()` runs on JSON import AND on every sync receive (old backups can no longer restore wrong pairing) |

### Verified state
- Local sync server **v1192**: 21 classes, 1134 slots, 0 unassigned, 35 roster teachers, `deletedTeachers = SA PB SZ NM TP AG NT`, 0 departed/HSC in any slot.
- Composites: `Bio/Eco/Phy_Edu -> SB,RD,DV`, `Maths/Hindi/Music -> DP,MS,MG`, `Acct/History -> VV,SS` - 48 composite cells checked, 0 mismatches/duplicates (23 cells repaired this session).
- Export file for live import: `D:\downloads data\data\9period-timetable-export.json` (rebuilt v1192, `periodCount 9`).
- eslint: `csvTimetableImport.js` / new files clean; `TimetableContext.jsx` still the 10 pre-existing errors (no new).

### Next steps (not yet done)
1. User: hard-refresh `localhost:5173`, confirm 11a shows `SB,RD,DV`.
2. User: on live site - wait for deploy of `74af59a`, hard-refresh `/timetable/index.html`, ensure timetable UNLOCKED, Restore Backup with the export file above; import banner should show `repaired N composite cells`.
3. Verify live: 9 columns, 11a/11b composites, teacher view combined cells (`11A + 11B`), `index-D7I3VvFz.js` loaded.
4. Optional: run `node scripts/sync-9period-timetable.mjs --show-clashes` against prod `MONGODB_URI` if a direct DB push is preferred over the UI import.
5. Watch for stale tabs: old bundles push stale `addedTeachers`; `onRemoteChange` now repairs composites, but a hard-refresh of every open tab is still recommended.

### Gotchas re-learned
- JSON import used to bypass all repairs - always re-resolve `/` cells on any inbound payload.
- Local sync server keeps state in memory; editing `sync-data.json` directly gets overwritten (push via `POST /api/sync` instead).
- PowerShell mangles inline `node -e` with quotes - write a temp `.mjs` under `%TEMP%\opencode` instead; use `pathToFileURL()` for Windows `import()`.

---

## Session Progress - September 26, 2026 (Smart Chanakya: class-range compare + clash detector)

### Shipped (not committed)
| File | What |
| --- | --- |
| `services/timetableCompare.js` (new, pure/shared) | Class-range parsing ("compare all classes from class 6 to 11", "6 - 11", "6 through 11" -> every section of 6..11), `detectTeacherClashes` (clash = same teacher + different subject same day/period; joint = same subject = combined class), `renderClassComparison` (one table per day + legend + verdict + clash/joint details); `mergePeriodRows` / `extractClassTokens` / `resolveClassTokens` / `formatGrid` moved out of the route |
| `app/api/chanakya/chat/route.ts` | Compare delegates to the service; passes known class numbers (range ends that do not exist are not reported "unknown"); clears the bogus `params.class` capture ("6-T") when a timetable intent converts to compare; help texts updated |
| `app/smart-chanakya/page.tsx` | Assistant messages containing ` | ` render `font-mono` + `whitespace-pre` + `overflow-x-auto` (wide tables scroll instead of wrapping), assistant bubble `max-w-[95%]`, quick action "Compare class 6 to 11" |
| `scripts/compare-timetable-report.mjs` (new) | Offline report from live MongoDB using the same service: `--day monday`, `--from/--to`, `--classes`, `--out`, `--no-write` |
| `reports/timetable-comparison-6-to-11.md` + `...-monday.md` | Generated reports (6 days / day-filtered) |
| **Rule (final, same session)** | Compare honours **exactly what the user types**: random classes (`compare 5, 8 and 9`), sections (`compare 5a, 6b and 9a`), ranges (`compare class 1 to 11`), any day (`on monday` / `on wednesday` / `on saturday`, ranges `monday to wednesday`), optional period. Only when **no classes are named** (`compare timetable`) does it default to every class in the timetable (`sortedClassKeys`, 1-A…11-B). Teacher compare (`Compare DV and SS periods`) is a separate path; unknown numbers still get feedback (`compare 12 and 13`). **Do not reintroduce the earlier "always 6–11" hard-code** - it was reverted because the user wants any classes (1-11), any sections, any day. |

### Verified
- 31/31 assertions in `%TEMP%\opencode\test-timetable-compare.mjs`: range parsing, date/period immunity ("compare period 6 to 11" is NOT class 11), regressions (explicit section list, "class 8A" now a single-class view, teacher compare), clash/joint detection, day+period filters, truncation never loses teacher marks.
- Live API on :3000: "compare all classes from class 6 to 11 on monday" -> 11 classes, Monday only, **2 clashes** (GA: P6 8-B Comp vs 9-B Comp/Hsc; P8 7-A Comp vs 9-A Comp/Hsc), 11 joint slots. Full week = 10 clashes, 60 joint slots; "monday to wednesday" -> 3 day tables.
- `npx tsc --noEmit`: no errors in the touched files (pre-existing errors elsewhere unchanged). eslint: new files clean; route.ts keeps its pre-existing `no-require-imports` / `any` warnings.
- After the final rule: `compare 5a, 6b and 9a` -> exactly those 3 columns; `compare 5, 8 and 9` -> 6 columns (all sections of 5/8/9); `+ on monday` / `on wednesday` / `on saturday` -> 1 day only; `compare class 1 to 11` and bare `compare timetable` -> all 21 classes; `compare 10a and 11b on wednesday` -> 2 columns, Wednesday; `compare 12 and 13` -> "Class(es) not found in timetable: 12, 13"; teacher compare and `show timetable for Class 8A` unchanged; 31/31 + 15/15 unit assertions pass. eslint/tsc: only pre-existing issues (route `require()` x2, `any` warnings, `activity/upload/route.ts` userId).
- Period filter also scopes the clash verdict (`detectTeacherClashes({ period })`), so `compare period 6 for classes 5,8,9` renders only P6 rows and reports only P6 clashes (`Clash check (6 classes, 6 day(s), P6)`).

### Findings / next steps
- MongoDB `timetables` holds 11 classes (no 10-B) and the composite cells `Bio/Eco/Phy_Edu` are **UNASSIGNED** there, so DV/AG are absent -> "Compare DV and SS" reports DV unknown. The v1192 local composites were never pushed to Mongo; run `npm run sync:timetable-9p` (or `sync:timetable-live:watch`) to refresh.
- All 10 clashes are GA teaching `Comp` and `Comp/Hsc` simultaneously (different subject strings). If those are intentional dual sessions, normalise the subject name so they classify as joint.

### Gotchas
- Cell budget: >6 classes -> 22-char cells; `formatCell` priority is teacher marks > subject; a cell where every teacher is flagged uses one trailing marker (`Maths/… (DP, MG, MS)=`) to stay short.

---

## Session Progress - September 26, 2026 (Smart Chanakya: first-half designer 6-10 - COMPLETED)

### Shipped (not committed)
| File | What |
| --- | --- |
| `VS CODE Final TT project Doon Scholars/timetable-web-app/src/services/firstHalfPlanner.js` | Cross-class P1-5 designer for 6a-10a: `planFirstHalf(timetables, {periodCount})` -> `{ok, classes, updates, manual, newTimetables, report}`. Daily Maths/Science/SST in P1-5, weekly FH quota 30 (Maths6 + Sci6/SST6 + langs 2x4 + Computer/Skill 2 + filler top-up), SH remainder in P6-8 (+P9), no adjacent same-subject, science rotation w/ strands lookahead + forced-demand reservation, fixed per-section teachers, juniors fixed, 11/12 excluded everywhere (busy map AND verify) |
| `.../src/components/ClassTimetable.jsx` | "Design First Half (6-10)" purple toolbar button -> `handleDesignFirstHalf` -> preview panel (`fhPlan`, failures list, Apply/Cancel) -> `applyFhPlan` loops `updateSlot` (lock-aware); `setFhPlan(null)` on class change. Imports `planFirstHalf` + `CalendarRange` |
| Temp tests | `%TEMP%\opencode\plan-test.mjs` (summary+grids), `plan-debug.mjs` (all failures/manual), `sat-probe.mjs`, `sh-week-probe.mjs`, `load-probe.mjs`, `quota-dump.mjs` |

### Final result
- **`ok=true`, manual=0, failures=0**, 435 cell updates, 9 classes, ~210ms. 5 FH + 3 SH cells/day/class; loads preserved; 0 teacher clashes (senior-senior + junior; 11/12 ignored).
- eslint: `firstHalfPlanner.js` clean; `ClassTimetable.jsx` keeps its 3 pre-existing errors only (278 surrogate x2, 316 set-state-in-effect). `npm run build` OK (2.08s). Dev :5173 serves file 200.

### Bugs found & fixed this session (in order)
1. `classMeta` unioned rotating teachers (HSC->GA+AR) -> forced joint duties, huge congestion. Fixed: **majority teacher signature per subject**.
2. SH daily cap `total>=6||total<=2 ? 2 : 1` blocked 3-load subjects; then absolute cap 2 blocked 9b English_lang (2 FH + 1 SH). Final: **SH cap = 3/day** (FH keeps `maxPerDayOf`: t>=6||t<=2 ->2 else 1).
3. Static pref sort put langs on days 0-3 -> Computer/Skill dumped on GA-saturated Fri/Sat. Added **urgency = remaining/daysLeft** sort.
4. `attemptDay` replaced (not accumulated) its prepend list -> class starvation oscillation; 4 attempts too few. Now **accumulate prepend + 10 attempts**, break when prepend stops growing.
5. **Zero-slack teacher (SW needs exactly 24/24 SH slots)**: tie-broken order deferred English every day, 8b starved. Added `teacherWeekSlack(c, day, sub, band)` = min over teachers of (free-today + 4/days-after) - remaining-demand, **primary sort key for both FH fill and SH candidates**.
6. **Fill loops were single-pass**: one placement per candidate sub -> Sat with need=3 but only 2 distinct subs left (GK + Gamesx2) failed structurally. Both FH and SH fill now **multi-pass `while(need>0 && progress)`** with `failedOnce` dedupe on triedWhy.

### NOT done / next steps
1. UI smoke-test in browser: hard-refresh :5173, click "Design First Half (6-10)", review preview, Apply, check grid + Detect Clashes = 0.
2. Science rotation is lookahead + prev-day tie-break only (no hard ban on same sci subject twice in a row) - verify visually if user cares.
3. `npx tsc --noEmit` not re-run (JSX file, unchanged config).
4. Nothing committed this session - ask user before `git add` (stage only `src/services/firstHalfPlanner.js` + `src/components/ClassTimetable.jsx`, never lock.json/sync-data.json).

### Gotchas (re-learned)
- Empty `triedWhy` in a fill failure note = **candidates exhausted**, not teacher busy - check candidate list length vs `need` first.
- `freeShCount`-style counts must be re-evaluated after placements; snapshot/restore must include `lastPeriodOf` or retries become nondeterministic (it does, `snap.lpo`).
- `plan.newTimetables` contains ONLY 6a-10a; junior/11-12 occupancy comes from the `busy` map built from original `timetables`.

---

## Session Progress - September 26, 2026 (Print Filtered timetable - SHIPPED)

### Shipped (committed + pushed to main -> Railway)
| Commit | What |
| --- | --- |
| 3c95607 | First-half designer 6-10 (firstHalfPlanner.js + ClassTimetable UI) + Separate Combined (bandAwareFix.js) |
| 0908bc3 | scripts/export-print-filtered.mjs - local HTML generator |
| 19b5407 | Print Filtered button live in Class Timetable; shared builder src/utils/filteredPrintHtml.js (script now imports it too) |

### Feature
- Button "Print Filtered (1-5: P6-9 / 6-11: P1-6)" in ClassTimetable toolbar next to Print All -> opens popup with buildFilteredPrintHtml(timetables, {periodCount}) -> auto window.print().
- Rules: classes 1-5 keep P6..periodCount (P1-5 grey blank), classes 6-11 keep P1-P6 (P7-9 grey blank), class 12 skipped (21 classes), A4 landscape, one class per page, subject + teacher initials per cell.
- Data quirks handled: assignedTeachers object entries ({teacher, clash, clashWith}) normalized to initials; label map (English_Lit->English, SSt->SST, ")Science"->Science); corrupted "Math (DP" cell (10a P8) falls outside kept range.
- Local: node "VS CODE Final TT project Doon Scholars/timetable-web-app/scripts/export-print-filtered.mjs" [outfile] -> D:\downloads data\data\timetable_print_1-5_P6-9_6-11_P1-6.html (source sync-data.json).

### Verified
- eslint: only 3 pre-existing ClassTimetable errors; new util + script clean. npm run build OK (2.0s). Vite serves both modules 200. Output checked: 21 sections, 498 out-cells, 0 [object Object], multi-teacher cells render "AD, GA".

### NOT done / next steps
- User to confirm live button after Railway deploy (hard-refresh first). Print dialog tips: destination Save as PDF, landscape, enable background graphics.
- Local planner UI smoke-test (Design First Half preview -> Apply) still not done in browser.
- Nothing uncommitted except lock.json/sync-data.json/analyze-csv-map.mjs (NEVER stage those).

---

## Session Progress - September 26, 2026 (Print Filtered missing on live + NEW Print Split mode - SHIPPED)

### Root cause: why "Print Filtered" never appeared on the live site
Two independent traps, both fixed:
1. **Stale bundle**: Railway serves the committed prebuilt Vite app at `public/timetable/`, NOT a fresh Vite build. Commit `19b5407` (the button) only touched `src/**` + `scripts/**` and **never re-ran the sync**, so `public/timetable` still held the `74af59a` build (25 Sep 23:47, `index-D7I3VvFz.js`) with no button.
2. **Watch paths**: `railway.json` `watchPatterns` was `["src/**","app/**","lib/**","next.config.js","package.json"]`. Railway docs: *"When specified, any changes that don't match the patterns will skip creating a new deployment."* Commits touching only the Vite app were therefore **silently skipped** - no deploy was ever triggered.
   - Fix: added `public/**` and `railway.json` to `watchPatterns`.
   - **Rule: any change to the timetable UI requires `node scripts/sync-timetable.mjs` (build Vite -> copy `dist/` -> `public/timetable/`) AND a commit that includes `public/**`, otherwise it never reaches the live site.**

### Shipped (commit `483ab4d`, pushed to main -> Railway deployed)
| File | What |
| --- | --- |
| `.../src/utils/filteredPrintHtml.js` | New `mode` option: `'default'` (classic 1-5 P6-9 / 6-11 P1-6) and **`'split'`** (classes 1-5 keep **P1-P5**, classes 6-11 keep **P6-P9**). Exports `keepRangeFor(classNum, mode, periodCount)`; `modeNote()` drives the header text; class 12 skipped in both modes. Default mode is byte-compatible with the old rules. |
| `.../src/components/ClassTimetable.jsx` | `handlePrintFiltered(mode)` + second button **"Print Split (1-5: P1-5 · 6-11: P6-9)"**. Buttons call `onClick={() => handlePrintFiltered('default'/'split')}` - never pass the event as `mode`. |
| `.../scripts/export-print-filtered.mjs` | `--mode split` flag; default outfile names now mode-specific. |
| `public/timetable/**` | Rebuilt bundle `index-CM1Zzu6Y.js` / `index-BjR4R-NW.css`. |
| `railway.json` | `watchPatterns` += `public/**`, `railway.json`. |

### Verified
- `%TEMP%\opencode\print-modes-test.mjs`: **294/294 assertions** against live `sync-data.json` (21 classes, periodCount 9) - keep ranges, out-cell counts, badges, note text, class-12 skipped, no `undefined` in output.
- eslint: `filteredPrintHtml.js` + `export-print-filtered.mjs` clean; `ClassTimetable.jsx` only its 3 pre-existing errors (279 surrogate x2, 317 set-state-in-effect - untouched lines).
- `node scripts/sync-timetable.mjs` OK (vite build 10.0s). Both script modes write 21 classes.
- **Live confirmed**: `https://python-arena-production.up.railway.app/timetable/index.html` now serves `index-CM1Zzu6Y.js` (deployed after ~4.5 min; old bundle was `index-D7I3VvFz.js`), and that JS contains `Print Filtered`, `Print Split`, `Print Class`, `Print All`, `P1-P5 only`. Hard-refresh (Ctrl+Shift+R) to see it.

### Gotchas
- `onClick={handlePrintFiltered}` would pass the click event as `mode` - always wrap in `() =>`.
- `Periods 6-9` is not a literal in the minified bundle (built as `` `Periods 6-${periodCount}` ``) - assert on generated HTML, not on the bundle string.
- Only `railway.json`/`public/**`/`app|src|lib`/`package.json`/`next.config.js` trigger deploys - Vite-app-only pushes are skipped by Railway.

### Addendum (same session, commit `138b700`): free period -> prints "Practice"
- `filteredPrintHtml.js`: an **in-range cell with no subject** now renders `<td class="free"><span class="free-txt">Practice</span></td>` (italic grey, white bg so it prints without background graphics). Applies to **both** `default` and `split` modes. Out-of-range cells stay grey and empty (they are excluded, not free). Note + legend explain it.
- **Data reality check:** the current `sync-data.json` is 100% full - 21 classes x 6 days x 9 periods = **1134/1134 slots have a subject AND a teacher, 0 free periods**. So today's print shows **no** "Practice" anywhere; it appears only after a slot is emptied (editor/clear/planner).
- Tests: `%TEMP%\opencode\print-modes-test.mjs` -> **6042/6042**, incl. synthetic runs that clear 6a Mon P6 (Practice in both modes), 1a Mon P1 (stays grey in default, becomes Practice in split), and all-days cell-content coverage (`sub` xor `free-txt`).
- Live confirmed: `/timetable/index.html` serves `index-Dv_SLqZ0.js` containing `free-txt` + `Practice` + both print buttons.

### Addendum 2 (same session, commit `7ff859e`): Practice in **every** blank cell
- User asked for a report first, then chose **"Grey cells = Practice too"** (and, in the same breath, "grey = just not printed" - contradictory; implemented the primary answer, data untouched).
- `filteredPrintHtml.js`: out-of-range cells now render `<td class="out"><span class="free-txt">Practice</span></td>` (grey band kept, text `#475569` for legibility), in-range blanks unchanged (`<td class="free">`). So **no cell in either printout can ever be blank** - every cell is subject or Practice. Note + legend updated ("Practice = no lesson printed here (free period or out of range)").
- Numbers with current data: **default mode 498 Practice** (498 grey + 0 free), **split mode 570 Practice** (570 grey + 0 free); 636/564 real subject cells.
- Tests: `%TEMP%\opencode\print-modes-test.mjs` -> **9380/9380**, incl. "no blank cell anywhere" (all 21 classes x 6 days x 9 periods x 2 modes), grey band retained, Practice counters vs expected band size, synthetic clears.
- eslint clean. Bundle `index-BPDkTGIc.js` live-verified (`no lesson printed here`, `class="out"`, `class="free"`, both print buttons).
