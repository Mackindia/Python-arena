import React, { createContext, useState, useEffect, useContext } from 'react';

// Data imports (Using the extracted JSON data as initial state)
import initialLoadMaster from '../data/load_master.json';
import initialTimetables from '../data/timetables.json';
import initialTeachers from '../data/teachers.json';
import initialTeacherSlotUsage from '../data/teacher_slot_usage.json';
import initialTeacherMapping from '../data/teacher_mapping.json';
import initialSubjectMap from '../data/teacher_subject_map.json';

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
  const [teacherSubjectMap, setTeacherSubjectMap] = useState({});

  useEffect(() => {
    // Initialize state from local storage or fallback to initial data
    const savedTT = localStorage.getItem('timetables');
    const savedLoad = localStorage.getItem('loadMaster');
    const savedSlotUsage = localStorage.getItem('teacherSlotUsage');
    
    let currentTT = initialTimetables;
    if (savedTT) {
      currentTT = JSON.parse(savedTT);
      setTimetables(currentTT);
    } else {
      setTimetables(initialTimetables);
    }

    if (savedLoad) {
      setLoadMaster(JSON.parse(savedLoad));
    } else {
      setLoadMaster(initialLoadMaster);
    }
    
    if (savedSlotUsage) {
      setTeacherSlotUsage(JSON.parse(savedSlotUsage));
    } else {
      setTeacherSlotUsage(initialTeacherSlotUsage);
    }
    
    const savedSubstitutions = localStorage.getItem('substitutions');
    if (savedSubstitutions) {
      setSubstitutions(JSON.parse(savedSubstitutions));
    }
    
    const savedAbsentTeachers = localStorage.getItem('absentTeachers');
    if (savedAbsentTeachers) {
      setAbsentTeachers(JSON.parse(savedAbsentTeachers));
    }
    
    const savedTSMap = localStorage.getItem('teacherSubjectMap');
    if (savedTSMap) {
      setTeacherSubjectMap(JSON.parse(savedTSMap));
    } else {
      setTeacherSubjectMap(initialSubjectMap);
    }
    
    setTeachers(initialTeachers);
    
    const savedMasterClasses = localStorage.getItem('masterClasses');
    if (savedMasterClasses) {
      setMasterClasses(JSON.parse(savedMasterClasses));
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
  }, []);

  // Save to local storage whenever state changes
  useEffect(() => {
    if (Object.keys(timetables).length > 0) {
      localStorage.setItem('timetables', JSON.stringify(timetables));
    }
  }, [timetables]);

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
    localStorage.setItem('teacherSubjectMap', JSON.stringify(teacherSubjectMap));
  }, [teacherSubjectMap]);

  // Logic: Check for teacher collision
  // A teacher cannot be in two different classes at the same day and period
  // Supports comma-separated teachers (e.g., 'SA,SS' will clash with 'SA')
  const checkTeacherCollision = (teacherStr, day, period, currentClass) => {
    if (!teacherStr) return false;
    
    const currentTeachers = teacherStr.split(',').map(t => t.trim().toLowerCase()).filter(Boolean);
    if (currentTeachers.length === 0) return false;
    
    for (const [classId, schedule] of Object.entries(timetables)) {
      if (classId === currentClass) continue; // Skip current class
      
      const conflictSlot = schedule.find(
        slot => slot.day === day && parseInt(slot.period) === parseInt(period)
      );
      
      if (conflictSlot && conflictSlot.teacher) {
        const conflictTeachers = conflictSlot.teacher.split(',').map(t => t.trim().toLowerCase()).filter(Boolean);
        const hasOverlap = currentTeachers.some(t => conflictTeachers.includes(t));
        
        if (hasOverlap) {
          return classId; // Return the class where the collision occurs
        }
      }
    }
    return false;
  };

  // Update a specific slot in a class timetable
  const updateSlot = (classId, day, period, subject, teacher) => {
    setTimetables(prev => {
      const classSchedule = [...(prev[classId] || [])];
      
      // Find if slot exists
      const slotIndex = classSchedule.findIndex(s => s.day === day && s.period === period);
      
      if (!subject && !teacher) {
        // Remove the slot if both are empty
        if (slotIndex >= 0) {
          classSchedule.splice(slotIndex, 1);
        }
      } else {
        if (slotIndex >= 0) {
          // Update existing
          classSchedule[slotIndex] = { ...classSchedule[slotIndex], subject, teacher };
        } else {
          // Add new
          classSchedule.push({ day, period, subject, teacher });
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
          return { ...slot, teacher: newTeacher };
        }
        return slot;
      });
      
      return { ...prev, [classId]: updatedSchedule };
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

  const setDailySubstitutions = (dateString, subsArray) => {
    setSubstitutions(prev => ({
      ...prev,
      [dateString]: subsArray
    }));
  };

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
    // Always compute fresh from timetables to ensure conflicts are detected
    const usage = {};
    
    // Initialize for all teachers
    teachers.forEach(teacher => {
      usage[teacher] = {};
      ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].forEach(day => {
        usage[teacher][day] = {};
        for (let period = 1; period <= 8; period++) {
          usage[teacher][day][period] = 0;
        }
      });
    });
    
    // Count assignments from current timetables
    Object.entries(timetables).forEach(([, schedule]) => {
      schedule.forEach(slot => {
        if (slot.teacher && slot.teacher.trim()) {
          const assignedTeachers = slot.teacher.split(',').map(t => t.trim());
          assignedTeachers.forEach(t => {
            if (usage[t] && usage[t][slot.day]) {
              const period = slot.period;
              if (usage[t][slot.day][period] !== undefined) {
                usage[t][slot.day][period]++;
              }
            }
          });
        }
      });
    });
    
    return usage;
  };

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
      autoFillSnapshotTeachers,
      updateTotalLoad,
      checkTeacherCollision,
      getTeacherSlotUsage,
      addMasterClass,
      addMasterSection,
      deleteMasterClass,
      deleteMasterSection,
      addLoadMasterEntry,
      addSubstitution,
      removeSubstitution,
      setDailySubstitutions,
      markTeacherAbsent,
      unmarkTeacherAbsent
    }}>
      {children}
    </TimetableContext.Provider>
  );
};
