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

// ---- Bell timings (school day) ----
// P1-P5 in the morning, Break, then P6-P9. Change times here only —
// the Class Timetable grid (screen + Print Class / Print All) reads them.
export const PERIOD_TIMES = {
  1: ['8:00 AM', '8:35 AM'],
  2: ['8:35 AM', '9:10 AM'],
  3: ['9:10 AM', '9:45 AM'],
  4: ['9:45 AM', '10:20 AM'],
  5: ['10:20 AM', '10:55 AM'],
  6: ['11:10 AM', '11:55 AM'],
  7: ['11:55 AM', '12:30 PM'],
  8: ['12:30 PM', '1:05 PM'],
  9: ['1:05 PM', '1:45 PM'],
};

// Break sits right after this period; its column renders between P5 and P6.
export const BREAK_AFTER_PERIOD = 5;
export const BREAK_TIME = ['10:55 AM', '11:10 AM'];

// "8:00 AM" + "8:35 AM" -> "8:00 – 8:35" (compact, for grid headers)
// withMeridiem -> "8:00 AM – 8:35 AM" (full, for tooltips)
export const formatTimeRange = (start, end, withMeridiem = false) => {
  if (!start || !end) return '';
  if (withMeridiem) return `${start} – ${end}`;
  const strip = (t) => t.replace(/\s*(AM|PM)/i, '');
  return `${strip(start)} – ${strip(end)}`;
};

export const formatPeriodTime = (period, withMeridiem = false) => {
  const time = PERIOD_TIMES[period];
  return time ? formatTimeRange(time[0], time[1], withMeridiem) : '';
};

export const formatBreakTime = (withMeridiem = false) =>
  formatTimeRange(BREAK_TIME[0], BREAK_TIME[1], withMeridiem);

export const applyPeriodCountCss = () => {
  if (typeof document === 'undefined') return;
  document.documentElement.style.setProperty(
    '--period-count',
    String(getPeriodCount())
  );
};

applyPeriodCountCss();
