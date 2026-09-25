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
import { timetableLockService } from '../services/timetableLockService';
import {
  parseGridTimetableCsv,
  applyImportedPeriodCount,
  knownTeachers as knownTeacherCodes,
  rosterCodes,
} from '../utils/csvTimetableImport';

const parseCSVInitialData = () => {
  try {
    const rows = rawCsvData.split('\n').filter(r => r.trim());
    const dataRows = rows.slice(1);
    const mapForUI = {};

    dataRows.forEach(row => {
      const matches = row.match(/(".*?"|[^",]+)(?=\s*,|\s*$)/g);
      if (!matches || matches.length < 4) return;
      
      const cleanedRow = matches.map(m => m.replace(/^"|"$/g, '').trim());
      const [rawSubject, cls, section] = cleanedRow;
      // Keep every teacher token (rows can carry 3+ teachers: SB,RD,DV)
      const rawTeacher = cleanedRow.slice(3).join(',');
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
  const [teachersSynced, setTeachersSynced] = useState(false);
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
  const [isTimetableLocked, setIsTimetableLocked] = useState(true); // Default: locked (safe)
  const [lockStatus, setLockStatus] = useState('frozen'); // 'draft' | 'frozen'
  const [lockInfo, setLockInfo] = useState({ frozenAt: null, frozenBy: null });
  const syncReady = useRef(false);   // only push after initial hydration
  const syncPushTimers = useRef({});
  const isRemoteUpdate = useRef(false);

  useEffect(() => {
    // Helper function to safely parse JSON from localStorage
    const safeJSONParse = (key, fallback) => {
      const item = localStorage.getItem(key);
      if (!item || item === "undefined" || item === "null" || item === "[object Object]") return fallback;
      try {
        const parsed = JSON.parse(item);
        if (parsed === null) return fallback;
        if (Array.isArray(parsed) && parsed.length === 0) return fallback;
        if (typeof parsed === 'object' && !Array.isArray(parsed) && Object.keys(parsed).length === 0) return fallback;
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
    
    
    // ──────────────────────────────────────────────────────────────────
    // FIX: Build teachers list from ACTUAL timetable data on initial load.
    // Previously used initialTeachers (static JSON) which never updates —
    // causing stale/removed teacher initials to persist in the UI.
    // Now: Scan timetable slots + localStorage custom teachers - deleted
    // ──────────────────────────────────────────────────────────────────
    const customTeachers = safeJSONParse('addedTeachers', []);
    const deletedTeachersList = safeJSONParse('deletedTeachers', []);

    // Step 1: Scan timetables to find teachers actually assigned to slots
    const timetableTeachers = new Set();
    Object.values(currentTT).forEach(schedule => {
      schedule.forEach(slot => {
        if (slot.teacher) {
          slot.teacher.split(',').forEach(t => {
            const cleanT = t.trim().toUpperCase();
            if (cleanT && cleanT.toLowerCase() !== 'nan' && cleanT !== '0' && !deletedTeachersList.includes(cleanT)) {
              timetableTeachers.add(cleanT);
            }
          });
        }
      });
    });

    // Step 2: Build final list = timetable teachers + custom teachers - deleted
    const initialTeacherSet = new Set();
    timetableTeachers.forEach(t => initialTeacherSet.add(t));
    customTeachers.forEach(t => {
      const normalized = t.trim().toUpperCase();
      if (!deletedTeachersList.includes(normalized)) {
        initialTeacherSet.add(normalized);
      }
    });

    setTeachers(Array.from(initialTeacherSet).sort());
    
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

    // Rebuild teacherSubjectMap from timetables if it's empty
    const savedSubjectMap = safeJSONParse('teacherSubjectMap', null);
    if (!savedSubjectMap || Object.keys(savedSubjectMap).length === 0) {
      const subjectMap = {};
      Object.entries(currentTT).forEach(([classId, slots]) => {
        if (Array.isArray(slots)) {
          slots.forEach(slot => {
            if (slot.subject && slot.teacher) {
              if (!subjectMap[slot.subject]) subjectMap[slot.subject] = {};
              subjectMap[slot.subject][classId] = slot.teacher;
            }
          });
        }
      });
      if (Object.keys(subjectMap).length > 0) {
        setTeacherSubjectMap(subjectMap);
        localStorage.setItem('teacherSubjectMap', JSON.stringify(subjectMap));
        console.log('[Init] Rebuilt teacherSubjectMap with', Object.keys(subjectMap).length, 'subjects');
      }
    }

    syncReady.current = true;
  }, []);

  // ── Sync Service: receive remote changes ──────────────────────────────────
  const onRemoteChange = useCallback((payload) => {
    // After CSV/import, ignore remote for a short window so other tabs/devices
    // cannot immediately overwrite the new teachers with stale data.
    try {
      const ignoreUntil = parseInt(localStorage.getItem('ignoreRemoteUntil') || '0', 10);
      if (ignoreUntil && Date.now() < ignoreUntil) {
        console.warn('[sync] Ignoring remote update (import grace period)');
        return;
      }
      const localEpoch = parseInt(localStorage.getItem('dataEpoch') || '0', 10);
      const remoteEpoch = Number(payload.dataEpoch || 0);
      if (localEpoch && remoteEpoch && remoteEpoch < localEpoch) {
        console.warn('[sync] Ignoring stale remote payload (older dataEpoch)');
        return;
      }
    } catch {
      // ignore storage errors
    }

    isRemoteUpdate.current = true;
    setSyncStatus('receiving');

    if (payload.timetables && typeof payload.timetables === 'object') {
      setTimetables(payload.timetables);
      localStorage.setItem('timetables', JSON.stringify(payload.timetables));
    }
    if (Array.isArray(payload.teachers) && payload.teachers.length > 0) {
      setTeachers(payload.teachers);
      localStorage.setItem('syncedTeachers', JSON.stringify(payload.teachers));
      setTeachersSynced(true);
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
    if (payload.dataEpoch) {
      try {
        localStorage.setItem('dataEpoch', String(payload.dataEpoch));
      } catch {
        // ignore
      }
    }
    if (Array.isArray(payload.addedTeachers)) {
      localStorage.setItem('addedTeachers', JSON.stringify(payload.addedTeachers));
    }
    if (Array.isArray(payload.deletedTeachers)) {
      localStorage.setItem('deletedTeachers', JSON.stringify(payload.deletedTeachers));
    }

    setTimeout(() => {
      isRemoteUpdate.current = false;
      setSyncStatus('synced');
    }, 600);
    setTimeout(() => setSyncStatus('idle'), 2500);
  }, []);

  useEffect(() => {
    // Initialize lock service with new status format
    timetableLockService.init((status, locked) => {
      setIsTimetableLocked(locked);
      setLockStatus(status);
      setLockInfo(timetableLockService.freezeInfo);
      
      if (locked) {
        console.warn(`[lock] Timetable is now FROZEN (status: ${status}). Edits are disabled.`);
      } else {
        console.log(`[lock] Timetable is now DRAFT (status: ${status}). Edits are enabled.`);
      }
    });

    syncService.init(onRemoteChange);
    return () => {
      syncService.destroy();
      timetableLockService.destroy();
    };
  }, [onRemoteChange]);

  // ── Sync Service: push local changes (debounced 800ms per field) ──────────
  const debouncedPushField = useCallback((fieldName, fieldData) => {
    if (!syncReady.current) return;
    if (isRemoteUpdate.current) return;

    clearTimeout(syncPushTimers.current[fieldName]);
    syncPushTimers.current[fieldName] = setTimeout(() => {
      // Carry dataEpoch so server can reject truly stale full-state overwrites
      let payload = { [fieldName]: fieldData };
      try {
        const epoch = parseInt(localStorage.getItem('dataEpoch') || '0', 10);
        if (epoch) payload.dataEpoch = epoch;
      } catch {
        // ignore
      }
      syncService.push(payload);
      setSyncStatus('synced');
      setTimeout(() => setSyncStatus('idle'), 2000);
    }, 800);
  }, []);

  useEffect(() => {
    if (!syncReady.current || Object.keys(timetables).length === 0) return;
    if (isRemoteUpdate.current) return;
    debouncedPushField('timetables', timetables);
  }, [timetables, debouncedPushField]);

  useEffect(() => {
    if (!syncReady.current || !teacherSubjectMap || Object.keys(teacherSubjectMap).length === 0) return;
    if (isRemoteUpdate.current) return;
    debouncedPushField('teacherSubjectMap', teacherSubjectMap);
  }, [teacherSubjectMap, debouncedPushField]);

  useEffect(() => {
    if (!syncReady.current || teachers.length === 0) return;
    if (isRemoteUpdate.current) return;
    if (teachersSynced) return; // Don't re-push if we just received from server
    debouncedPushField('teachers', teachers);
  }, [teachers, debouncedPushField, teachersSynced]);

  useEffect(() => {
    if (!syncReady.current || loadMaster.length === 0) return;
    if (isRemoteUpdate.current) return;
    debouncedPushField('loadMaster', loadMaster);
  }, [loadMaster, debouncedPushField]);

  useEffect(() => {
    if (!syncReady.current || masterClasses.length === 0) return;
    if (isRemoteUpdate.current) return;
    debouncedPushField('masterClasses', masterClasses);
  }, [masterClasses, debouncedPushField]);

  useEffect(() => {
    if (!syncReady.current) return;
    if (isRemoteUpdate.current) return;

    clearTimeout(syncPushTimers.current['subs_absent']);
    syncPushTimers.current['subs_absent'] = setTimeout(() => {
      syncService.push({ substitutions, absentTeachers });
      setSyncStatus('synced');
      setTimeout(() => setSyncStatus('idle'), 2000);
    }, 800);
  }, [substitutions, absentTeachers]);

  // Sync addedTeachers and deletedTeachers so all clients stay consistent
  useEffect(() => {
    if (!syncReady.current) return;
    if (isRemoteUpdate.current) return;

    const added = JSON.parse(localStorage.getItem('addedTeachers') || '[]');
    const deleted = JSON.parse(localStorage.getItem('deletedTeachers') || '[]');

    clearTimeout(syncPushTimers.current['teacher_lists']);
    syncPushTimers.current['teacher_lists'] = setTimeout(() => {
      syncService.push({ addedTeachers: added, deletedTeachers: deleted });
      setSyncStatus('synced');
      setTimeout(() => setSyncStatus('idle'), 2000);
    }, 800);
  }, [teachers]);

  // Save to local storage whenever state changes
  useEffect(() => {
    if (Object.keys(timetables).length > 0) {
      localStorage.setItem('timetables', JSON.stringify(timetables));
      
      // ──────────────────────────────────────────────────────────────────
      // FIX: Build teachers list from ACTUAL timetable data (ground truth)
      // Previously: UNION of initialTeachers + addedTeachers + timetable scan
      //   → Stale teachers persisted after rename/swap (old initials never removed)
      // Now: Teachers = timetable scan + addedTeachers - deletedTeachers
      //   → Only teachers that actually exist in timetables or were explicitly added
      // ──────────────────────────────────────────────────────────────────
      const savedAddedTeachers = localStorage.getItem('addedTeachers');
      const customTeachers = savedAddedTeachers ? JSON.parse(savedAddedTeachers) : [];

      const savedDeletedTeachers = localStorage.getItem('deletedTeachers');
      const deletedTeachers = savedDeletedTeachers ? JSON.parse(savedDeletedTeachers) : [];
      
      // Step 1: Scan ALL timetable slots to find teachers actually in use
      const timetableTeachers = new Set();
      Object.values(timetables).forEach(schedule => {
        schedule.forEach(slot => {
          if (slot.teacher) {
            slot.teacher.split(',').forEach(t => {
              const cleanT = t.trim().toUpperCase();
              if (cleanT && cleanT.toLowerCase() !== 'nan' && cleanT !== '0' && !deletedTeachers.includes(cleanT)) {
                timetableTeachers.add(cleanT);
              }
            });
          }
        });
      });

      // Step 2: Build final list = timetable teachers + custom teachers - deleted
      const dynamicTeachers = new Set();

      // Add all teachers found in timetables (these are the real, active teachers)
      timetableTeachers.forEach(t => dynamicTeachers.add(t));

      // Add custom teachers (explicitly added by user, even if not yet in timetables)
      customTeachers.forEach(t => {
        const normalized = t.trim().toUpperCase();
        if (!deletedTeachers.includes(normalized)) {
          dynamicTeachers.add(normalized);
        }
      });

      // NOTE: We intentionally do NOT include initialTeachers blindly.
      // initialTeachers is a static JSON that never updates. If a teacher was
      // renamed/swapped, their old initials linger there. The timetable scan
      // is the single source of truth — only teachers actually assigned to
      // slots appear in the list.

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
    
    // 2. From teacherSubjectMap (check existence, not truthy value — empty string means "mapped but unassigned")
    if (teacherSubjectMap) {
      Object.keys(teacherSubjectMap).forEach(subj => {
        if (teacherSubjectMap[subj][normalizedClassId] !== undefined) {
          subjects.add(subj);
        }
      });
    }
    
    return Array.from(subjects).sort();
  };

  // Update a specific slot in a class timetable
  const updateSlot = (classId, day, period, subject, teacher, assignedTeachers = null, clashes = []) => {
    // Check if timetable is locked
    if (!timetableLockService.canEdit()) return false;

    const dayKey = String(day || '').trim();
    const periodNum = parseInt(period, 10);

    setTimetables(prev => {
      const existing = Array.isArray(prev[classId]) ? prev[classId] : [];
      // Normalize period types (string vs number) so lookups never miss and duplicate slots
      const classSchedule = existing.filter(
        s => !(s.day === dayKey && parseInt(s.period, 10) === periodNum)
      );

      let finalAssigned = assignedTeachers;
      if (finalAssigned === null) {
        finalAssigned = teacher ? teacher.split(',').map(t => t.trim()).filter(Boolean) : [];
      }

      if (subject || teacher) {
        classSchedule.push({
          day: dayKey,
          period: periodNum,
          subject,
          teacher,
          assignedTeachers: finalAssigned,
          clashes: clashes || [],
        });
      }

      // Sort for stable order
      const dayOrder = { Mon: 0, Tue: 1, Wed: 2, Thu: 3, Fri: 4, Sat: 5, Sun: 6 };
      classSchedule.sort((a, b) => {
        const d = (dayOrder[a.day] ?? 9) - (dayOrder[b.day] ?? 9);
        if (d !== 0) return d;
        return parseInt(a.period, 10) - parseInt(b.period, 10);
      });

      return { ...prev, [classId]: classSchedule };
    });

    return true;
  };

  // Update teacher for a specific subject in a class
  const updateTeacherForSubject = (classId, subject, newTeacher) => {
    // Check if timetable is locked
    if (!timetableLockService.canEdit()) return;

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
    // Check if timetable is locked
    if (!timetableLockService.canEdit()) return;

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

  // Freeze the timetable (no password required)
  const freezeTimetable = useCallback(async () => {
    const result = await timetableLockService.freeze();
    if (result.success) {
      alert('Timetable is now FROZEN. No changes allowed until unfrozen.');
    } else {
      alert('Failed to freeze timetable: ' + result.error);
    }
    return result;
  }, []);

  // Unfreeze the timetable (requires password)
  const unfreezeTimetable = useCallback(async (password) => {
    if (!password) {
      alert('Password required to unfreeze timetable.');
      return { success: false, error: 'Password required' };
    }
    
    const result = await timetableLockService.unfreeze(password);
    if (result.success) {
      alert('Timetable is now in DRAFT mode. You can make changes.');
    } else {
      alert('Failed to unfreeze timetable: ' + result.error);
    }
    return result;
  }, []);

  // Get lock status text
  const getLockStatusText = useCallback(() => {
    return timetableLockService.getStatusText();
  }, []);

  // Clear ALL timetable slots (Mastersheet + Class Timetable + assignments).
  // DOES NOT touch teacherSubjectMap or loadMaster.
  const clearAllTimetables = useCallback(() => {
    if (!timetableLockService.canEdit()) return false;

    // Keep teachers list alive after slots are emptied (rebuild scans slots)
    try {
      const saved = JSON.parse(localStorage.getItem('addedTeachers') || '[]');
      const set = new Set(
        saved.map(t => String(t || '').trim().toUpperCase()).filter(Boolean)
      );
      teachers.forEach(t => {
        const n = String(t || '').trim().toUpperCase();
        if (n && n !== 'NAN' && n !== '0') set.add(n);
      });
      localStorage.setItem('addedTeachers', JSON.stringify(Array.from(set).sort()));
    } catch {
      // ignore parse errors
    }

    setTimetables(prev => {
      const next = {};
      const classIds = new Set([...Object.keys(prev || {}), ...classes]);
      classIds.forEach(id => {
        next[id] = [];
      });
      return next;
    });

    setTeacherSlotUsage({});
    localStorage.setItem('teacherSlotUsage', JSON.stringify({}));
    setSubstitutions({});
    localStorage.setItem('substitutions', JSON.stringify({}));
    setAbsentTeachers({});
    localStorage.setItem('absentTeachers', JSON.stringify({}));

    return true;
  }, [teachers, classes]);

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

      // Detect format: full backup vs raw timetables
      // Full backup has keys like "timetables", "teachers", etc.
      // Raw timetables has class IDs like "1a", "2b", etc.
      let processedData = backupData;
      const hasClassIds = Object.keys(backupData).some(key => /^\d+[a-z]$/i.test(key));
      const hasBackupKeys = backupData.timetables !== undefined || backupData.teachers !== undefined;

      if (hasClassIds && !hasBackupKeys) {
        // Raw timetables format detected - wrap it properly
        console.log('[Import] Raw timetables format detected, wrapping in backup format');
        processedData = {
          timetables: backupData,
          teachers: [],
          teacherSubjectMap: null,
          loadMaster: null,
          masterClasses: null
        };
      }

      const payload = {};
      const syncKeys = ['timetables', 'teachers', 'teacherSubjectMap', 'loadMaster', 'masterClasses', 'substitutions', 'absentTeachers'];
      syncKeys.forEach(key => {
        if (processedData[key] !== undefined) {
          payload[key] = parseVal(processedData[key]);
        }
      });

      // If we only have timetables, derive teachers from the data
      if (payload.timetables && (!payload.teachers || payload.teachers.length === 0)) {
        const teacherSet = new Set();
        Object.values(payload.timetables).forEach(schedule => {
          if (Array.isArray(schedule)) {
            schedule.forEach(slot => {
              if (slot.teacher) {
                slot.teacher.split(',').forEach(t => {
                  const clean = t.trim().toUpperCase();
                  if (clean && clean !== 'NAN' && clean !== '0') {
                    teacherSet.add(clean);
                  }
                });
              }
            });
          }
        });
        payload.teachers = Array.from(teacherSet).sort();
        console.log('[Import] Derived', payload.teachers.length, 'teachers from timetable data');
      }

      // If we have timetables but no teacherSubjectMap, build it from the data
      if (payload.timetables && !payload.teacherSubjectMap) {
        const subjectMap = {};
        Object.entries(payload.timetables).forEach(([classId, slots]) => {
          if (Array.isArray(slots)) {
            slots.forEach(slot => {
              if (slot.subject && slot.teacher) {
                if (!subjectMap[slot.subject]) subjectMap[slot.subject] = {};
                subjectMap[slot.subject][classId] = slot.teacher;
              }
            });
          }
        });
        payload.teacherSubjectMap = subjectMap;
        console.log('[Import] Built teacherSubjectMap with', Object.keys(subjectMap).length, 'subjects');
      }

      const response = await fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: syncService._clientId,
          payload
        })
      });

      let serverSuccess = false;
      let resJson = {};

      if (response.ok) {
        resJson = await response.json();
        serverSuccess = resJson.success;
        if (serverSuccess) {
          syncService._knownVersion = resJson.version;
        }
      } else {
        console.warn('[Import] Sync server not available, saving to localStorage only');
      }

      // Save to localStorage (works with or without server)
      const safeSet = (key, value) => {
        if (!value) return;
        const stringVal = typeof value === 'string' ? value : JSON.stringify(value);
        localStorage.setItem(key, stringVal);
      };

      Object.keys(processedData).forEach(key => {
        safeSet(key, processedData[key]);
      });

      if (payload.timetables) setTimetables(payload.timetables);
      if (payload.teachers) {
        setTeachers(payload.teachers);
        localStorage.setItem('syncedTeachers', JSON.stringify(payload.teachers));
      }
      if (payload.teacherSubjectMap) setTeacherSubjectMap(payload.teacherSubjectMap);
      if (payload.loadMaster) setLoadMaster(payload.loadMaster);
      if (payload.masterClasses) setMasterClasses(payload.masterClasses);
      if (payload.substitutions) setSubstitutions(payload.substitutions);
      if (payload.absentTeachers) setAbsentTeachers(payload.absentTeachers);

      alert('Data imported successfully! The page will now reload.');
      window.location.reload();
      return true;
    } catch (err) {
      alert('Error restoring backup: ' + err.message);
      return false;
    }
  }, []);

  const importCsvTimetable = useCallback(async (csvText) => {
    if (!timetableLockService.canEdit()) return false;

    try {
      const parsed = parseGridTimetableCsv(csvText);
      applyImportedPeriodCount(parsed.periodCount);

      const teacherSet = new Set(parsed.teachers);
      // Keep every current staff member visible (even with 0 periods) so
      // substitutes can be picked and unassigned staff is easy to spot.
      rosterCodes.forEach(c => teacherSet.add(c));
      try {
        const savedAdded = JSON.parse(localStorage.getItem('addedTeachers') || '[]');
        savedAdded.forEach(t => {
          const n = String(t || '').trim().toUpperCase();
          // Only keep additions that are still on the current staff roster —
          // otherwise departed codes saved earlier (NM, SZ, TP, AG …) come back
          // on every import and show up with 0 periods ("free").
          if (n && n !== 'NAN' && n !== '0' && knownTeacherCodes.has(n)) {
            teacherSet.add(n);
          }
        });
      } catch {
        // ignore
      }
      const teachersList = Array.from(teacherSet).sort();

      const dataEpoch = Date.now();
      const payload = {
        dataEpoch,
        timetables: parsed.timetables,
        teachers: teachersList,
        teacherSubjectMap: parsed.teacherSubjectMap,
        loadMaster: parsed.loadMaster,
        masterClasses: parsed.masterClasses,
        substitutions: {},
        absentTeachers: {},
        addedTeachers: teachersList,
        deletedTeachers: [],
      };

      // Block remote overwrite of this fresh import for 30s
      localStorage.setItem('dataEpoch', String(dataEpoch));
      localStorage.setItem('ignoreRemoteUntil', String(dataEpoch + 30000));
      localStorage.setItem('timetables', JSON.stringify(parsed.timetables));
      localStorage.setItem('teacherSubjectMap', JSON.stringify(parsed.teacherSubjectMap));
      localStorage.setItem('loadMaster', JSON.stringify(parsed.loadMaster));
      localStorage.setItem('masterClasses', JSON.stringify(parsed.masterClasses));
      localStorage.setItem('teachers', JSON.stringify(teachersList));
      localStorage.setItem('addedTeachers', JSON.stringify(teachersList));
      localStorage.setItem('teacherSlotUsage', JSON.stringify({}));
      localStorage.setItem('substitutions', JSON.stringify({}));
      localStorage.setItem('absentTeachers', JSON.stringify({}));
      localStorage.removeItem('deletedTeachers');
      localStorage.removeItem('syncedTeachers');

      // Full replace push — bump knownVersion from response
      let serverOk = false;
      try {
        const response = await fetch('/api/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            clientId: syncService._clientId,
            payload,
            fullReplace: true,
          }),
        });
        if (response.ok) {
          const resJson = await response.json();
          if (resJson.success) {
            syncService._knownVersion = resJson.version;
            serverOk = true;
          }
        } else {
          console.warn('[CSV Import] Sync server rejected push', response.status);
        }
      } catch {
        console.warn('[CSV Import] Sync server not available, localStorage only');
      }

      // Update live state (skip remote until grace ends)
      isRemoteUpdate.current = true;
      setTimetables(parsed.timetables);
      setTeachers(teachersList);
      setTeacherSubjectMap(parsed.teacherSubjectMap);
      setLoadMaster(parsed.loadMaster);
      setMasterClasses(parsed.masterClasses);
      setClasses(parsed.classes);
      setTeacherSlotUsage({});
      setSubstitutions({});
      setAbsentTeachers({});

      // Push local fields as well (debounced services will skip remote while flag set)
      try {
        syncService.push(payload);
      } catch {
        // ignore
      }

      const slotCount = Object.values(parsed.timetables)
        .reduce((sum, arr) => sum + (Array.isArray(arr) ? arr.length : 0), 0);
      const stats = parsed.stats || {};
      alert(
        `CSV imported successfully!\n\n` +
        `• Classes: ${parsed.classes.length}\n` +
        `• Slots assigned: ${slotCount}\n` +
        `• Periods/day: ${parsed.periodCount}\n` +
        `• Teachers: ${teachersList.length}\n` +
        `• Kept from CSV (source of truth): ${stats.fromCsv || 0}\n` +
        `• Filled from subject-teacher map: ${stats.filledFromOfficial || 0}\n` +
        `• Composite cells re-paired by subject: ${stats.compositeRepaired || 0}\n` +
        `• Server: ${serverOk ? 'updated' : 'skipped (using local only)'}\n\n` +
        `Old teacher initials will not reappear for 30s while sync catches up.`
      );
      window.location.reload();
      return true;
    } catch (err) {
      alert('CSV import failed: ' + err.message);
      return false;
    }
  }, []);

  const forcePushAllToServer = useCallback(async () => {
    // Check if timetable is locked
    if (!timetableLockService.canEdit()) return false;

    try {
      const payload = {};
      if (Object.keys(timetables).length > 0) payload.timetables = timetables;
      if (teachers.length > 0) payload.teachers = teachers;
      if (teacherSubjectMap && Object.keys(teacherSubjectMap).length > 0) payload.teacherSubjectMap = teacherSubjectMap;
      if (loadMaster.length > 0) payload.loadMaster = loadMaster;
      if (masterClasses.length > 0) payload.masterClasses = masterClasses;
      if (Object.keys(substitutions).length > 0) payload.substitutions = substitutions;
      if (Object.keys(absentTeachers).length > 0) payload.absentTeachers = absentTeachers;

      if (Object.keys(payload).length === 0) {
        alert('No data to push. All engines are empty locally.');
        return false;
      }

      const response = await fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: syncService._clientId,
          payload
        })
      });

      if (!response.ok) {
        throw new Error('Server returned ' + response.status);
      }

      const resJson = await response.json();
      if (resJson.success) {
        syncService._knownVersion = resJson.version;
        setSyncStatus('synced');
        setTimeout(() => setSyncStatus('idle'), 2000);
        alert(`Force sync complete! Pushed ${Object.keys(payload).join(', ')} to server (version ${resJson.version}).`);
        return true;
      } else {
        throw new Error(resJson.error || 'Unknown server error');
      }
    } catch (err) {
      alert('Force sync failed: ' + err.message);
      return false;
    }
  }, [timetables, teachers, teacherSubjectMap, loadMaster, masterClasses, substitutions, absentTeachers]);

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
      importCsvTimetable,
      clearAllTimetables,
      forcePushAllToServer,
      syncStatus,
      teachersSynced,
      isTimetableLocked,
      lockStatus,
      lockInfo,
      freezeTimetable,
      unfreezeTimetable,
      getLockStatusText,
    }}>
      {children}
    </TimetableContext.Provider>
  );
};
