import React, { createContext, useState, useEffect, useContext, useRef, useCallback } from 'react';

// Data imports (Using the extracted JSON data as initial state)
import initialLoadMaster from '../data/load_master.json';
import initialTimetables from '../data/timetables.json';
import initialTeachers from '../data/teachers.json';
import initialTeacherSlotUsage from '../data/teacher_slot_usage.json';
import initialTeacherMapping from '../data/teacher_mapping.json';
import { checkTeacherCollision as engineCheckTeacherCollision } from '../services/collisionEngine';
import { generateTeacherUsageGrid } from '../services/derivedViewEngine';
import { rawCsvData } from '../data/csvData';
import { syncService } from '../services/syncService';

const parseCSVInitialData = () => {
  try {
    const rows = rawCsvData.split('\n').filter(r => r.trim());
    const dataRows = rows.slice(1);
    const mapForUI = {};

    dataRows.forEach(row => {
      const matches = row.match(/(".*?"|[^",]+)(?=\s*,|\s*$)/g);
      if (!matches || matches.length < 4) return;
      
      let [rawSubject, cls, section, rawTeacher] = matches.map(m => m.replace(/^"|"$/g, '').trim());
      const classId = `${cls}${section}`.toUpperCase();
      
      const subjectTokens = (rawSubject.toUpperCase() === 'A/C' || rawSubject.toUpperCase() === 'F/S')
        ? [rawSubject]
        : rawSubject.split('/').map(t => t.trim());
      const teacherTokens = rawTeacher.split(',').map(t => t.trim());
      
      subjectTokens.forEach((subjectToken, index) => {
        if (!mapForUI[subjectToken]) mapForUI[subjectToken] = {};
        
        const teacherForSubject = teacherTokens.length > 1 && teacherTokens.length === subjectTokens.length
          ? teacherTokens[index]
          : rawTeacher;
          
        mapForUI[subjectToken][classId] = teacherForSubject;
      });
    });
    return mapForUI;
  } catch (e) {
    console.error("Error parsing initial CSV in context", e);
    return {};
  }
};

const TimetableContext = createContext();

export const useTimetable = () => useContext(TimetableContext);

export const TimetableProvider = ({ children }) => {
  const [timetables, setTimetables] = useState({});
  const [loadMaster, setLoadMaster] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [classes, setClasses] = useState([]);
  const [teacherSlotUsage, setTeacherSlotUsage] = useState({});
  const [masterClasses, setMasterClasses] = useState([]);
  const [substitutions, setSubstitutions] = useState({});
  const [absentTeachers, setAbsentTeachers] = useState({});
  const [teacherMapping, setTeacherMapping] = useState(initialTeacherMapping);
  const [teacherSubjectMap, setTeacherSubjectMap] = useState(() => {
    const item = localStorage.getItem('teacherSubjectMap');
    if (!item || item === "undefined" || item === "null" || item === "[object Object]") {
      return parseCSVInitialData();
    }
    try {
      const parsed = JSON.parse(item);
      return parsed === null ? parseCSVInitialData() : parsed;
    } catch (e) {
      return parseCSVInitialData();
    }
  });

  // Sync service state
  const [syncStatus, setSyncStatus] = useState('idle'); // 'idle' | 'synced' | 'receiving'
  const syncReady = useRef(false);   // only push after initial hydration
  const syncPushTimer = useRef(null);

  useEffect(() => {
    // Helper function to safely parse JSON from localStorage
    const safeJSONParse = (key, fallback) => {
      const item = localStorage.getItem(key);
      if (!item || item === "undefined" || item === "null" || item === "[object Object]") return fallback;
      try {
        const parsed = JSON.parse(item);
        if (parsed === null) return fallback;
        return parsed;
      } catch (e) {
        console.warn(`Corrupted localStorage data for key: ${key}. Resetting to default.`);
        return fallback;
      }
    };

    const currentTT = safeJSONParse('timetables', initialTimetables);
    setTimetables(currentTT);

    setLoadMaster(safeJSONParse('loadMaster', initialLoadMaster));
    setTeacherSlotUsage(safeJSONParse('teacherSlotUsage', initialTeacherSlotUsage));
    
    const savedSubstitutions = safeJSONParse('substitutions', null);
    if (savedSubstitutions) setSubstitutions(savedSubstitutions);
    
    const savedAbsentTeachers = safeJSONParse('absentTeachers', null);
    if (savedAbsentTeachers) setAbsentTeachers(savedAbsentTeachers);
    
    
    const customTeachers = safeJSONParse('addedTeachers', []);
    const deletedTeachersList = safeJSONParse('deletedTeachers', []);

    const validInitial = initialTeachers.filter(t => !deletedTeachersList.includes(t));
    const validCustom = customTeachers.filter(t => !deletedTeachersList.includes(t));

    setTeachers([...new Set([...validInitial, ...validCustom])].sort());
    
    const savedMasterClasses = safeJSONParse('masterClasses', null);
    if (savedMasterClasses) {
      setMasterClasses(savedMasterClasses);
      setClasses(Object.keys(currentTT));
    } else {
      // Derive initial master classes from currentTT
      const derived = {};
      Object.keys(currentTT).forEach(classId => {
        // e.g. "1a" -> "1", "a"
        const match = classId.match(/^(\d+)(.*)$/i);
        let cName = classId;
        let sName = "";
        if (match) {
          cName = match[1];
          sName = match[2].trim().toUpperCase(); // store sections as uppercase
        }
        if (!derived[cName]) derived[cName] = new Set();
        if (sName) derived[cName].add(sName);
      });
      const initialMaster = Object.keys(derived).map(k => ({
        className: k,
        sections: Array.from(derived[k])
      }));
      setMasterClasses(initialMaster);
      setClasses(Object.keys(currentTT));
    }
    syncReady.current = true;
  }, []);

  // ── Sync Service: receive remote changes ──────────────────────────────────
  const onRemoteChange = useCallback((payload) => {
    setSyncStatus('receiving');

    if (payload.timetables && typeof payload.timetables === 'object') {
      setTimetables(payload.timetables);
      localStorage.setItem('timetables', JSON.stringify(payload.timetables));
    }
    if (payload.teacherSubjectMap && typeof payload.teacherSubjectMap === 'object') {
      setTeacherSubjectMap(payload.teacherSubjectMap);
      localStorage.setItem('teacherSubjectMap', JSON.stringify(payload.teacherSubjectMap));
    }
    if (Array.isArray(payload.loadMaster)) {
      setLoadMaster(payload.loadMaster);
      localStorage.setItem('loadMaster', JSON.stringify(payload.loadMaster));
    }
    if (Array.isArray(payload.masterClasses)) {
      setMasterClasses(payload.masterClasses);
      localStorage.setItem('masterClasses', JSON.stringify(payload.masterClasses));
      // Derive classes from updated masterClasses
      const classIds = [];
      payload.masterClasses.forEach(mc => {
        if (mc.sections && mc.sections.length > 0) {
          mc.sections.forEach(sec => classIds.push(`${mc.className}${sec.toLowerCase()}`));
        } else {
          classIds.push(mc.className);
        }
      });
      setClasses(classIds);
    }
    if (payload.substitutions && typeof payload.substitutions === 'object') {
      setSubstitutions(payload.substitutions);
      localStorage.setItem('substitutions', JSON.stringify(payload.substitutions));
    }
    if (payload.absentTeachers && typeof payload.absentTeachers === 'object') {
      setAbsentTeachers(payload.absentTeachers);
      localStorage.setItem('absentTeachers', JSON.stringify(payload.absentTeachers));
    }

    setTimeout(() => setSyncStatus('synced'), 400);
    setTimeout(() => setSyncStatus('idle'), 2500);
  }, []);

  useEffect(() => {
    syncService.init(onRemoteChange);
    return () => syncService.destroy();
  }, [onRemoteChange]);

  // ── Sync Service: push local changes (debounced 800ms) ───────────────────
  const debouncedPush = useCallback((payload) => {
    if (!syncReady.current) return;
    clearTimeout(syncPushTimer.current);
    syncPushTimer.current = setTimeout(() => {
      syncService.push(payload);
      setSyncStatus('synced');
      setTimeout(() => setSyncStatus('idle'), 2000);
    }, 800);
  }, []);

  useEffect(() => {
    if (!syncReady.current || Object.keys(timetables).length === 0) return;
    debouncedPush({ timetables });
  }, [timetables, debouncedPush]);

  useEffect(() => {
    if (!syncReady.current || !teacherSubjectMap || Object.keys(teacherSubjectMap).length === 0) return;
    debouncedPush({ teacherSubjectMap });
  }, [teacherSubjectMap, debouncedPush]);

  useEffect(() => {
    if (!syncReady.current || loadMaster.length === 0) return;
    debouncedPush({ loadMaster });
  }, [loadMaster, debouncedPush]);

  useEffect(() => {
    if (!syncReady.current || masterClasses.length === 0) return;
    debouncedPush({ masterClasses });
  }, [masterClasses, debouncedPush]);

  useEffect(() => {
    if (!syncReady.current) return;
    debouncedPush({ substitutions, absentTeachers });
  }, [substitutions, absentTeachers, debouncedPush]);

  // Save to local storage whenever state changes
  useEffect(() => {
    if (Object.keys(timetables).length > 0) {
      localStorage.setItem('timetables', JSON.stringify(timetables));
      
      // Dynamically update teachers list based on assigned timetables
      const savedAddedTeachers = localStorage.getItem('addedTeachers');
      const customTeachers = savedAddedTeachers ? JSON.parse(savedAddedTeachers) : [];

      const savedDeletedTeachers = localStorage.getItem('deletedTeachers');
      const deletedTeachers = savedDeletedTeachers ? JSON.parse(savedDeletedTeachers) : [];
      
      const validInitial = initialTeachers.filter(t => !deletedTeachers.includes(t));
      const validCustom = customTeachers.filter(t => !deletedTeachers.includes(t));

      const dynamicTeachers = new Set([...validInitial, ...validCustom]);
      
      Object.values(timetables).forEach(schedule => {
        schedule.forEach(slot => {
          if (slot.teacher) {
            slot.teacher.split(',').forEach(t => {
              const cleanT = t.trim();
              if (cleanT && cleanT.toLowerCase() !== 'nan' && cleanT !== '0' && !deletedTeachers.includes(cleanT)) {
                dynamicTeachers.add(cleanT);
              }
            });
          }
        });
      });
      setTeachers(Array.from(dynamicTeachers).sort());
    }
  }, [timetables]);

  const addNewTeacher = (initials) => {
    const formatted = initials.trim().toUpperCase();
    if (!formatted) return;

    const savedAddedTeachers = localStorage.getItem('addedTeachers');
    const customTeachers = savedAddedTeachers ? JSON.parse(savedAddedTeachers) : [];
    
    // Make sure it's removed from deletedTeachers if they re-add it!
    const savedDeletedTeachers = localStorage.getItem('deletedTeachers');
    let deletedTeachers = savedDeletedTeachers ? JSON.parse(savedDeletedTeachers) : [];
    if (deletedTeachers.includes(formatted)) {
      deletedTeachers = deletedTeachers.filter(t => t !== formatted);
      localStorage.setItem('deletedTeachers', JSON.stringify(deletedTeachers));
    }

    if (!customTeachers.includes(formatted)) {
      customTeachers.push(formatted);
      localStorage.setItem('addedTeachers', JSON.stringify(customTeachers));
      setTeachers(prev => {
        const next = new Set([...prev, formatted]);
        return Array.from(next).sort();
      });
    }
  };

  const deleteTeacher = (initials) => {
    const formatted = initials.trim().toUpperCase();
    if (!formatted) return;

    // 1. Remove from addedTeachers
    const savedAddedTeachers = localStorage.getItem('addedTeachers');
    let customTeachers = savedAddedTeachers ? JSON.parse(savedAddedTeachers) : [];
    customTeachers = customTeachers.filter(t => t !== formatted);
    localStorage.setItem('addedTeachers', JSON.stringify(customTeachers));
    
    // 1.5 Add to deletedTeachers to ensure it overrides initialTeachers
    const savedDeletedTeachers = localStorage.getItem('deletedTeachers');
    const deletedTeachersList = savedDeletedTeachers ? JSON.parse(savedDeletedTeachers) : [];
    if (!deletedTeachersList.includes(formatted)) {
      deletedTeachersList.push(formatted);
      localStorage.setItem('deletedTeachers', JSON.stringify(deletedTeachersList));
    }

    // 2. Remove from active state
    setTeachers(prev => prev.filter(t => t !== formatted));

    // 3. Remove from teacherSubjectMap
    setTeacherSubjectMap(prev => {
      const nextMap = JSON.parse(JSON.stringify(prev));
      Object.keys(nextMap).forEach(subj => {
        Object.keys(nextMap[subj]).forEach(col => {
          const currentVal = nextMap[subj][col] || "";
          if (currentVal) {
            const tokens = currentVal.split(',').map(t => t.trim());
            const newTokens = tokens.filter(t => t !== formatted);
            nextMap[subj][col] = newTokens.join(', ');
          }
        });
      });
      return nextMap;
    });

    // 4. Remove from timetables
    setTimetables(prev => {
      const nextTT = { ...prev };
      Object.keys(nextTT).forEach(classId => {
        const classSchedule = [...nextTT[classId]];
        let updated = false;
        
        const updatedSchedule = classSchedule.map(slot => {
          if (!slot.teacher) return slot;
          const currentTeachers = slot.teacher.split(',').map(t => t.trim());
          if (currentTeachers.includes(formatted)) {
            const newTeacherList = currentTeachers.filter(t => t !== formatted);
            updated = true;
            return { 
              ...slot, 
              teacher: newTeacherList.join(', '), 
              assignedTeachers: newTeacherList 
            };
          }
          return slot;
        });
        
        if (updated) {
          nextTT[classId] = updatedSchedule;
        }
      });
      return nextTT;
    });
  };

  useEffect(() => {
    if (loadMaster.length > 0) {
      localStorage.setItem('loadMaster', JSON.stringify(loadMaster));
    }
  }, [loadMaster]);

  useEffect(() => {
    if (Object.keys(teacherSlotUsage).length > 0) {
      localStorage.setItem('teacherSlotUsage', JSON.stringify(teacherSlotUsage));
    }
  }, [teacherSlotUsage]);

  useEffect(() => {
    if (masterClasses.length > 0) {
      localStorage.setItem('masterClasses', JSON.stringify(masterClasses));
    }
  }, [masterClasses]);

  useEffect(() => {
    localStorage.setItem('substitutions', JSON.stringify(substitutions));
  }, [substitutions]);

  useEffect(() => {
    localStorage.setItem('absentTeachers', JSON.stringify(absentTeachers));
  }, [absentTeachers]);

  useEffect(() => {
    if (teacherSubjectMap && Object.keys(teacherSubjectMap).length > 0) {
      localStorage.setItem('teacherSubjectMap', JSON.stringify(teacherSubjectMap));
    }
  }, [teacherSubjectMap]);

  // Logic: Check for teacher collision using the engine
  const checkTeacherCollision = (teacherStr, day, period, currentClass) => {
    if (!teacherStr) return false;
    const currentTeachers = teacherStr.split(',').map(t => t.trim().toLowerCase()).filter(Boolean);
    if (currentTeachers.length === 0) return false;
    
    for (const t of currentTeachers) {
      const collisionClass = engineCheckTeacherCollision(t, day, period, currentClass, timetables);
      if (collisionClass) return collisionClass;
    }
    return false;
  };

  const getAllowedSubjectsForClass = (classId) => {
    const normalizedClassId = classId.replace(/\s+/g, '').toUpperCase();
    const subjects = new Set();
    
    // 1. From loadMaster
    loadMaster.forEach(l => {
      if (l.class_id.toUpperCase() === normalizedClassId) {
        subjects.add(l.subject);
      }
    });
    
    // 2. From teacherSubjectMap
    if (teacherSubjectMap) {
      Object.keys(teacherSubjectMap).forEach(subj => {
        if (teacherSubjectMap[subj][normalizedClassId]) {
          subjects.add(subj);
        }
      });
    }
    
    return Array.from(subjects).sort();
  };

  // Update a specific slot in a class timetable
  const updateSlot = (classId, day, period, subject, teacher, assignedTeachers = null, clashes = []) => {
    setTimetables(prev => {
      const classSchedule = [...(prev[classId] || [])];
      
      // Find if slot exists
      const slotIndex = classSchedule.findIndex(s => s.day === day && s.period === period);
      
      let finalAssigned = assignedTeachers;
      if (finalAssigned === null) {
        finalAssigned = teacher ? teacher.split(',').map(t => t.trim()).filter(Boolean) : [];
      }
      
      if (!subject && !teacher) {
        // Remove the slot if both are empty
        if (slotIndex >= 0) {
          classSchedule.splice(slotIndex, 1);
        }
      } else {
        if (slotIndex >= 0) {
          // Update existing
          classSchedule[slotIndex] = { ...classSchedule[slotIndex], subject, teacher, assignedTeachers: finalAssigned, clashes };
        } else {
          // Add new
          classSchedule.push({ day, period, subject, teacher, assignedTeachers: finalAssigned, clashes });
        }
      }
      
      return { ...prev, [classId]: classSchedule };
    });
  };

  // Update teacher for a specific subject in a class
  const updateTeacherForSubject = (classId, subject, newTeacher) => {
    setTimetables(prev => {
      const classSchedule = [...(prev[classId] || [])];
      
      const updatedSchedule = classSchedule.map(slot => {
        if (slot.subject === subject) {
          const assignedTeachers = newTeacher ? newTeacher.split(',').map(t => t.trim()).filter(Boolean) : [];
          return { ...slot, teacher: newTeacher, assignedTeachers };
        }
        return slot;
      });
      
      return { ...prev, [classId]: updatedSchedule };
    });
  };

  // Global swap: Replaces oldTeacher with newTeacher everywhere in the timetables
  const swapTeacherGlobal = (oldTeacher, newTeacher) => {
    setTimetables(prev => {
      const nextTT = { ...prev };
      let swappedCount = 0;
      
      Object.keys(nextTT).forEach(classId => {
        const classSchedule = [...nextTT[classId]];
        let updated = false;
        
        const updatedSchedule = classSchedule.map(slot => {
          if (!slot.teacher) return slot;
          const currentTeachers = slot.teacher.split(',').map(t => t.trim());
          if (currentTeachers.includes(oldTeacher)) {
            const newTeacherList = currentTeachers.map(t => t === oldTeacher ? newTeacher : t);
            updated = true;
            swappedCount++;
            return { 
              ...slot, 
              teacher: newTeacherList.join(', '), 
              assignedTeachers: newTeacherList 
            };
          }
          return slot;
        });
        
        if (updated) {
          nextTT[classId] = updatedSchedule;
        }
      });
      
      return nextTT;
    });
  };

  const autoFillSnapshotTeachers = () => {
    const mapping = {
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

    setTimetables(prev => {
      let newT = { ...prev };
      let count = 0;
      
      Object.keys(newT).forEach(classId => {
        let normalizedId = classId.replace(/\s+/g, '').toUpperCase();
        let classSchedule = [...newT[classId]];
        let updated = false;

        classSchedule = classSchedule.map(slot => {
          if (!slot.subject) return slot;
          let subj = slot.subject.toLowerCase();
          for (const mSubj of Object.keys(mapping)) {
            if (subj === mSubj.toLowerCase() || subj.includes(mSubj.toLowerCase())) {
              if (mapping[mSubj][normalizedId]) {
                updated = true;
                count++;
                return { ...slot, teacher: mapping[mSubj][normalizedId] };
              }
            }
          }
          return slot;
        });

        if (updated) {
          newT[classId] = classSchedule;
        }
      });
      
      alert(`Successfully mapped and assigned ${count} slots with teachers!`);
      return newT;
    });
  };

  // Helper to format classId
  const formatClassId = (className, sectionName) => {
    // Follow the Doon Scholars convention: e.g. "1a" (if single letter, make it lowercase? Or just append)
    // Actually we'll just append it directly like "6A" or "12PCM". We'll use uppercase.
    const section = sectionName ? sectionName.trim().toUpperCase() : '';
    const needsSpace = section.length > 1; // e.g. "PCM" gets space "12 PCM"
    return needsSpace ? `${className} ${section}` : `${className}${section.toLowerCase()}`;
  };

  // Add a new master class
  const addMasterClass = (className) => {
    const formattedName = className.trim();
    if (!formattedName) return;
    
    setMasterClasses(prev => {
      if (prev.find(c => c.className === formattedName)) return prev;
      return [...prev, { className: formattedName, sections: [] }];
    });
  };

  // Add a new section to an existing class
  const addMasterSection = (className, sectionName) => {
    const sName = sectionName.trim().toUpperCase();
    if (!sName) return;
    
    let added = false;
    setMasterClasses(prev => prev.map(c => {
      if (c.className === className && !c.sections.includes(sName)) {
        added = true;
        return { ...c, sections: [...c.sections, sName] };
      }
      return c;
    }));

    // Wait a tick or just calculate classId directly
    const classId = formatClassId(className, sName);

    // Initialize timetable
    setTimetables(prev => {
      if (!prev[classId]) {
        return { ...prev, [classId]: [] };
      }
      return prev;
    });

    // Add to classes array
    setClasses(prev => prev.includes(classId) ? prev : [...prev, classId]);

    // Clone load master from first section
    setMasterClasses(prev => {
       const cls = prev.find(c => c.className === className);
       if (cls && cls.sections.length > 0) {
          const firstSection = cls.sections[0];
          if (firstSection !== sName) {
             const firstClassId = formatClassId(className, firstSection);
             setLoadMaster(prevLoad => {
                const template = prevLoad.filter(item => item.class_id === firstClassId);
                const newEntries = template.map(item => ({
                   ...item,
                   class_id: classId,
                   class_val: className,
                   section: sName,
                   total_load: 0
                }));
                const exists = prevLoad.some(item => item.class_id === classId);
                return exists ? prevLoad : [...prevLoad, ...newEntries];
             });
          }
       }
       return prev;
    });
  };

  const deleteMasterClass = (className) => {
    // Delete all related timetables, loads, and classes
    setMasterClasses(prev => {
      const cls = prev.find(c => c.className === className);
      if (cls) {
        const classIdsToRemove = cls.sections.map(s => formatClassId(className, s));
        if (cls.sections.length === 0) classIdsToRemove.push(formatClassId(className, ''));

        setTimetables(t => {
          const newT = { ...t };
          classIdsToRemove.forEach(id => delete newT[id]);
          return newT;
        });

        setLoadMaster(l => l.filter(item => !classIdsToRemove.includes(item.class_id)));
        setClasses(c => c.filter(id => !classIdsToRemove.includes(id)));
      }
      return prev.filter(c => c.className !== className);
    });
  };

  const deleteMasterSection = (className, sectionName) => {
    const sName = sectionName.trim().toUpperCase();
    const classIdToRemove = formatClassId(className, sName);

    setMasterClasses(prev => prev.map(c => {
      if (c.className === className) {
        return { ...c, sections: c.sections.filter(s => s !== sName) };
      }
      return c;
    }));

    setTimetables(t => {
      const newT = { ...t };
      delete newT[classIdToRemove];
      return newT;
    });

    setLoadMaster(l => l.filter(item => item.class_id !== classIdToRemove));
    setClasses(c => c.filter(id => id !== classIdToRemove));
  };

  // Update total_load for a specific class+subject row in loadMaster
  const updateTotalLoad = (classId, subject, delta) => {
    setLoadMaster(prev => prev.map(item => {
      if (item.class_id === classId && item.subject === subject) {
        const newLoad = Math.max(0, (item.total_load || 0) + delta);
        return { ...item, total_load: newLoad };
      }
      return item;
    }));
  };

  const addLoadMasterEntry = (className, sectionName, subject, load) => {
    const sName = sectionName.trim().toUpperCase();
    const classId = formatClassId(className, sName);
    
    setLoadMaster(prev => {
      // Check if it already exists
      if (prev.some(item => item.class_id === classId && item.subject === subject)) {
        return prev;
      }
      return [...prev, {
        class_id: classId,
        class_val: className,
        section: sName,
        subject: subject,
        total_load: parseInt(load) || 0
      }];
    });

    setTeacherSubjectMap(prev => {
      const nextMap = { ...prev };
      if (!nextMap[subject]) {
        nextMap[subject] = {};
      }
      if (nextMap[subject][classId] === undefined) {
        nextMap[subject][classId] = "";
      }
      return nextMap;
    });
  };

  const removeLoadMasterEntry = (classId, subject) => {
    setLoadMaster(prev => prev.filter(item => !(item.class_id === classId && item.subject === subject)));
    setTeacherSubjectMap(prev => {
      const nextMap = { ...prev };
      if (nextMap[subject]) {
        delete nextMap[subject][classId];
        if (Object.keys(nextMap[subject]).length === 0) {
          delete nextMap[subject];
        }
      }
      return nextMap;
    });
  };

  const renameLoadMasterSubject = (classId, oldSubject, newSubject) => {
    const trimmed = newSubject.trim();
    if (!trimmed) return;
    
    setLoadMaster(prev => prev.map(item => {
      if (item.class_id === classId && item.subject === oldSubject) {
        return { ...item, subject: trimmed };
      }
      return item;
    }));

    setTimetables(prev => {
      const nextTT = { ...prev };
      if (nextTT[classId]) {
        nextTT[classId] = nextTT[classId].map(slot => {
          if (slot.subject === oldSubject) {
            return { ...slot, subject: trimmed };
          }
          return slot;
        });
      }
      return nextTT;
    });

    setTeacherSubjectMap(prev => {
      const nextMap = { ...prev };
      if (nextMap[oldSubject]) {
        const classMapping = nextMap[oldSubject][classId];
        if (classMapping !== undefined) {
          if (!nextMap[trimmed]) nextMap[trimmed] = {};
          nextMap[trimmed][classId] = classMapping;
          delete nextMap[oldSubject][classId];
          if (Object.keys(nextMap[oldSubject]).length === 0) {
            delete nextMap[oldSubject];
          }
        }
      }
      return nextMap;
    });
  };

  const renameSubjectGlobal = (oldSubject, newSubject) => {
    const trimmed = newSubject.trim();
    if (!trimmed) return;

    // 1. Rename in loadMaster
    setLoadMaster(prev => prev.map(item => {
      if (item.subject === oldSubject) {
        return { ...item, subject: trimmed };
      }
      return item;
    }));

    // 2. Rename in timetables
    setTimetables(prev => {
      const nextTT = {};
      Object.keys(prev).forEach(classId => {
        nextTT[classId] = prev[classId].map(slot => {
          if (slot.subject === oldSubject) {
            return { ...slot, subject: trimmed };
          }
          return slot;
        });
      });
      return nextTT;
    });

    // 3. Rename in teacherSubjectMap
    setTeacherSubjectMap(prev => {
      const nextMap = { ...prev };
      if (nextMap[oldSubject]) {
        nextMap[trimmed] = nextMap[oldSubject];
        delete nextMap[oldSubject];
      }
      return nextMap;
    });
  };

  const addSubstitution = (dateString, period, classId, subject, absentTeacher, substituteTeacher, isManual = false) => {
    setSubstitutions(prev => {
      const dailySubs = prev[dateString] || [];
      const filtered = dailySubs.filter(s => !(s.period === period && s.classId === classId));
      return {
        ...prev,
        [dateString]: [...filtered, { period, classId, subject, absentTeacher, substituteTeacher, manualOverride: isManual, locked: false }]
      };
    });
  };

  const setDailySubstitutions = React.useCallback((dateString, subsArray) => {
    setSubstitutions(prev => ({
      ...prev,
      [dateString]: subsArray
    }));
  }, []);

  const removeSubstitution = (dateString, period, classId) => {
    setSubstitutions(prev => {
      if (!prev[dateString]) return prev;
      return {
        ...prev,
        [dateString]: prev[dateString].filter(s => !(s.period === period && s.classId === classId))
      };
    });
  };

  const markTeacherAbsent = (dateString, teacherName) => {
    setAbsentTeachers(prev => {
      const dailyAbsent = prev[dateString] || [];
      if (dailyAbsent.includes(teacherName)) return prev;
      return { ...prev, [dateString]: [...dailyAbsent, teacherName] };
    });
  };

  const unmarkTeacherAbsent = (dateString, teacherName) => {
    setAbsentTeachers(prev => {
      if (!prev[dateString]) return prev;
      return {
        ...prev,
        [dateString]: prev[dateString].filter(t => t !== teacherName)
      };
    });
    
    // Also remove any substitutions that were made for this teacher on this day
    setSubstitutions(prev => {
      if (!prev[dateString]) return prev;
      return {
        ...prev,
        [dateString]: prev[dateString].filter(s => s.absentTeacher !== teacherName)
      };
    });
  };

  // Get teacher slot usage: compute from current timetables
  const getTeacherSlotUsage = () => {
    return generateTeacherUsageGrid(timetables, teachers);
  };

  const importBackup = useCallback(async (backupData) => {
    try {
      const parseVal = (val) => {
        if (!val) return null;
        if (typeof val === 'string') {
          try {
            return JSON.parse(val);
          } catch (e) {
            return val;
          }
        }
        return val;
      };

      const payload = {};
      const syncKeys = ['timetables', 'teacherSubjectMap', 'loadMaster', 'masterClasses', 'substitutions', 'absentTeachers'];
      syncKeys.forEach(key => {
        if (backupData[key] !== undefined) {
          payload[key] = parseVal(backupData[key]);
        }
      });

      const response = await fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: syncService._clientId,
          payload
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update sync server with backup data');
      }

      const resJson = await response.json();
      if (resJson.success) {
        syncService._knownVersion = resJson.version;

        const safeSet = (key, value) => {
          if (!value) return;
          const stringVal = typeof value === 'string' ? value : JSON.stringify(value);
          localStorage.setItem(key, stringVal);
        };

        Object.keys(backupData).forEach(key => {
          safeSet(key, backupData[key]);
        });

        if (payload.timetables) setTimetables(payload.timetables);
        if (payload.teacherSubjectMap) setTeacherSubjectMap(payload.teacherSubjectMap);
        if (payload.loadMaster) setLoadMaster(payload.loadMaster);
        if (payload.masterClasses) setMasterClasses(payload.masterClasses);
        if (payload.substitutions) setSubstitutions(payload.substitutions);
        if (payload.absentTeachers) setAbsentTeachers(payload.absentTeachers);

        alert('Backup Restored and Synced to Server Successfully! The page will now reload.');
        window.location.reload();
        return true;
      } else {
        throw new Error(resJson.error || 'Unknown server error');
      }
    } catch (err) {
      alert('Error restoring backup: ' + err.message);
      return false;
    }
  }, []);

  return (
    <TimetableContext.Provider value={{
      timetables,
      loadMaster,
      teachers,
      classes,
      masterClasses,
      teacherSlotUsage,
      teacherMapping,
      teacherSubjectMap,
      setTeacherSubjectMap,
      substitutions,
      absentTeachers,
      updateSlot,
      updateTeacherForSubject,
      swapTeacherGlobal,
      autoFillSnapshotTeachers,
      updateTotalLoad,
      checkTeacherCollision,
      getAllowedSubjectsForClass,
      getTeacherSlotUsage,
      addMasterClass,
      addMasterSection,
      deleteMasterClass,
      deleteMasterSection,
      addLoadMasterEntry,
      removeLoadMasterEntry,
      renameLoadMasterSubject,
      renameSubjectGlobal,
      addSubstitution,
      removeSubstitution,
      setDailySubstitutions,
      markTeacherAbsent,
      unmarkTeacherAbsent,
      addNewTeacher,
      deleteTeacher,
      importBackup,
      syncStatus
    }}>
      {children}
    </TimetableContext.Provider>
  );
};
