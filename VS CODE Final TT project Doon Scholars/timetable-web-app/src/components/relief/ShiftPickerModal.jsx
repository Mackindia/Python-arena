import React, { useState, useMemo } from 'react';
import { useTimetable } from '../../context/TimetableContext';
import { getFreeSlots, validateShift, getShiftPreview } from '../../services/teacherReliefEngine';
import './reliefStyles.css';
import { getPeriods } from '../../config/periods';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const PERIODS = getPeriods();

const ShiftPickerModal = ({ teacher, fromDay, fromPeriod, onClose, onConfirm, onShowRecommendations }) => {
  const { timetables } = useTimetable();
  const [selectedSlot, setSelectedSlot] = useState(null);

  // Get source slot info
  const sourceSlot = useMemo(() => {
    for (const [classId, classSchedule] of Object.entries(timetables)) {
      const slot = classSchedule.find(
        s => s.day === fromDay && parseInt(s.period) === parseInt(fromPeriod) && s.teacher === teacher
      );
      if (slot) return { ...slot, classId };
    }
    return null;
  }, [timetables, teacher, fromDay, fromPeriod]);

  // Build all possible destination slots (all days, all periods)
  const allDestSlots = useMemo(() => {
    const slots = [];
    DAYS.forEach(day => {
      PERIODS.forEach(period => {
        if (day === fromDay && period === parseInt(fromPeriod)) return; // skip source
        const validation = validateShift(timetables, teacher, fromDay, fromPeriod, day, period);
        slots.push({
          day,
          period,
          valid: validation.valid,
          reason: validation.reason,
          warnings: validation.warnings
        });
      });
    });
    return slots;
  }, [timetables, teacher, fromDay, fromPeriod]);

  // Get preview for selected slot
  const preview = useMemo(() => {
    if (!selectedSlot) return null;
    return getShiftPreview(timetables, teacher, fromDay, fromPeriod, selectedSlot.day, selectedSlot.period);
  }, [timetables, teacher, fromDay, fromPeriod, selectedSlot]);

  // Handle slot selection
  const handleSelect = (slot) => {
    if (!slot.valid) return;
    setSelectedSlot(slot);
  };

  // Handle confirm
  const handleConfirm = () => {
    if (!selectedSlot || !preview || !preview.valid) return;

    onConfirm({
      teacher,
      fromDay,
      fromPeriod: parseInt(fromPeriod),
      toDay: selectedSlot.day,
      toPeriod: selectedSlot.period,
      sourceSlot
    });
  };

  // Group slots by day
  const slotsByDay = useMemo(() => {
    const grouped = {};
    DAYS.forEach(day => {
      grouped[day] = allDestSlots.filter(s => s.day === day);
    });
    return grouped;
  }, [allDestSlots]);

  // Count valid vs invalid
  const validCount = allDestSlots.filter(s => s.valid).length;
  const invalidCount = allDestSlots.filter(s => !s.valid).length;

  return (
    <div className="shift-picker-overlay" onClick={onClose}>
      <div className="shift-picker-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="shift-picker-header">
          <div>
            <h3>Move: {teacher} — {fromDay} P{fromPeriod}</h3>
            {sourceSlot && (
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                {sourceSlot.subject} ({sourceSlot.classId.toUpperCase()})
              </div>
            )}
          </div>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        {/* Summary */}
        <div style={{
          padding: '0.5rem 1.5rem',
          borderBottom: '1px solid var(--border-color)',
          fontSize: '0.8rem',
          color: 'var(--text-secondary)',
          display: 'flex',
          gap: '1rem'
        }}>
          <span>✅ {validCount} free slots</span>
          <span>❌ {invalidCount} clashes</span>
        </div>

        {/* Free Slots List */}
        <div className="shift-picker-list">
          {DAYS.map(day => {
            const daySlots = slotsByDay[day];
            if (daySlots.length === 0) return null;

            return (
              <div key={day} style={{ marginBottom: '1rem' }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                  {day}
                </div>
                {daySlots.map(slot => {
                  const isSelected = selectedSlot?.day === slot.day && selectedSlot?.period === slot.period;

                  return (
                    <div
                      key={`${slot.day}-${slot.period}`}
                      className={`shift-slot-row ${!slot.valid ? 'clash' : ''} ${isSelected ? 'selected' : ''}`}
                      style={isSelected ? { borderColor: 'var(--primary-color)', background: 'rgba(79, 70, 229, 0.08)' } : {}}
                    >
                      <div className="shift-slot-day">{slot.day}</div>
                      <div className="shift-slot-period">P{slot.period}</div>
                      <div className={`shift-slot-status ${!slot.valid ? 'clash' : 'free'}`}>
                        {slot.valid ? '✓ free' : slot.reason}
                      </div>
                      <button
                        className="shift-slot-select"
                        disabled={!slot.valid}
                        onClick={() => handleSelect(slot)}
                      >
                        {isSelected ? 'Selected' : 'Select'}
                      </button>
                    </div>
                  );
                })}
              </div>
            );
          })}

          {validCount === 0 && (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
              <div style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>🔍</div>
              <div style={{ fontWeight: 600, marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
                No direct shift possible
              </div>
              <div style={{ fontSize: '0.85rem', marginBottom: '1.5rem' }}>
                All destination classes are fully occupied. The system can suggest alternative solutions.
              </div>
              {onShowRecommendations && (
                <button className="rec-open-btn" onClick={onShowRecommendations}>
                  💡 Get Recommendations
                </button>
              )}
            </div>
          )}
        </div>

        {/* Preview */}
        {selectedSlot && preview && (
          <div className="shift-preview">
            <h4>Preview after move:</h4>
            <div className="shift-preview-changes">
              <div className="shift-preview-day">
                <span className="day-name">{fromDay}:</span>
                <span className="arrow">{preview.before[fromDay]} →</span>
                <span className={`new-load ${preview.after[fromDay] <= 6 ? '' : 'warning'}`}>
                  {preview.after[fromDay]}
                </span>
                {preview.after[fromDay] <= 6 && <span> ✓</span>}
              </div>
              <div className="shift-preview-day">
                <span className="day-name">{selectedSlot.day}:</span>
                <span className="arrow">{preview.before[selectedSlot.day]} →</span>
                <span className={`new-load ${preview.after[selectedSlot.day] <= 6 ? '' : 'warning'}`}>
                  {preview.after[selectedSlot.day]}
                </span>
                {preview.after[selectedSlot.day] <= 6 && <span> ✓</span>}
              </div>
            </div>
            {preview.warnings.length > 0 && (
              <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: 'var(--warning-color)' }}>
                {preview.warnings.map((w, i) => (
                  <div key={i}>⚠ {w}</div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="shift-picker-footer">
          <button className="btn-cancel" onClick={onClose}>Cancel</button>
          <button
            className="btn-confirm"
            onClick={handleConfirm}
            disabled={!selectedSlot || !preview || !preview.valid}
          >
            Confirm Shift
          </button>
        </div>
      </div>
    </div>
  );
};

export default ShiftPickerModal;
