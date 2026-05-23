import React, { createContext, useState, useEffect, useContext } from 'react';

// Data imports (Using the extracted JSON data as initial state)
import initialLoadMaster from '../data/load_master.json';
import initialTimetables from '../data/timetables.json';
import initialTeachers from '../data/teachers.json';
import initialTeacherSlotUsage from '../data/teacher_slot_usage.json';

const TimetableContext = createContext();

export const useTimetable = () => useContext(TimetableContext);

export const TimetableProvider = ({ children }) => {
  const [timetables, setTimetables] = useState({});
  const [loadMaster, setLoadMaster] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [classes, setClasses] = useState([]);
  const [teacherSlotUsage, setTeacherSlotUsage] = useState({});
  const [masterClasses, setMasterClasses] = useState([]);

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

  // Logic: Check for teacher collision
  // A teacher cannot be in two different classes at the same day and period
  const checkTeacherCollision = (teacher, day, period, currentClass) => {
    if (!teacher) return false;
    
    for (const [classId, schedule] of Object.entries(timetables)) {
      if (classId === currentClass) continue; // Skip current class
      
      const conflict = schedule.find(
        slot => slot.day === day && slot.period === period && slot.teacher === teacher
      );
      
      if (conflict) {
        return classId; // Return the class where the collision occurs
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
      updateSlot,
      updateTotalLoad,
      checkTeacherCollision,
      getTeacherSlotUsage,
      addMasterClass,
      addMasterSection,
      deleteMasterClass,
      deleteMasterSection,
      addLoadMasterEntry
    }}>
      {children}
    </TimetableContext.Provider>
  );
};
