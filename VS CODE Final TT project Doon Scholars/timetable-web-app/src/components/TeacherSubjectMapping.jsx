import React, { useEffect, useState } from 'react';
import { useTimetable } from '../context/TimetableContext';
import { Save } from 'lucide-react';

const WING_CONFIGS = [
  {
    title: "Senior Secondary Wing (Classes 11 - 12)",
    headerColor: "#fb923c", // Orange
    rowColor: "#ffedd5",
    columns: [
      "11PCM", "11PCB", "11COMMA", "11COMMB", "11HUM", 
      "12PCM", "12PCB", "12COMMA", "12COMMB", "12HUM"
    ],
    subjects: [
      "English", "Physics", "Chemistry", "Biology", "Computer Science",
      "Accounts", "Business Studies", "Economics", "Applied Maths",
      "History", "Geography", "Pol. Science", "Psychology", "Sociology", "Legal Studies",
      "Maths", "Physical Education", "Fine Arts", "Music"
    ]
  },
  {
    title: "Secondary Wing (Classes 9 - 10)",
    headerColor: "#94a3b8", // Grey
    rowColor: "#f1f5f9",
    columns: ["9A", "9B", "10A", "10B"],
    subjects: [
      "English", "Hindi", "SSt", "Maths", "Science", "IT", "AI"
    ]
  },
  {
    title: "Middle Wing (Classes 6 - 8)",
    headerColor: "#60a5fa", // Blue
    rowColor: "#eff6ff",
    columns: ["6A", "6B", "7A", "7B", "8A", "8B"],
    subjects: [
      "English", "Hindi", "Sanskrit", "Maths", "Science", "SSt", "Computer", "GK", "Art_Craft", "Library", "PE"
    ]
  },
  {
    title: "Primary Wing (Classes 1 - 5)",
    headerColor: "#4ade80", // Green
    rowColor: "#f0fdf4",
    columns: ["1A", "1B", "2A", "2B", "3A", "3B", "4A", "4B", "5A", "5B"],
    subjects: [
      "English_Lit", "English_Lang", "Hindi_Lit", "Hindi_Lang", "Maths", "EVS", "GK", "VE", "Computer", "Art_Craft", "Dance", "Music", "Library", "PE"
    ]
  }
];

const TeacherSubjectMapping = () => {
  const { teacherSubjectMap, setTeacherSubjectMap, timetables, updateTeacherForSubject } = useTimetable();

  // Initialize with snapshot data if empty
  useEffect(() => {
    if (Object.keys(teacherSubjectMap).length === 0) {
      const initialMap = {};
      
      // Initialize all subjects and columns from configs
      WING_CONFIGS.forEach(wing => {
        wing.subjects.forEach(subj => {
          if (!initialMap[subj]) initialMap[subj] = {};
          wing.columns.forEach(col => {
            initialMap[subj][col] = "";
          });
        });
      });
      
      // Auto-populate from known snapshot data
      const knownData = {
        "English": { "9A": "NM", "9B": "NM", "10A": "NM", "10B": "NM", "11PCM": "SP", "11PCB": "SP", "11COMMA": "SP", "11COMMB": "SP", "11HUM": "SP", "12PCM": "SP", "12PCB": "SP", "12COMMA": "SP", "12COMMB": "SP", "12HUM": "SP" },
        "Hindi": { "9A": "MG", "9B": "MG", "10A": "MG", "10B": "MG" },
        "Maths": { "9A": "VR", "9B": "VR", "10A": "VR", "10B": "VR", "11PCM": "NT", "11COMMA": "NT", "11COMMB": "NT", "12PCM": "NT", "12COMMA": "NT" },
        "Science": { "9A": "AN, RD, NG", "9B": "AN, RD, NG", "10A": "AN, RD, NG", "10B": "AN, RD, NG" },
        "SSt": { "9A": "SS, SB, MN", "9B": "SS, SB, MN", "10A": "AB, SD, MN", "10B": "AB, SD, MN" },
        "IT": { "9A": "NP", "9B": "NP", "10A": "NP", "10B": "NP" },
        "AI": { "9A": "TP", "9B": "TP", "10A": "TP", "10B": "TP" },
        "Physics": { "11PCM": "AN", "11PCB": "AN", "12PCM": "AN", "12PCB": "AN" },
        "Chemistry": { "11PCM": "RD", "11PCB": "RD", "12PCM": "RD", "12PCB": "RD" },
        "Biology": { "11PCB": "NG", "12PCB": "NG" },
        "Accounts": { "11COMMA": "MS", "11COMMB": "MS", "12COMMA": "MS", "12COMMB": "MS" },
        "Business Studies": { "11COMMA": "SH", "11COMMB": "SH", "12COMMA": "SH", "12COMMB": "SH" },
        "Economics": { "11COMMA": "PR", "11COMMB": "PR", "11HUM": "PR", "12COMMA": "PR", "12COMMB": "PR", "12HUM": "PR" },
        "History": { "11HUM": "SA", "12HUM": "SA" },
        "Geography": { "11HUM": "AR", "12HUM": "AR" },
        "Pol. Science": { "11HUM": "DV", "12HUM": "DV" },
        "Psychology": { "11PCB": "RN", "11HUM": "RN", "12PCB": "RN", "12HUM": "RN" },
        "Sociology": { "11HUM": "GA", "12HUM": "GA" },
        "Physical Education": { "11PCM": "SZ, SU", "11PCB": "SZ, SU", "11COMMA": "SZ, SU", "11COMMB": "SZ, SU", "11HUM": "SZ, SU", "12PCM": "PB", "12PCB": "PB", "12COMMA": "PB", "12COMMB": "PB", "12HUM": "PB" },
        "Fine Arts": { "11PCM": "KB", "11PCB": "KB", "11COMMA": "KB", "11COMMB": "KB", "11HUM": "KB", "12PCM": "KB", "12PCB": "KB", "12COMMA": "KB", "12COMMB": "KB", "12HUM": "KB" },
        "Music": { "11PCM": "MG", "11PCB": "MG", "11COMMA": "MG", "11COMMB": "MG", "11HUM": "MG", "12PCM": "MG", "12PCB": "MG", "12COMMA": "MG", "12COMMB": "MG", "12HUM": "MG" },
        "Computer Science": { "11PCM": "SW", "12PCM": "SW" },
        "Legal Studies": { "11HUM": "HSC", "12HUM": "HSC" },
        "Applied Maths": { "11COMMA": "DK", "11COMMB": "DK", "12COMMA": "DK", "12COMMB": "DK" }
      };

      Object.keys(knownData).forEach(subj => {
        if (!initialMap[subj]) initialMap[subj] = {};
        Object.keys(knownData[subj]).forEach(col => {
          initialMap[subj][col] = knownData[subj][col];
        });
      });

      setTeacherSubjectMap(initialMap);
    }
  }, []);

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
        {WING_CONFIGS.map((wing, wIdx) => (
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
