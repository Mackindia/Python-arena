import React, { useState } from 'react';
import { useTimetable } from '../context/TimetableContext';
import { useNavigate } from 'react-router-dom';
import { Plus, AlertTriangle, CheckCircle2 } from 'lucide-react';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const PERIODS = [1, 2, 3, 4, 5, 6, 7, 8];

const Mastersheet = () => {
  const { timetables, classes, checkTeacherCollision, updateSlot, teachers, loadMaster } = useTimetable();
  const [selectedDay, setSelectedDay] = useState('Mon');
  const [editMode, setEditMode] = useState(false);
  const [notification, setNotification] = useState(null);
  const navigate = useNavigate();

  // Sort classes logically (1a, 1b, 2a... 10a, 11a, 11b)
  const sortedClasses = [...classes].sort((a, b) => {
    const numA = parseInt(a.replace(/\D/g, '')) || 0;
    const numB = parseInt(b.replace(/\D/g, '')) || 0;
    if (numA === numB) {
      return a.localeCompare(b);
    }
    return numA - numB;
  });

  // Get all unique subjects across the school
  const allSubjects = [...new Set([
    ...loadMaster.map(l => l.subject),
    'Library', 'Games', 'Music', 'Dance', 'Art', 'Computer', 'PE', 'CCA', 'VE'
  ])].sort();

  const handleSlotUpdate = (cls, day, period, field, value, currentSubject, currentTeacher) => {
    let subject = currentSubject || '';
    let teacher = currentTeacher || '';

    if (field === 'subject') subject = value;
    if (field === 'teacher') teacher = value;

    // Check collision if updating teacher
    if (field === 'teacher' && value) {
      const collisionClass = checkTeacherCollision(value, day, period, cls);
      if (collisionClass) {
        setNotification({
          type: 'error',
          message: `Collision Detected! Teacher ${value} is already assigned to class ${collisionClass.toUpperCase()} on ${day} Period ${period}.`
        });
      } else {
        setNotification({
          type: 'success',
          message: `Slot updated successfully.`
        });
      }
    }

    updateSlot(cls, day, period, subject, teacher);
    
    // Clear notification after 3s
    setTimeout(() => setNotification(null), 3000);
  };

  const handleDeployToLMS = async () => {
    if (!confirm('Are you sure you want to deploy the current timetable to the live LMS Database? This will override current live schedules.')) return;
    
    try {
      const res = await fetch('/api/admin/timetable/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ timetables })
      });
      
      const data = await res.json();
      if (data.success) {
        setNotification({ type: 'success', message: `Successfully deployed ${data.count} periods to the LMS Database!` });
      } else {
        setNotification({ type: 'error', message: data.error || 'Deployment failed.' });
      }
    } catch (err) {
      setNotification({ type: 'error', message: 'Failed to connect to the server.' });
    }
  };

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 className="page-title">Mastersheet</h1>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            className="btn btn-primary" 
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', borderRadius: '4px', padding: '0.5rem 1rem', background: '#059669', border: 'none' }}
            onClick={handleDeployToLMS}
            title="Sync this timetable to the main LMS Database"
          >
            Deploy to LMS Database
          </button>
          <button 
            className={editMode ? "btn" : "btn btn-primary"}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', borderRadius: '4px', padding: '0.5rem 1rem' }}
            onClick={() => setEditMode(!editMode)}
            disabled={classes.length === 0}
          >
            {editMode ? 'Done Editing' : 'Edit Mastersheet'}
          </button>
          <button 
            className="btn btn-primary" 
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', borderRadius: '4px', padding: '0.5rem 1rem', background: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}
            onClick={() => navigate('/manage-classes')}
          >
            <Plus size={16} /> Manage Classes
          </button>
        </div>
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
          <label>Select Day:</label>
          <select 
            value={selectedDay} 
            onChange={(e) => setSelectedDay(e.target.value)}
            style={{ width: '150px' }}
          >
            {DAYS.map(day => (
              <option key={day} value={day}>{day}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="card" style={{ overflowX: 'auto' }}>
        <div className="master-grid" style={{ gridTemplateColumns: `80px repeat(${PERIODS.length}, minmax(${editMode ? '140px' : '1fr'}, 1fr))` }}>
          {/* Header Row */}
          <div className="grid-cell grid-header">Class</div>
          {PERIODS.map(p => (
            <div key={`p${p}`} className="grid-cell grid-header">Period {p}</div>
          ))}

          {/* Data Rows */}
          {sortedClasses.map(cls => (
            <React.Fragment key={cls}>
              <div className="grid-cell day-header">{cls.toUpperCase()}</div>
              {PERIODS.map(p => {
                const slot = timetables[cls]?.find(s => s.day === selectedDay && parseInt(s.period) === p);
                const collisionClass = slot?.teacher ? checkTeacherCollision(slot.teacher, selectedDay, p, cls) : false;
                
                return (
                  <div 
                    key={`${cls}-p${p}`} 
                    className={`grid-cell ${collisionClass ? 'collision-warning' : ''}`}
                    title={collisionClass ? `Clash Detected: ${slot.teacher} is also teaching Class ${collisionClass.toUpperCase()} in Period ${p}` : ''}
                    style={{ padding: editMode ? '4px' : '0.5rem' }}
                  >
                    {editMode ? (
                      <div className="edit-slot" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <select 
                          value={slot?.subject || ''} 
                          onChange={(e) => handleSlotUpdate(cls, selectedDay, p, 'subject', e.target.value, slot?.subject, slot?.teacher)}
                          style={{ fontSize: '0.8rem', padding: '2px' }}
                        >
                          <option value="">- Sub -</option>
                          {allSubjects.map(sub => (
                            <option key={sub} value={sub}>{sub}</option>
                          ))}
                        </select>
                        <select 
                          value={slot?.teacher || ''} 
                          onChange={(e) => handleSlotUpdate(cls, selectedDay, p, 'teacher', e.target.value, slot?.subject, slot?.teacher)}
                          style={{ fontSize: '0.8rem', padding: '2px' }}
                        >
                          <option value="">- Tr -</option>
                          {teachers.map(t => (
                            <option key={t} value={t}>{t}</option>
                          ))}
                        </select>
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
      </div>
    </div>
  );
};

export default Mastersheet;
