# Timetable Sync Diagnostic Report

**Date:** 2026-06-20
**Issue:** Timetable changes made by super admin (abhishekr474) not syncing to sadmin account. Master Sheet, Load Master, and Class Timetable engines appear blank in sadmin.

---

## Executive Summary

The sync system has **4 critical bugs** that collectively prevent data from flowing from abhishekr474 to sadmin. The root cause is a cascade failure: a historical bug corrupted sadmin's localStorage with empty values, the server-side sync store was never properly seeded, and a role-checking bug blocks the super admin from key admin endpoints.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    Timetable Sync Architecture                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────┐    BroadcastChannel    ┌─────────────┐        │
│  │ abhishekr474│ ◄────────────────────► │   sadmin    │        │
│  │  (Tab/Dev)  │    (same-browser only) │  (Tab/Prod) │        │
│  └──────┬──────┘                        └──────┬──────┘        │
│         │ POST /api/sync                       │ GET /api/sync  │
│         ▼                                      ▼                │
│  ┌──────────────────────────────────────────────────────┐      │
│  │              /api/sync endpoint                       │      │
│  │  DEV:  Vite Plugin → sync-data.json (local file)     │      │
│  │  PROD: Next.js API → MongoDB SyncStore               │      │
│  └──────────────────────────────────────────────────────┘      │
│                                                                 │
│  ⚠️  DEV and PROD backends are SEPARATE stores.                │
│      Data pushed in dev NEVER reaches production.               │
└─────────────────────────────────────────────────────────────────┘
```

---

## Bug Analysis

### BUG 1: Split-Brain Sync Backend (CRITICAL)

**File:** `src/constants/engines.ts:158`
```js
href: process.env.NODE_ENV === "development" 
  ? "http://localhost:5173"      // → Vite dev server → sync-data.json
  : "/admin/timetable",          // → Next.js iframe → MongoDB SyncStore
```

**Problem:** In development mode, the timetable links to `localhost:5173` (Vite dev server). All sync pushes go to `sync-data.json` via the Vite plugin. In production, the iframe loads `/timetable/index.html` and sync calls resolve to the Next.js `/api/sync` route backed by MongoDB.

**Impact:** If abhishekr474 edits on the Vite dev server, pushes go to `sync-data.json`. If sadmin opens the production app, polls go to MongoDB. **The two stores never communicate.** Data is silently lost.

**Evidence — sync-data.json (current state):**
```json
{
  "version": 4,
  "timetables": null,       ← ALL NULL
  "teacherSubjectMap": null, ← ALL NULL
  "loadMaster": null,        ← ALL NULL
  "masterClasses": null,     ← ALL NULL
  "substitutions": {},
  "absentTeachers": {}
}
```

---

### BUG 2: localStorage Poisoning from Historical Null Coercion (CRITICAL)

**File:** `app/api/sync/route.ts` (before commit e80421d)

**What happened:** Before commit e80421d, the GET handler coerced null database values to empty defaults:
```js
// OLD CODE (pre-e80421d) — coerced nulls to empty values:
timetables: syncStore.timetables || {},      // null → {}
loadMaster: syncStore.loadMaster || [],      // null → []
masterClasses: syncStore.masterClasses || [] // null → []
```

When sadmin's browser polled the server, it received `timetables: {}`, `loadMaster: []`, `masterClasses: []`. The `onRemoteChange` handler then wrote these to localStorage:
```js
// In TimetableContext.jsx onRemoteChange:
if (payload.timetables && typeof payload.timetables === 'object') {
  localStorage.setItem('timetables', JSON.stringify(payload.timetables)); // Wrote "{}"
}
if (Array.isArray(payload.loadMaster)) {
  localStorage.setItem('loadMaster', JSON.stringify(payload.loadMaster)); // Wrote "[]"
}
```

**The fix in e80421d** stopped the server from coercing nulls, but **did NOT repair the already-corrupted localStorage**. On every subsequent page load, the `safeJSONParse` function reads `"{}"` / `"[]"` from localStorage — these are valid JSON that parse to empty objects/arrays (not null), so the fallback to `initialTimetables` / `initialLoadMaster` never triggers:

```js
// TimetableContext.jsx line 84-95:
const safeJSONParse = (key, fallback) => {
  const item = localStorage.getItem(key);
  // Checks for "undefined", "null", "[object Object]" — but NOT "{}" or "[]"!
  if (!item || item === "undefined" || item === "null" || item === "[object Object]") return fallback;
  const parsed = JSON.parse(item);
  if (parsed === null) return fallback;
  return parsed;  // Returns {} or [] — bypasses the initialData fallback!
};
```

**Impact:** sadmin's localStorage is permanently poisoned with empty values. Every reload re-reads these empty values. The initial JSON data imports (`timetables.json`, `load_master.json`) are never used as fallback because `{}` and `[]` pass all validity checks.

---

### BUG 3: Push Guards Suppress Empty State → No Recovery Path (MEDIUM)

**File:** `TimetableContext.jsx:212-234`

```js
useEffect(() => {
  if (!syncReady.current || Object.keys(timetables).length === 0) return; // ← BLOCKS empty push
  debouncedPushField('timetables', timetables);
}, [timetables]);

useEffect(() => {
  if (!syncReady.current || loadMaster.length === 0) return; // ← BLOCKS empty push
  debouncedPushField('loadMaster', loadMaster);
}, [loadMaster]);

useEffect(() => {
  if (!syncReady.current || masterClasses.length === 0) return; // ← BLOCKS empty push
  debouncedPushField('masterClasses', masterClasses);
}, [masterClasses]);
```

**Problem:** These guards prevent sadmin from pushing empty data (correct behavior to prevent corruption). But they also mean sadmin can never trigger a push to update the server with its own state — because its state IS empty. Combined with Bug 2, sadmin is stuck in a permanent blank state with no way to recover through normal sync.

---

### BUG 4: isAdmin() Check Excludes super_admin Role (MEDIUM)

**Files:**
- `app/api/admin/timetable/sync/route.ts:15-31`
- `app/api/admin/timetable/preview/route.ts:16-31`

```ts
async function isAdmin() {
  const user = await User.findOne({ clerkId: userId });
  return user?.role === "admin";  // ← Only checks "admin", NOT "super_admin"!
}
```

**Problem:** abhishekr474 has role `super_admin` (hardcoded in `lib/rbac.ts:81` and `app/api/auth/me/route.ts:62-63`). But the `isAdmin()` function only accepts `role === "admin"`. This means:
- abhishekr474 **cannot** load timetable preview via `/api/admin/timetable/preview`
- abhishekr474 **cannot** sync timetable to production via `/api/admin/timetable/sync`
- The entire admin timetable management page is broken for the super admin

---

### BUG 5: Silent Push Failures (LOW)

**File:** `syncService.js:125-136`

```js
async _pushToServer(payload) {
  try {
    await fetch('/api/sync', { ... });
  } catch {
    // Silent — BroadcastChannel already handled same-browser sync
  }
}
```

**Problem:** All server push errors are silently swallowed. If MongoDB is unreachable, the POST fails, or the server returns 500, the user has no indication that their edits are not being persisted for other users. Combined with the split-backend issue (Bug 1), this means data loss goes completely undetected.

---

## Why Teacher Mapping & Substitution Maker Still Have Data

- **Teacher Mapping** (`teacherSubjectMap`): Falls back to `parseCSVInitialData()` which parses from hardcoded `rawCsvData` in `src/data/csvData.js`. This fallback is triggered when localStorage returns null/undefined. The CSV data is always available regardless of sync state.

- **Substitution Maker** (`substitutions`, `absentTeachers`): These were stored as `{}` (empty objects) in sync-data.json, not `null`. The UI renders the empty substitution interface, showing the form but no saved substitutions. The data the user sees may be from localStorage if any substitutions were previously created locally.

---

## Data Flow Diagram — Current Failure

```
abhishekr474 edits timetable in DEV (localhost:5173)
    │
    ▼
POST /api/sync → Vite Plugin → sync-data.json (local file)
    │
    ├── sync-data.json: timetables = {actual data}
    │   (But this gets OVERWRITTEN to null on next empty push)
    │
    ▼
abhishekr474 closes browser / restarts dev server
    │
    ▼
sync-data.json loses state (or gets null from race condition)
    │
    ▼
sadmin opens production app (localhost:3000/admin/timetable)
    │
    ▼
GET /api/sync → Next.js → MongoDB SyncStore
    │
    ▼
SyncStore document: ALL FIELDS NULL (never received real data)
    │
    ▼
onRemoteChange receives nulls → guards block (post e80421d fix)
    │
    ▼
But localStorage already has {} / [] from BEFORE the fix
    │
    ▼
safeJSONParse returns {} / [] → blank UI
```

---

## Fix Plan

### Fix 1: Repair safeJSONParse to Detect Empty Containers
**File:** `TimetableContext.jsx` — safeJSONParse function

Add checks for empty objects `{}` and empty arrays `[]` to trigger fallback.

### Fix 2: Fix isAdmin() to Include super_admin
**Files:** `app/api/admin/timetable/sync/route.ts`, `app/api/admin/timetable/preview/route.ts`

Change `user?.role === "admin"` to `user?.role === "admin" || user?.role === "super_admin"`.

### Fix 3: Add Sync Status Indicator with Error Reporting
**File:** `syncService.js`

Log and surface push failures instead of silently swallowing them.

### Fix 4: Add "Force Sync to Server" Button
**File:** `TimetableContext.jsx`

Add a function that bypasses the empty-check guards and pushes all current state to the server, allowing abhishekr474 to seed the MongoDB SyncStore with real data.

### Fix 5: Seed MongoDB SyncStore
Run the backup restore flow or create a one-time migration script to populate the MongoDB SyncStore with the correct initial data from the JSON imports.

---

## Affected Files

| File | Bug | Status |
|------|-----|--------|
| `timetable-web-app/src/context/TimetableContext.jsx` | #2, #3 | Needs fix |
| `app/api/sync/route.ts` | #1 | Fixed in e80421d but damage persists |
| `app/api/admin/timetable/sync/route.ts` | #4 | Needs fix |
| `app/api/admin/timetable/preview/route.ts` | #4 | Needs fix |
| `timetable-web-app/src/services/syncService.js` | #5 | Needs fix |
| `timetable-web-app/sync-data.json` | #1 | All fields null |
| `src/constants/engines.ts` | #1 | Dev/Prod split intentional but problematic |
| `models/SyncStore.ts` | — | Schema OK, data empty |

---

## Immediate Actions Required

1. **Clear sadmin's localStorage** for keys: `timetables`, `loadMaster`, `masterClasses`, `teacherSubjectMap`
2. **Deploy the code fixes** (safeJSONParse, isAdmin, force-sync)
3. **Have abhishekr474 use "Force Sync to Server"** to seed MongoDB with real data
4. **Verify** sadmin receives data on next poll (within 3 seconds)
