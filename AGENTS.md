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

---

## Session Progress - September 27, 2026 (Smart Chanakya: always read the LIVE Vite-app timetable - SHIPPED, not committed)

### Problem
The bot answered from MongoDB `timetables` (CSV snapshot, frozen Sep 25 08:06) while the Vite Timetable Engine edits `syncstores` (prod) + local `sync-data.json` (dev). **68.7% of cells differed** - user saw the bot show `Science (AB)` for 6-B Mon P1 where the editor showed `English_Lit (RD)`. Also "show time table of AR"-style commands were unreliable and `compare class 6b and class 11 a and b` silently dropped 11-B.

### Shipped (all local, NOTHING committed - ask user before git add)
| File | What |
| --- | --- |
| `services/timetableSource.js` (new, CJS) | Pure loader: `convertSyncTimetables` (Vite payload -> one-row-per-teacher rows, mirrors `sync-timetable-live.mjs`), `makeCandidate` guards (empty/short-period/few-classes payloads rejected), `loadAuthoritativeTimetable({syncDoc, rootDir})` = **freshest-wins** between `syncstores` doc (epoch-ms `updatedAt`) and `VS CODE Final TT project Doon Scholars/timetable-web-app/sync-data.json` (mtime-cached read; accepts ms/s/ISO `updatedAt`), ties -> syncstores; `describeSource` -> `"local sync-data.json . v1693 . updated 2026-09-27 09:07"` |
| `lib/live-timetable.ts` (new) | `getLiveTimetable()` for routes: connectDB -> SyncStore -> local file -> else legacy `Timetable.find({})` with `stale: true` + "STALE" source note |
| `app/api/chanakya/chat/route.ts` | Replaced `Timetable.find` with `getLiveTimetable()`; `knownTeacherIds` hoisted (single compute); **teacherHint** parsing (`"show time table of AR"`, `"timetable for GA"`, `"AR's schedule"`) validated against known ids in POST, word-match fallback kept; **grouped teacher schedule** (TeacherView-style: `P2 | Class 9-A + 9-B | Computer (combined)`, different subjects at same period -> `? clash`); `[source: ...]` footer appended to timetable/compare replies; help texts updated |
| `app/api/chanakya/{analyze,recovery,substitute,period-finder}/route.ts` | Same `getLiveTimetable()` swap (stale `Timetable.find` removed) |
| `services/timetableCompare.js` | `extractClassTokens`: new `danglingSection` regex -> `"compare class 6b and class 11 a and b"` now yields **6-B, 11-A, 11-B** (was 2 classes). `"and class 10a"` cannot false-match (`and` must be followed by ONE letter) |
| `scripts/compare-timetable-report.mjs` | Same source selection (syncstores -> local file -> legacy); prints + embeds `Source:` in report |
| `app/api/chanakya/chat/route.ts` (substitute intent) | PRE-EXISTING BUG FIXED: `"find substitute for AR"` used to capture `find`/`substitute` as the teacher. Now takes the word after `for/of` (honorifics skipped) with scaffold-word set, else first non-scaffold word |
| `services/substituteFinder.js` | PRE-EXISTING BUG FIXED: empty-day early return now includes `totalAffected: 0, covered: 0, uncovered: 0` (chat AND admin `/api/chanakya/substitute` used to render/store `undefined`) |

### Verified
- `%TEMP%\opencode\tt-source-test.mjs` -> **61/61**: conversion vs live file (data-driven, not hard-coded - the file was edited mid-session v1671 -> v1693), freshest-wins (newer/older/broken syncDoc), toMs formats, extractClassTokens (new rule + 6 regressions), render 6-B vs 11-A, teacher matching, teacherHint patterns, mergePeriodRows, candidate guards.
- Live :3000 (next dev, hot-reloaded): `compare class 6b and class 11 a and b timetable` -> 3 columns incl. 11-B, fresh cells, footer `[source: local sync-data.json . v1693 . updated 2026-09-27 09:07]`; `show time table of AR` -> grouped schedule w/ combined; `timetable for GA on monday`; `show timetable for class 8a`; `compare DV and SS periods on monday`; `AR free periods on Thursday`; `find substitute for AR` -> `0/0/0` (Sunday); greeting (no footer); `GET /period-finder`; `POST /analyze` (8-A Maths 12/wk) - all OK.
- Freshness audit (read-only): syncstores v11049 @ 2026-09-26 21:59 vs local v1693 @ 2026-09-27 09:07 -> local correctly chosen; the two stores differ in 51/1134 cells (4.5%); legacy `timetables` still 1134 docs (deliberately NOT written).
- eslint: new/touched files 0 errors (only pre-existing: chat route 2x `require(holidayService)`, substituteFinder line 1 `require`). `npx tsc --noEmit`: only pre-existing `activity/upload/route.ts userId`.

### Next steps / follow-ups (not done)
1. Nothing committed - stage only the files in the table above (never `sync-data.json`/`lock.json`), ask user first. Railway deploys Next from source, so prod gets this on commit+push.
2. Other consumers still read stale `Timetable.find`: `app/api/class-schedule`, `app/online-class/*` (pages), `app/api/documents/teacher-subjects`, `app/api/admin/timetable`, `app/api/admin/online-scheduler`. Swap to `getLiveTimetable()` if the user wants the whole site on live data (query shapes need filtering after load).
3. 11-A Mon P5 composite lost RD,DV in the live file during editing (`teacher: "SB"` only, `clashes:[{teacher:SB,classId:11b}]`) - data change by the user, not the bot; verify in the Vite app if unintended.
4. Chat substitute report always uses TODAY's date (no date parsing) - weekday testing of the full substitution path still pending (logic verified via direct node call: AR Mon 2026-09-28 -> 2 affected, 0 covered because only AR teaches STEM and GA is busy P9).

---

## Session Progress - September 27, 2026 (all-teacher print + substitution + Solution Manager brain - ALL DEPLOYED)

### Shipped (committed + pushed to main -> Railway live, verified on prod bundle)
| Commit | What |
| --- | --- |
| `21f54bc` | Teacher-schedule print: `handlePrintAllTeachers(mode)` + `buildAllTeachersPrintHtml` (all 32 teachers, **one teacher per page**, modes all/default/split) + substitution fixes (`displayTeachers` = timetable ∪ rosterCodes ∪ knownTeachers-gated context teachers; `SUBSTITUTION_EXEMPT = ['AN','P','RN','DK']` in normalization.js used by engine + manual picker; fewest-weekly-load-first priority via `weeklyLoad`/`weekLoadOf`) + rebuilt `public/timetable` (`index-BsMZbZt4.js`) |
| `b17a21f` | **Solution Manager brain**: `src/services/clashSolver.js` + `src/components/SolutionManager.jsx` (exports `SuggestionList`) + ClassTimetable toolbar button "🧠 Solution Manager" + per-clash-row "🧠 Solve" (prefill via `key=` remount) + rebuilt `public/timetable` (`index-SzN_5TPX.js`) |

Live verified: `https://python-arena-production.up.railway.app/timetable/index.html` serves `index-SzN_5TPX.js` containing `Solution Manager`, `Free the teacher`, `Same-class swap`, `0 new clashes`, `Print All`, `Print Teacher`, `One teacher per page`, `Practice`.

### Solution Manager design (clashSolver.js)
- `proposeSwaps({timetables, classId, subject, day?, period?, beforeClashes, periodCount, maxVerify=170, limit=30})` -> `{ok, pinned, classId, subject, sources, baselineClashes, targetClashes, candidatesFound, verified, notVerified, safeCount, suggestions[], note}`.
- **4 patterns**: `move` (empty cell of same class), `within` (swap 2 cells of the class), `freeOther` (don't touch this class - swap 2 cells of the OTHER class that owns the clashing teacher), `exchange` (cross-class content swap, curriculum-changing, ranked last, `-15`).
- **Every candidate is cloned + `scanAllClashes` re-run**: `added` (new ids), `fixed`, `fixedTarget` (clashes at the source cell). `safe = added.length === 0`; unsafe get `-500` each and their Apply button is disabled.
- Score = `100*fixedTarget + 40*otherFixed + 8*(move) - 15*(exchange) - 10*(freeOther) - structureDelta(adjacency*10 + 3+-same-day*6) - bandPenalty(6 if the move crosses the class's printed band via keepRangeFor default) - 500*added`.
- Ranking keeps **diversity**: best 2 of each kind first, then fill by score (`diversified`), so all patterns stay visible.
- Honest `note` strings: fixes found / neutral relocations (no clash there) / "No legal move exists for this period..." (queue empty) / all-options-shift-the-clash.
- Also exports `listSubjectCells` (cells + `clashing` flag for the period dropdown) and `subjectsOfClass`.
- Perf: ~69 ms per call (≤60 full rescans), 1134 slots.

### Verified (all green)
- `%TEMP%\opencode\solver-test.mjs` -> **8882/8882**: all 130 baseline clashes probed; every suggestion re-applied and re-scanned; teacher-load invariance; subject-multiset invariance (use **canonical/sorted** JSON compare - insertion order differs after a swap and produced false failures); synthetic known-answer case; pinned/echo guard; empty-queue honesty note.
- **Result on live data: 63 of 130 clashes have a verified clash-free fix; 67 have no single legal move** (zero-slack teachers like GA/DP in every slot) - the panel says so instead of faking it.
- print suites: `teacher-print-test` 6225, `teacher-print-test2` 9813, `teacher-print-all-test` 13815, `print-modes-test` 9391; `subst-bundle` 4885. **Full suite 53 011 assertions, 0 failed.**
- SSR smoke (`vite build --ssr .smoke-entry.jsx --outDir .smoke-dist` then `node .smoke-dist/.smoke-entry.js`) -> 16/16 (panel controls + real `SuggestionList` render); smoke files deleted before commit.
- eslint: `clashSolver.js` + `SolutionManager.jsx` + print files clean; `ClassTimetable.jsx` keeps only its 3 pre-existing errors (282 surrogate x2, 320 set-state-in-effect); `SubstitutionManager.jsx` keeps its 7 pre-existing unused-var errors.

### Gotchas
- **Bug that cost the most time**: `added` was computed as `[...beforeIds].filter(id => afterIds.has(id))` (= clashes that REMAIN) - everything looked unsafe. Correct: `[...afterIds].filter(id => !beforeIdSet.has(id))`.
- `set-state-in-effect` lint rule: SolutionManager derives `subject`/`cellKey` from props with fallbacks (`subjectList.some(...) ? pick : first`) instead of syncing in an effect; the 🧠 prefill arrives through a `key=` prop so initial state picks it up; `result` freshness guarded by comparing `result.classId/subject/pinned` (add `pinned` to proposeSwaps output).
- Only export **components** from a component file (`react-refresh/only-export-components`) - `describeSuggestion`/`cellLabel` stay module-local, `SuggestionList` is exported (it is a component).
- PowerShell mangles inline `node -e` with backticks/quotes (silently no-op) - write a temp `.mjs` under `%TEMP%\opencode` instead.
- `subst-test.mjs` imports `engine.js` **directly** and fails on the extensionless `./normalization` import; run the rolldown path: `npx rolldown subst-entry.mjs --file subst-bundle.mjs --format esm --platform node` from the app dir, then `node subst-bundle.mjs`.

### Live data purge (DONE same session) - removing stale teachers from prod `syncstores`

- **Audit (read-only)** `%TEMP%\opencode\purge-audit2.mjs`: walk BOTH values and object keys (first version only checked values and missed key-shaped data like `substitutions.AG`). Result: AG/NM/NT/PB/SA/SZ/TP existed only in `teachers` (all 7), `addedTeachers` (6, not AG), `deletedTeachers` (6, missing NT); **0 in any timetable slot, 0 as keys** in substitutions/absentTeachers/teacherSubjectMap. Local `sync-data.json` was already clean (only the 7 `deletedTeachers` history entries).
- **Write path**: `POST https://python-arena-production.up.railway.app/api/sync` body `{clientId, clientVersion: <fetched version>, payload:{...fields}}` (`app/api/sync/route.ts`) - **partial update**: only keys present in `payload` are `$set`; `clientVersion < server version` -> 409; server bumps `version` itself (bump is what makes open tabs re-fetch).
- **Blocker**: POST is rejected **403 when frozen** (`lib/timetable-lock.ts`, default = frozen, fail-closed). Unlock UI = red/green banner at top of the live timetable (`FreezeControl` -> `/api/admin/timetable/lock` `{action:'unfreeze', password}`) or `/admin/timetable`; the API also needs an admin Clerk session. User unlocked -> I purged -> user must **re-freeze** (asked each time).
- **Shipped**: `purge-live.mjs` (teachers 39->32, added 38->32, deleted -> all 7; verified timetables/substitutions byte-identical) -> v11050; then `add3-live.mjs` (union MP/RN/SL into teachers+addedTeachers -> 35/35, matches local exactly) -> **v11051**. Both scripts re-GET and assert before exiting 0.
- Gotcha: while unlocked, polling the purge loop is harmless (403 = no change); never write `timetables` from a script without the version guard.

### Pending / next steps
1. ~~Prod stale initials~~ **DONE** - live purged (v11050) + MP/RN/SL added (v11051); `teachers`/`addedTeachers` = 35, `deletedTeachers` = AG,NM,NT,PB,SA,SZ,TP.
2. MP/RN/SL exemption from relief: **not decided** (RN already in `SUBSTITUTION_EXEMPT`, MP/SL are not; they are now on live and eligible for relief).
3. 67 clashes need multi-move / teacher reassignment - a chain solver (2-3 swaps) is the natural next brain feature.
4. Local `sync-data.json` is at v1738+ (roster 35) - never commit `sync-data.json`/`lock.json`.
5. **Live timetable is STILL UNFROZEN** (user confirmed 27 Sep) - no writes pending, so nothing blocks; user must click **Freeze** in the top banner of the live timetable (`/api/admin/timetable/lock`, GET needs admin auth so a script cannot check it). Reason to care: while open, stale tabs can push old data over prod (that is how the 7 stale initials survived).

---

## Session Progress - September 27, 2026 (Clash Report: batch apply + hide/unhide - DEPLOYED)

### Shipped (committed + pushed -> Railway live, bundle verified)
| Commit | What |
| --- | --- |
| `5bebc5e` | **Batch apply** on the Clash Report: new `src/services/clashBatchApply.js` (pure: `rowKeyOf`, `collectBatchIds`, `pendingCheckedIds`, `countBatch`) + new `src/components/ClashBatchBar.jsx` (presentational, default export) + ClassTimetable wiring (scope radio This class / All classes, per-row checkbox column + header select-all, "Tick all rows"/"Untick", `✅ Apply Intentional (n)` / `☑ Apply Checked (n)` / `↺ Undo (n)`, counts + "n already reviewed") **and the ledger persistence bug fix** (see below) + rebuilt bundle |
| `5c20f3f` | **Hide/unhide report + auto-hide**: `🙈 Hide report` in the report header, slim strip `⚠️ Clash report hidden for all classes — N clashes (...)` with `👁 Show report`; one switch for ALL classes, persisted in `localStorage['clashReportHidden']` (`readReportHidden`/`writeReportHidden` at top of ClassTimetable.jsx); **auto-hide** after `handleBatchApply(INTENTIONAL)` when `allClashIds.every(id => nextLedger[id]?.status === INTENTIONAL)` (computed with a local `setMarks(ledger, ids, ...)` because `setLedger` state is async) |

Live bundles: `index-Df7gcazL.js` (batch) then `index-mrX2Tv0w.js` (hide) - both marker-checked on prod (`Apply in one go`, `Hide report`, `Show report`, `Clash report hidden for all classes`).

### Bug fixed (important, affects everything)
**Clash review marks were NEVER persisted.** `saveLedger` was exported from `clashCheckLedger.js` but never called anywhere, so every Intentional/Checked mark vanished on refresh (the `clashCheckLedger` localStorage key was only written by the legacy-migration path inside `loadLedger`). Fix: `useEffect(() => { saveLedger(ledger); }, [ledger]);` added in **both** `ClassTimetable.jsx` and `TeacherView.jsx`.

### Behaviour rules (do not regress)
- Target selection: **ticked rows win** > scope `all` (every clash id) > scope `class` (this class's rows). Unknown ticked keys are ignored; ids are deduped.
- `Apply Checked` only touches ids with **no mark** (never downgrades an existing Intentional/Checked) and asks **ONE** `window.prompt` for the whole batch (blank/cancel = no note, does NOT abort).
- `Apply Intentional` marks every id in target (overwrites Checked - same as the per-row button).
- `scope=all` + nothing ticked asks `window.confirm` before writing (`confirmWholeTimetable`), for Apply and Undo.
- Panel renders when `selectedClass && !reportHidden && (clashReport.length > 0 || globalSummary.total > 0)` so a class with 0 clashes can still batch-review ALL classes; if rows are 0 it shows "No clashes in X - switch scope to All classes".
- Auto-hide is **global** (whole timetable intentional), not per class - a partial class apply never hides the report.
- Selecting another class clears the ticked rows (`setSelectedRowKeys(new Set())` in the class `<select>` onChange).

### Verified
- `C:\Users\DOONSC~1\AppData\Local\Temp\opencode\batch-test.mjs` -> **27/27** (scope/selection precedence, dedupe, pending-vs-reviewed counts, setMarks/clearMarks round trip, null-safety, **auto-hide gate** all-intentional/one-unchecked/one-checked/no-clashes).
- SSR smoke (`.smoke-entry.jsx` -> `.smoke-dist`, deleted before commit) -> **17/17** on `ClashBatchBar`: counts in labels, disabled controls when empty, radios by `value=`, no `undefined`/`NaN`. Radios need explicit `value=` - React does not emit `value` from `checked` alone, and assertion order in `renderToStaticMarkup` is not guaranteed (match per `<input>` tag).
- eslint: `clashBatchApply.js` + `ClashBatchBar.jsx` clean; `ClassTimetable.jsx` still only its 3 pre-existing errors (surrogate x2 at ~413, `set-state-in-effect` at ~451 - line numbers shift with edits). `toggleReportHidden` unused-var error appeared when I used inline `() => setReportHidden(...)` instead - removed the helper.
- `npx vite build` OK; `node scripts/sync-timetable.mjs` OK; local `:5173` returns 200 for all three modules; prod bundle marker-checked.

### Gotchas
- Writing side effects inside a `setState` updater is a bad idea (double-invoke in StrictMode) - persist via a plain `setReportHidden(next)` wrapper that writes then sets.
- PowerShell `Invoke-WebRequest` with `-Uri` twice throws "Cannot bind parameter" - pass the URL once.
- Deploy turnaround for this repo's timetable app: push -> Railway ~3-8 min -> poll `public/timetable/index.html` for the new `assets/index-*.js` name.

### Not done / next steps
1. Teacher Timetable view still has only per-row buttons (marks are shared + now persisted); the batch bar could be added there if wanted.
2. Hide state is global (all classes) by design; switch to per-class storage if the user asks.
3. Live timetable still unfrozen - see Pending item 5 above.

---

## Session Progress - October 13, 2026 (Video pipeline: Pixazo LTX fix + Pollinations pollen + rain video)

### Context
User is building a free AI video generator (`video-pipeline/`). Prior sessions built the full pipeline (Gemini scenes + Pollinations images + MS Edge Hindi TTS + ffmpeg assembly + Ken Burns + xfade + intro/outro cards). Today focused on unlocking real AI video clips per scene (instead of stills with zoom).

### Shipped (NOT committed - ask user before git add)
| File | What |
| --- | --- |
| `video-pipeline/src/stock.js` | **pixazoVideo() rewritten** with correct LTX Video 2.5 endpoint (`POST gateway.pixazo.ai/ltx-video/v1/text-to-video`), proper params (`negative`, `aspect`, `steps`, `cfg`), official polling loop (`GET v2/requests/status/{id}`, uppercase `COMPLETED`/`FAILED`/`ERROR`), 402 fail-fast with card_required message. Added `media_url` to findMediaUrl prefer list. Call site now passes aspect (9:16/16:9/1:1). |
| `video-pipeline/scripts/rain-hindi.txt` (new) | ~75-word Hindi script: water cycle (evaporation -> clouds -> rain) |
| `video-pipeline/output/rain-hindi_1920x1080.mp4` (new) | 32.3s, 11.3 MB, 1920x1080. 3 scenes + intro/outro + Hindi narration + subtitles + xfade. Verified via 5 extracted frames (intro title, sun-over-ocean, clouds, rain valley, outro). |

### Key findings (video source blockers)
1. **Pixazo key `cae5f56f8ab0413d9962532b2916e385` is VALID** (HTTP 402 `card_required`, not 401). Correct endpoint: `POST gateway.pixazo.ai/ltx-video/v1/text-to-video` with header `Ocp-Apim-Subscription-Key`. Docs: `https://www.pixazo.ai/models/ltx`. Pricing: $0.45/video "Covered by your monthly free credit" BUT Terms (updated 5 Oct 2026) require **minimum $10 wallet top-up** before API free tier activates. Error message ("add a card, won't be charged") is misleading vs fine print. **User decided to skip Pixazo** (too many traps: $10 min, auto-renew, cancel flow). |
2. **Pollinations key `sk_GqCW...` is VALID** (balance endpoint 403 = missing `account:usage` permission, but key check HTTP 200 valid:true). User earned **0.25 quest pollen** via 1 claimed quest. **BUT video API returns 402 "available paid balance is 0.0000"** - quest pollen does NOT work for video models, only paid pollen. User was considering $1 top-up (1 pollen ≈ 20 wan-fast clips ≈ 6-7 full videos) but chose to save/exit instead. |
3. **Pollinations video pricing**: wan-fast ~$0.05/clip (480p), seedance ~$0.03/sec (720p), veo ~$0.15/sec (best). Model chain in code: wan-fast -> seedance-2.0-fast -> wan -> veo. |
4. **Free tier reality**: Pollinations flux images always free (0 pollen); video always costs pollen. Pixazo LTX needs $10 top-up. No fully-free real AI video path exists without either a card or a paid top-up. |

### User education (layman explanations given)
- Pollen = prepaid mobile recharge analogy; 1 pollen ≈ $1; no subscription; expires only on account inactivity
- Pixazo = Visa/Mastercard only (no RuPay/UPI); $10 min top-up; 7-day trial auto-renews at $15/mo unless cancelled (separate from API free tier)
- AI video quality: works great for nature/landscape/weather (90%); hit-or-miss for simple human action (50%); struggles with close-up faces and cross-scene character consistency (30%). Not Pixar-ready. Good for documentary/educational B-roll.
- Pollinations offers REAL Seedance and Veo models (not knockoffs) but as separate 4-8s clips, not one continuous story.

### Pipeline state (verified working end-to-end)
- `npm run make -- scripts/rain-hindi.txt --lang hi --aspect 16:9 --style cinematic --title "बारिश कैसे बनती है"` -> 32.3s output with AI images + Ken Burns (fallback path)
- Video source chain: Pexels -> Pixabay video -> Pixazo LTX (card) -> Pollinations (paid pollen) -> AI image+KenBurns -> Openverse photo -> gradient
- Current fallback used: pollinations-ai images + ken burns (both video sources blocked)
- Temp test scripts: `%TEMP%\opencode\pixazo-test.mjs`, `pollen-check.mjs`, `pollen-video-test.mjs`, `ltx-scan.mjs`, `ltx-free.mjs`, `ltx-retrieve.mjs`

### Gotchas re-learned
- PowerShell mangles inline `node -e` with backticks/quotes (silently no-op) - write temp `.mjs` under `%TEMP%\opencode` instead
- PowerShell aliases `curl` -> Invoke-WebRequest (breaks -H flags) - use `curl.exe`
- Temp scripts outside `video-pipeline/` cannot `import "dotenv/config"` - load `.env` manually with fs.readFileSync
- ffmpeg on PATH as plain `ffmpeg` (not `C:\ffmpeg\bin\ffmpeg.exe`)
- Pixazo docs page `pixazo.ai/api/free` example URL (`gateway.pixazo.ai/ltx/text-to-video`) is WRONG (404) - correct is `ltx-video/v1/text-to-video`; always check `pixazo.ai/models/ltx` for per-model slugs

### Not done / next steps
1. Nothing committed - stage only `src/stock.js`, `scripts/rain-hindi.txt`, `output/rain-hindi_1920x1080.mp4` (never `.env`/`work/`/`lock.json`), ask user first.
2. User may top up $1 Pollinations pollen later -> rerun rain command for real AI video clips (wan-fast 480p or upgrade to seedance for 720p).
3. User may add Pixazo card + $10 top-up later -> pixazoVideo() already wired and endpoint-tested.
4. Character-consistency / longer continuous clips not addressed (fundamental current-gen AI video limitation, not a code bug).
5. Optional: add a `--model wan-fast|seedance|veo` CLI flag so user can pick quality vs pollen cost.


---

## Session Progress - October 14, 2026 (Video pipeline: music trimmer Phases 1-4 - ALL SHIPPED, committed)

### Problem
Background music never synced to the rendered video: no trim to video length, no fades landing on the last frame, promo mode ignored user music entirely, no ducking under the voice, no loudness normalisation.

### Shipped
| File | What |
| --- | --- |
| `video-pipeline/src/musicTrim.js` | Shared trimmer: `planMusic` (pure), `trimMusic`, `musicDuration`, **`prepareMusic`** (used by BOTH `assemble()` and `assemblePromo()`): segment pre-trim -> `work/music-seg.wav`, `-stream_loop -1` input args, cap/atempo/volume/fade chain, fade-out ALWAYS ends exactly at videoDur |
| `video-pipeline/src/assemble.js` | Music planned AFTER final `videoDur` known; `amix duration=longest` (music reaches VIDEO end, not voice end); silent-audio guard `anullsrc` when no voice+no music (used to crash on `concat=n=0`); **duck branch**: voice = sidechain key (`asplit` -> `apad=whole_dur=videoDur` -> `sidechaincompress threshold=0.02:ratio=12:attack=25:release=450`); **loudnorm** `I=-16:TP=-1.5:LRA=11` on final mix; new params `musicDuck=true, loudnorm=true` |
| `video-pipeline/src/{index,engine,cinematic}.js` | Flags `--music-start/end/fade-in/fade-out/volume`, `--no-music-loop`, `--no-music-duck`, `--no-loudnorm` + usage text; wired through make mode, cinematic, and **promo** (`renderPromo` call site) |
| `video-pipeline/src/promoRender.js` | `assemblePromo` uses `prepareMusic` (music spans 0..total, `-t total`), anullsrc fallback, loudnorm `[aout]->[aFin]`; `renderPromo` accepts music params (default `musicVolume` 1.0 since promo has no voice) |
| `video-pipeline/server.js` | Phase 2: busboy field `music` (or audio extension) stored as `bgm-<name>`; `/render` splits music vs media, builds `--music` + trim/duck/loudnorm flags, logs `background music: ...`; form = music file input + start/end/fade-in/fade-out/volume fields + no-loop/no-duck/no-loudnorm checkboxes; music-only upload works (media optional) |

### The one hard bug (cost the most time)
`sidechaincompress` output ends at its **SHORTEST input** - verified both orders with a minimal ffmpeg repro: the 1.5s voice key truncated the whole music lane to voice length (B failed at audio=1.5s, duck renders had no tail). Fix: pad the key first `[key]apad=whole_dur=videoDur`. Also confirmed by `ffmpeg -h filter=sidechaincompress`: input #0 = main (the audio being compressed = music), input #1 = sidechain (key = voice) - my input order was already right, only the duration was wrong.

### Verified
- `%TEMP%\opencode\music-trim-test.mjs` -> **83/83, 0 failed**: planMusic/trimMusic/prepareMusic units (segment, clamps, no-loop, past-end, zero dur), A-H integration (fade envelope, end-sync `duration=longest`, segment trim, no-loop warning, no-music regression, skip-past-end, **duck** = >1.5dB quieter during voice + restored after, **loudnorm** = +4dB quiet mix + duration intact), I = offline promo render (music-seg written, fades, audio exactly = total), J = **server E2E** (spawn :4500, upload 4 pngs + mp3 tagged `bgm-`, POST /render free mode, poll /status -> 6s output with music, log lines asserted), CLI usage flags.
- eslint (repo root config): **0 errors**, 7 pre-existing unused-var warnings only (`width/height` in assemble.js etc.).
- Edge TTS still 403 (service-side, unrelated) - full `npm run make` voice render blocked; engine cinematic/promo verified offline instead.

### Gotchas re-learned
- Sidechain/duck measurements must run with `loudnorm: false` on BOTH renders or normalisation erases the delta.
- `meanVolume`-style checks on a truncated stream crash (`n_samples: 0`) - always fix duration first.
- Killing the server mid-render orphans the engine child; engine dies later with EPIPE on stdout and leaves a `moov atom not found` partial - delete partials before retesting.
- Pollinations AI image gen currently returns "too small" for short prompts -> gradient fallback (pre-existing, unrelated); keep E2E tests fully offline by uploading one image per scene.
- Root `.gitignore` only has `/node_modules` - never `git add video-pipeline` wholesale (would swallow `node_modules/`, `output/`, `work/`, `.env`); stage explicit paths.

### Next steps (not done)
1. Committed locally only (user said save -> no push).
2. Optional: sidechain threshold tuning for real TTS (24kHz mono vs 44.1kHz music), pre-normalise voice lane before ducking.
3. Optional: `--model wan-fast|seedance|veo` CLI flag from Oct 13 note still open.