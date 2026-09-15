import React, { useState, useMemo } from 'react';
import { useTimetable } from '../../context/TimetableContext';
import { getAllTeachersSummary } from '../../services/teacherReliefEngine';
import DayDetailPanel from './DayDetailPanel';
import './reliefStyles.css';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const TARGET_LOAD = 6;

const TeacherLoadHeatmap = ({ shiftQueue, onAddShift, onRemoveShift, onClearQueue, onApplyAll, onShowRecommendations }) => {
  const { timetables, teachers } = useTimetable();
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [selectedDay, setSelectedDay] = useState(null);
  const [filterClass, setFilterClass] = useState('');
  const [filterSubject, setFilterSubject] = useState('');
  const [searchTeacher, setSearchTeacher] = useState('');

  // Get all unique classes and subjects for filters
  const { allClasses, allSubjects } = useMemo(() => {
    const classSet = new Set();
    const subjectSet = new Set();
    Object.entries(timetables).forEach(([classId, schedule]) => {
      classSet.add(classId);
      schedule.forEach(slot => {
        if (slot.subject) subjectSet.add(slot.subject);
      });
    });
    return {
      allClasses: Array.from(classSet).sort(),
      allSubjects: Array.from(subjectSet).sort()
    };
  }, [timetables]);

  // Get summary for all teachers
  const summary = useMemo(() => {
    let result = getAllTeachersSummary(timetables, teachers);

    // Apply filters
    if (filterClass) {
      result = result.filter(t => {
        // Check if teacher teaches in this class
        const classSlots = timetables[filterClass] || [];
        return classSlots.some(s => s.teacher === t.teacher);
      });
    }

    if (filterSubject) {
      result = result.filter(t => {
        // Check if teacher teaches this subject
        return Object.values(timetables).some(schedule =>
          schedule.some(s => s.teacher === t.teacher && s.subject === filterSubject)
        );
      });
    }

    if (searchTeacher) {
      const search = searchTeacher.toLowerCase();
      result = result.filter(t => t.teacher.toLowerCase().includes(search));
    }

    return result;
  }, [timetables, teachers, filterClass, filterSubject, searchTeacher]);

  // Get overloaded count
  const overloadedCount = summary.filter(t => t.overloadedDays.length > 0).length;

  // Handle cell click
  const handleCellClick = (teacher, day) => {
    setSelectedTeacher(teacher);
    setSelectedDay(day);
  };

  // Close detail panel
  const handleCloseDetail = () => {
    setSelectedTeacher(null);
    setSelectedDay(null);
  };

  // Get cell class based on load
  const getCellClass = (load) => {
    if (load > TARGET_LOAD) return 'overloaded';
    if (load === TARGET_LOAD) return 'at-limit';
    return 'good';
  };

  // Get status text
  const getStatusText = (teacherData) => {
    if (teacherData.overloadedDays.length === 0) {
      return <span style={{ color: '#059669' }}>✓ OK</span>;
    }
    return (
      <span style={{ color: '#dc2626' }}>
        ⚠ {teacherData.overloadedDays.length} day{teacherData.overloadedDays.length > 1 ? 's' : ''}
      </span>
    );
  };

  // Check if a shift is queued for this teacher+day
  const getQueuedShiftCount = (teacher, day) => {
    return shiftQueue.filter(s => s.teacher === teacher && s.fromDay === day).length;
  };

  // Get the new load after queued shifts
  const getQueuedNewLoad = (teacher, day) => {
    const baseLoad = summary.find(t => t.teacher === teacher)?.days[day] || 0;
    const shiftsOut = shiftQueue.filter(s => s.teacher === teacher && s.fromDay === day).length;
    const shiftsIn = shiftQueue.filter(s => s.teacher === teacher && s.toDay === day).length;
    return baseLoad - shiftsOut + shiftsIn;
  };

  return (
    <div className="relief-layout">
      <div className="relief-main">
        {/* Filter Bar */}
        <div className="relief-filters">
          <div>
            <label>Class:</label>
            <select value={filterClass} onChange={(e) => setFilterClass(e.target.value)}>
              <option value="">All Classes</option>
              {allClasses.map(c => (
                <option key={c} value={c}>{c.toUpperCase()}</option>
              ))}
            </select>
          </div>

          <div>
            <label>Subject:</label>
            <select value={filterSubject} onChange={(e) => setFilterSubject(e.target.value)}>
              <option value="">All Subjects</option>
              {allSubjects.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <div>
            <label>Teacher:</label>
            <input
              type="text"
              placeholder="Search teacher..."
              value={searchTeacher}
              onChange={(e) => setSearchTeacher(e.target.value)}
            />
          </div>
        </div>

        {/* Heatmap Grid */}
        <div className="heatmap-container">
          <div className="heatmap-grid">
            {/* Header Row */}
            <div className="heatmap-header">Teacher</div>
            {DAYS.map(day => (
              <div key={day} className="heatmap-header">{day}</div>
            ))}
            <div className="heatmap-header">Status</div>

            {/* Teacher Rows */}
            {summary.map(teacherData => (
              <React.Fragment key={teacherData.teacher}>
                <div className="heatmap-teacher-name">{teacherData.teacher}</div>

                {DAYS.map(day => {
                  const load = teacherData.days[day];
                  const cellClass = getCellClass(load);
                  const queuedCount = getQueuedShiftCount(teacherData.teacher, day);
                  const newLoad = getQueuedNewLoad(teacherData.teacher, day);

                  return (
                    <div
                      key={`${teacherData.teacher}-${day}`}
                      className={`heatmap-cell ${cellClass}`}
                      onClick={() => handleCellClick(teacherData.teacher, day)}
                      title={`${teacherData.teacher} - ${day}: ${load} periods${queuedCount > 0 ? ` (${queuedCount} shifts queued)` : ''}`}
                    >
                      {queuedCount > 0 ? (
                        <>
                          <span style={{ textDecoration: 'line-through', opacity: 0.5, fontSize: '0.8em' }}>
                            {load}
                          </span>
                          <span style={{ marginLeft: '4px' }}>{newLoad}</span>
                          <span className="shift-badge">{queuedCount} shift{queuedCount > 1 ? 's' : ''}</span>
                        </>
                      ) : (
                        load
                      )}
                    </div>
                  );
                })}

                <div className="heatmap-status">
                  {getStatusText(teacherData)}
                </div>
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Summary */}
        <div className="heatmap-summary">
          <div className="stat">
            <div className="stat-dot" style={{ background: '#dc2626' }}></div>
            <span><strong>{overloadedCount}</strong> teacher{overloadedCount !== 1 ? 's' : ''} overloaded</span>
          </div>
          <div className="stat">
            <div className="stat-dot" style={{ background: '#059669' }}></div>
            <span><strong>{summary.length - overloadedCount}</strong> teacher{summary.length - overloadedCount !== 1 ? 's' : ''} OK</span>
          </div>
          {shiftQueue.length > 0 && (
            <div className="stat">
              <div className="stat-dot" style={{ background: 'var(--primary-color)' }}></div>
              <span><strong>{shiftQueue.length}</strong> shift{shiftQueue.length !== 1 ? 's' : ''} queued</span>
            </div>
          )}
        </div>
      </div>

      {/* Day Detail Panel */}
      {selectedTeacher && selectedDay && (
        <DayDetailPanel
          teacher={selectedTeacher}
          day={selectedDay}
          onClose={handleCloseDetail}
          onAddShift={onAddShift}
          shiftQueue={shiftQueue}
          onShowRecommendations={onShowRecommendations}
        />
      )}
    </div>
  );
};

export default TeacherLoadHeatmap;
