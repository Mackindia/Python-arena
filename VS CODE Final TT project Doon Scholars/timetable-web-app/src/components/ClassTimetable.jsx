import React, { useState, useEffect } from 'react';
import { useTimetable } from '../context/TimetableContext';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';
import { autoAssignTeacher } from '../services/allocationEngine';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const PERIODS = [1, 2, 3, 4, 5, 6, 7, 8];

const ClassTimetable = () => {
  const { timetables, classes, updateSlot, checkTeacherCollision, loadMaster, teachers, teacherSubjectMap, getAllowedSubjectsForClass } = useTimetable();
  const [selectedClass, setSelectedClass] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [adminOverride, setAdminOverride] = useState(false);
  const [notification, setNotification] = useState(null);

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
        <div style={{ display: 'flex', gap: '10px' }}>
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
            onChange={(e) => setSelectedClass(e.target.value)}
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
