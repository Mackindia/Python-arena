import React, { useState, useMemo, useCallback } from 'react';
import { useTimetable } from '../context/TimetableContext';
import { getAllTeachersSummary, applyShifts } from '../services/teacherReliefEngine';
import TeacherLoadHeatmap from './relief/TeacherLoadHeatmap';
import ShiftQueueSidebar from './relief/ShiftQueueSidebar';
import RecommendationPanel from './relief/RecommendationPanel';
import './relief/reliefStyles.css';
import { getPeriods } from '../config/periods';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const PERIODS = getPeriods();

const TeacherView = () => {
  const { timetables, teachers, updateSlot } = useTimetable();
  const [selectedTeacher, setSelectedTeacher] = useState(teachers[0] || '');
  const [activeTab, setActiveTab] = useState('schedule');
  const [shiftQueue, setShiftQueue] = useState([]);

  // Calculate teacher's schedule across all classes (for Schedule tab)
  const getTeacherSchedule = () => {
    const schedule = {};
    DAYS.forEach(day => {
      schedule[day] = {};
      PERIODS.forEach(p => {
        schedule[day][p] = null;
      });
    });

    if (!selectedTeacher) return schedule;

    Object.entries(timetables).forEach(([classId, classSchedule]) => {
      classSchedule.forEach(slot => {
        // Handle comma-separated teachers (e.g., "GA,SA,HSC")
        const teachers = slot.teacher ? slot.teacher.split(',').map(t => t.trim()) : [];
        if (teachers.includes(selectedTeacher)) {
          schedule[slot.day][parseInt(slot.period)] = {
            classId,
            subject: slot.subject
          };
        }
      });
    });

    return schedule;
  };

  const schedule = getTeacherSchedule();

  // Calculate total classes per week
  let totalClasses = 0;
  DAYS.forEach(day => {
    PERIODS.forEach(p => {
      if (schedule[day][p]) totalClasses++;
    });
  });

  // Get overloaded count for badge
  const overloadedCount = useMemo(() => {
    const summary = getAllTeachersSummary(timetables, teachers);
    return summary.filter(t => t.overloadedDays.length > 0).length;
  }, [timetables, teachers]);

  // Shift queue handlers
  const handleAddShift = useCallback((shift) => {
    setShiftQueue(prev => [...prev, shift]);
  }, []);

  const handleRemoveShift = useCallback((index) => {
    setShiftQueue(prev => prev.filter((_, i) => i !== index));
  }, []);

  const handleClearQueue = useCallback(() => {
    setShiftQueue([]);
  }, []);

  // Recommendation state
  const [showRecommendations, setShowRecommendations] = useState(false);
  const [recommendationTeacher, setRecommendationTeacher] = useState(null);
  const [recommendationDay, setRecommendationDay] = useState(null);

  const handleShowRecommendations = useCallback((teacher, day) => {
    setRecommendationTeacher(teacher);
    setRecommendationDay(day);
    setShowRecommendations(true);
  }, []);

  const handleCloseRecommendations = useCallback(() => {
    setShowRecommendations(false);
    setRecommendationTeacher(null);
    setRecommendationDay(null);
  }, []);

  const handleApplyRecommendation = useCallback((rec) => {
    // Convert recommendation steps to shifts
    const newShifts = rec.steps
      .filter(step => step.action === 'swap')
      .map(step => ({
        teacher: step.teacher,
        fromDay: step.from.day,
        fromPeriod: step.from.period,
        toDay: step.to.day,
        toPeriod: step.to.period,
        sourceSlot: {
          classId: step.from.classId,
          subject: rec.sourceSlot?.subject || ''
        }
      }));

    // Add to shift queue
    setShiftQueue(prev => [...prev, ...newShifts]);
    setShowRecommendations(false);
  }, []);

  const handleApplyAll = useCallback(() => {
    if (shiftQueue.length === 0) return;

    // Apply all shifts to timetables
    const newTimetables = applyShifts(timetables, shiftQueue);

    // Update each class timetable in context
    Object.entries(newTimetables).forEach(([classId, newSchedule]) => {
      const oldSchedule = timetables[classId] || [];

      // Find slots that were removed (existed in old but not in new)
      const removedSlots = oldSchedule.filter(oldSlot => {
        return !newSchedule.some(newSlot =>
          newSlot.day === oldSlot.day &&
          newSlot.period === oldSlot.period &&
          newSlot.teacher === oldSlot.teacher
        );
      });

      // Find slots that were added (exist in new but not in old)
      const addedSlots = newSchedule.filter(newSlot => {
        return !oldSchedule.some(oldSlot =>
          oldSlot.day === newSlot.day &&
          oldSlot.period === newSlot.period &&
          oldSlot.teacher === newSlot.teacher
        );
      });

      // Remove old slots
      removedSlots.forEach(slot => {
        updateSlot(classId, slot.day, slot.period, '', '');
      });

      // Add new slots
      addedSlots.forEach(slot => {
        updateSlot(classId, slot.day, slot.period, slot.subject, slot.teacher);
      });
    });

    // Clear the queue
    setShiftQueue([]);

    // Show success message (you could add a toast/notification here)
    alert(`Applied ${shiftQueue.length} shift(s) successfully!`);
  }, [shiftQueue, timetables, updateSlot]);

  return (
    <div>
      {/* Tab Bar */}
      <div className="relief-tab-bar">
        <button
          className={`relief-tab ${activeTab === 'schedule' ? 'active' : ''}`}
          onClick={() => setActiveTab('schedule')}
        >
          Schedule
        </button>
        <button
          className={`relief-tab ${activeTab === 'relief' ? 'active' : ''}`}
          onClick={() => setActiveTab('relief')}
        >
          Relief
          {overloadedCount > 0 && <span className="badge">{overloadedCount}</span>}
        </button>
      </div>

      {/* Schedule Tab */}
      {activeTab === 'schedule' && (
        <>
          <div className="filter-bar" style={{ display: 'flex', justifyContent: 'space-between' }}>
            <div className="filter-group">
              <label>Select Teacher:</label>
              <select
                value={selectedTeacher}
                onChange={(e) => setSelectedTeacher(e.target.value)}
                style={{ width: '200px' }}
              >
                <option value="">- Select Teacher -</option>
                {teachers.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            {selectedTeacher && (
              <div className="filter-group">
                <span className="badge badge-success" style={{ fontSize: '1rem', padding: '0.5rem 1rem' }}>
                  Total Load: {totalClasses} classes/week
                </span>
              </div>
            )}
          </div>

          {selectedTeacher ? (
            <div className="card">
              <div className="timetable-grid">
                <div className="grid-cell grid-header">Day</div>
                {PERIODS.map(p => (
                  <div key={`p${p}`} className="grid-cell grid-header">P{p}</div>
                ))}

                {DAYS.map(day => (
                  <React.Fragment key={day}>
                    <div className="grid-cell day-header">{day}</div>
                    {PERIODS.map(p => {
                      const slot = schedule[day][p];
                      return (
                        <div key={`${day}-p${p}`} className="grid-cell" style={slot ? { backgroundColor: 'rgba(79, 70, 229, 0.05)' } : {}}>
                          {slot ? (
                            <>
                              <div className="slot-subject">{slot.classId.toUpperCase()}</div>
                              <div className="slot-teacher">{slot.subject}</div>
                            </>
                          ) : (
                            <div className="slot-teacher" style={{ opacity: 0.3 }}>- Free -</div>
                          )}
                        </div>
                      );
                    })}
                  </React.Fragment>
                ))}
              </div>
            </div>
          ) : (
            <div className="card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
              Please select a teacher to view their schedule.
            </div>
          )}
        </>
      )}

      {/* Relief Tab */}
      {activeTab === 'relief' && (
        <div className="shift-queue-container">
          <TeacherLoadHeatmap
            shiftQueue={shiftQueue}
            onAddShift={handleAddShift}
            onRemoveShift={handleRemoveShift}
            onClearQueue={handleClearQueue}
            onApplyAll={handleApplyAll}
            onShowRecommendations={handleShowRecommendations}
          />
          <ShiftQueueSidebar
            shiftQueue={shiftQueue}
            onRemoveShift={handleRemoveShift}
            onClearQueue={handleClearQueue}
            onApplyAll={handleApplyAll}
          />
        </div>
      )}

      {/* Recommendation Panel */}
      {showRecommendations && recommendationTeacher && recommendationDay && (
        <RecommendationPanel
          teacher={recommendationTeacher}
          overloadedDay={recommendationDay}
          onApplySwap={handleApplyRecommendation}
          onClose={handleCloseRecommendations}
        />
      )}
    </div>
  );
};

export default TeacherView;
