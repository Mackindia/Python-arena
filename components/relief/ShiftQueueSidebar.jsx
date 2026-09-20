import React, { useMemo } from 'react';
import { useTimetable } from '../../context/TimetableContext';
import { getTeacherDayLoads } from '../../services/teacherReliefEngine';
import './reliefStyles.css';

const ShiftQueueSidebar = ({ shiftQueue, onRemoveShift, onRevertShift, onClearQueue, onApplyAll }) => {
  const { timetables } = useTimetable();

  // Calculate summary of changes per teacher
  const summary = useMemo(() => {
    const teacherChanges = {};

    shiftQueue.forEach(shift => {
      if (!teacherChanges[shift.teacher]) {
        teacherChanges[shift.teacher] = { shifts: [], before: {}, after: {} };
      }
      teacherChanges[shift.teacher].shifts.push(shift);
    });

    Object.keys(teacherChanges).forEach(teacher => {
      const dayLoads = getTeacherDayLoads(timetables, teacher);
      const changes = teacherChanges[teacher];

      const affectedDays = new Set();
      changes.shifts.forEach(s => {
        affectedDays.add(s.fromDay);
        affectedDays.add(s.toDay);
      });

      affectedDays.forEach(day => {
        const baseLoad = dayLoads[day]?.load || 0;
        const shiftsOut = changes.shifts.filter(s => s.fromDay === day).length;
        const shiftsIn = changes.shifts.filter(s => s.toDay === day).length;

        changes.before[day] = baseLoad;
        changes.after[day] = baseLoad - shiftsOut + shiftsIn;
      });
    });

    return teacherChanges;
  }, [shiftQueue, timetables]);

  // Separate applied shifts from queued shifts
  const queuedShifts = shiftQueue.filter(s => !s.applied);
  const appliedShifts = shiftQueue.filter(s => s.applied);

  if (shiftQueue.length === 0) {
    return (
      <div className="shift-queue-sidebar">
        <div className="shift-queue-header">
          <h3>Shift Queue</h3>
        </div>
        <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          No shifts queued yet.
          <br />
          <span style={{ fontSize: '0.8rem' }}>Click any period in the heatmap to start.</span>
        </div>
      </div>
    );
  }

  return (
    <div className="shift-queue-sidebar">
      {/* Header */}
      <div className="shift-queue-header">
        <h3>Shift Queue</h3>
        <span className="shift-queue-count">{queuedShifts.length}</span>
      </div>

      {/* Queue List */}
      <div className="shift-queue-list">
        {shiftQueue.map((shift, index) => (
          <div
            key={index}
            className="shift-queue-item"
            style={shift.applied ? { opacity: 0.6, borderStyle: 'dashed' } : {}}
          >
            <div className="shift-queue-item-header">
              <span className="shift-queue-item-teacher">
                {shift.teacher}
                {shift.applied && <span style={{ fontSize: '0.7rem', color: 'var(--accent-color)', marginLeft: '4px' }}>✓ applied</span>}
              </span>
              <div style={{ display: 'flex', gap: '4px' }}>
                {!shift.applied ? (
                  <>
                    <button
                      className="shift-queue-item-remove"
                      onClick={() => onRemoveShift(index)}
                      title="Remove from queue"
                    >
                      ×
                    </button>
                  </>
                ) : (
                  <button
                    className="shift-queue-item-remove"
                    onClick={() => onRevertShift(index)}
                    title="Revert this shift"
                    style={{ color: 'var(--warning-color)', fontSize: '0.9rem' }}
                  >
                    ↩
                  </button>
                )}
              </div>
            </div>
            <div className="shift-queue-item-detail">
              {shift.fromDay} P{shift.fromPeriod} → {shift.toDay} P{shift.toPeriod}
            </div>
            {shift.sourceSlot && (
              <div className="shift-queue-item-subject">
                {shift.sourceSlot.subject} ({shift.sourceSlot.classId.toUpperCase()})
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Summary */}
      <div className="shift-queue-summary">
        <div style={{ fontWeight: 600, marginBottom: '0.5rem', fontSize: '0.85rem' }}>Summary:</div>
        {Object.entries(summary).map(([teacher, changes]) => (
          <div key={teacher} className="shift-queue-summary-row">
            <span className="teacher">{teacher}:</span>
            <span>
              {Object.entries(changes.after).map(([day, after]) => {
                const before = changes.before[day];
                return `${day} ${before}→${after}`;
              }).join(', ')}
            </span>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="shift-queue-actions">
        {queuedShifts.length > 0 && (
          <button className="btn-apply-all" onClick={onApplyAll}>
            Apply All ({queuedShifts.length})
          </button>
        )}
        <button className="btn-discard-all" onClick={onClearQueue}>
          {appliedShifts.length > 0 ? 'Clear All' : 'Discard All'}
        </button>
      </div>
    </div>
  );
};

export default ShiftQueueSidebar;
