import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useTimetable } from '../context/TimetableContext';
import { getAllTeachersSummary, applyShifts } from '../services/teacherReliefEngine';
import {
  scanAllClashes,
  getTeacherClashes,
} from '../services/clashScanner';
import {
  CHECKED,
  INTENTIONAL,
  loadLedger,
  setMarks,
  clearMarks,
  askForNote,
  recordFirstSeen,
  getLastVisit,
  setLastVisit,
  formatTimestamp,
  summarizeClashMarks,
} from '../services/clashCheckLedger';
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

  // Check marks: which clashes have I already reviewed? (shared with Class Timetable)
  const [ledger, setLedger] = useState(() => loadLedger());
  const [lastVisit] = useState(() => getLastVisit());

  // Record that this session started — next visit compares against it (NEW chips)
  useEffect(() => {
    setLastVisit();
  }, []);

  // Global scan: EVERY teacher double-booking across all classes, at once.
  // Catches clashes that the class timetable report might have missed.
  const allClashes = useMemo(() => scanAllClashes(timetables), [timetables]);
  const allClashIds = useMemo(() => allClashes.map((c) => c.id), [allClashes]);
  const firstSeen = useMemo(() => recordFirstSeen(allClashIds), [allClashIds]);
  const teacherClashes = useMemo(
    () => getTeacherClashes(allClashes, selectedTeacher),
    [allClashes, selectedTeacher]
  );
  const teacherSummary = useMemo(
    () => summarizeClashMarks(teacherClashes.map((c) => c.id), ledger, firstSeen, lastVisit),
    [teacherClashes, ledger, firstSeen, lastVisit]
  );
  const clashIndex = useMemo(() => {
    const idx = {};
    teacherClashes.forEach(c => { idx[`${c.day}|${c.period}`] = c; });
    return idx;
  }, [teacherClashes]);
  // Marks whose clash no longer exists = already fixed/cleared (history)
  const clearedMarks = useMemo(() => {
    const current = new Set(allClashIds);
    return Object.entries(ledger)
      .filter(([id]) => !current.has(id))
      .sort((a, b) => (b[1].checkedAt || 0) - (a[1].checkedAt || 0));
  }, [ledger, allClashIds]);

  const applyMark = useCallback((ids, status, withNote = false) => {
    if (!ids || ids.length === 0) return;
    let note;
    if (withNote) {
      const existing = ledger[ids[0]] && ledger[ids[0]].note;
      note = askForNote(existing);
    }
    setLedger(prev => setMarks(prev, ids, status, note));
  }, [ledger]);

  const unmark = useCallback((ids) => {
    if (!ids || ids.length === 0) return;
    setLedger(prev => clearMarks(prev, ids));
  }, []);

  const handleClearHistory = useCallback(() => {
    const ids = clearedMarks.map(([id]) => id);
    if (ids.length === 0) return;
    setLedger(prev => clearMarks(prev, ids));
  }, [clearedMarks]);

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
        now.clash = clashRow;
        // Review mark: null = unchecked, 'checked' = pending fix, 'intentional' = combined
        now.clashMark = clashRow ? (ledger[clashRow.id] || null) : null;
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
              <div className="filter-group" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <span className="badge badge-success" style={{ fontSize: '1rem', padding: '0.5rem 1rem' }}>
                  Total Load: {totalClasses} classes/week
                </span>
                {teacherSummary.unchecked > 0 && (
                  <span className="badge" style={{ background: '#dc2626', color: '#fff', fontSize: '0.9rem', padding: '0.5rem 1rem', borderRadius: '12px', fontWeight: 700 }} title="Clashes of this teacher you have not checked yet">
                    {teacherSummary.unchecked} unchecked
                  </span>
                )}
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
                      const markStatus = slot && slot.clashMark ? slot.clashMark.status : null;
                      const isUncheckedCell = !!(slot && slot.clash && !markStatus);
                      const isCheckedCell = !!(slot && slot.clash && markStatus === CHECKED);
                      const isIntentionalCell = !!(slot && slot.clash && markStatus === INTENTIONAL);
                      const cellTitle = slot
                        ? isUncheckedCell
                          ? `UNCHECKED clash — ${slot.clash.teacher} is allotted to ${slot.clash.classIds.map(c => c.toUpperCase()).join(', ')} on ${day} Period ${p} (not reviewed yet)`
                          : isCheckedCell
                            ? `Checked, pending fix — ${slot.clash.classIds.map(c => c.toUpperCase()).join(', ')}${slot.clashMark.note ? ` — note: ${slot.clashMark.note}` : ''}`
                            : isIntentionalCell
                              ? `Intentional combined period (reviewed): ${slot.classIds.map(c => c.toUpperCase()).join(' + ')}`
                              : slot.combined
                                ? `Combined class: ${slot.classIds.map(c => c.toUpperCase()).join(' + ')}`
                                : undefined
                        : undefined;
                      return (
                        <div
                          key={`${day}-p${p}`}
                          className={`grid-cell${isUncheckedCell ? ' collision-warning' : isCheckedCell ? ' checked-warning' : ''}`}
                          style={slot ? { backgroundColor: isUncheckedCell ? '#fef2f2' : isCheckedCell ? '#fffbeb' : 'rgba(79, 70, 229, 0.05)' } : {}}
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
                                  background: isUncheckedCell ? '#dc2626' : isCheckedCell ? '#d97706' : '#16a34a',
                                  color: '#fff',
                                  letterSpacing: '0.03em'
                                }}>
                                  {isUncheckedCell ? '⚠ UNCHECKED' : isCheckedCell ? '✓ Checked' : '✓ Intentional'}
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
                ⚠️ Clash Report — {selectedTeacher.toUpperCase()} ({teacherSummary.unchecked} unchecked • {teacherSummary.checked} checked • {teacherSummary.intentional} intentional)
              </h3>
              {/* Check-memory progress bar */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap', fontSize: '0.82rem', color: '#334155', marginBottom: '0.5rem' }}>
                <span style={{ fontWeight: 700 }}>Reviewed {teacherSummary.reviewed}/{teacherSummary.total}</span>
                <div style={{ flex: '1 1 180px', height: '10px', background: '#e5e7eb', borderRadius: '5px', overflow: 'hidden', display: 'flex', minWidth: '140px' }}>
                  <div style={{ width: `${(teacherSummary.intentional / teacherSummary.total) * 100}%`, background: '#16a34a' }} />
                  <div style={{ width: `${(teacherSummary.checked / teacherSummary.total) * 100}%`, background: '#f59e0b' }} />
                  <div style={{ width: `${(teacherSummary.unchecked / teacherSummary.total) * 100}%`, background: '#ef4444' }} />
                </div>
                {teacherSummary.newCount > 0 && (
                  <span style={{ background: '#dc2626', color: '#fff', borderRadius: '10px', padding: '1px 8px', fontSize: '0.7rem', fontWeight: 800 }}>
                    {teacherSummary.newCount} NEW since last visit
                  </span>
                )}
                <span style={{ color: '#64748b', fontSize: '0.76rem' }}>Last visit: {formatTimestamp(lastVisit)}</span>
              </div>
              <p style={{ fontSize: '0.8rem', color: '#6b7280', margin: '0 0 0.75rem 0' }}>
                Every period where this teacher is allotted to 2+ classes. Mark each one so you remember next day:
                <strong> ✓ Checked</strong> = real, fix later · <strong>Intentional</strong> = combined class.
                Unchecked clashes stay red until reviewed.
              </p>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                <thead>
                  <tr style={{ background: '#fee2e2' }}>
                    <th style={{ padding: '6px 10px', textAlign: 'left', borderBottom: '2px solid #fca5a5' }}>Day</th>
                    <th style={{ padding: '6px 10px', textAlign: 'center', borderBottom: '2px solid #fca5a5' }}>Period</th>
                    <th style={{ padding: '6px 10px', textAlign: 'left', borderBottom: '2px solid #fca5a5' }}>Classes Allotted (Subject)</th>
                    <th style={{ padding: '6px 10px', textAlign: 'center', borderBottom: '2px solid #fca5a5' }}>Status</th>
                    <th style={{ padding: '6px 10px', textAlign: 'left', borderBottom: '2px solid #fca5a5' }}>Note</th>
                    <th style={{ padding: '6px 10px', textAlign: 'center', borderBottom: '2px solid #fca5a5' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {teacherClashes.map((c, i) => {
                    const mark = ledger[c.id] || null;
                    const state = !mark ? 'unchecked' : mark.status === CHECKED ? 'checked' : 'intentional';
                    return (
                      <tr key={c.id} style={{ background: state === 'intentional' ? '#f0fdf4' : state === 'checked' ? '#fffbeb' : i % 2 === 0 ? '#fff' : '#fef2f2' }}>
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
                        <td style={{ padding: '6px 10px', textAlign: 'center', borderBottom: '1px solid #fecaca', fontWeight: 700, fontSize: '0.8rem' }}>
                          <span style={{ color: state === 'unchecked' ? '#dc2626' : state === 'checked' ? '#b45309' : '#166534' }}>
                            {state === 'unchecked' ? '⚠ UNCHECKED' : state === 'checked' ? '✓ Checked · to fix' : '✓ Intentional'}
                          </span>
                        </td>
                        <td style={{ padding: '6px 10px', borderBottom: '1px solid #fecaca', fontSize: '0.78rem', fontStyle: 'italic', color: '#475569' }}>
                          {mark && mark.note ? mark.note : '—'}
                        </td>
                        <td style={{ padding: '6px 10px', textAlign: 'center', borderBottom: '1px solid #fecaca', whiteSpace: 'nowrap' }}>
                          {state === 'unchecked' && (
                            <button
                              onClick={() => applyMark([c.id], CHECKED, true)}
                              style={{ background: '#d97706', color: 'white', border: 'none', borderRadius: '4px', padding: '4px 10px', fontWeight: 600, cursor: 'pointer', fontSize: '0.78rem', marginRight: '4px' }}
                              title="Mark as reviewed: a real clash you will fix later (optional note)"
                            >✓ Checked</button>
                          )}
                          {state === 'checked' && (
                            <button
                              onClick={() => unmark([c.id])}
                              style={{ background: '#6b7280', color: 'white', border: 'none', borderRadius: '4px', padding: '4px 10px', fontWeight: 600, cursor: 'pointer', fontSize: '0.78rem', marginRight: '4px' }}
                              title="Undo the check mark — back to unchecked"
                            >Undo</button>
                          )}
                          {state === 'intentional' ? (
                            <button
                              onClick={() => unmark([c.id])}
                              style={{ background: '#16a34a', color: 'white', border: 'none', borderRadius: '4px', padding: '4px 10px', fontWeight: 600, cursor: 'pointer', fontSize: '0.78rem' }}
                              title="Marked as intentional combined class — click to unmark"
                            >✓ Intentional — Unmark</button>
                          ) : (
                            <button
                              onClick={() => applyMark([c.id], INTENTIONAL, false)}
                              style={{ background: '#16a34a', color: 'white', border: 'none', borderRadius: '4px', padding: '4px 10px', fontWeight: 600, cursor: 'pointer', fontSize: '0.78rem' }}
                              title="Mark as intentional combined class (reviewed — not a real clash)"
                            >Intentional</button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Cleared history — clashes you marked that no longer exist (fixed) */}
          {selectedTeacher && clearedMarks.length > 0 && (
            <div className="no-print" style={{ marginTop: '0.75rem', padding: '0.75rem 1rem', borderRadius: '0.5rem', border: '1px solid #bbf7d0', background: '#f0fdf4', fontSize: '0.8rem', color: '#166534' }}>
              <strong>✓ Already cleared ({clearedMarks.length}):</strong>{' '}
              {clearedMarks.slice(0, 5).map(([id, m]) => id.split('|').slice(0, 3).join(' ') + (m.note ? ` “${m.note}”` : '')).join(' · ')}
              {clearedMarks.length > 5 ? ` … +${clearedMarks.length - 5} more` : ''}
              <button
                onClick={handleClearHistory}
                style={{ marginLeft: '8px', background: 'none', border: '1px solid #86efac', color: '#15803d', borderRadius: '4px', padding: '2px 8px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600 }}
                title="Remove these finished entries from memory"
              >Clear list</button>
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
