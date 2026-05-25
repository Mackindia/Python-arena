import React, { useEffect } from 'react';
import { useTimetable } from '../context/TimetableContext';
import { Save } from 'lucide-react';
import mappingConfig from '../data/teacher_mapping_config.json';

const TeacherSubjectMapping = () => {
  const { teacherSubjectMap, setTeacherSubjectMap, timetables, updateTeacherForSubject } = useTimetable();

  // Initialize with snapshot data if empty
  useEffect(() => {
    if (Object.keys(teacherSubjectMap).length === 0 && mappingConfig.wings && mappingConfig.wings.length > 0) {
      setTeacherSubjectMap(mappingConfig.initialData || {});
    }
  }, [teacherSubjectMap]);

  const handleCellChange = (subject, col, value) => {
    setTeacherSubjectMap(prev => ({
      ...prev,
      [subject]: {
        ...prev[subject],
        [col]: value
      }
    }));
  };

  const pushToTimetable = () => {
    let count = 0;
    Object.keys(timetables).forEach(classId => {
      let normalizedId = classId.replace(/\s+/g, '').toUpperCase();
      
      const schedule = timetables[classId];
      if (!schedule) return;

      schedule.forEach(slot => {
        if (!slot.subject) return;
        let subj = slot.subject.toLowerCase();
        
        for (const mSubj of Object.keys(teacherSubjectMap)) {
          if (subj === mSubj.toLowerCase() || subj.includes(mSubj.toLowerCase())) {
            const mappedTeacher = teacherSubjectMap[mSubj][normalizedId];
            if (mappedTeacher) {
              updateTeacherForSubject(classId, slot.subject, mappedTeacher);
              count++;
            }
          }
        }
      });
    });
    alert(`Successfully synced ${count} slots to the live Timetable!`);
  };

  if (Object.keys(teacherSubjectMap).length === 0) return <div>Loading Matrix...</div>;

  if (!mappingConfig.wings || mappingConfig.wings.length === 0) {
    return <div style={{ padding: '2rem' }}>Please run the extraction script to load the CSV first.</div>;
  }

  return (
    <div style={{ paddingBottom: '3rem' }}>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h1 className="page-title">Teacher Subject Mapping</h1>
        <button 
          className="btn btn-primary" 
          onClick={pushToTimetable}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#2563eb', color: 'white', padding: '0.5rem 1rem', borderRadius: '6px', border: 'none', cursor: 'pointer', fontWeight: 600 }}
        >
          <Save size={18} />
          Sync to Timetable
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        {mappingConfig.wings.map((wing, wIdx) => (
          <div key={wIdx} style={{ border: '1px solid #cbd5e1', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
            <div style={{ background: wing.headerColor, color: 'white', padding: '0.75rem 1rem', fontWeight: 'bold', fontSize: '1.1rem' }}>
              {wing.title}
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 'max-content', fontSize: '14px', fontFamily: 'sans-serif' }}>
                <thead style={{ background: '#f8fafc' }}>
                  <tr>
                    <th style={{ padding: '10px', borderBottom: '2px solid #cbd5e1', borderRight: '2px solid #cbd5e1', textAlign: 'left', width: '180px' }}>
                      SUBJECT
                    </th>
                    {wing.columns.map((col) => (
                      <th key={col} style={{ padding: '10px', borderBottom: '2px solid #cbd5e1', borderRight: '1px solid #e2e8f0', textAlign: 'center', minWidth: '70px' }}>
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {wing.subjects.map((subject) => (
                    <tr key={subject}>
                      <td style={{ padding: '8px 10px', background: wing.rowColor, borderBottom: '1px solid #e2e8f0', borderRight: '2px solid #cbd5e1', fontWeight: 'bold', color: '#1e293b' }}>
                        {subject}
                      </td>
                      {wing.columns.map((col) => {
                        const val = teacherSubjectMap[subject]?.[col] || "";
                        return (
                          <td key={`${subject}-${col}`} style={{ padding: 0, background: wing.rowColor, borderBottom: '1px solid #e2e8f0', borderRight: '1px solid #e2e8f0' }}>
                            <input 
                              type="text"
                              value={val}
                              onChange={(e) => handleCellChange(subject, col, e.target.value.toUpperCase())}
                              style={{
                                width: '100%',
                                height: '100%',
                                minHeight: '36px',
                                padding: '4px',
                                border: 'none',
                                background: 'transparent',
                                textAlign: 'center',
                                outline: 'none',
                                fontWeight: val ? '600' : 'normal',
                                color: '#0f172a'
                              }}
                              onFocus={(e) => e.target.style.background = 'rgba(255,255,255,0.6)'}
                              onBlur={(e) => e.target.style.background = 'transparent'}
                            />
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TeacherSubjectMapping;
