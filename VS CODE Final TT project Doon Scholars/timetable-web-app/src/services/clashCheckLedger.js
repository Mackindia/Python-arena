// =============================================
// CLASH CHECK LEDGER — "have I checked this clash yet?"
// Persistent review marks keyed by clash id (day|period|teacher|classIds):
//   (absent)      -> UNCHECKED: needs review (red, pulsing)
//   'checked'     -> CHECKED: reviewed, real clash, pending fix (+ optional note)
//   'intentional' -> INTENTIONAL: reviewed, intentional combined class (was "Keep")
// Also tracks first-seen times (NEW chips) and last visit (progress memory),
// so next day you resume exactly where you stopped instead of starting at zero.
// =============================================

const LEDGER_KEY = 'clashCheckLedger';
const LEGACY_KEY = 'keptClashKeys'; // old Keep-only storage (migrated once)
const FIRST_SEEN_KEY = 'clashFirstSeen';
const LAST_VISIT_KEY = 'clashLastVisit';

export const CHECKED = 'checked';
export const INTENTIONAL = 'intentional';

const readJson = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return parsed === null || parsed === undefined ? fallback : parsed;
  } catch {
    return fallback;
  }
};

const writeJson = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // storage unavailable — marks stay in memory for this session
  }
};

const writeText = (key, value) => {
  try {
    localStorage.setItem(key, value);
  } catch {
    // ignore
  }
};

const readNumber = (key) => {
  try {
    const v = parseInt(localStorage.getItem(key) || '0', 10);
    return Number.isNaN(v) ? 0 : v;
  } catch {
    return 0;
  }
};

// ---- ledger ----
export const loadLedger = () => {
  const ledger = readJson(LEDGER_KEY, {});
  const legacy = readJson(LEGACY_KEY, null);
  if (Array.isArray(legacy) && legacy.length > 0) {
    legacy.forEach((id) => {
      if (!ledger[id]) {
        ledger[id] = { status: INTENTIONAL, note: '', checkedAt: Date.now() };
      }
    });
    writeJson(LEDGER_KEY, ledger);
    try {
      localStorage.removeItem(LEGACY_KEY);
    } catch {
      // ignore
    }
  }
  return ledger;
};

export const saveLedger = (ledger) => writeJson(LEDGER_KEY, ledger);

// Mark ids with a status. note === undefined keeps the existing note.
export const setMarks = (ledger, ids, status, note) => {
  const next = { ...ledger };
  const now = Date.now();
  ids.forEach((id) => {
    const existing = next[id];
    next[id] = {
      status,
      note: note !== undefined ? note : (existing && existing.note) || '',
      checkedAt: now,
    };
  });
  return next;
};

export const clearMarks = (ledger, ids) => {
  const next = { ...ledger };
  ids.forEach((id) => delete next[id]);
  return next;
};

// ---- first-seen (NEW since last visit) ----
export const loadFirstSeen = () => readJson(FIRST_SEEN_KEY, {});

// Record first-seen time for ids never seen before (idempotent, safe in a memo).
export const recordFirstSeen = (ids) => {
  const next = { ...loadFirstSeen() };
  const now = Date.now();
  let changed = false;
  (ids || []).forEach((id) => {
    if (!next[id]) {
      next[id] = now;
      changed = true;
    }
  });
  if (changed) writeJson(FIRST_SEEN_KEY, next);
  return next;
};

// ---- last visit ----
export const getLastVisit = () => readNumber(LAST_VISIT_KEY);
export const setLastVisit = (ts = Date.now()) => writeText(LAST_VISIT_KEY, String(ts));

// Optional note prompt (browser). Returns undefined when cancelled.
export const askForNote = (existing = '') => {
  try {
    const res = window.prompt('Note for this clash (optional):', existing || '');
    if (res === null) return undefined;
    return res.trim();
  } catch {
    return undefined;
  }
};

export const formatTimestamp = (ts) => {
  if (!ts) return 'never';
  try {
    return new Date(ts).toLocaleString(undefined, {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return 'unknown';
  }
};

// Progress counters for a set of clash ids.
export const summarizeClashMarks = (ids, ledger, firstSeen, lastVisit) => {
  let checked = 0;
  let intentional = 0;
  let unchecked = 0;
  let newCount = 0;
  (ids || []).forEach((id) => {
    const m = ledger[id];
    if (!m) {
      unchecked += 1;
      if (lastVisit && (firstSeen[id] || 0) > lastVisit) newCount += 1;
    } else if (m.status === CHECKED) {
      checked += 1;
    } else {
      intentional += 1;
    }
  });
  return {
    total: (ids || []).length,
    checked,
    intentional,
    unchecked,
    newCount,
    reviewed: checked + intentional,
  };
};
