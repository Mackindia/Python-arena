// ============================================================
// CLASH BATCH APPLY - review many clashes in ONE click
//
// The Clash Report lets you tick rows and then push "Intentional"
// or "Checked" onto the whole selection in one go — or, when nothing
// is ticked, onto the whole scope (this class / every class).
//
// Kept pure (no React, no storage) so it can be unit-tested:
//   rowKeyOf(row)         - stable key for a report row
//   collectBatchIds(opts) - which clash ids the batch targets
//   pendingCheckedIds()   - "Apply Checked" skips already-reviewed ids
//   countBatch()          - counts used on the button labels
// ============================================================

export const rowKeyOf = (row) => (row?.entries || []).map((e) => e.id).join('+');

// Target selection, in priority order:
//   1. rows ticked            -> exactly those rows (current class list)
//   2. nothing ticked + scope 'all'  -> every clash in the timetable
//   3. nothing ticked + scope 'class'-> every clash of the selected class
export const collectBatchIds = ({ rows, selectedKeys, scope, allClashIds }) => {
  const sel = new Set(selectedKeys || []);
  if (sel.size > 0) {
    const ids = [];
    (rows || []).forEach((row) => {
      if (sel.has(rowKeyOf(row))) {
        (row?.entries || []).forEach((e) => ids.push(e.id));
      }
    });
    return [...new Set(ids)];
  }
  if (scope === 'all') return [...new Set(allClashIds || [])];
  return [...new Set((rows || []).flatMap((row) => (row?.entries || []).map((e) => e.id)))];
};

// "Apply Checked" must never overwrite an existing review mark.
export const pendingCheckedIds = (ids, ledger) =>
  (ids || []).filter((id) => !(ledger && ledger[id]));

export const countBatch = (ids, ledger) => {
  const all = ids || [];
  const pending = pendingCheckedIds(all, ledger);
  return {
    total: all.length,
    pending: pending.length,
    reviewed: all.length - pending.length,
  };
};
