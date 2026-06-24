import React, { useState } from 'react';
import { useTimetable } from '../context/TimetableContext';
import { useNavigate } from 'react-router-dom';
import { Plus, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { autoAssignTeacher } from '../services/allocationEngine';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const PERIODS = [1, 2, 3, 4, 5, 6, 7, 8];
const ALL_DAYS_VALUE = 'ALL';

const Mastersheet = () => {
  const { timetables, classes, checkTeacherCollision, updateSlot, teachers, loadMaster, teacherSubjectMap, getAllowedSubjectsForClass, importBackup } = useTimetable();
  const [selectedDay, setSelectedDay] = useState('Mon');
  const [editMode, setEditMode] = useState(false);
  const [adminOverride, setAdminOverride] = useState(false);
  const [notification, setNotification] = useState(null);
  const navigate = useNavigate();

  // Check if a subject has a valid mapping for a class
  // Returns: { subjectExists: boolean, teacherAssigned: boolean, status: string }
  const getMappingStatus = (classId, subject) => {
    if (!subject) return { subjectExists: false, teacherAssigned: false, status: 'empty' };
    
    const normalizedClassId = classId.replace(/\s+/g, '').toUpperCase();
    
    // 1. Check if subject exists in loadMaster for this class
    const subjectInLoadMaster = loadMaster.some(
      item => item.class_id.replace(/\s+/g, '').toUpperCase() === normalizedClassId && item.subject === subject
    );
    
    // 2. Check if subject exists in teacherSubjectMap for this class
    const subjectInMap = teacherSubjectMap && teacherSubjectMap[subject] && 
      teacherSubjectMap[subject][normalizedClassId] !== undefined;
    
    const subjectExists = subjectInLoadMaster || subjectInMap;
    
    // 3. Check if teacher is mapped
    let teacherAssigned = false;
    if (subjectExists && teacherSubjectMap && teacherSubjectMap[subject]) {
      const mappedTeacher = teacherSubjectMap[subject][normalizedClassId];
      teacherAssigned = mappedTeacher !== undefined && mappedTeacher !== null && mappedTeacher.trim() !== '';
    }
    
    // 4. Determine status
    let status = 'valid';
    if (!subjectExists) {
      status = 'no_subject';
    } else if (!teacherAssigned) {
      status = 'no_teacher';
    }
    
    return { subjectExists, teacherAssigned, status };
  };

  // Sort classes logically (1a, 1b, 2a... 10a, 11a, 11b)
  const sortedClasses = [...classes].sort((a, b) => {
    const numA = parseInt(a.replace(/\D/g, '')) || 0;
    const numB = parseInt(b.replace(/\D/g, '')) || 0;
    if (numA === numB) {
      return a.localeCompare(b);
    }
    return numA - numB;
  });

  const handleSlotUpdate = (cls, day, period, field, value, currentSubject, currentTeacher) => {
    let subject = currentSubject || '';
    let teacher = currentTeacher || '';
    let assignedTeachers = null;
    let clashes = [];

    if (field === 'subject') {
      subject = value;
      teacher = ''; // RULE: Clear previous assignment before recalculation
      // Auto-assign teacher using centralized engine
      if (value && teacherSubjectMap) {
        const assignment = autoAssignTeacher(value, cls, day, period, teacherSubjectMap, timetables);
        
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

    // Check collision if updating teacher manually
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

    updateSlot(cls, day, period, subject, teacher, assignedTeachers, clashes);
    
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

  const isFullWeek = selectedDay === ALL_DAYS_VALUE;
  const daysToShow = isFullWeek ? DAYS : [selectedDay];

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 className="page-title">Mastersheet</h1>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            className="btn btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', borderRadius: '4px', padding: '0.5rem 1rem', background: '#3b82f6', border: 'none' }}
            onClick={() => window.print()}
            title={isFullWeek ? "Print full week Mastersheet (Mon-Sat)" : "Print this day's Mastersheet"}
          >
            🖨️ Print {isFullWeek ? 'Full Week' : 'Today'}
          </button>
          <button 
            className="btn btn-primary" 
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', borderRadius: '4px', padding: '0.5rem 1rem', background: '#059669', border: 'none' }}
            onClick={handleDeployToLMS}
            title="Sync this timetable to the main LMS Database"
          >
            Deploy to LMS Database
          </button>
          <button 
            className="btn btn-primary" 
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', borderRadius: '4px', padding: '0.5rem 1rem', background: '#8b5cf6', border: 'none' }}
            onClick={() => {
              const backup = {
                timetables: localStorage.getItem('timetables'),
                teacherSubjectMap: localStorage.getItem('teacherSubjectMap'),
                addedTeachers: localStorage.getItem('addedTeachers'),
                deletedTeachers: localStorage.getItem('deletedTeachers'),
                deletedSubjects: localStorage.getItem('deletedSubjects'),
                loadMaster: localStorage.getItem('loadMaster'),
                masterClasses: localStorage.getItem('masterClasses'),
                teacherSlotUsage: localStorage.getItem('teacherSlotUsage'),
                substitutions: localStorage.getItem('substitutions'),
                absentTeachers: localStorage.getItem('absentTeachers')
              };
              const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
              const a = document.createElement('a');
              a.href = URL.createObjectURL(blob);
              a.download = `Timetable_Data_Backup_${new Date().toISOString().split('T')[0]}.json`;
              a.click();
            }}
            title="Download a hard copy backup of your current timetable data"
          >
            💾 Export Backup
          </button>

          <label
            className="btn btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', borderRadius: '4px', padding: '0.5rem 1rem', background: '#ef4444', border: 'none', cursor: 'pointer' }}
            title="Restore your timetable data from a previously downloaded JSON backup file"
          >
            ↩️ Restore Backup
            <input
              type="file"
              accept=".json"
              style={{ display: 'none' }}
              onChange={(e) => {
                const file = e.target.files[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = async (event) => {
                  try {
                    const data = JSON.parse(event.target.result);
                    await importBackup(data);
                  } catch (err) {
                    alert('Error parsing backup file. Make sure it is the correct JSON file.');
                  }
                };
                reader.readAsText(file);
              }}
            />
          </label>

          <button 
            className={adminOverride ? "btn btn-primary" : "btn"}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', borderRadius: '4px', padding: '0.5rem 1rem' }}
            onClick={() => setAdminOverride(!adminOverride)}
            title="Enable manual teacher selection"
          >
            {adminOverride ? 'Disable Override' : 'Admin Override'}
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

      <h1 className="print-only-title" style={{ display: 'none', textAlign: 'center', marginBottom: '20px', fontSize: '24px' }}>
        Doon Scholars - Master Timetable ({isFullWeek ? 'Full Week (Mon-Sat)' : selectedDay})
      </h1>

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
            <option value={ALL_DAYS_VALUE}>📅 Full Week</option>
            {DAYS.map(day => (
              <option key={day} value={day}>{day}</option>
            ))}
          </select>
        </div>
      </div>


      <datalist id="teacher-list">
        {teachers.map(t => <option key={t} value={t} />)}
      </datalist>

      <div className="card printable-area" style={{ overflowX: 'auto' }}>
        {daysToShow.map(day => (
          <div key={day} className="day-timetable-section" style={isFullWeek ? { marginBottom: '2rem', pageBreakAfter: 'always' } : {}}>
            {isFullWeek && (
              <h2 style={{ textAlign: 'center', fontSize: '16px', fontWeight: 'bold', marginBottom: '10px', color: '#1e293b', padding: '8px', background: '#f1f5f9', borderRadius: '4px' }}>
                {day === 'Mon' ? 'Monday' : day === 'Tue' ? 'Tuesday' : day === 'Wed' ? 'Wednesday' : day === 'Thu' ? 'Thursday' : day === 'Fri' ? 'Friday' : 'Saturday'}
              </h2>
            )}
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
                    const slot = timetables[cls]?.find(s => s.day === day && parseInt(s.period) === p);
                    const mappingStatus = getMappingStatus(cls, slot?.subject);
                    const collisionClass = slot?.teacher && mappingStatus.status === 'valid' ? checkTeacherCollision(slot.teacher, day, p, cls) : false;
                    
                    // Determine cell CSS class: missing mapping takes priority, then collision
                    let cellClassName = 'grid-cell';
                    if (mappingStatus.status === 'no_subject') {
                      cellClassName += ' missing-mapping';
                    } else if (mappingStatus.status === 'no_teacher') {
                      cellClassName += ' missing-mapping';
                    } else if (collisionClass) {
                      cellClassName += ' collision-warning';
                    }
                    
                    // Determine title tooltip
                    let cellTitle = '';
                    if (mappingStatus.status === 'no_subject') {
                      cellTitle = 'No valid subject mapping exists - subject may be deleted';
                    } else if (mappingStatus.status === 'no_teacher') {
                      cellTitle = 'Subject exists but teacher is not assigned';
                    } else if (collisionClass) {
                      cellTitle = `Clash Detected: ${slot.teacher} is also teaching Class ${collisionClass.toUpperCase()} in Period ${p}`;
                    }
                    
                    return (
                      <div 
                        key={`${cls}-${day}-p${p}`} 
                        className={cellClassName}
                        title={cellTitle}
                        style={{ padding: editMode ? '4px' : '0.5rem' }}
                      >
                        {editMode ? (
                          <div className="edit-slot" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <select 
                              value={slot?.subject || ''} 
                              onChange={(e) => handleSlotUpdate(cls, day, p, 'subject', e.target.value, slot?.subject, slot?.teacher)}
                              style={{ fontSize: '0.8rem', padding: '2px', width: '100%', background: '#fff', border: '1px solid #ccc', borderRadius: '2px' }}
                            >
                              <option value="">- Sub -</option>
                              {getAllowedSubjectsForClass(cls).map(sub => (
                                <option key={sub} value={sub}>{sub}</option>
                              ))}
                            </select>
                            {adminOverride && (
                              <input 
                                type="text"
                                list="teacher-list"
                                value={slot?.teacher || ''} 
                                onChange={(e) => handleSlotUpdate(cls, day, p, 'teacher', e.target.value, slot?.subject, slot?.teacher)}
                                style={{ fontSize: '0.8rem', padding: '2px', width: '100%' }}
                                placeholder="- Tr Override -"
                              />
                            )}
                          </div>
                        ) : (
                          <>
                            {slot?.subject ? (
                              <>
                                {mappingStatus.status === 'no_subject' ? (
                                  <div className="slot-subject" style={{ color: '#1e40af', fontSize: '0.75rem' }}>No Subject or Teacher Assigned</div>
                                ) : mappingStatus.status === 'no_teacher' ? (
                                  <>
                                    <div className="slot-subject">{slot.subject}</div>
                                    <div className="slot-teacher">No Teacher</div>
                                  </>
                                ) : (
                                  <>
                                    <div className="slot-subject">{slot.subject}</div>
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
                                )}
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
        ))}
      </div>
    </div>
  );
};

export default Mastersheet;
