import React, { useState, useMemo } from 'react';
import { useTimetable } from '../../context/TimetableContext';
import { getDayDetail, getTeacherDayLoads, pickBestPeriod } from '../../services/teacherReliefEngine';
import ShiftPickerModal from './ShiftPickerModal';
import './reliefStyles.css';

const PERIODS = [1, 2, 3, 4, 5, 6, 7, 8];

const DayDetailPanel = ({ teacher, day, onClose, onAddShift, shiftQueue, onShowRecommendations }) => {
  const { timetables } = useTimetable();
  const [selectedPeriod, setSelectedPeriod] = useState(null);
  const [suggestedPeriod, setSuggestedPeriod] = useState(null);

  // Get day detail
  const daySlots = useMemo(() => {
    return getDayDetail(timetables, teacher, day);
  }, [timetables, teacher, day]);

  // Get teacher's day loads
  const dayLoads = useMemo(() => {
    return getTeacherDayLoads(timetables, teacher);
  }, [timetables, teacher]);

  const currentLoad = dayLoads[day]?.load || 0;
  const isOverloaded = currentLoad > 6;
  const excess = currentLoad - 6;

  // Check which periods already have queued shifts
  const queuedPeriods = useMemo(() => {
    return shiftQueue
      .filter(s => s.teacher === teacher && s.fromDay === day)
      .map(s => s.fromPeriod);
  }, [shiftQueue, teacher, day]);

  // Handle suggest button
  const handleSuggest = () => {
    const best = pickBestPeriod(timetables, teacher, day);
    setSuggestedPeriod(best);
  };

  // Handle move button click
  const handleMove = (period) => {
    setSelectedPeriod(period);
  };

  // Handle shift confirmed from modal
  const handleShiftConfirmed = (shift) => {
    onAddShift(shift);
    setSelectedPeriod(null);
  };

  // Get slot for a period
  const getSlotForPeriod = (period) => {
    return daySlots.find(s => s.period === period);
  };

  return (
    <div className="day-detail-overlay" onClick={onClose}>
      <div className="day-detail-panel" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="day-detail-header">
          <div>
            <h3>{teacher} — {day}</h3>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
              {currentLoad} periods scheduled
              {isOverloaded && (
                <span style={{ color: 'var(--danger-color)', marginLeft: '8px', fontWeight: 600 }}>
                  (overloaded by {excess})
                </span>
              )}
            </div>
          </div>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        {/* Target Info - only show if overloaded */}
        {isOverloaded && (
          <div className="day-detail-target">
            Target: Remove {excess} period{excess > 1 ? 's' : ''} ({currentLoad}→6)
          </div>
        )}

        {!isOverloaded && (
          <div style={{
            padding: '0.75rem 1.5rem',
            background: 'rgba(16, 185, 129, 0.1)',
            borderBottom: '1px solid var(--border-color)',
            fontSize: '0.85rem',
            color: '#065F46'
          }}>
            ✅ Day is within limit. You can still move periods to balance load.
          </div>
        )}

        {/* Slots List */}
        <div className="day-detail-slots">
          {PERIODS.map(period => {
            const slot = getSlotForPeriod(period);
            const isQueued = queuedPeriods.includes(period);
            const isSuggested = suggestedPeriod === period;

            if (!slot) {
              return (
                <div key={period} className="day-slot-row free">
                  <div className="day-slot-period">P{period}</div>
                  <div className="day-slot-info">
                    <div className="day-slot-subject" style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                      — free —
                    </div>
                  </div>
                </div>
              );
            }

            return (
              <div
                key={period}
                className={`day-slot-row ${isSuggested ? 'suggested' : ''}`}
                style={isSuggested ? { borderColor: 'var(--primary-color)', background: 'rgba(79, 70, 229, 0.05)' } : {}}
              >
                <div className="day-slot-period">P{period}</div>
                <div className="day-slot-info">
                  <div className="day-slot-subject">{slot.subject}</div>
                  <div className="day-slot-class">{slot.classId.toUpperCase()}</div>
                </div>
                {isQueued ? (
                  <span style={{ fontSize: '0.8rem', color: 'var(--accent-color)', fontWeight: 500 }}>
                    ✓ Queued
                  </span>
                ) : (
                  <button
                    className="day-slot-action"
                    onClick={() => handleMove(period)}
                    title={`Move P${period} to another day`}
                  >
                    ← Move this
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* Suggest Button */}
        <div className="day-detail-suggest">
          <button className="suggest-btn" onClick={handleSuggest}>
            💡 Suggest best period to move
          </button>
          {suggestedPeriod && (
            <div style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: 'var(--primary-color)' }}>
              Suggested: Period {suggestedPeriod} (middle of continuous block)
            </div>
          )}
        </div>

        {/* Shift Picker Modal */}
        {selectedPeriod && (
          <ShiftPickerModal
            teacher={teacher}
            fromDay={day}
            fromPeriod={selectedPeriod}
            onClose={() => setSelectedPeriod(null)}
            onConfirm={handleShiftConfirmed}
            onShowRecommendations={() => {
              setSelectedPeriod(null);
              if (onShowRecommendations) onShowRecommendations(teacher, day);
            }}
          />
        )}
      </div>
    </div>
  );
};

export default DayDetailPanel;
