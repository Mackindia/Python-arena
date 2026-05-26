import React, { useState, useEffect } from 'react';
import { useTimetable } from '../context/TimetableContext';
import { AlertTriangle, CheckCircle2, Zap, Search, Wrench } from 'lucide-react';
import { autoAssignTeacher } from '../services/allocationEngine';
import { autoArrangeClass, detectClashes, resolveClashes, resolveSingleClash, resolveClashDeep } from '../services/autoArrangeEngine';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const PERIODS = [1, 2, 3, 4, 5, 6, 7, 8];

const ClassTimetable = () => {
  const { timetables, classes, updateSlot, checkTeacherCollision, loadMaster, teachers, teacherSubjectMap, getAllowedSubjectsForClass } = useTimetable();
  const [selectedClass, setSelectedClass] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [adminOverride, setAdminOverride] = useState(false);
  const [notification, setNotification] = useState(null);
  const [clashReport, setClashReport] = useState(null);
  const [resolveLog, setResolveLog] = useState(null);

  const getLogDetails = (msg) => {
    let type = 'info';
    let title = 'Adjustment';
    let color = '#3b82f6';
    let bg = '#eff6ff';
    let border = '#bfdbfe';
    let icon = '🔄';

    if (msg.startsWith('🔄')) {
      type = 'internal';
      title = 'Internal Swap';
      color = '#0284c7';
      bg = '#f0f9ff';
      border = '#bae6fd';
      icon = '🔄';
    } else if (msg.startsWith('🔧')) {
      type = 'deep';
      title = 'Deep Resolve (Cross-Class)';
      color = '#7c3aed';
      bg = '#faf5ff';
      border = '#e9d5ff';
      icon = '🔧';
    } else if (msg.startsWith('✅')) {
      type = 'resolved';
      title = 'Pre-Resolved';
      color = '#16a34a';
      bg = '#f0fdf4';
      border = '#bbf7d0';
      icon = '✅';
    } else if (msg.startsWith('❌')) {
      type = 'unresolved';
      title = 'Unresolved Clash';
      color = '#dc2626';
      bg = '#fef2f2';
      border = '#fecaca';
      icon = '❌';
    }

    let cleanText = msg.replace(/^[🔄🔧✅❌]\s*/, '');
    return { type, title, color, bg, border, icon, text: cleanText };
  };

  const formatLogText = (text) => {
    const regex = /(\b[A-Za-z]+ \d\b|\bP\d\b|\b(?:Mon|Tue|Wed|Thu|Fri|Sat)(?:day)?\b|\b[1-9]+[A-B]\b|\([A-Za-z\s-]+\)|\b[A-Z]{2,3}\b)/g;
    const parts = text.split(regex);
    
    return parts.map((part, index) => {
      const isPeriod = /^[A-Za-z]+ \d$|^P\d$/.test(part);
      const isDay = /^(?:Mon|Tue|Wed|Thu|Fri|Sat)(?:day)?$/.test(part);
      const isClass = /^[1-9]+[A-B]$/.test(part);
      const isSubject = /^\([A-Za-z\s-]+\)$/.test(part);
      const isTeacher = /^[A-Z]{2,3}$/.test(part);

      if (isPeriod) {
        return <strong key={index} style={{ color: '#0f766e', fontWeight: 600 }}>{part}</strong>;
      }
      if (isDay) {
        return <strong key={index} style={{ color: '#b45309', fontWeight: 600 }}>{part}</strong>;
      }
      if (isClass) {
        return <span key={index} style={{ background: '#e0f2fe', color: '#0369a1', padding: '2px 6px', borderRadius: '4px', fontWeight: 700, fontSize: '0.8rem', margin: '0 2px' }}>{part}</span>;
      }
      if (isSubject) {
        return <span key={index} style={{ color: '#4f46e5', fontStyle: 'italic', fontWeight: 500 }}>{part}</span>;
      }
      if (isTeacher) {
        return <span key={index} style={{ background: '#fef08a', color: '#854d0e', padding: '1px 5px', borderRadius: '3px', fontWeight: 700, fontSize: '0.8rem', border: '1px solid #fef08a', margin: '0 2px' }}>{part}</span>;
      }
      return part;
    });
  };

  // Sync selectedClass if the current one is deleted or on load
  useEffect(() => {
    if (classes.length > 0) {
      if (!selectedClass || !classes.includes(selectedClass)) {
        setSelectedClass(classes[0]);
      }
    } else {
      setSelectedClass('');
    }
  }, [classes, selectedClass]);

  const [printAllClasses, setPrintAllClasses] = useState(false);

  useEffect(() => {
    if (printAllClasses) {
      // Small timeout to allow DOM to render all tables before printing
      const timer = setTimeout(() => {
        window.print();
        setPrintAllClasses(false);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [printAllClasses]);

  const handlePrintCurrent = () => {
    window.print();
  };

  const handlePrintAll = () => {
    setPrintAllClasses(true);
  };

  const handleSlotUpdate = (day, period, field, value, currentSubject, currentTeacher) => {
    let subject = currentSubject || '';
    let teacher = currentTeacher || '';
    let assignedTeachers = null;
    let clashes = [];

    if (field === 'subject') {
      subject = value;
      teacher = ''; // RULE: Clear previous assignment before recalculation
      // Auto-assign teacher using centralized engine
      if (value && teacherSubjectMap) {
        const assignment = autoAssignTeacher(value, selectedClass, day, period, teacherSubjectMap, timetables);
        
        if (assignment.status !== 'empty') {
          teacher = assignment.teacher;
          assignedTeachers = assignment.assignedTeachers || [];
          clashes = assignment.clashes || [];
          
          if (assignment.status === 'success') {
            setNotification({ type: 'success', message: assignment.message });
          } else if (assignment.status === 'partial_conflict') {
            setNotification({ type: 'warning', message: assignment.message });
          } else if (assignment.status === 'full_conflict') {
            setNotification({ type: 'error', message: assignment.message });
          }
        }
      }
    }
    if (field === 'teacher') teacher = value;

    // Check collision if updating teacher
    if (field === 'teacher' && value) {
      const collisionClass = checkTeacherCollision(value, day, period, selectedClass);
      if (collisionClass) {
        setNotification({
          type: 'error',
          message: `Collision Detected! Teacher ${value} is already assigned to class ${collisionClass.toUpperCase()} on ${day} Period ${period}.`
        });
        // Still update, but show warning (or we could prevent it)
      } else {
        setNotification({
          type: 'success',
          message: `Slot updated successfully.`
        });
      }
    }

    updateSlot(selectedClass, day, period, subject, teacher, assignedTeachers, clashes);
    
    // Clear notification after 3s
    setTimeout(() => setNotification(null), 3000);
  };

  // =============================================
  // AUTO ARRANGE: Fill entire class from scratch
  // =============================================
  const handleAutoArrange = () => {
    if (!selectedClass) return;
    if (!confirm(`This will REPLACE the entire timetable for ${selectedClass.toUpperCase()} using Load Master subjects and Teacher Mapping. Continue?`)) return;

    const result = autoArrangeClass(selectedClass, loadMaster, teacherSubjectMap, timetables);
    if (result.error) {
      setNotification({ type: 'error', message: result.error });
      return;
    }

    // Write each slot
    result.schedule.forEach(slot => {
      updateSlot(selectedClass, slot.day, slot.period, slot.subject, slot.teacher, slot.assignedTeachers, []);
    });

    const clashes = result.schedule.filter(s => s.clash);
    if (clashes.length > 0) {
      setNotification({ type: 'warning', message: `Auto-arranged ${result.schedule.length} slots. ${clashes.length} clashes detected — use Resolve Clashes to fix them.` });
    } else {
      setNotification({ type: 'success', message: `Successfully auto-arranged ${result.schedule.length} slots with zero clashes!` });
    }
    setClashReport(null);
    setResolveLog(null);
    setTimeout(() => setNotification(null), 5000);
  };

  // =============================================
  // DETECT CLASHES
  // =============================================
  const handleDetectClashes = () => {
    if (!selectedClass) return;
    const clashes = detectClashes(selectedClass, timetables);
    setClashReport(clashes);
    if (clashes.length === 0) {
      setNotification({ type: 'success', message: `No clashes found in ${selectedClass.toUpperCase()}!` });
    } else {
      setNotification({ type: 'error', message: `Found ${clashes.length} clashes in ${selectedClass.toUpperCase()}.` });
    }
    setTimeout(() => setNotification(null), 5000);
  };

  // =============================================
  // RESOLVE CLASHES (bulk resolve including deep swaps)
  // =============================================
  const handleResolveClashes = () => {
    if (!selectedClass) return;
    const result = resolveClashes(selectedClass, timetables);

    result.updates.forEach(u => {
      updateSlot(u.classId, u.day, u.period, u.subject, u.teacher, u.assignedTeachers, []);
    });

    setResolveLog(result.log);
    setClashReport(null);

    if (result.unresolved === 0 && result.totalClashes > 0) {
      setNotification({ type: 'success', message: `All ${result.totalClashes} clashes resolved!` });
    } else if (result.unresolved > 0) {
      setNotification({ type: 'warning', message: `Resolved ${result.resolved}/${result.totalClashes} clashes. ${result.unresolved} remain unresolvable.` });
    } else {
      setNotification({ type: 'success', message: `No clashes to resolve in ${selectedClass.toUpperCase()}.` });
    }
    setTimeout(() => setNotification(null), 5000);
  };

  // =============================================
  // RESOLVE A SINGLE CLASH (per-row button, supports deep swap)
  // =============================================
  const handleResolveSingle = (day, period, deep = false) => {
    if (!selectedClass) return;
    const result = resolveClashDeep(selectedClass, day, period, timetables, deep);

    if (result.success) {
      result.updates.forEach(u => {
        updateSlot(u.classId, u.day, u.period, u.subject, u.teacher, u.assignedTeachers, []);
      });
      setNotification({ type: 'success', message: result.message });
      setResolveLog(prev => prev ? [...prev, result.message] : [result.message]);
      
      // Re-detect clashes to refresh the report
      setTimeout(() => {
        // Deep copy the timetables and apply the updates locally to run detectClashes
        const updatedTT = JSON.parse(JSON.stringify(timetables));
        result.updates.forEach(u => {
          if (!updatedTT[u.classId]) updatedTT[u.classId] = [];
          const classSchedule = updatedTT[u.classId];
          const slotIdx = classSchedule.findIndex(s => s.day === u.day && parseInt(s.period) === parseInt(u.period));
          if (slotIdx >= 0) {
            classSchedule[slotIdx] = {
              ...classSchedule[slotIdx],
              subject: u.subject,
              teacher: u.teacher,
              assignedTeachers: u.assignedTeachers
            };
          } else {
            classSchedule.push({
              day: u.day,
              period: u.period,
              subject: u.subject,
              teacher: u.teacher,
              assignedTeachers: u.assignedTeachers
            });
          }
        });
        setClashReport(detectClashes(selectedClass, updatedTT));
      }, 150);
    } else {
      setNotification({ type: 'error', message: result.message });
    }
    setTimeout(() => setNotification(null), 5000);
  };

  // Dismiss a clash (keep it as intentional combined class)
  const handleDismissClash = (slotKey) => {
    setClashReport(prev => prev ? prev.filter(c => c.slotKey !== slotKey) : []);
  };

  const renderTimetableGrid = (targetClass) => (
    <div key={targetClass} className="timetable-wrapper" style={{ marginBottom: '3rem', pageBreakAfter: 'always' }}>
      <h2 className="print-only-title" style={{ display: 'none', textAlign: 'center', marginBottom: '1rem', color: '#0f172a', fontSize: '1.5rem', fontWeight: 'bold' }}>
        Doon Scholars - Class {targetClass.toUpperCase()} Timetable
      </h2>
      <div className="timetable-grid">
        {/* Header Row */}
        <div className="grid-cell grid-header">Day</div>
        {PERIODS.map(p => (
          <div key={`p${p}`} className="grid-cell grid-header">Period {p}</div>
        ))}

        {/* Data Rows */}
        {DAYS.map(day => (
          <React.Fragment key={day}>
            <div className="grid-cell day-header">{day}</div>
            {PERIODS.map(p => {
              const slot = timetables[targetClass]?.find(s => s.day === day && parseInt(s.period) === p);
              const isCollision = slot?.teacher && checkTeacherCollision(slot.teacher, day, p, targetClass);
              
              return (
                <div 
                  key={`${day}-p${p}`} 
                  className={`grid-cell ${isCollision ? 'collision-warning' : ''}`}
                  title={isCollision ? `Clash Detected: ${slot.teacher} is also teaching Class ${isCollision.toUpperCase()} in Period ${p}` : ''}
                >
                  {editMode && targetClass === selectedClass ? (
                    <div className="edit-slot no-print">
                      <select 
                        value={slot?.subject || ''} 
                        onChange={(e) => handleSlotUpdate(day, p, 'subject', e.target.value, slot?.subject, slot?.teacher)}
                        style={{ fontSize: '0.8rem', padding: '2px', width: '100%', background: '#fff', border: '1px solid #ccc', borderRadius: '2px' }}
                      >
                        <option value="">- Subject -</option>
                        {targetClass && getAllowedSubjectsForClass(targetClass).map(sub => (
                          <option key={sub} value={sub}>{sub}</option>
                        ))}
                      </select>
                      {adminOverride && (
                        <input 
                          type="text"
                          list="class-teacher-list"
                          value={slot?.teacher || ''} 
                          onChange={(e) => handleSlotUpdate(day, p, 'teacher', e.target.value, slot?.subject, slot?.teacher)}
                          style={{ fontSize: '0.8rem', padding: '2px', width: '100%' }}
                          placeholder="- Teacher Override -"
                        />
                      )}
                    </div>
                  ) : (
                    <>
                      {slot?.subject ? (
                        <>
                          <div className="slot-subject font-bold">{slot.subject}</div>
                          <div className="slot-teacher">
                            {slot.assignedTeachers && slot.assignedTeachers.length > 0 
                              ? slot.assignedTeachers.map((at, idx) => {
                                  if (typeof at === 'string') return <span key={idx}>{at}{idx < slot.assignedTeachers.length - 1 ? ', ' : ''}</span>;
                                  return (
                                    <span key={idx} style={{ color: at.clash ? '#ef4444' : 'inherit' }} title={at.clashWith ? `Clash: ${at.clashWith}` : ''}>
                                      {at.teacher}{at.clash ? ` ⚠ (${at.clashWith})` : ''}{idx < slot.assignedTeachers.length - 1 ? ', ' : ''}
                                    </span>
                                  );
                                })
                              : (slot.teacher ? slot.teacher : 'No Teacher')}
                          </div>
                        </>
                      ) : (
                        <div className="slot-teacher" style={{opacity: 0.3}}>-</div>
                      )}
                    </>
                  )}
                </div>
              );
            })}
          </React.Fragment>
        ))}
      </div>
    </div>
  );

  return (
    <div>
      <div className="page-header no-print">
        <h1 className="page-title">Class Timetables</h1>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button
            className="btn"
            onClick={handleAutoArrange}
            disabled={!selectedClass}
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: '#7c3aed', color: 'white', border: 'none', borderRadius: '4px', padding: '0.5rem 1rem', fontWeight: 600, cursor: 'pointer' }}
            title="Auto-fill this class's timetable from Load Master & Teacher Mapping"
          >
            <Zap size={16} /> Auto Arrange
          </button>
          <button
            className="btn"
            onClick={handleDetectClashes}
            disabled={!selectedClass}
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: '#ea580c', color: 'white', border: 'none', borderRadius: '4px', padding: '0.5rem 1rem', fontWeight: 600, cursor: 'pointer' }}
            title="Scan for teacher clashes in the selected class"
          >
            <Search size={16} /> Detect Clashes
          </button>
          <button
            className="btn"
            onClick={handleResolveClashes}
            disabled={!selectedClass}
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: '#0d9488', color: 'white', border: 'none', borderRadius: '4px', padding: '0.5rem 1rem', fontWeight: 600, cursor: 'pointer' }}
            title="Auto-resolve clashes by swapping periods within this class only"
          >
            <Wrench size={16} /> Resolve Clashes
          </button>
          <button className="btn btn-outline" onClick={handlePrintCurrent} title="Print or Download PDF for this class">
            🖨️ Print Class
          </button>
          <button className="btn btn-outline" onClick={handlePrintAll} title="Print or Download PDF for ALL classes">
            🖨️ Print All
          </button>
          <button 
            className={adminOverride ? "btn btn-primary" : "btn"}
            onClick={() => setAdminOverride(!adminOverride)}
            title="Enable manual teacher selection"
          >
            {adminOverride ? 'Disable Override' : 'Admin Override'}
          </button>
          <button 
            className={editMode ? "btn" : "btn btn-primary"}
            onClick={() => setEditMode(!editMode)}
            disabled={!selectedClass}
          >
            {editMode ? 'Done Editing' : 'Edit Timetable'}
          </button>
        </div>
      </div>

      {notification && (
        <div className="no-print" style={{
          padding: '1rem', 
          marginBottom: '1rem', 
          borderRadius: '0.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          backgroundColor: notification.type === 'error' ? '#fef2f2' : '#ecfdf5',
          border: `1px solid ${notification.type === 'error' ? '#ef4444' : '#10b981'}`,
          color: notification.type === 'error' ? '#991b1b' : '#065f46'
        }}>
          {notification.type === 'error' ? <AlertTriangle size={20} /> : <CheckCircle2 size={20} />}
          {notification.message}
        </div>
      )}

      <div className="filter-bar no-print">
        <div className="filter-group">
          <label>Select Class:</label>
          <select 
            value={selectedClass} 
            onChange={(e) => {
              setSelectedClass(e.target.value);
              setResolveLog(null);
              setClashReport(null);
            }}
            style={{ width: '150px' }}
            disabled={classes.length === 0}
          >
            {classes.length === 0 ? (
              <option value="">No classes</option>
            ) : (
              classes.map(cls => (
                <option key={cls} value={cls}>{cls.toUpperCase()}</option>
              ))
            )}
          </select>
        </div>
      </div>


      <datalist id="class-teacher-list">
        {teachers.map(t => <option key={t} value={t} />)}
      </datalist>

      {/* Clash Report Panel */}
      {clashReport && clashReport.length > 0 && (
        <div className="no-print" style={{ marginBottom: '1rem', padding: '1rem', borderRadius: '0.5rem', border: '1px solid #fca5a5', background: '#fef2f2' }}>
          <h3 style={{ margin: '0 0 0.75rem 0', color: '#991b1b', fontSize: '1rem', fontWeight: 700 }}>⚠️ Clash Report — {selectedClass.toUpperCase()} ({clashReport.length} clashes)</h3>
          <p style={{ fontSize: '0.8rem', color: '#6b7280', margin: '0 0 0.75rem 0' }}>
            Use <strong>Resolve</strong> to auto-fix a clash by swapping within the class. Use <strong>Keep</strong> if it's an intentional combined class.
          </p>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
            <thead><tr style={{ background: '#fee2e2' }}>
              <th style={{ padding: '6px 10px', textAlign: 'left', borderBottom: '2px solid #fca5a5' }}>Day</th>
              <th style={{ padding: '6px 10px', textAlign: 'center', borderBottom: '2px solid #fca5a5' }}>Period</th>
              <th style={{ padding: '6px 10px', textAlign: 'left', borderBottom: '2px solid #fca5a5' }}>Subject</th>
              <th style={{ padding: '6px 10px', textAlign: 'center', borderBottom: '2px solid #fca5a5' }}>Teachers</th>
              <th style={{ padding: '6px 10px', textAlign: 'left', borderBottom: '2px solid #fca5a5' }}>Clashes With</th>
              <th style={{ padding: '6px 10px', textAlign: 'center', borderBottom: '2px solid #fca5a5' }}>Action</th>
            </tr></thead>
            <tbody>{clashReport.map((c, i) => (
              <tr key={i} style={{ background: i % 2 === 0 ? '#fff' : '#fef2f2' }}>
                <td style={{ padding: '6px 10px', borderBottom: '1px solid #fecaca' }}>{c.day}</td>
                <td style={{ padding: '6px 10px', textAlign: 'center', borderBottom: '1px solid #fecaca', fontWeight: 700 }}>{c.period}</td>
                <td style={{ padding: '6px 10px', borderBottom: '1px solid #fecaca' }}>
                  {c.subject}
                  {c.isComposite && <span style={{ marginLeft: '6px', fontSize: '0.7rem', background: '#dbeafe', color: '#1e40af', padding: '1px 6px', borderRadius: '4px' }}>Combined</span>}
                </td>
                <td style={{ padding: '6px 10px', textAlign: 'center', borderBottom: '1px solid #fecaca' }}>
                  {c.allTeachers ? c.allTeachers.map((t, ti) => (
                    <span key={ti} style={{ fontWeight: 700, color: t.toUpperCase() === c.teacher ? '#dc2626' : '#166534' }}>
                      {t}{ti < c.allTeachers.length - 1 ? ', ' : ''}
                    </span>
                  )) : <span style={{ fontWeight: 700, color: '#dc2626' }}>{c.teacher}</span>}
                </td>
                <td style={{ padding: '6px 10px', borderBottom: '1px solid #fecaca' }}>{c.clashClass.toUpperCase()}</td>
                <td style={{ padding: '6px 10px', borderBottom: '1px solid #fecaca', textAlign: 'center', whiteSpace: 'nowrap' }}>
                  <button
                    onClick={() => handleResolveSingle(c.day, c.period, false)}
                    style={{ background: '#0d9488', color: 'white', border: 'none', borderRadius: '4px', padding: '4px 10px', fontWeight: 600, cursor: 'pointer', fontSize: '0.8rem', marginRight: '4px' }}
                    title="Auto-resolve this specific clash by swapping within the class"
                  >Resolve</button>
                  <button
                    onClick={() => handleResolveSingle(c.day, c.period, true)}
                    style={{ background: '#7c3aed', color: 'white', border: 'none', borderRadius: '4px', padding: '4px 10px', fontWeight: 600, cursor: 'pointer', fontSize: '0.8rem', marginRight: '4px' }}
                    title="Try Deep Resolve: Fixes the clash by swapping in other classes if internal swap fails"
                  >Deep Resolve</button>
                  <button
                    onClick={() => handleDismissClash(c.slotKey)}
                    style={{ background: '#6b7280', color: 'white', border: 'none', borderRadius: '4px', padding: '4px 10px', fontWeight: 600, cursor: 'pointer', fontSize: '0.8rem' }}
                    title="Keep this clash — it's an intentional combined class"
                  >Keep</button>
                </td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}

      {/* Resolve Log Panel */}
      {resolveLog && resolveLog.length > 0 && (
        <div className="no-print" style={{ 
          marginBottom: '1.5rem', 
          padding: '1.25rem', 
          borderRadius: '0.75rem', 
          border: '1px solid #e2e8f0', 
          background: 'linear-gradient(to bottom, #ffffff, #f8fafc)', 
          boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05), 0 2px 4px -2px rgb(0 0 0 / 0.05)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.75rem' }}>
            <h3 style={{ margin: 0, color: '#1e293b', fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '28px', height: '28px', borderRadius: '50%', background: '#f1f5f9', color: '#0f766e' }}>🔧</span>
              Resolution & Adjustment Log
            </h3>
            <button 
              onClick={() => setResolveLog(null)}
              style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 500 }}
              title="Clear all resolution entries"
            >
              Clear Log
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {resolveLog.map((msg, i) => {
              const details = getLogDetails(msg);
              return (
                <div key={i} style={{ 
                  display: 'flex', 
                  alignItems: 'flex-start', 
                  gap: '0.75rem', 
                  padding: '0.75rem 1rem', 
                  borderRadius: '0.5rem', 
                  border: `1px solid ${details.border}`, 
                  background: details.bg,
                  fontSize: '0.875rem',
                  lineHeight: '1.5',
                  boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.02)'
                }}>
                  <span style={{ fontSize: '1.1rem', lineHeight: '1', marginTop: '2px' }}>{details.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                      <span style={{ fontWeight: 700, color: details.color, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        {details.title}
                      </span>
                    </div>
                    <div style={{ color: '#334155' }}>
                      {formatLogText(details.text)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="card printable-area">
        {classes.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
            No classes available. Please add classes in the Class & Section Manager first.
          </div>
        ) : (
          printAllClasses ? classes.map(cls => renderTimetableGrid(cls)) : renderTimetableGrid(selectedClass)
        )}
      </div>
    </div>
  );
};

export default ClassTimetable;
