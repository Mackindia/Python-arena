import React, { useEffect, useMemo, useState } from 'react';
import { proposeSwaps, subjectsOfClass, listSubjectCells } from '../services/clashSolver';

const KIND_META = {
  move: { label: 'Move', color: '#0369a1' },
  within: { label: 'Same-class swap', color: '#7c3aed' },
  freeOther: { label: 'Free the teacher', color: '#0d9488' },
  exchange: { label: 'Cross-class swap', color: '#b45309' },
};
const KIND_FALLBACK = { label: 'Swap', color: '#64748b' };

const cellLabel = (c) => (c ? `${c.day} P${c.period}` : '');

const describeSuggestion = (s) => {
  const from = cellLabel(s.src);
  const to = cellLabel(s.other);
  const sub = (s.src && s.src.subject) || 'this period';
  const otherSub = s.other ? (s.other.subject || 'an empty period') : '';
  if (s.kind === 'move') return `Move ${sub} ${from} → ${to}`;
  if (s.kind === 'within') return `Swap ${sub} ${from} ⇄ ${otherSub} ${to} (same class)`;
  if (s.kind === 'freeOther') {
    const anchorSub = (s.anchor && s.anchor.subject) || 'this period';
    const teachers = (s.src.teachers || []).map((t) => t.toUpperCase()).join(',');
    return `Keep ${s.updates[0].classId.toUpperCase()} as-is · swap ${s.otherClassId.toUpperCase()} ${from} (${anchorSub}) ⇄ ${to} (${otherSub}) — frees ${teachers} at ${from}`;
  }
  return `Move ${sub} ${from} → ${s.otherClassId.toUpperCase()} ${to}, brings back ${otherSub}`;
};

// the ranked list of moves - exported so it can be smoke-rendered on its own
export const SuggestionList = ({ suggestions, onApply }) => (
  <div style={{ maxHeight: '340px', overflowY: 'auto', display: 'grid', gap: '0.5rem', paddingRight: '2px' }}>
    {suggestions.map((s, i) => {
      const meta = KIND_META[s.kind] || KIND_FALLBACK;
      return (
        <div
          key={`${s.kind}-${cellLabel(s.src)}-${cellLabel(s.other)}-${i}`}
          style={{
            background: '#fff',
            border: `1px solid ${s.safe ? '#c4b5fd' : '#fecaca'}`,
            borderRadius: '6px',
            padding: '0.55rem 0.7rem',
            display: 'flex',
            gap: '0.6rem',
            alignItems: 'center',
            flexWrap: 'wrap',
          }}
        >
          <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#fff', background: meta.color, borderRadius: '4px', padding: '2px 7px' }}>
            {meta.label}
          </span>
          <span style={{ fontSize: '0.86rem', fontWeight: 700 }}>
            {describeSuggestion(s)}
          </span>
          <span style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', fontSize: '0.72rem' }}>
            {s.fixedTarget.length > 0 && (
              <span style={{ background: '#dcfce7', color: '#166534', borderRadius: '4px', padding: '1px 6px', fontWeight: 700 }}>
                ✓ clears this clash{s.fixed.length > s.fixedTarget.length ? ` +${s.fixed.length - s.fixedTarget.length} more` : ''}
              </span>
            )}
            <span style={{ background: s.safe ? '#e0f2fe' : '#fee2e2', color: s.safe ? '#075985' : '#991b1b', borderRadius: '4px', padding: '1px 6px', fontWeight: 700 }}>
              {s.safe ? '0 new clashes' : `⚠ +${s.added.length} new clash(es)`}
            </span>
            {s.bandPenalty > 0 && (
              <span style={{ background: '#fef3c7', color: '#92400e', borderRadius: '4px', padding: '1px 6px', fontWeight: 700 }}>
                leaves printed band
              </span>
            )}
            <span style={{ background: '#f1f5f9', color: '#475569', borderRadius: '4px', padding: '1px 6px', fontWeight: 700 }}>
              score {s.score}
            </span>
          </span>
          <button
            className="btn btn-primary"
            onClick={() => onApply(s)}
            disabled={!s.safe}
            style={{
              marginLeft: 'auto',
              background: s.safe ? '#7c3aed' : '#94a3b8',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              padding: '0.35rem 0.8rem',
              fontWeight: 700,
              cursor: s.safe ? 'pointer' : 'not-allowed',
              fontSize: '0.8rem',
            }}
            title={s.safe ? 'Apply this swap' : 'Blocked: it would move the clash somewhere else'}
          >
            Apply
          </button>
        </div>
      );
    })}
  </div>
);

// NOTE: subject/period are DERIVED, not synced in an effect - the class
// selector lives on the page, so a stale choice simply falls back to the
// first subject/cell of the new class. The 🧠 prefill arrives as a `key`
// (parent remounts this panel), so initial state picks it up.
const SolutionManager = ({
  selectedClass,
  timetables,
  updateSlot,
  allClashes = [],
  periodCount = 9,
  prefill = null,
  onNotify,
  onClose,
}) => {
  const [subjectPick, setSubjectPick] = useState(prefill?.subject || '');
  const [cellPick, setCellPick] = useState(
    prefill?.day && prefill?.period ? `${prefill.day}|${prefill.period}` : ''
  );
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);

  const subjectList = useMemo(
    () => (selectedClass ? subjectsOfClass(timetables, selectedClass) : []),
    [timetables, selectedClass]
  );
  const subject = subjectList.some((s) => s.subject === subjectPick)
    ? subjectPick
    : subjectList[0]?.subject || '';

  const cells = useMemo(
    () => (selectedClass && subject ? listSubjectCells(timetables, selectedClass, subject, allClashes) : []),
    [timetables, selectedClass, subject, allClashes]
  );
  const cellKey = cells.some((c) => `${c.day}|${c.period}` === cellPick) ? cellPick : '';
  const pinned = cellKey;

  useEffect(() => {
    if (!selectedClass || !subject) return undefined;
    let cancelled = false;
    const timer = setTimeout(() => {
      const [day, period] = cellKey ? cellKey.split('|') : [null, null];
      const r = proposeSwaps({
        timetables,
        classId: selectedClass,
        subject,
        day: day || null,
        period: period || null,
        beforeClashes: allClashes,
        periodCount,
      });
      if (!cancelled) {
        setResult(r);
        setBusy(false);
      }
    }, 30);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [timetables, selectedClass, subject, cellKey, allClashes, periodCount]);

  const fresh =
    result &&
    result.classId === selectedClass &&
    result.subject === subject &&
    (result.pinned || '') === pinned;

  const applySuggestion = (s) => {
    let locked = false;
    s.updates.forEach((u) => {
      const ok = updateSlot(u.classId, u.day, u.period, u.subject, u.teacher, u.assignedTeachers, []);
      if (ok === false) locked = true;
    });
    const msg = describeSuggestion(s);
    if (locked) {
      onNotify?.('error', `Timetable is locked — nothing changed. Unlock it, then apply: ${msg}`);
    } else {
      const delta = s.afterCount - s.beforeCount;
      onNotify?.(
        'success',
        `${msg} — clashes ${s.beforeCount} → ${s.afterCount} (${delta <= 0 ? delta : `+${delta}`})`
      );
    }
  };

  const suggestions = fresh && result.ok ? result.suggestions : [];

  return (
    <div
      className="no-print"
      style={{
        margin: '1rem 0',
        padding: '1rem',
        borderRadius: '0.5rem',
        background: 'linear-gradient(to bottom, #faf5ff, #f5f3ff)',
        border: '1px solid #7c3aed',
        color: '#3b0764',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '28px', height: '28px', borderRadius: '50%', background: '#7c3aed', color: '#fff' }}>🧠</span>
          <strong style={{ fontSize: '1.05rem' }}>Solution Manager</strong>
          <span style={{ fontSize: '0.8rem', opacity: 0.8 }}>
            every move below was re-checked against the whole timetable — none can create a new clash
          </span>
        </div>
        <button className="btn btn-outline" onClick={onClose}>Close</button>
      </div>

      <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', alignItems: 'center', margin: '0.8rem 0' }}>
        <span style={{ fontSize: '0.82rem' }}>
          Class: <strong>{(selectedClass || '—').toUpperCase()}</strong>
        </span>
        <label style={{ fontSize: '0.82rem' }}>Subject:</label>
        <select
          value={subject}
          onChange={(e) => { setSubjectPick(e.target.value); setCellPick(''); setBusy(true); }}
          style={{ minWidth: '150px' }}
        >
          {subjectList.length === 0 && <option value="">(none)</option>}
          {subjectList.map((s) => (
            <option key={s.subject} value={s.subject}>{s.subject} ({s.cells})</option>
          ))}
        </select>
        <label style={{ fontSize: '0.82rem' }}>Which period:</label>
        <select
          value={cellKey}
          onChange={(e) => { setCellPick(e.target.value); setBusy(true); }}
          style={{ minWidth: '200px' }}
        >
          <option value="">Any period of this subject</option>
          {cells.map((c) => (
            <option key={`${c.day}-${c.period}`} value={`${c.day}|${c.period}`}>
              {c.day} P{c.period} ({c.teachers.join(',') || 'no teacher'}){c.clashing ? ' — CLASH' : ''}
            </option>
          ))}
        </select>
        <span style={{ fontSize: '0.78rem', color: busy ? '#7c3aed' : '#166534', fontWeight: 600 }}>
          {busy ? 'thinking…' : `✓ school-wide clashes: ${allClashes.length}`}
        </span>
      </div>

      {fresh && !result.ok && (
        <div style={{ fontSize: '0.85rem', color: '#b45309', marginBottom: '0.5rem' }}>⚠ {result.reason}</div>
      )}

      {fresh && result.ok && (
        <>
          <div style={{ fontSize: '0.8rem', background: '#fff', border: '1px solid #ddd6fe', borderRadius: '6px', padding: '0.5rem 0.7rem', marginBottom: '0.6rem' }}>
            <strong>{result.note}</strong>{' '}
            <span style={{ opacity: 0.75 }}>
              this period: {result.targetClashes} clash(es) · {result.verified} of {result.candidatesFound} possible moves checked
              {result.notVerified > 0 ? ` (${result.notVerified} skipped)` : ''}
            </span>
          </div>

          {suggestions.length === 0 ? (
            <div style={{ fontSize: '0.85rem' }}>No options for this selection — try another subject or period.</div>
          ) : (
            <SuggestionList suggestions={suggestions} onApply={applySuggestion} />
          )}
        </>
      )}
    </div>
  );
};

export default SolutionManager;
