import React, { useState, useEffect } from 'react';
import { useTimetable } from '../context/TimetableContext';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';
import { autoAssignTeacher } from '../services/allocationEngine';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const PERIODS = [1, 2, 3, 4, 5, 6, 7, 8];

const ClassTimetable = () => {
  const { timetables, classes, updateSlot, checkTeacherCollision, loadMaster, teachers, teacherSubjectMap } = useTimetable();
  const [selectedClass, setSelectedClass] = useState('');
  const [editMode, setEditMode] = useState(false);
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

  const handleSlotUpdate = (day, period, field, value, currentSubject, currentTeacher) => {
    let subject = currentSubject || '';
    let teacher = currentTeacher || '';

    if (field === 'subject') {
      subject = value;
      // Auto-assign teacher using centralized engine
      if (value && teacherSubjectMap) {
        const assignment = autoAssignTeacher(value, selectedClass, day, period, teacherSubjectMap, timetables);
        
        if (assignment.status !== 'empty') {
          teacher = assignment.teacher;
          
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

    updateSlot(selectedClass, day, period, subject, teacher);
    
    // Clear notification after 3s
    setTimeout(() => setNotification(null), 3000);
  };

  // Get subjects for this class from load master
  const classSubjects = loadMaster
    .filter(l => l.class_id === selectedClass)
    .map(l => l.subject);
    
  const uniqueSubjects = [...new Set([...classSubjects, 'Library', 'Games', 'Music', 'Dance', 'Art'])];

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Class Timetables</h1>
        <button 
          className={editMode ? "btn" : "btn btn-primary"}
          onClick={() => setEditMode(!editMode)}
          disabled={!selectedClass}
        >
          {editMode ? 'Done Editing' : 'Edit Timetable'}
        </button>
      </div>

      {notification && (
        <div style={{
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

      <div className="filter-bar">
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

      <datalist id="class-subject-list">
        {uniqueSubjects.map(sub => <option key={sub} value={sub} />)}
      </datalist>
      <datalist id="class-teacher-list">
        {teachers.map(t => <option key={t} value={t} />)}
      </datalist>

      <div className="card">
        {classes.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
            No classes available. Please add classes in the Class & Section Manager first.
          </div>
        ) : (
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
                  const slot = timetables[selectedClass]?.find(s => s.day === day && parseInt(s.period) === p);
                  const isCollision = slot?.teacher && checkTeacherCollision(slot.teacher, day, p, selectedClass);
                  
                  return (
                    <div 
                      key={`${day}-p${p}`} 
                      className={`grid-cell ${isCollision ? 'collision-warning' : ''}`}
                      title={isCollision ? `Clash Detected: ${slot.teacher} is also teaching Class ${isCollision.toUpperCase()} in Period ${p}` : ''}
                    >
                      {editMode ? (
                        <div className="edit-slot">
                          <input 
                            type="text"
                            list="class-subject-list"
                            value={slot?.subject || ''} 
                            onChange={(e) => handleSlotUpdate(day, p, 'subject', e.target.value, slot?.subject, slot?.teacher)}
                            style={{ fontSize: '0.8rem', padding: '2px', width: '100%' }}
                            placeholder="- Subject -"
                          />
                          <input 
                            type="text"
                            list="class-teacher-list"
                            value={slot?.teacher || ''} 
                            onChange={(e) => handleSlotUpdate(day, p, 'teacher', e.target.value, slot?.subject, slot?.teacher)}
                            style={{ fontSize: '0.8rem', padding: '2px', width: '100%' }}
                            placeholder="- Teacher -"
                          />
                        </div>
                      ) : (
                        <>
                          {slot?.subject ? (
                            <>
                              <div className="slot-subject">{slot.subject}</div>
                              <div className="slot-teacher">{slot.teacher}</div>
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
        )}
      </div>
    </div>
  );
};

export default ClassTimetable;
