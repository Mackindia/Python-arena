import React, { useState } from 'react';
import { useTimetable } from '../context/TimetableContext';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const PERIODS = [1, 2, 3, 4, 5, 6, 7, 8];

const TeacherView = () => {
  const { timetables, teachers } = useTimetable();
  const [selectedTeacher, setSelectedTeacher] = useState(teachers[0] || '');

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

  // Calculate total classes per week
  let totalClasses = 0;
  DAYS.forEach(day => {
    PERIODS.forEach(p => {
      if (schedule[day][p]) totalClasses++;
    });
  });

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Teacher View</h1>
      </div>

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
    </div>
  );
};

export default TeacherView;
