import React from 'react';

// Pure presentational bar for the Clash Report: pick a scope, tick rows,
// then push Intentional / Checked / Undo onto the whole target in one click.
// All logic lives in ClassTimetable + services/clashBatchApply.js.
const ClashBatchBar = ({
  classCount = 0,
  allCount = 0,
  scope = 'class',
  onScopeChange = () => {},
  rowCount = 0,
  selectedCount = 0,
  total = 0,
  pending = 0,
  reviewed = 0,
  onTickAll = () => {},
  onUntick = () => {},
  onApplyIntentional = () => {},
  onApplyChecked = () => {},
  onUndo = () => {},
}) => (
  <div
    className="clash-batch-bar"
    style={{
      display: 'flex',
      flexWrap: 'wrap',
      alignItems: 'center',
      gap: '8px',
      padding: '8px 10px',
      marginBottom: '10px',
      background: '#fff7ed',
      border: '1px solid #fdba74',
      borderRadius: '6px',
      fontSize: '0.82rem',
    }}
  >
    <strong style={{ color: '#9a3412' }}>Apply in one go:</strong>
    <label style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
      <input
        type="radio"
        name="batchScope"
        value="class"
        checked={scope === 'class'}
        onChange={() => onScopeChange('class')}
      />
      This class ({classCount})
    </label>
    <label style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
      <input
        type="radio"
        name="batchScope"
        value="all"
        checked={scope === 'all'}
        onChange={() => onScopeChange('all')}
      />
      All classes ({allCount})
    </label>
    <span style={{ color: '#fdba74' }}>|</span>
    <button
      onClick={onTickAll}
      disabled={rowCount === 0}
      style={{
        background: 'white',
        border: '1px solid #fdba74',
        color: '#9a3412',
        borderRadius: '4px',
        padding: '3px 8px',
        cursor: rowCount ? 'pointer' : 'not-allowed',
        fontSize: '0.78rem',
        fontWeight: 600,
      }}
    >
      Tick all rows ({rowCount})
    </button>
    <button
      onClick={onUntick}
      disabled={selectedCount === 0}
      style={{
        background: 'white',
        border: '1px solid #fed7aa',
        color: '#9a3412',
        borderRadius: '4px',
        padding: '3px 8px',
        cursor: selectedCount ? 'pointer' : 'not-allowed',
        fontSize: '0.78rem',
        fontWeight: 600,
      }}
    >
      Untick
    </button>
    <span style={{ color: '#475569', fontSize: '0.78rem' }}>
      {selectedCount > 0 ? `${selectedCount} row(s) ticked` : 'nothing ticked = whole scope'}
    </span>
    <button
      onClick={onApplyIntentional}
      disabled={total === 0}
      style={{
        background: total ? '#16a34a' : '#94a3b8',
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        padding: '5px 10px',
        fontWeight: 700,
        cursor: total ? 'pointer' : 'not-allowed',
        fontSize: '0.8rem',
      }}
      title="Mark every clash in scope as an intentional combined class (reviewed — leave it)"
    >
      ✅ Apply Intentional ({total})
    </button>
    <button
      onClick={onApplyChecked}
      disabled={pending === 0}
      style={{
        background: pending ? '#d97706' : '#94a3b8',
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        padding: '5px 10px',
        fontWeight: 700,
        cursor: pending ? 'pointer' : 'not-allowed',
        fontSize: '0.8rem',
      }}
      title="Mark every not-yet-reviewed clash in scope as Checked (real clash, fix later) — one optional note covers the whole batch"
    >
      ☑ Apply Checked ({pending})
    </button>
    <button
      onClick={onUndo}
      disabled={total === 0}
      style={{
        background: total ? '#6b7280' : '#94a3b8',
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        padding: '5px 10px',
        fontWeight: 700,
        cursor: total ? 'pointer' : 'not-allowed',
        fontSize: '0.8rem',
      }}
      title="Clear review marks in scope — back to unchecked"
    >
      ↺ Undo ({total})
    </button>
    {reviewed > 0 && (
      <span style={{ color: '#166534', fontSize: '0.78rem' }}>{reviewed} already reviewed</span>
    )}
  </div>
);

export default ClashBatchBar;
