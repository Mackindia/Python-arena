import React, { useState } from 'react';
import { useTimetable } from '../context/TimetableContext';
import { User, Activity } from 'lucide-react';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const PERIODS = [1, 2, 3, 4, 5, 6, 7, 8];

const TeacherView = () => {
  const { timetables, teachers, getTeacherSlotUsage } = useTimetable();
  const [selectedTeacher, setSelectedTeacher] = useState(teachers[0] || '');
  const [viewMode, setViewMode] = useState('schedule'); // 'schedule' or 'matrix'

  // Calculate teacher's schedule across all classes
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
        if (slot.teacher === selectedTeacher) {
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
  const slotUsage = getTeacherSlotUsage();

  // Calculate total classes per week for selected teacher
  let totalClasses = 0;
  DAYS.forEach(day => {
    PERIODS.forEach(p => {
      if (schedule[day][p]) totalClasses++;
    });
  });

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 className="page-title">Teacher View</h1>
        
        <div style={{ display: 'flex', gap: '0.5rem', background: 'var(--bg-secondary)', padding: '0.25rem', borderRadius: '8px' }}>
          <button 
            style={{ 
              display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', 
              background: viewMode === 'schedule' ? 'var(--accent)' : 'transparent', 
              color: viewMode === 'schedule' ? 'white' : 'var(--text-secondary)',
              border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 500
            }}
            onClick={() => setViewMode('schedule')}
          >
            <User size={16} /> Individual Schedule
          </button>
          <button 
            style={{ 
              display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', 
              background: viewMode === 'matrix' ? 'var(--accent)' : 'transparent', 
              color: viewMode === 'matrix' ? 'white' : 'var(--text-secondary)',
              border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 500
            }}
            onClick={() => setViewMode('matrix')}
          >
            <Activity size={16} /> Slot Usage Matrix
          </button>
        </div>
      </div>

      {viewMode === 'schedule' && (
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
                  <div key={`p${p}`} className="grid-cell grid-header">Period {p}</div>
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
                            <div className="slot-teacher" style={{opacity: 0.3}}>- Free -</div>
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

      {viewMode === 'matrix' && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--border)', background: 'var(--bg-secondary)' }}>
            <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--text-primary)' }}>Teacher Weekly Load Overview</h3>
          </div>
          <div style={{ overflowX: 'auto', maxHeight: '70vh' }}>
            <table className="data-table" style={{ whiteSpace: 'nowrap' }}>
              <thead style={{ position: 'sticky', top: 0, zIndex: 10, background: 'var(--bg-primary)' }}>
                <tr>
                  <th style={{ position: 'sticky', left: 0, background: 'var(--bg-secondary)', zIndex: 11, borderRight: '2px solid var(--border)' }}>Teacher</th>
                  <th style={{ textAlign: 'center', borderRight: '2px solid var(--border)', background: '#f8fafc', color: '#0f172a' }}>Total Load</th>
                  {DAYS.map(day => (
                    <th key={day} style={{ textAlign: 'center', borderRight: day !== 'Sat' ? '1px solid var(--border)' : 'none' }}>
                      {day} Load
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {teachers.map(teacher => {
                  let totalLoad = 0;
                  const dayLoads = {};
                  DAYS.forEach(day => {
                    let dayLoad = 0;
                    PERIODS.forEach(p => {
                      if (slotUsage[teacher] && slotUsage[teacher][day] && slotUsage[teacher][day][p] > 0) {
                        dayLoad += slotUsage[teacher][day][p];
                      }
                    });
                    dayLoads[day] = dayLoad;
                    totalLoad += dayLoad;
                  });

                  return (
                    <tr key={teacher}>
                      <td style={{ position: 'sticky', left: 0, background: 'var(--bg-primary)', fontWeight: 600, borderRight: '2px solid var(--border)' }}>
                        {teacher}
                      </td>
                      <td style={{ textAlign: 'center', fontWeight: 'bold', fontSize: '1.1rem', borderRight: '2px solid var(--border)', color: totalLoad > 35 ? 'var(--danger)' : 'var(--text-primary)' }}>
                        {totalLoad}
                      </td>
                      {DAYS.map(day => (
                        <td key={`${teacher}-${day}`} style={{ textAlign: 'center', borderRight: day !== 'Sat' ? '1px solid var(--border)' : 'none' }}>
                          <span style={{ 
                            display: 'inline-block', minWidth: '30px', padding: '2px 8px', borderRadius: '4px',
                            background: dayLoads[day] >= 7 ? '#fef2f2' : (dayLoads[day] > 0 ? '#f0fdf4' : 'transparent'),
                            color: dayLoads[day] >= 7 ? '#991b1b' : (dayLoads[day] > 0 ? '#166534' : 'var(--text-secondary)'),
                            fontWeight: dayLoads[day] > 0 ? '600' : 'normal'
                          }}>
                            {dayLoads[day] > 0 ? dayLoads[day] : '-'}
                          </span>
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherView;
