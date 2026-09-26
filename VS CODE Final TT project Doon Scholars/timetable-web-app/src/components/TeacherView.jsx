import React, { useState, useMemo, useCallback } from 'react';
import { useTimetable } from '../context/TimetableContext';
import { getAllTeachersSummary, applyShifts } from '../services/teacherReliefEngine';
import {
  scanAllClashes,
  getTeacherClashes,
  loadKeptClashes,
  saveKeptClashes,
  keepClashes,
  unkeepClashes,
} from '../services/clashScanner';
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

  // Intentional combined classes kept by the user (shared with Class Timetable)
  const [keptClashes, setKeptClashes] = useState(() => loadKeptClashes());
  const keptSet = useMemo(() => new Set(keptClashes), [keptClashes]);

  // Global scan: EVERY teacher double-booking across all classes, at once.
  // Catches clashes that the class timetable report might have missed.
  const allClashes = useMemo(() => scanAllClashes(timetables), [timetables]);
  const teacherClashes = useMemo(
    () => getTeacherClashes(allClashes, selectedTeacher),
    [allClashes, selectedTeacher]
  );
  const clashIndex = useMemo(() => {
    const idx = {};
    teacherClashes.forEach(c => { idx[`${c.day}|${c.period}`] = c; });
    return idx;
  }, [teacherClashes]);

  const handleToggleKeep = useCallback((id, keep) => {
    setKeptClashes(prev => {
      const next = keep ? keepClashes(prev, [id]) : unkeepClashes(prev, [id]);
      saveKeptClashes(next);
      return next;
    });
  }, []);

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
        // Handle comma-separated teachers (e.g., "SB,RD,DV")
        const slotTeachers = slot.teacher ? slot.teacher.split(',').map(t => t.trim()) : [];
        if (!slotTeachers.includes(selectedTeacher)) return;
        const p = parseInt(slot.period);
        const clashRow = clashIndex[`${slot.day}|${p}`] || null;
        const cell = schedule[slot.day][p];
        if (cell) {
          // Combined class: the teacher is with 2+ sections in this period.
          // Keep every section instead of overwriting (11a used to vanish
          // behind 11b, so the teacher view disagreed with the class grid).
          if (!cell.classIds.includes(classId)) cell.classIds.push(classId);
          if (!cell.subjects.includes(slot.subject)) cell.subjects.push(slot.subject);
        } else {
          schedule[slot.day][p] = {
            classIds: [classId],
            subjects: [slot.subject],
            combined: false,
          };
        }
        const now = schedule[slot.day][p];
        now.combined = now.classIds.length > 1;
        // Real double-booking vs. kept (intentional) combined period
        now.clash = clashRow;
        now.clashKept = clashRow ? keptSet.has(clashRow.id) : false;
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
                      const isClashCell = !!(slot && slot.clash && !slot.clashKept);
                      const cellTitle = slot
                        ? isClashCell
                          ? `CLASH — ${slot.clash.teacher} is allotted to ${slot.clash.classIds.map(c => c.toUpperCase()).join(', ')} on ${day} Period ${p}`
                          : slot.clashKept
                            ? `Kept as intentional combined class: ${slot.classIds.map(c => c.toUpperCase()).join(' + ')}`
                            : slot.combined
                              ? `Combined class: ${slot.classIds.map(c => c.toUpperCase()).join(' + ')}`
                              : undefined
                        : undefined;
                      return (
                        <div
                          key={`${day}-p${p}`}
                          className={`grid-cell${isClashCell ? ' collision-warning' : ''}`}
                          style={slot ? { backgroundColor: isClashCell ? '#fef2f2' : 'rgba(79, 70, 229, 0.05)' } : {}}
                          title={cellTitle}
                        >
                          {slot ? (
                            <>
                              <div className="slot-subject" title={cellTitle}>
                                {slot.classIds.map(c => c.toUpperCase()).join(' + ')}
                              </div>
                              <div className="slot-teacher">{slot.subjects.join(' / ')}</div>
                              {slot.clash && (
                                <div style={{
                                  marginTop: '3px',
                                  fontSize: '0.65rem',
                                  fontWeight: 700,
                                  padding: '1px 7px',
                                  borderRadius: '8px',
                                  display: 'inline-block',
                                  background: isClashCell ? '#dc2626' : '#16a34a',
                                  color: '#fff',
                                  letterSpacing: '0.03em'
                                }}>
                                  {isClashCell ? '⚠ CLASH' : 'Combined ✓'}
                                </div>
                              )}
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

          {/* Per-teacher clash report — catches clashes missed in class timetable */}
          {selectedTeacher && teacherClashes.length > 0 && (
            <div className="card no-print" style={{ marginTop: '1rem', border: '1px solid #fca5a5', background: '#fef2f2', borderRadius: '0.5rem', padding: '1rem' }}>
              <h3 style={{ margin: '0 0 0.5rem 0', color: '#991b1b', fontSize: '1rem', fontWeight: 700 }}>
                ⚠️ Clash Report — {selectedTeacher.toUpperCase()} ({teacherClashes.filter(c => !keptSet.has(c.id)).length} active • {teacherClashes.filter(c => keptSet.has(c.id)).length} kept)
              </h3>
              <p style={{ fontSize: '0.8rem', color: '#6b7280', margin: '0 0 0.75rem 0' }}>
                Every period where this teacher is allotted to 2+ classes at once. If a clash was missed in the class timetable, it shows up here.
              </p>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                <thead>
                  <tr style={{ background: '#fee2e2' }}>
                    <th style={{ padding: '6px 10px', textAlign: 'left', borderBottom: '2px solid #fca5a5' }}>Day</th>
                    <th style={{ padding: '6px 10px', textAlign: 'center', borderBottom: '2px solid #fca5a5' }}>Period</th>
                    <th style={{ padding: '6px 10px', textAlign: 'left', borderBottom: '2px solid #fca5a5' }}>Classes Allotted (Subject)</th>
                    <th style={{ padding: '6px 10px', textAlign: 'center', borderBottom: '2px solid #fca5a5' }}>Status</th>
                    <th style={{ padding: '6px 10px', textAlign: 'center', borderBottom: '2px solid #fca5a5' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {teacherClashes.map((c, i) => {
                    const isKept = keptSet.has(c.id);
                    return (
                      <tr key={c.id} style={{ background: isKept ? '#f0fdf4' : i % 2 === 0 ? '#fff' : '#fef2f2' }}>
                        <td style={{ padding: '6px 10px', borderBottom: '1px solid #fecaca' }}>{c.day}</td>
                        <td style={{ padding: '6px 10px', textAlign: 'center', borderBottom: '1px solid #fecaca', fontWeight: 700 }}>{c.period}</td>
                        <td style={{ padding: '6px 10px', borderBottom: '1px solid #fecaca' }}>
                          {c.slots.map((s, si) => (
                            <span key={si}>
                              <strong>{s.classId.toUpperCase()}</strong>
                              {s.subject ? ` — ${s.subject}` : ''}
                              {si < c.slots.length - 1 ? ' & ' : ''}
                            </span>
                          ))}
                        </td>
                        <td style={{ padding: '6px 10px', textAlign: 'center', borderBottom: '1px solid #fecaca', fontWeight: 700, color: isKept ? '#166534' : '#dc2626' }}>
                          {isKept ? 'Combined (kept)' : 'CLASH'}
                        </td>
                        <td style={{ padding: '6px 10px', textAlign: 'center', borderBottom: '1px solid #fecaca' }}>
                          <button
                            onClick={() => handleToggleKeep(c.id, !isKept)}
                            style={{
                              background: isKept ? '#dc2626' : '#6b7280',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              padding: '4px 10px',
                              fontWeight: 600,
                              cursor: 'pointer',
                              fontSize: '0.8rem'
                            }}
                            title={isKept ? 'Mark this as a real clash again' : 'Keep this — it is an intentional combined class'}
                          >
                            {isKept ? 'Unkeep' : 'Keep (combined)'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
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
