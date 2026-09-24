// Single source of truth for periods per day (8 or 9).
// Mastersheet button writes here; engines + grid read from here.

const STORAGE_KEY = 'timetablePeriodCount';
export const ALLOWED_PERIOD_COUNTS = [8, 9];
export const DEFAULT_PERIOD_COUNT = 9;

let cache = null;

export const getPeriodCount = () => {
  if (cache !== null) return cache;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const n = raw ? parseInt(raw, 10) : DEFAULT_PERIOD_COUNT;
    cache = ALLOWED_PERIOD_COUNTS.includes(n) ? n : DEFAULT_PERIOD_COUNT;
  } catch {
    cache = DEFAULT_PERIOD_COUNT;
  }
  return cache;
};

export const setPeriodCount = (count) => {
  const n = ALLOWED_PERIOD_COUNTS.includes(Number(count))
    ? Number(count)
    : DEFAULT_PERIOD_COUNT;
  cache = n;
  try {
    localStorage.setItem(STORAGE_KEY, String(n));
  } catch {
    // ignore quota / private mode
  }
  applyPeriodCountCss();
  return n;
};

export const getPeriods = () =>
  Array.from({ length: getPeriodCount() }, (_, i) => i + 1);

export const applyPeriodCountCss = () => {
  if (typeof document === 'undefined') return;
  document.documentElement.style.setProperty(
    '--period-count',
    String(getPeriodCount())
  );
};

applyPeriodCountCss();
