import React, { useState } from 'react';
import { useTimetable } from '../context/TimetableContext';
import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const PERIODS = [1, 2, 3, 4, 5, 6, 7, 8];

const Mastersheet = () => {
  const { timetables, classes } = useTimetable();
  const [selectedDay, setSelectedDay] = useState('Mon');
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

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 className="page-title">Mastersheet</h1>
        <button 
          className="btn btn-primary" 
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', borderRadius: '4px', padding: '0.5rem 1rem' }}
          onClick={() => navigate('/manage-classes')}
        >
          <Plus size={16} /> Manage Classes
        </button>
      </div>

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

      <div className="card">
        <div className="master-grid" style={{ gridTemplateColumns: `80px repeat(${PERIODS.length}, 1fr)` }}>
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
                return (
                  <div key={`${cls}-p${p}`} className="grid-cell">
                    {slot ? (
                      <>
                        <div className="slot-subject">{slot.subject}</div>
                        <div className="slot-teacher">{slot.teacher}</div>
                      </>
                    ) : (
                      <div className="slot-teacher" style={{opacity: 0.3}}>-</div>
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
