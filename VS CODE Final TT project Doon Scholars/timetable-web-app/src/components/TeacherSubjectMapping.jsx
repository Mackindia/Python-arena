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

const parseCSVConfig = (loadMaster = []) => {
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
    
    let [rawSubject, cls, section, rawTeacher] = matches.map(m => m.replace(/^"|"$/g, '').trim());
    
    const wingDef = WING_DEFS.find(w => w.match(cls));
    if (wingDef) {
      const classId = `${cls}${section}`.toUpperCase();
      
      const subjectTokens = (rawSubject.toUpperCase() === 'A/C' || rawSubject.toUpperCase() === 'F/S')
        ? [rawSubject]
        : rawSubject.split('/').map(t => t.trim());
      const teacherTokens = rawTeacher.split(',').map(t => t.trim());
      
      subjectTokens.forEach((subjectToken, index) => {
        wings[wingDef.id].subjects.add(subjectToken);
        wings[wingDef.id].columns.add(classId);
        
        if (!mapForUI[subjectToken]) mapForUI[subjectToken] = {};
        
        // If multiple teachers exist, map 1-to-1. If single teacher, map to all.
        const teacherForSubject = teacherTokens.length > 1 && teacherTokens.length === subjectTokens.length
          ? teacherTokens[index]
          : rawTeacher; // fallback to full string if mismatch
          
        mapForUI[subjectToken][classId] = teacherForSubject;
      });
    }
  });

  const savedDeletedSubjects = localStorage.getItem('deletedSubjects');
  let deletedSubjectsList = [];
  try {
    const parsed = savedDeletedSubjects ? JSON.parse(savedDeletedSubjects) : [];
    deletedSubjectsList = Array.isArray(parsed) ? parsed : [];
  } catch(e) {}

  const savedAddedSubjects = localStorage.getItem('addedSubjects');
  let addedSubjectsList = [];
  try {
    const parsed = savedAddedSubjects ? JSON.parse(savedAddedSubjects) : [];
    addedSubjectsList = Array.isArray(parsed) ? parsed : [];
  } catch(e) {}

  addedSubjectsList.forEach(item => {
    if (wings[item.wingId]) {
      wings[item.wingId].subjects.add(item.subject);
      if (!mapForUI[item.subject]) {
        mapForUI[item.subject] = {};
      }
    }
  });

  // Process live loadMaster entries to ensure dynamically added subjects/classes are mapped
  if (Array.isArray(loadMaster)) {
    loadMaster.forEach(item => {
      const cls = item.class_val;
      const subject = item.subject;
      const classId = item.class_id.toUpperCase();
      
      const wingDef = WING_DEFS.find(w => w.match(cls));
      if (wingDef) {
        wings[wingDef.id].subjects.add(subject);
        wings[wingDef.id].columns.add(classId);
        
        if (!mapForUI[subject]) {
          mapForUI[subject] = {};
        }
        if (mapForUI[subject][classId] === undefined) {
          mapForUI[subject][classId] = "";
        }
      }
    });
  }

  const savedDeletedTeachers = localStorage.getItem('deletedTeachers');
  let deletedTeachersList = [];
  try {
    const parsed = savedDeletedTeachers ? JSON.parse(savedDeletedTeachers) : [];
    deletedTeachersList = Array.isArray(parsed) ? parsed : [];
  } catch(e) {}

  const finalConfig = WING_DEFS.map(w => ({
    title: w.title,
    headerColor: w.headerColor,
    rowColor: w.rowColor,
    columns: Array.from(wings[w.id].columns).sort((a, b) => {
      const matchA = a.match(/^(\d+)(.*)$/);
      const matchB = b.match(/^(\d+)(.*)$/);
      if (matchA && matchB) {
        const numA = parseInt(matchA[1], 10);
        const numB = parseInt(matchB[1], 10);
        if (numA !== numB) return numA - numB;
        return matchA[2].localeCompare(matchB[2]);
      }
      return a.localeCompare(b);
    }),
    subjects: Array.from(wings[w.id].subjects).filter(s => !deletedSubjectsList.includes(s)).sort((a, b) => a.localeCompare(b))
  })).filter(w => w.columns.length > 0 && w.subjects.length > 0);

  // Remove deleted subjects from initialData
  Object.keys(mapForUI).forEach(subj => {
    if (deletedSubjectsList.includes(subj)) {
      delete mapForUI[subj];
    } else {
      // Also remove any permanently deleted teachers from the raw CSV data
      Object.keys(mapForUI[subj]).forEach(col => {
        const currentVal = mapForUI[subj][col] || "";
        if (currentVal) {
          const tokens = currentVal.split(',').map(t => t.trim());
          const newTokens = tokens.filter(t => !deletedTeachersList.includes(t));
          mapForUI[subj][col] = newTokens.join(', ');
        }
      });
    }
  });

  return { wings: finalConfig, initialData: mapForUI };
};

const TeacherSubjectMapping = () => {
  const { 
    teacherSubjectMap, 
    setTeacherSubjectMap, 
    timetables, 
    updateTeacherForSubject, 
    swapTeacherGlobal, 
    teachers, 
    addNewTeacher,
    deleteTeacher,
    renameSubjectGlobal,
    loadMaster
  } = useTimetable();
  const [config, setConfig] = useState(null);

  // ===== Quick Reassign Tool =====
  const [reassignMode, setReassignMode] = useState('teacher'); // 'teacher' | 'class'

  // --- Mode: Find & Replace Teacher ---
  const [findTeacher, setFindTeacher] = useState('');
  const [replaceTeacher, setReplaceTeacher] = useState('');
  const [checkedSlots, setCheckedSlots] = useState({});

  const foundSlots = useMemo(() => {
    if (!findTeacher || !teacherSubjectMap) return [];
    const slots = [];
    Object.entries(teacherSubjectMap).forEach(([subj, classMap]) => {
      Object.entries(classMap).forEach(([cls, teacherStr]) => {
        if (teacherStr) {
          const tokens = teacherStr.split(',').map(t => t.trim());
          if (tokens.includes(findTeacher)) {
            slots.push({ cls, subj, currentTeacher: teacherStr });
          }
        }
      });
    });
    return slots.sort((a, b) => {
      const numA = parseInt(a.cls); const numB = parseInt(b.cls);
      if (numA !== numB) return numA - numB;
      return a.cls.localeCompare(b.cls) || a.subj.localeCompare(b.subj);
    });
  }, [findTeacher, teacherSubjectMap]);

  const foundByClass = useMemo(() => {
    const g = {};
    foundSlots.forEach(s => { if (!g[s.cls]) g[s.cls] = []; g[s.cls].push(s); });
    return g;
  }, [foundSlots]);

  useEffect(() => {
    const c = {};
    foundSlots.forEach(s => { c[`${s.cls}|${s.subj}`] = true; });
    setCheckedSlots(c);
  }, [foundSlots]);

  // --- Mode: Assign by Class ---
  const [quickClassIds, setQuickClassIds] = useState([]);
  const [quickSelections, setQuickSelections] = useState({});
  const [quickNewTeacher, setQuickNewTeacher] = useState('');

  const allClasses = useMemo(() => {
    if (!config || !config.wings) return [];
    return config.wings.flatMap(w => w.columns).sort((a, b) => {
      const numA = parseInt(a); const numB = parseInt(b);
      if (numA === numB) return a.localeCompare(b);
      return numA - numB;
    });
  }, [config]);

  const classSubjectsMap = useMemo(() => {
    if (quickClassIds.length === 0) return {};
    const map = {};
    quickClassIds.forEach(clsId => {
      const targetScheduleKey = Object.keys(timetables).find(k => k.replace(/\s+/g, '').toUpperCase() === clsId);
      const schedule = targetScheduleKey ? timetables[targetScheduleKey] : null;
      const subjs = new Set();
      if (schedule) {
        schedule.forEach(slot => {
          if (slot.subject) {
            const subjectTokens = (slot.subject.toUpperCase() === 'A/C' || slot.subject.toUpperCase() === 'F/S')
              ? [slot.subject] : slot.subject.split('/').map(t => t.trim());
            subjectTokens.forEach(t => { if (t) subjs.add(t); });
          }
        });
      } else {
        const wing = config.wings.find(w => w.columns.includes(clsId));
        if (wing) wing.subjects.forEach(s => subjs.add(s));
      }
      map[clsId] = Array.from(subjs).sort();
    });
    return map;
  }, [quickClassIds, config, timetables]);

  useEffect(() => {
    setQuickSelections(prev => {
      const next = { ...prev }; let changed = false;
      Object.keys(next).forEach(cls => {
        if (!quickClassIds.includes(cls)) { delete next[cls]; changed = true; }
        else if (classSubjectsMap[cls]) {
          const v = next[cls].filter(s => classSubjectsMap[cls].includes(s));
          if (v.length !== next[cls].length) { next[cls] = v; changed = true; }
        }
      });
      return changed ? next : prev;
    });
  }, [quickClassIds, classSubjectsMap]);

  const toggleSelection = (setter, item) => {
    setter(prev => prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item]);
  };

  const toggleSubjectSelection = (clsId, subj) => {
    setQuickSelections(prev => {
      const classSelections = prev[clsId] || [];
      const newSelections = classSelections.includes(subj)
        ? classSelections.filter(s => s !== subj) : [...classSelections, subj];
      return { ...prev, [clsId]: newSelections };
    });
  };

  const allCurrentSubjects = useMemo(() => {
    if (!config || !config.wings) return [];
    const subjs = new Set();
    config.wings.forEach(w => {
      if (w.subjects) {
        w.subjects.forEach(s => subjs.add(s));
      }
    });
    return Array.from(subjs).sort();
  }, [config]);

  // Parse CSV and Initialize
  useEffect(() => {
    const parsed = parseCSVConfig(loadMaster);
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
            if (nextMap[subj][col] === undefined) {
              nextMap[subj][col] = parsed.initialData[subj][col];
              hasChanges = true;
            }
          });
        }
      });
      
      return hasChanges ? nextMap : prev;
    });
  }, [loadMaster]); // Re-run when loadMaster changes

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
        const subjectTokens = slot.subject.split('/').map(t => t.trim());
        let assignedTeachers = [];

        subjectTokens.forEach(token => {
          // Exact lookup only
          const mappedTeacher = teacherSubjectMap[token]?.[normalizedId];
          if (mappedTeacher) {
            assignedTeachers.push(mappedTeacher);
          }
        });

        // Remove duplicates
        assignedTeachers = [...new Set(assignedTeachers)];

        // Save into timetable
        if (assignedTeachers.length > 0) {
          updateTeacherForSubject(classId, slot.subject, assignedTeachers.join(','));
          count++;
        }
      });
    });
    alert(`Successfully synced ${count} slots to the live Timetable!`);
  };

  if (!config) return <div>Loading Matrix...</div>;

  return (
    <div style={{ paddingBottom: '3rem' }}>
      <datalist id="teacher-list">
        {teachers.map(t => <option key={t} value={t} />)}
      </datalist>

      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h1 className="page-title">Teacher Subject Mapping</h1>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button 
            className="btn btn-outline" 
            onClick={() => {
              if (window.confirm("This will wipe all customizations and perform a HARD RESTORE from the original CSV data. All deleted teachers and subjects will be restored. Are you absolutely sure?")) {
                localStorage.removeItem('deletedSubjects');
                localStorage.removeItem('deletedTeachers');
                localStorage.removeItem('addedSubjects');
                localStorage.removeItem('teacherSubjectMap');
                window.location.reload();
              }
            }}
            style={{ padding: '0.5rem 1rem', borderRadius: '6px', border: '1px solid #ef4444', color: '#b91c1c', cursor: 'pointer', fontWeight: 600, background: '#fef2f2' }}
            title="Restore deleted subjects and teachers from CSV"
          >
            Hard Restore Data
          </button>
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

      {/* Teacher Management Engines */}
      <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
        
        {/* Delete Subject and Teacher Initials */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', flex: '1', minWidth: '300px' }}>
          
          {/* Add Teacher */}
          <div style={{ background: '#f0fdf4', padding: '1.5rem', borderRadius: '8px', border: '1px solid #bbf7d0' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#166534', marginBottom: '0.5rem' }}>Add New Teacher</h3>
            <p style={{ fontSize: '0.875rem', color: '#15803d', margin: '0 0 1rem 0' }}>Register a brand new teacher's initials.</p>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input 
                id="new-teacher-initial" 
                type="text" 
                placeholder="e.g. AB" 
                style={{ flex: 1, padding: '0.5rem', border: '1px solid #86efac', borderRadius: '4px' }} 
              />
              <button 
                className="btn"
                style={{ background: '#22c55e', color: 'white', border: 'none', padding: '0.5rem 1rem', borderRadius: '4px', fontWeight: 600, cursor: 'pointer' }}
                onClick={() => {
                  const val = document.getElementById('new-teacher-initial').value;
                  if (!val) return;
                  if (teachers.includes(val.toUpperCase())) {
                    alert(`${val.toUpperCase()} is already in the system.`);
                    return;
                  }
                  addNewTeacher(val);
                  alert(`Added ${val.toUpperCase()} to the teacher list!`);
                  document.getElementById('new-teacher-initial').value = '';
                }}
              >
                Add
              </button>
            </div>
          </div>

          {/* Add Subject Row */}
          <div style={{ background: '#eff6ff', padding: '1.5rem', borderRadius: '8px', border: '1px solid #bfdbfe' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#1e40af', marginBottom: '0.5rem' }}>Add Subject Row</h3>
            <p style={{ fontSize: '0.875rem', color: '#2563eb', margin: '0 0 1rem 0' }}>Add a brand new subject row to the mapping grid.</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <select 
                id="add-subject-wing"
                style={{ width: '100%', padding: '0.5rem', border: '1px solid #bfdbfe', borderRadius: '4px', background: '#fff' }}
              >
                <option value="">- Select Wing -</option>
                <option value="primary">Primary Wing (Classes 1 - 5)</option>
                <option value="middle">Middle Wing (Classes 6 - 8)</option>
                <option value="secondary">Secondary Wing (Classes 9 - 10)</option>
                <option value="senior">Senior Secondary Wing (Classes 11 - 12)</option>
              </select>
              <input 
                id="add-subject-name" 
                type="text" 
                placeholder="e.g. Science" 
                style={{ width: '100%', padding: '0.5rem', border: '1px solid #bfdbfe', borderRadius: '4px' }} 
              />
              <button 
                className="btn"
                style={{ background: '#3b82f6', color: 'white', border: 'none', padding: '0.5rem 1rem', borderRadius: '4px', fontWeight: 600, cursor: 'pointer' }}
                onClick={() => {
                  const wingId = document.getElementById('add-subject-wing').value;
                  const subjectName = document.getElementById('add-subject-name').value.trim();
                  if (!wingId || !subjectName) {
                    alert("Please select a wing and enter a subject name.");
                    return;
                  }
                  
                  let exists = false;
                  config.wings.forEach(w => {
                    if (w.subjects.includes(subjectName)) {
                      exists = true;
                    }
                  });
                  if (exists) {
                    alert(`Subject "${subjectName}" already exists in the mapping grid.`);
                    return;
                  }

                  // 1. Add to addedSubjects in localStorage
                  const savedAddedSubjects = localStorage.getItem('addedSubjects');
                  const addedList = savedAddedSubjects ? JSON.parse(savedAddedSubjects) : [];
                  addedList.push({ subject: subjectName, wingId });
                  localStorage.setItem('addedSubjects', JSON.stringify(addedList));

                  // Remove from deleted list if it was deleted previously
                  const savedDeletedSubjects = localStorage.getItem('deletedSubjects');
                  if (savedDeletedSubjects) {
                    try {
                      let deletedList = JSON.parse(savedDeletedSubjects) || [];
                      if (deletedList.includes(subjectName)) {
                        deletedList = deletedList.filter(s => s !== subjectName);
                        localStorage.setItem('deletedSubjects', JSON.stringify(deletedList));
                      }
                    } catch (e) {}
                  }

                  // 2. Update config wings state
                  setConfig(prev => {
                    const newWings = prev.wings.map(w => {
                      if (w.id === wingId) {
                        return {
                          ...w,
                          subjects: [...new Set([...w.subjects, subjectName])].sort()
                        };
                      }
                      return w;
                    });
                    return { ...prev, wings: newWings };
                  });

                  // 3. Initialize mapping row
                  setTeacherSubjectMap(prev => {
                    const nextMap = { ...prev };
                    if (!nextMap[subjectName]) {
                      nextMap[subjectName] = {};
                    }
                    return nextMap;
                  });

                  alert(`Successfully added subject "${subjectName}" to the ${wingId} wing.`);
                  document.getElementById('add-subject-name').value = '';
                  document.getElementById('add-subject-wing').value = '';
                }}
              >
                Add Subject Row
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1rem' }}>
            {/* Delete Teacher */}
            <div style={{ background: '#fef2f2', padding: '1.5rem', borderRadius: '8px', border: '1px solid #fecaca', flex: 1 }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#991b1b', marginBottom: '0.5rem' }}>Delete Teacher</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <input 
                  id="delete-teacher-initial" 
                  type="text" 
                  list="teacher-list"
                  placeholder="- Select Teacher -" 
                  style={{ width: '100%', padding: '0.5rem', border: '1px solid #fca5a5', borderRadius: '4px' }} 
                />
                <button 
                  className="btn"
                  style={{ background: '#ef4444', color: 'white', border: 'none', padding: '0.5rem 1rem', borderRadius: '4px', fontWeight: 600, cursor: 'pointer' }}
                  onClick={() => {
                    const val = document.getElementById('delete-teacher-initial').value.trim().toUpperCase();
                    if (!val) return;
                    if (!teachers.includes(val)) {
                      alert(`Teacher ${val} is not currently in the system.`);
                      return;
                    }

                    // STRICT VALIDATION: Check if teacher still has assignments
                    let hasAssignments = false;
                    
                    // 1. Check Mapping Grid
                    Object.values(teacherSubjectMap).forEach(row => {
                      Object.values(row).forEach(cellVal => {
                        if (cellVal && cellVal.split(',').map(t => t.trim()).includes(val)) {
                          hasAssignments = true;
                        }
                      });
                    });

                    // 2. Check Live Timetables
                    Object.values(timetables).forEach(schedule => {
                      schedule.forEach(slot => {
                        if (slot.teacher && slot.teacher.split(',').map(t => t.trim()).includes(val)) {
                          hasAssignments = true;
                        }
                      });
                    });

                    if (hasAssignments) {
                      alert(`DENIED: Cannot delete ${val}!\n\nThis teacher still has active classes assigned in the Master Grid or Live Timetables. You MUST first use the 'Rename / Swap Teacher' engine to transfer their classes to a different teacher before they can be deleted.`);
                      return;
                    }

                    if (window.confirm(`This will permanently erase ${val} from the system. Are you sure?`)) {
                      deleteTeacher(val);
                      alert(`Successfully erased Teacher ${val} from the entire system.`);
                      document.getElementById('delete-teacher-initial').value = '';
                    }
                  }}
                >
                  Delete
                </button>
              </div>
            </div>

            {/* Delete Subject */}
            <div style={{ background: '#fffbeb', padding: '1.5rem', borderRadius: '8px', border: '1px solid #fde68a', flex: 1 }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#b45309', marginBottom: '0.5rem' }}>Delete Subject</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <select 
                  id="delete-subject-name" 
                  style={{ width: '100%', padding: '0.5rem', border: '1px solid #fcd34d', borderRadius: '4px', background: '#fff' }} 
                >
                  <option value="">- Select Subject -</option>
                  {allCurrentSubjects.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <button 
                  className="btn"
                  style={{ background: '#f59e0b', color: 'white', border: 'none', padding: '0.5rem 1rem', borderRadius: '4px', fontWeight: 600, cursor: 'pointer' }}
                  onClick={() => {
                    const val = document.getElementById('delete-subject-name').value;
                    if (!val) return;
                    if (window.confirm(`Are you sure you want to completely erase the subject "${val}" from the Mapping Grid?`)) {
                      const savedDeletedSubjects = localStorage.getItem('deletedSubjects');
                      const deletedSubjectsList = savedDeletedSubjects ? JSON.parse(savedDeletedSubjects) : [];
                      
                      if (!deletedSubjectsList.includes(val)) {
                        deletedSubjectsList.push(val);
                        localStorage.setItem('deletedSubjects', JSON.stringify(deletedSubjectsList));
                      }
                      
                      setTeacherSubjectMap(prev => {
                        const nextMap = { ...prev };
                        delete nextMap[val];
                        return nextMap;
                      });

                      setConfig(prev => {
                        const newWings = prev.wings.map(w => ({
                          ...w,
                          subjects: w.subjects.filter(s => s !== val)
                        })).filter(w => w.columns.length > 0 && w.subjects.length > 0);
                        return { ...prev, wings: newWings };
                      });

                      alert(`Successfully deleted the subject "${val}".`);
                      document.getElementById('delete-subject-name').value = '';
                    }
                  }}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Teacher & Subject Swapping / Renaming Engines */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', flex: '2', minWidth: '500px' }}>
          {/* Rename / Swap Teacher */}
          <div style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#1e293b', marginBottom: '0.5rem' }}>Rename / Swap Teacher</h3>
            <p style={{ fontSize: '0.875rem', color: '#64748b', margin: '0 0 1rem 0' }}>Rename a teacher's initials, or swap an old teacher with a new one globally across all timetables.</p>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end' }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: '0.25rem' }}>Old Initials</label>
                <input 
                  id="swap-old-teacher" 
                  type="text" 
                  list="teacher-list"
                  placeholder="- Select Old Initial -" 
                  style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '4px' }} 
                />
              </div>
              <div style={{ paddingBottom: '0.5rem', color: '#64748b', fontWeight: 'bold' }}>→</div>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: '0.25rem' }}>New Initials</label>
                <input 
                  id="swap-new-teacher" 
                  type="text" 
                  list="teacher-list"
                  placeholder="- Type New Initial -" 
                  style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '4px' }} 
                />
              </div>
              <button 
                className="btn"
                style={{ background: '#3b82f6', color: 'white', border: 'none', padding: '0.5rem 1.5rem', borderRadius: '4px', fontWeight: 600, cursor: 'pointer', height: '37px' }}
                onClick={() => {
                  const oldT = document.getElementById('swap-old-teacher').value.trim().toUpperCase();
                  const newT = document.getElementById('swap-new-teacher').value.trim().toUpperCase();
                  if (!oldT || !newT) {
                    alert("Please enter both the old and new teacher initials.");
                    return;
                  }
                  if (window.confirm(`Are you sure you want to completely replace/rename ${oldT} to ${newT} everywhere?`)) {
                    
                    // Ensure new teacher is saved to the list too
                    addNewTeacher(newT);

                    // 1. Swap in the Mapping Grid
                    setTeacherSubjectMap(prev => {
                      const nextMap = JSON.parse(JSON.stringify(prev));
                      Object.keys(nextMap).forEach(subj => {
                        Object.keys(nextMap[subj]).forEach(col => {
                          const currentVal = nextMap[subj][col] || "";
                          if (currentVal) {
                            const tokens = currentVal.split(',').map(t => t.trim());
                            if (tokens.includes(oldT)) {
                              const newTokens = tokens.map(t => t === oldT ? newT : t);
                              nextMap[subj][col] = newTokens.join(', ');
                            }
                          }
                        });
                      });
                      return nextMap;
                    });

                    // 2. Swap directly in the Live Timetable
                    swapTeacherGlobal(oldT, newT);
                    
                    // 3. Remove the old teacher from the system completely
                    deleteTeacher(oldT);
                    
                    alert(`Successfully renamed Teacher ${oldT} to ${newT} everywhere!`);
                    document.getElementById('swap-old-teacher').value = '';
                    document.getElementById('swap-new-teacher').value = '';
                  }
                }}
              >
                Rename / Swap
              </button>
            </div>
          </div>

          {/* Rename Subject Globally */}
          <div style={{ background: '#f0fdfa', padding: '1.5rem', borderRadius: '8px', border: '1px solid #99f6e4' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#0f766e', marginBottom: '0.5rem' }}>Rename Subject Globally</h3>
            <p style={{ fontSize: '0.875rem', color: '#0d9488', margin: '0 0 1rem 0' }}>Rename a subject globally across the Mapping Grid, Load Master, and Live Timetable.</p>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end' }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#0f766e', marginBottom: '0.25rem' }}>Old Subject Name</label>
                <input 
                  id="rename-old-subject" 
                  type="text" 
                  placeholder="- e.g. English_Lit -" 
                  style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '4px' }} 
                />
              </div>
              <div style={{ paddingBottom: '0.5rem', color: '#0d9488', fontWeight: 'bold' }}>→</div>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#0f766e', marginBottom: '0.25rem' }}>New Subject Name</label>
                <input 
                  id="rename-new-subject" 
                  type="text" 
                  placeholder="- Type New Name -" 
                  style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '4px' }} 
                />
              </div>
              <button 
                className="btn"
                style={{ background: '#0d9488', color: 'white', border: 'none', padding: '0.5rem 1.5rem', borderRadius: '4px', fontWeight: 600, cursor: 'pointer', height: '37px' }}
                onClick={() => {
                  const oldSubj = document.getElementById('rename-old-subject').value.trim();
                  const newSubj = document.getElementById('rename-new-subject').value.trim();
                  if (!oldSubj || !newSubj) {
                    alert("Please enter both the old and new subject names.");
                    return;
                  }
                  
                  // Find if subject exists in any wing
                  let subjectExists = false;
                  config.wings.forEach(w => {
                    if (w.subjects.includes(oldSubj)) {
                      subjectExists = true;
                    }
                  });
                  
                  if (!subjectExists) {
                    alert(`Subject "${oldSubj}" is not in the Mapping Grid.`);
                    return;
                  }
                  
                  if (window.confirm(`Are you sure you want to rename "${oldSubj}" to "${newSubj}" globally?`)) {
                    // 1. Rename in Timetable and Load Master globally
                    renameSubjectGlobal(oldSubj, newSubj);
                    
                    // 2. Rename in config wings to update UI grid display
                    setConfig(prev => {
                      const newWings = prev.wings.map(w => ({
                        ...w,
                        subjects: w.subjects.map(s => s === oldSubj ? newSubj : s)
                      }));
                      return { ...prev, wings: newWings };
                    });

                    // 3. Update deleted subjects list in localStorage if it was previously there
                    const savedDeletedSubjects = localStorage.getItem('deletedSubjects');
                    if (savedDeletedSubjects) {
                      try {
                        let deletedList = JSON.parse(savedDeletedSubjects) || [];
                        if (deletedList.includes(oldSubj)) {
                          deletedList = deletedList.map(s => s === oldSubj ? newSubj : s);
                          localStorage.setItem('deletedSubjects', JSON.stringify(deletedList));
                        }
                      } catch (e) {}
                    }
                    
                    alert(`Successfully renamed subject "${oldSubj}" to "${newSubj}" globally!`);
                    document.getElementById('rename-old-subject').value = '';
                    document.getElementById('rename-new-subject').value = '';
                  }
                }}
              >
                Rename Subject
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ===== Quick Teacher Reassign Tool ===== */}
      <div style={{ background: '#f5f3ff', padding: '1.5rem', borderRadius: '8px', border: '1px solid #ddd6fe', marginBottom: '2rem', width: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#5b21b6', margin: 0 }}>Quick Teacher Reassign</h3>
          <button onClick={() => { setFindTeacher(''); setReplaceTeacher(''); setCheckedSlots({}); setQuickClassIds([]); setQuickSelections({}); setQuickNewTeacher(''); }}
            style={{ background: '#e0e7ff', color: '#4f46e5', border: 'none', padding: '0.35rem 0.75rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}>
            Clear All
          </button>
        </div>

        {/* Mode Tabs */}
        <div style={{ display: 'flex', gap: '0', marginBottom: '1.5rem', borderBottom: '2px solid #ddd6fe' }}>
          {[{ id: 'teacher', label: 'Find & Replace Teacher' }, { id: 'class', label: 'Assign by Class' }].map(tab => (
            <button key={tab.id} onClick={() => setReassignMode(tab.id)}
              style={{ padding: '0.5rem 1.25rem', border: 'none', borderBottom: reassignMode === tab.id ? '3px solid #7c3aed' : '3px solid transparent', background: 'transparent', color: reassignMode === tab.id ? '#5b21b6' : '#94a3b8', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer', transition: 'all 0.2s', marginBottom: '-2px' }}>
              {tab.label}
            </button>
          ))}
        </div>

        {/* ========== MODE: Find & Replace Teacher ========== */}
        {reassignMode === 'teacher' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <p style={{ fontSize: '0.85rem', color: '#7c3aed', margin: 0 }}>Type a teacher's initials to see everywhere they're assigned. Check the slots you want to change, then type the replacement.</p>

            {/* Step 1: Find Teacher */}
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#5b21b6', marginBottom: '0.5rem' }}>1. Teacher to Replace</label>
              <input type="text" list="teacher-list" value={findTeacher}
                onChange={(e) => setFindTeacher(e.target.value.toUpperCase().trim())}
                placeholder="Type initials (e.g. AK)" 
                style={{ width: '200px', padding: '0.5rem', border: '1px solid #c4b5fd', borderRadius: '4px', outline: 'none', fontWeight: 600 }} />
            </div>

            {/* Step 2: Found Assignments */}
            {findTeacher && foundSlots.length > 0 && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#5b21b6' }}>2. Found {foundSlots.length} assignment(s) — uncheck slots you want to keep</label>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button onClick={() => { const c = {}; foundSlots.forEach(s => { c[`${s.cls}|${s.subj}`] = true; }); setCheckedSlots(c); }}
                      style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem', border: '1px solid #c4b5fd', borderRadius: '3px', background: '#fff', color: '#5b21b6', cursor: 'pointer', fontWeight: 600 }}>
                      Check All
                    </button>
                    <button onClick={() => setCheckedSlots({})}
                      style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem', border: '1px solid #c4b5fd', borderRadius: '3px', background: '#fff', color: '#5b21b6', cursor: 'pointer', fontWeight: 600 }}>
                      Uncheck All
                    </button>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '280px', overflowY: 'auto', padding: '1rem', border: '1px solid #c4b5fd', borderRadius: '6px', background: '#fff' }}>
                  {Object.entries(foundByClass).map(([cls, slots]) => (
                    <div key={cls} style={{ borderBottom: '1px dashed #e2e8f0', paddingBottom: '0.5rem' }}>
                      <div style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#475569', marginBottom: '0.4rem' }}>Class {cls}:</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                        {slots.map(slot => {
                          const key = `${slot.cls}|${slot.subj}`;
                          const isChecked = !!checkedSlots[key];
                          return (
                            <label key={key}
                              style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', padding: '0.3rem 0.6rem', borderRadius: '6px', cursor: 'pointer', border: isChecked ? '2px solid #7c3aed' : '1px solid #e2e8f0', background: isChecked ? '#ede9fe' : '#f8fafc', transition: 'all 0.15s', minWidth: '100px' }}>
                              <input type="checkbox" checked={isChecked} onChange={(e) => setCheckedSlots(prev => ({ ...prev, [key]: e.target.checked }))} style={{ accentColor: '#7c3aed' }} />
                              <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#1e293b' }}>{slot.subj}</span>
                                <span style={{ fontSize: '0.6rem', color: '#64748b' }}>{slot.currentTeacher}</span>
                              </div>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {findTeacher && foundSlots.length === 0 && (
              <div style={{ padding: '1rem', background: '#fef2f2', borderRadius: '6px', border: '1px solid #fecaca', color: '#991b1b', fontSize: '0.85rem' }}>
                No assignments found for teacher <strong>{findTeacher}</strong>. Check spelling or try a different initial.
              </div>
            )}

            {/* Step 3: Replace With */}
            {Object.values(checkedSlots).some(v => v) && (
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end' }}>
                <div style={{ flex: 1, maxWidth: '200px' }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#5b21b6', marginBottom: '0.5rem' }}>3. Replace with</label>
                  <input type="text" list="teacher-list" value={replaceTeacher}
                    onChange={(e) => setReplaceTeacher(e.target.value.toUpperCase())}
                    placeholder="New initials (e.g. BK)" 
                    style={{ width: '100%', padding: '0.5rem', border: '1px solid #c4b5fd', borderRadius: '4px', outline: 'none', fontWeight: 600 }} />
                </div>
                <button className="btn" disabled={!replaceTeacher.trim()}
                  style={{ background: replaceTeacher.trim() ? '#7c3aed' : '#c4b5fd', color: 'white', border: 'none', padding: '0.5rem 1.5rem', borderRadius: '4px', fontWeight: 600, cursor: replaceTeacher.trim() ? 'pointer' : 'not-allowed', height: '37px' }}
                  onClick={() => {
                    const newT = replaceTeacher.trim().toUpperCase();
                    if (!newT) return;
                    if (!teachers.includes(newT)) {
                      if (!window.confirm(`Teacher ${newT} is not in the system. Add them and proceed?`)) return;
                      addNewTeacher(newT);
                    }
                    const slotsToChange = foundSlots.filter(s => checkedSlots[`${s.cls}|${s.subj}`]);
                    setTeacherSubjectMap(prev => {
                      const next = { ...prev };
                      slotsToChange.forEach(slot => {
                        const current = next[slot.subj]?.[slot.cls] || '';
                        const tokens = current.split(',').map(t => t.trim());
                        const replaced = tokens.map(t => t === findTeacher ? newT : t);
                        const deduped = [...new Set(replaced)];
                        if (!next[slot.subj]) next[slot.subj] = {};
                        next[slot.subj][slot.cls] = deduped.join(', ');
                      });
                      return next;
                    });
                    alert(`Replaced ${findTeacher} → ${newT} in ${slotsToChange.length} slot(s)!\nRemember to click "Sync to Timetable" to push changes.`);
                    setFindTeacher(''); setReplaceTeacher(''); setCheckedSlots({});
                  }}>
                  Apply Replacement
                </button>
              </div>
            )}
          </div>
        )}

        {/* ========== MODE: Assign by Class ========== */}
        {reassignMode === 'class' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <p style={{ fontSize: '0.85rem', color: '#7c3aed', margin: 0 }}>Select classes, pick subjects, and assign a teacher directly.</p>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#5b21b6', marginBottom: '0.5rem' }}>1. Select Class(es)</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', maxHeight: '120px', overflowY: 'auto', padding: '0.5rem', border: '1px solid #c4b5fd', borderRadius: '6px', background: '#fff' }}>
                {allClasses.map(cls => (
                  <button key={cls} onClick={() => toggleSelection(setQuickClassIds, cls)}
                    style={{ padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', border: quickClassIds.includes(cls) ? 'none' : '1px solid #ddd6fe', background: quickClassIds.includes(cls) ? '#7c3aed' : '#fff', color: quickClassIds.includes(cls) ? '#fff' : '#6d28d9', transition: 'all 0.2s' }}>
                    {cls}
                  </button>
                ))}
              </div>
            </div>
            {quickClassIds.length > 0 && (
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#5b21b6', marginBottom: '0.5rem' }}>2. Select Subject(s) per Class</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '300px', overflowY: 'auto', padding: '1rem', border: '1px solid #c4b5fd', borderRadius: '6px', background: '#fff' }}>
                  {quickClassIds.map(cls => (
                    <div key={cls} style={{ borderBottom: '1px dashed #e2e8f0', paddingBottom: '0.75rem' }}>
                      <div style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#475569', marginBottom: '0.5rem' }}>Class {cls} Subjects:</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                        {(classSubjectsMap[cls] || []).map(subj => {
                          const isSelected = (quickSelections[cls] || []).includes(subj);
                          const currentTeacher = teacherSubjectMap[subj]?.[cls] || "—";
                          return (
                            <button key={subj} onClick={() => toggleSubjectSelection(cls, subj)}
                              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '0.35rem 0.6rem', borderRadius: '6px', cursor: 'pointer', border: isSelected ? 'none' : '1px solid #ddd6fe', background: isSelected ? '#8b5cf6' : '#fff', color: isSelected ? '#fff' : '#5b21b6', transition: 'all 0.2s', minWidth: '80px' }}>
                              <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>{subj}</span>
                              <span style={{ fontSize: '0.65rem', fontWeight: 600, opacity: 0.6 }}>({currentTeacher})</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {Object.values(quickSelections).some(arr => arr.length > 0) && (
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end' }}>
                <div style={{ flex: 1, maxWidth: '300px' }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#5b21b6', marginBottom: '0.5rem' }}>3. Assign Teacher (use commas for multiple)</label>
                  <input type="text" list="teacher-list" value={quickNewTeacher} onChange={(e) => setQuickNewTeacher(e.target.value.toUpperCase())}
                    placeholder="e.g. AK or AK, BK, CK" style={{ width: '100%', padding: '0.5rem', border: '1px solid #c4b5fd', borderRadius: '4px', outline: 'none' }} />
                </div>
                <button className="btn" disabled={!quickNewTeacher}
                  style={{ background: quickNewTeacher ? '#7c3aed' : '#c4b5fd', color: 'white', border: 'none', padding: '0.5rem 1.5rem', borderRadius: '4px', fontWeight: 600, cursor: quickNewTeacher ? 'pointer' : 'not-allowed', height: '37px' }}
                  onClick={() => {
                    const newT = quickNewTeacher.trim().toUpperCase();
                    if (!newT) return;
                    const teacherTokens = newT.split(',').map(t => t.trim()).filter(Boolean);
                    const missing = teacherTokens.filter(t => !teachers.includes(t));
                    if (missing.length > 0) {
                      if (!window.confirm(`Teacher(s) ${missing.join(', ')} not in system. Add them?`)) return;
                      missing.forEach(t => addNewTeacher(t));
                    }
                    const formatted = teacherTokens.join(', ');
                    setTeacherSubjectMap(prev => {
                      const nextMap = { ...prev };
                      Object.entries(quickSelections).forEach(([cls, subjects]) => {
                        subjects.forEach(subj => { if (!nextMap[subj]) nextMap[subj] = {}; nextMap[subj][cls] = formatted; });
                      });
                      return nextMap;
                    });
                    const total = Object.values(quickSelections).reduce((a, c) => a + c.length, 0);
                    alert(`Assigned "${formatted}" to ${total} slot(s)! Click "Sync to Timetable" to push changes.`);
                    setQuickClassIds([]); setQuickSelections({}); setQuickNewTeacher('');
                  }}>
                  Apply Assignment
                </button>
              </div>
            )}
          </div>
        )}
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
                              list="teacher-list"
                              value={val}
                              onChange={(e) => handleCellChange(subject, col, e.target.value.toUpperCase())}
                              placeholder="-"
                              title="Click to Edit Teacher"
                              style={{
                                width: '100%',
                                height: '100%',
                                minHeight: '36px',
                                padding: '4px',
                                border: '1px solid transparent',
                                borderBottom: '1px solid #cbd5e1',
                                background: '#ffffff',
                                textAlign: 'center',
                                outline: 'none',
                                fontWeight: val ? '600' : 'normal',
                                color: '#0f172a',
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                              }}
                              onMouseOver={(e) => { e.target.style.border = '1px solid #3b82f6'; e.target.style.background = '#eff6ff'; }}
                              onMouseOut={(e) => { e.target.style.border = '1px solid transparent'; e.target.style.borderBottom = '1px solid #cbd5e1'; e.target.style.background = '#ffffff'; }}
                              onFocus={(e) => { e.target.style.border = '2px solid #2563eb'; e.target.style.background = '#ffffff'; }}
                              onBlur={(e) => { e.target.style.border = '1px solid transparent'; e.target.style.borderBottom = '1px solid #cbd5e1'; e.target.style.background = '#ffffff'; }}
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
