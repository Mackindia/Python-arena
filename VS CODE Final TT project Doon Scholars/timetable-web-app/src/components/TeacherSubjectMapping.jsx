import React, { useEffect, useState, useMemo } from 'react';
import { useTimetable } from '../context/TimetableContext';
import { Save } from 'lucide-react';
import { rawCsvData } from '../data/csvData';

const WING_DEFS = [
  { id: 'primary', title: 'Primary Wing (Classes 1 - 5)', headerColor: '#4ade80', rowColor: '#f0fdf4', match: (cls) => ['1','2','3','4','5'].includes(cls) },
  { id: 'middle', title: 'Middle Wing (Classes 6 - 8)', headerColor: '#60a5fa', rowColor: '#eff6ff', match: (cls) => ['6','7','8'].includes(cls) },
  { id: 'secondary', title: 'Secondary Wing (Classes 9 - 10)', headerColor: '#94a3b8', rowColor: '#f1f5f9', match: (cls) => ['9','10'].includes(cls) },
  { id: 'senior', title: 'Senior Secondary Wing (Classes 11 - 12)', headerColor: '#fb923c', rowColor: '#ffedd5', match: (cls) => ['11','12'].includes(cls) }
];

const parseCSVConfig = () => {
  const rows = rawCsvData.split('\n').filter(r => r.trim());
  const dataRows = rows.slice(1);
  
  const wings = {
    primary: { subjects: new Set(), columns: new Set() },
    middle: { subjects: new Set(), columns: new Set() },
    secondary: { subjects: new Set(), columns: new Set() },
    senior: { subjects: new Set(), columns: new Set() }
  };
  
  const mapForUI = {};

  dataRows.forEach(row => {
    const matches = row.match(/(".*?"|[^",]+)(?=\s*,|\s*$)/g);
    if (!matches || matches.length < 4) return;
    
    let [subject, cls, section, teacher] = matches.map(m => m.replace(/^"|"$/g, '').trim());
    
    const wingDef = WING_DEFS.find(w => w.match(cls));
    if (wingDef) {
      const classId = `${cls}${section}`.toUpperCase();
      
      wings[wingDef.id].subjects.add(subject);
      wings[wingDef.id].columns.add(classId);
      
      if (!mapForUI[subject]) mapForUI[subject] = {};
      mapForUI[subject][classId] = teacher;
    }
  });

  const finalConfig = WING_DEFS.map(w => ({
    title: w.title,
    headerColor: w.headerColor,
    rowColor: w.rowColor,
    columns: Array.from(wings[w.id].columns),
    subjects: Array.from(wings[w.id].subjects)
  })).filter(w => w.columns.length > 0);

  return { wings: finalConfig, initialData: mapForUI };
};

const TeacherSubjectMapping = () => {
  const { teacherSubjectMap, setTeacherSubjectMap, timetables, updateTeacherForSubject } = useTimetable();
  const [config, setConfig] = useState(null);

  // Parse CSV and Initialize
  useEffect(() => {
    const parsed = parseCSVConfig();
    setConfig(parsed);
    
    // Always merge in the CSV teacher initials if they are missing from the current state!
    // This fixes the issue where old cached browser data prevents initials from loading.
    setTeacherSubjectMap(prev => {
      const nextMap = { ...prev };
      let hasChanges = false;
      
      Object.keys(parsed.initialData).forEach(subj => {
        if (!nextMap[subj]) {
          nextMap[subj] = { ...parsed.initialData[subj] };
          hasChanges = true;
        } else {
          Object.keys(parsed.initialData[subj]).forEach(col => {
            if (!nextMap[subj][col]) {
              nextMap[subj][col] = parsed.initialData[subj][col];
              hasChanges = true;
            }
          });
        }
      });
      
      return hasChanges ? nextMap : prev;
    });
  }, []); // Run ONLY once on mount

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
          // Splitting by slash handles groups like "Bio/Eco/Phy_Edu" matching "Biology"
          const mSubjParts = mSubj.toLowerCase().split('/');
          
          if (mSubjParts.some(p => subj.includes(p) || p.includes(subj))) {
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

  if (!config) return <div>Loading Matrix...</div>;

  return (
    <div style={{ paddingBottom: '3rem' }}>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h1 className="page-title">Teacher Subject Mapping</h1>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button 
            className="btn btn-outline" 
            onClick={() => {
              if (window.confirm("This will reset all your current mappings back to the original CSV file. Are you sure?")) {
                setTeacherSubjectMap(config.initialData);
              }
            }}
            style={{ padding: '0.5rem 1rem', borderRadius: '6px', border: '1px solid #cbd5e1', cursor: 'pointer', fontWeight: 600, background: '#fff' }}
          >
            Reset to CSV
          </button>
          <button 
            className="btn btn-primary" 
            onClick={pushToTimetable}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#2563eb', color: 'white', padding: '0.5rem 1rem', borderRadius: '6px', border: 'none', cursor: 'pointer', fontWeight: 600 }}
          >
            <Save size={18} />
            Sync to Timetable
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        {config.wings.map((wing, wIdx) => (
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
