import React, { useState, useEffect, useMemo } from 'react';
import { useTimetable } from '../context/TimetableContext';
import { AlertTriangle, CheckCircle2, Zap, Search, Wrench, Scissors, CalendarRange } from 'lucide-react';
import { autoAssignTeacher } from '../services/allocationEngine';
import { autoArrangeClass, resolveClashes, resolveClashDeep } from '../services/autoArrangeEngine';
import { fixClass } from '../services/bandAwareFix';
import { planFirstHalf } from '../services/firstHalfPlanner';
import {
  scanAllClashes,
  getClassClashRows,
} from '../services/clashScanner';
import {
  CHECKED,
  INTENTIONAL,
  loadLedger,
  setMarks,
  clearMarks,
  askForNote,
  recordFirstSeen,
  getLastVisit,
  setLastVisit,
  formatTimestamp,
  summarizeClashMarks,
} from '../services/clashCheckLedger';
import { getPeriods } from '../config/periods';
import { buildFilteredPrintHtml } from '../utils/filteredPrintHtml';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const PERIODS = getPeriods();

const ClassTimetable = () => {
  const { timetables, classes, updateSlot, loadMaster, teachers, teacherSubjectMap, getAllowedSubjectsForClass } = useTimetable();
  const [selectedClass, setSelectedClass] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [adminOverride, setAdminOverride] = useState(false);
  const [notification, setNotification] = useState(null);
  const [resolveLog, setResolveLog] = useState(null);
  const [fixPlan, setFixPlan] = useState(null);
  const [fhPlan, setFhPlan] = useState(null);
  const [showLoadBalance, setShowLoadBalance] = useState(false);

  // Check marks: which clashes have I already reviewed? (persisted across days)
  const [ledger, setLedger] = useState(() => loadLedger());
  const [lastVisit] = useState(() => getLastVisit());

  // Record that this session started — next visit compares against it (NEW chips)
  useEffect(() => {
    setLastVisit();
  }, []);

  // ONE global scan over every class timetable — all clashes, all teachers,
  // reported at once (composite slots included, nothing masked).
  const allClashes = useMemo(() => scanAllClashes(timetables), [timetables]);
  const allClashIds = useMemo(() => allClashes.map((c) => c.id), [allClashes]);
  // First-seen times for NEW chips (idempotent localStorage write, no re-render)
  const firstSeen = useMemo(() => recordFirstSeen(allClashIds), [allClashIds]);

  const classClashIds = useMemo(
    () => allClashes.filter((c) => c.classIds.includes(selectedClass)).map((c) => c.id),
    [allClashes, selectedClass]
  );
  const classSummary = useMemo(
    () => summarizeClashMarks(classClashIds, ledger, firstSeen, lastVisit),
    [classClashIds, ledger, firstSeen, lastVisit]
  );
  const globalSummary = useMemo(
    () => summarizeClashMarks(allClashIds, ledger, firstSeen, lastVisit),
    [allClashIds, ledger, firstSeen, lastVisit]
  );
  // Marks whose clash no longer exists = already fixed/cleared (history)
  const clearedMarks = useMemo(() => {
    const current = new Set(allClashIds);
    return Object.entries(ledger)
      .filter(([id]) => !current.has(id))
      .sort((a, b) => (b[1].checkedAt || 0) - (a[1].checkedAt || 0));
  }, [ledger, allClashIds]);

  // Live clash report for the selected class — recomputed automatically
  // after every edit/resolve, so a second clash is never hidden behind the first.
  const clashReport = useMemo(() => {
    if (!selectedClass) return [];
    return getClassClashRows(allClashes, timetables, selectedClass).map((row) => {
      const entries = row.entries.map((e) => ({ ...e, mark: ledger[e.id] || null }));
      const uncheckedIds = entries.filter((e) => !e.mark).map((e) => e.id);
      const checkedIds = entries
        .filter((e) => e.mark && e.mark.status === CHECKED)
        .map((e) => e.id);
      const intentionalIds = entries
        .filter((e) => e.mark && e.mark.status === INTENTIONAL)
        .map((e) => e.id);
      const notes = [...new Set(entries.filter((e) => e.mark && e.mark.note).map((e) => e.mark.note))];
      const state = uncheckedIds.length > 0 ? 'unchecked'
        : checkedIds.length > 0 ? 'checked'
        : 'intentional';
      return { ...row, entries, uncheckedIds, checkedIds, intentionalIds, notes, state };
    });
  }, [allClashes, timetables, selectedClass, ledger]);

  const handleMarkChecked = (row) => {
    if (row.uncheckedIds.length === 0) return;
    const existingNote = row.notes[0] || '';
    const note = askForNote(existingNote);
    setLedger((prev) => {
      const next = setMarks(prev, row.uncheckedIds, CHECKED, note);
      return next;
    });
  };

  const handleMarkIntentional = (row) => {
    const ids = [...row.uncheckedIds, ...row.checkedIds];
    if (ids.length === 0) return;
    setLedger((prev) => {
      const next = setMarks(prev, ids, INTENTIONAL, undefined);
      return next;
    });
  };

  const handleUndoChecked = (row) => {
    if (row.checkedIds.length === 0) return;
    setLedger((prev) => {
      const next = clearMarks(prev, row.checkedIds);
      return next;
    });
  };

  const handleUnmarkIntentional = (row) => {
    if (row.intentionalIds.length === 0) return;
    setLedger((prev) => {
      const next = clearMarks(prev, row.intentionalIds);
      return next;
    });
  };

  const handleClearHistory = () => {
    if (clearedMarks.length === 0) return;
    setLedger((prev) => {
      const next = clearMarks(prev, clearedMarks.map(([id]) => id));
      return next;
    });
  };

  // Calculate load balance for selected class
  const getLoadBalance = (classId) => {
    if (!classId || !timetables[classId]) return [];
    
    const normalizedClassId = classId.replace(/\s+/g, '').toUpperCase();
    
    // Get deleted subjects from localStorage
    const savedDeletedSubjects = localStorage.getItem('deletedSubjects');
    const deletedSubjects = savedDeletedSubjects ? JSON.parse(savedDeletedSubjects) : [];
    
    // Get expected load from loadMaster for this class (excluding deleted subjects)
    const expectedLoad = {};
    loadMaster.forEach(item => {
      if (item.class_id.replace(/\s+/g, '').toUpperCase() === normalizedClassId && !deletedSubjects.includes(item.subject)) {
        expectedLoad[item.subject] = item.total_load;
      }
    });
    
    // Count actual periods in timetable for each subject (excluding deleted subjects)
    const actualLoad = {};
    timetables[classId].forEach(slot => {
      if (slot.subject && !deletedSubjects.includes(slot.subject)) {
        actualLoad[slot.subject] = (actualLoad[slot.subject] || 0) + 1;
      }
    });
    
    // Combine and calculate balance
    const allSubjects = new Set([...Object.keys(expectedLoad), ...Object.keys(actualLoad)]);
    const balance = [];
    
    allSubjects.forEach(subject => {
      const expected = expectedLoad[subject] || 0;
      const actual = actualLoad[subject] || 0;
      const diff = actual - expected;
      let status = 'balanced';
      
      if (diff > 0) status = 'overloaded';
      else if (diff < 0) status = 'underloaded';
      
      balance.push({
        subject,
        expected,
        actual,
        diff,
        status
      });
    });
    
    // Sort: overloaded first, then underloaded, then balanced
    return balance.sort((a, b) => {
      if (a.status === 'overloaded' && b.status !== 'overloaded') return -1;
      if (a.status !== 'overloaded' && b.status === 'overloaded') return 1;
      if (a.status === 'underloaded' && b.status === 'balanced') return -1;
      if (a.status === 'balanced' && b.status === 'underloaded') return 1;
      return a.subject.localeCompare(b.subject);
    });
  };

  const loadBalance = getLoadBalance(selectedClass);
  const overloadedCount = loadBalance.filter(b => b.status === 'overloaded').length;
  const underloadedCount = loadBalance.filter(b => b.status === 'underloaded').length;
  const balancedCount = loadBalance.filter(b => b.status === 'balanced').length;

  // Check if a subject has a valid mapping for a class
  // Returns: { subjectExists: boolean, teacherAssigned: boolean, status: string }
  const getMappingStatus = (classId, subject) => {
    if (!subject) return { subjectExists: false, teacherAssigned: false, status: 'empty' };
    
    const normalizedClassId = classId.replace(/\s+/g, '').toUpperCase();
    
    // 1. Check if subject exists in loadMaster for this class
    const subjectInLoadMaster = loadMaster.some(
      item => item.class_id.replace(/\s+/g, '').toUpperCase() === normalizedClassId && item.subject === subject
    );
    
    // 2. Check if subject exists in teacherSubjectMap for this class
    const subjectInMap = teacherSubjectMap && teacherSubjectMap[subject] && 
      teacherSubjectMap[subject][normalizedClassId] !== undefined;
    
    const subjectExists = subjectInLoadMaster || subjectInMap;
    
    // 3. Check if teacher is mapped
    let teacherAssigned = false;
    if (subjectExists && teacherSubjectMap && teacherSubjectMap[subject]) {
      const mappedTeacher = teacherSubjectMap[subject][normalizedClassId];
      teacherAssigned = mappedTeacher !== undefined && mappedTeacher !== null && mappedTeacher.trim() !== '';
    }
    
    // 4. Determine status
    let status = 'valid';
    if (!subjectExists) {
      status = 'no_subject';
    } else if (!teacherAssigned) {
      status = 'no_teacher';
    }
    
    return { subjectExists, teacherAssigned, status };
  };

  const getLogDetails = (msg) => {
    let type = 'info';
    let title = 'Adjustment';
    let color = '#3b82f6';
    let bg = '#eff6ff';
    let border = '#bfdbfe';
    let icon = '🔄';

    if (msg.startsWith('🔄')) {
      type = 'internal';
      title = 'Internal Swap';
      color = '#0284c7';
      bg = '#f0f9ff';
      border = '#bae6fd';
      icon = '🔄';
    } else if (msg.startsWith('🔧')) {
      type = 'deep';
      title = 'Deep Resolve (Cross-Class)';
      color = '#7c3aed';
      bg = '#faf5ff';
      border = '#e9d5ff';
      icon = '🔧';
    } else if (msg.startsWith('✅')) {
      type = 'resolved';
      title = 'Pre-Resolved';
      color = '#16a34a';
      bg = '#f0fdf4';
      border = '#bbf7d0';
      icon = '✅';
    } else if (msg.startsWith('❌')) {
      type = 'unresolved';
      title = 'Unresolved Clash';
      color = '#dc2626';
      bg = '#fef2f2';
      border = '#fecaca';
      icon = '❌';
    }

    let cleanText = msg.replace(/^[🔄🔧✅❌]\s*/, '');
    return { type, title, color, bg, border, icon, text: cleanText };
  };

  const formatLogText = (text) => {
    const regex = /(\b[A-Za-z]+ \d\b|\bP\d\b|\b(?:Mon|Tue|Wed|Thu|Fri|Sat)(?:day)?\b|\b[1-9]+[A-B]\b|\([A-Za-z\s-]+\)|\b[A-Z]{2,3}\b)/g;
    const parts = text.split(regex);
    
    return parts.map((part, index) => {
      const isPeriod = /^[A-Za-z]+ \d$|^P\d$/.test(part);
      const isDay = /^(?:Mon|Tue|Wed|Thu|Fri|Sat)(?:day)?$/.test(part);
      const isClass = /^[1-9]+[A-B]$/.test(part);
      const isSubject = /^\([A-Za-z\s-]+\)$/.test(part);
      const isTeacher = /^[A-Z]{2,3}$/.test(part);

      if (isPeriod) {
        return <strong key={index} style={{ color: '#0f766e', fontWeight: 600 }}>{part}</strong>;
      }
      if (isDay) {
        return <strong key={index} style={{ color: '#b45309', fontWeight: 600 }}>{part}</strong>;
      }
      if (isClass) {
        return <span key={index} style={{ background: '#e0f2fe', color: '#0369a1', padding: '2px 6px', borderRadius: '4px', fontWeight: 700, fontSize: '0.8rem', margin: '0 2px' }}>{part}</span>;
      }
      if (isSubject) {
        return <span key={index} style={{ color: '#4f46e5', fontStyle: 'italic', fontWeight: 500 }}>{part}</span>;
      }
      if (isTeacher) {
        return <span key={index} style={{ background: '#fef08a', color: '#854d0e', padding: '1px 5px', borderRadius: '3px', fontWeight: 700, fontSize: '0.8rem', border: '1px solid #fef08a', margin: '0 2px' }}>{part}</span>;
      }
      return part;
    });
  };

  // Sync selectedClass if the current one is deleted or on load
  useEffect(() => {
    if (classes.length > 0) {
      if (!selectedClass || !classes.includes(selectedClass)) {
        setSelectedClass(classes[0]);
      }
    } else {
      setSelectedClass('');
    }
  }, [classes, selectedClass]);

  const [printAllClasses, setPrintAllClasses] = useState(false);

  useEffect(() => {
    if (printAllClasses) {
      // Small timeout to allow DOM to render all tables before printing
      const timer = setTimeout(() => {
        window.print();
        setPrintAllClasses(false);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [printAllClasses]);

  const handlePrintCurrent = () => {
    window.print();
  };

  const handlePrintAll = () => {
    setPrintAllClasses(true);
  };

  const handlePrintFiltered = () => {
    const html = buildFilteredPrintHtml(timetables, { periodCount: PERIODS.length });
    const win = window.open('', '_blank');
    if (!win) {
      alert('Pop-up blocked. Please allow pop-ups for this site, then try again.');
      return;
    }
    win.document.open();
    win.document.write(html);
    win.document.close();
    let printed = false;
    const doPrint = () => {
      if (printed) return;
      printed = true;
      win.focus();
      win.print();
    };
    win.onload = doPrint;
    setTimeout(doPrint, 700);
  };

  const handleSlotUpdate = (day, period, field, value, currentSubject, currentTeacher) => {
    let subject = currentSubject || '';
    let teacher = currentTeacher || '';
    let assignedTeachers = null;
    let clashes = [];

    if (field === 'subject') {
      subject = value;
      teacher = ''; // RULE: Clear previous assignment before recalculation
      // Auto-assign teacher using centralized engine
      if (value && teacherSubjectMap) {
        const assignment = autoAssignTeacher(value, selectedClass, day, period, teacherSubjectMap, timetables);
        
        if (assignment.status !== 'empty') {
          teacher = assignment.teacher;
          assignedTeachers = assignment.assignedTeachers || [];
          clashes = assignment.clashes || [];
          
          if (assignment.status === 'success') {
            setNotification({ type: 'success', message: assignment.message });
          } else if (assignment.status === 'partial_conflict') {
            setNotification({ type: 'warning', message: assignment.message });
          } else if (assignment.status === 'full_conflict') {
            setNotification({ type: 'error', message: assignment.message });
          }
        }
      }
    }
    if (field === 'teacher') teacher = value;

    // Check collision if updating teacher — lists EVERY clashing class, not just the first
    if (field === 'teacher' && value) {
      const incoming = value.split(',').map(t => t.trim().toLowerCase()).filter(Boolean);
      const collisions = allClashes.filter(c =>
        c.day === day &&
        c.period === parseInt(period, 10) &&
        incoming.includes(c.teacherKey) &&
        !(ledger[c.id] && ledger[c.id].status === INTENTIONAL)
      );
      if (collisions.length > 0) {
        const detail = collisions
          .map(c => `${c.teacher} already allotted to ${c.classIds.filter(x => x !== selectedClass).join(', ').toUpperCase()}`)
          .join(' | ');
        setNotification({
          type: 'error',
          message: `Collision Detected! ${detail} on ${day} Period ${period}.`
        });
        // Still update, but show warning (or we could prevent it)
      } else {
        setNotification({
          type: 'success',
          message: `Slot updated successfully.`
        });
      }
    }

    updateSlot(selectedClass, day, period, subject, teacher, assignedTeachers, clashes);
    
    // Clear notification after 3s
    setTimeout(() => setNotification(null), 3000);
  };

  // =============================================
  // AUTO ARRANGE: Fill entire class from scratch
  // =============================================
  const handleAutoArrange = () => {
    if (!selectedClass) return;
    if (!confirm(`This will REPLACE the entire timetable for ${selectedClass.toUpperCase()} using Load Master subjects and Teacher Mapping. Continue?`)) return;

    const result = autoArrangeClass(selectedClass, loadMaster, teacherSubjectMap, timetables);
    if (result.error) {
      setNotification({ type: 'error', message: result.error });
      return;
    }

    // Write each slot
    result.schedule.forEach(slot => {
      updateSlot(selectedClass, slot.day, slot.period, slot.subject, slot.teacher, slot.assignedTeachers, []);
    });

    const clashes = result.schedule.filter(s => s.clash);
    if (clashes.length > 0) {
      setNotification({ type: 'warning', message: `Auto-arranged ${result.schedule.length} slots. ${clashes.length} clashes detected — use Resolve Clashes to fix them.` });
    } else {
      setNotification({ type: 'success', message: `Successfully auto-arranged ${result.schedule.length} slots with zero clashes!` });
    }
    setResolveLog(null);
    setTimeout(() => setNotification(null), 5000);
  };

  // =============================================
  // DETECT CLASHES (report is live; this button announces the full picture)
  // =============================================
  const handleDetectClashes = () => {
    if (!selectedClass) return;

    const otherActive = allClashes.filter(
      c => !c.classIds.includes(selectedClass) && !ledger[c.id]
    ).length;

    if (clashReport.length === 0) {
      setNotification({ type: 'success', message: `No clashes found in ${selectedClass.toUpperCase()}!` });
    } else {
      let message = `Clash check ${classSummary.reviewed}/${classSummary.total} reviewed in ${selectedClass.toUpperCase()} — ${classSummary.unchecked} unchecked, ${classSummary.checked} checked, ${classSummary.intentional} intentional`;
      if (otherActive > 0) {
        message += ` — plus ${otherActive} unchecked in other classes (check Teacher Timetable)`;
      }
      setNotification({ type: classSummary.unchecked > 0 ? 'error' : 'success', message });
    }
    setTimeout(() => setNotification(null), 6000);
  };

  // =============================================
  // RESOLVE CLASHES (bulk resolve including deep swaps)
  // =============================================
  const handleResolveClashes = () => {
    if (!selectedClass) return;
    const result = resolveClashes(selectedClass, timetables);

    result.updates.forEach(u => {
      updateSlot(u.classId, u.day, u.period, u.subject, u.teacher, u.assignedTeachers, []);
    });

    setResolveLog(result.log);

    if (result.unresolved === 0 && result.totalClashes > 0) {
      setNotification({ type: 'success', message: `All ${result.totalClashes} clashes resolved!` });
    } else if (result.unresolved > 0) {
      setNotification({ type: 'warning', message: `Resolved ${result.resolved}/${result.totalClashes} clashes. ${result.unresolved} remain unresolvable.` });
    } else {
      setNotification({ type: 'success', message: `No clashes to resolve in ${selectedClass.toUpperCase()}.` });
    }
    setTimeout(() => setNotification(null), 5000);
  };

  // =============================================
  // SEPARATE COMBINED + Maths/Science both-halves fix (preview first)
  // =============================================
  const handleSeparateCombined = () => {
    if (!selectedClass) return;
    const plan = fixClass(selectedClass, timetables, PERIODS.length);
    if (plan.moves.length === 0 && plan.manual.length === 0) {
      setNotification({
        type: 'success',
        message: `${selectedClass.toUpperCase()}: nothing to fix — no combined cells and Maths/Science already in both halves every day.`,
      });
      setTimeout(() => setNotification(null), 5000);
      return;
    }
    setFixPlan(plan);
  };

  const applyFixPlan = () => {
    if (!fixPlan) return;
    const locked = fixPlan.updates.some(
      (u) => updateSlot(fixPlan.classId, u.day, u.period, u.subject, u.teacher, u.assignedTeachers, []) === false
    );
    if (locked) {
      setNotification({ type: 'error', message: 'Timetable is locked — unlock it first, then apply again.' });
    } else {
      setNotification({
        type: fixPlan.ok ? 'success' : 'warning',
        message:
          `Applied ${fixPlan.moves.length} move(s) to ${fixPlan.classId.toUpperCase()}: ` +
          `combined cells → ${fixPlan.expected.combined.length}, ` +
          `daily Maths/Science gaps → ${fixPlan.expected.band.length}` +
          (fixPlan.manual.length ? `, ${fixPlan.manual.length} still need a manual fix.` : '. All clean.'),
      });
    }
    setFixPlan(null);
    setTimeout(() => setNotification(null), 7000);
  };

  // =============================================
  // DESIGN FIRST HALF (classes 6-10, cross-class planner; preview first)
  // =============================================
  const handleDesignFirstHalf = () => {
    const plan = planFirstHalf(timetables, { periodCount: PERIODS.length });
    if (plan.updates.length === 0 && plan.ok) {
      setNotification({
        type: 'success',
        message: 'First half already matches the design — no changes needed.',
      });
      setTimeout(() => setNotification(null), 5000);
      return;
    }
    setFhPlan(plan);
  };

  const applyFhPlan = () => {
    if (!fhPlan) return;
    let locked = false;
    fhPlan.updates.forEach((u) => {
      const r = updateSlot(u.classId, u.day, u.period, u.subject, u.teacher, u.assignedTeachers, []);
      if (r === false) locked = true;
    });
    if (locked) {
      setNotification({ type: 'error', message: 'Timetable is locked — unlock it first, then apply again.' });
    } else {
      const fails = fhPlan.report.failures.length;
      setNotification({
        type: fhPlan.ok ? 'success' : 'warning',
        message:
          `Designed first half for ${fhPlan.classes.length} classes (6-10): ${fhPlan.updates.length} cell(s) changed` +
          (fhPlan.ok ? ', all checks passed.' : ` — ${fails} check(s) need review.`),
      });
    }
    setFhPlan(null);
    setTimeout(() => setNotification(null), 7000);
  };

  // =============================================
  // RESOLVE A SINGLE CLASH (per-row button, supports deep swap)
  // =============================================
  const handleResolveSingle = (day, period, deep = false) => {
    if (!selectedClass) return;
    const result = resolveClashDeep(selectedClass, day, period, timetables, deep);

    if (result.success) {
      result.updates.forEach(u => {
        updateSlot(u.classId, u.day, u.period, u.subject, u.teacher, u.assignedTeachers, []);
      });
      setNotification({ type: 'success', message: result.message });
      setResolveLog(prev => prev ? [...prev, result.message] : [result.message]);
      // clashReport is derived from timetables, so it refreshes automatically
      // with EVERY remaining clash (no masked follow-up clashes).
    } else {
      setNotification({ type: 'error', message: result.message });
    }
    setTimeout(() => setNotification(null), 5000);
  };

  const renderTimetableGrid = (targetClass) => (
    <div key={targetClass} className="timetable-wrapper" style={{ marginBottom: '3rem', pageBreakAfter: 'always' }}>
      <h2 className="print-only-title" style={{ display: 'none', textAlign: 'center', marginBottom: '1rem', color: '#0f172a', fontSize: '1.5rem', fontWeight: 'bold' }}>
        Doon Scholars - Class {targetClass.toUpperCase()} Timetable
      </h2>
      <div className="timetable-grid">
        {/* Header Row */}
        <div className="grid-cell grid-header">Day</div>
        {PERIODS.map(p => (
          <div key={`p${p}`} className="grid-cell grid-header">P{p}</div>
        ))}

        {/* Data Rows */}
        {DAYS.map(day => (
          <React.Fragment key={day}>
            <div className="grid-cell day-header">{day}</div>
            {PERIODS.map(p => {
              const slot = timetables[targetClass]?.find(s => s.day === day && parseInt(s.period, 10) === parseInt(p, 10));
              const mappingStatus = getMappingStatus(targetClass, slot?.subject);
              // Live clash check — global scanner with check marks:
              //   red pulse = NOT reviewed yet, amber = reviewed & pending fix,
              //   no mark   = reviewed as intentional (or no clash)
              const cellClashMarks = allClashes
                .filter(c =>
                  c.classIds.includes(targetClass) &&
                  c.day === day &&
                  c.period === parseInt(p, 10)
                )
                .map(c => ({ clash: c, mark: ledger[c.id] || null }));
              const uncheckedCell = cellClashMarks.filter(x => !x.mark);
              const checkedCell = cellClashMarks.filter(x => x.mark && x.mark.status === CHECKED);
              const isCollision = uncheckedCell.length > 0;
              const isCheckedPending = !isCollision && checkedCell.length > 0;

              // Clash takes priority so resolve/edit results match Mastersheet
              let cellClassName = 'grid-cell';
              if (isCollision) {
                cellClassName += ' collision-warning';
              } else if (isCheckedPending) {
                cellClassName += ' checked-warning';
              } else if (
                mappingStatus.status === 'no_subject' ||
                mappingStatus.status === 'empty' ||
                mappingStatus.status === 'no_teacher'
              ) {
                cellClassName += ' missing-mapping';
              }

              // Determine title tooltip
              let cellTitle = '';
              if (isCollision) {
                cellTitle = `UNCHECKED clash — ${uncheckedCell
                  .map(x => `${x.clash.teacher} is also teaching ${x.clash.classIds.filter(y => y !== targetClass).join(', ').toUpperCase()}`)
                  .join(' | ')}`;
              } else if (isCheckedPending) {
                const note = checkedCell.find(x => x.mark && x.mark.note);
                cellTitle = `Checked, pending fix — ${checkedCell
                  .map(x => `${x.clash.teacher} also with ${x.clash.classIds.filter(y => y !== targetClass).join(', ').toUpperCase()}`)
                  .join(' | ')}${note && note.mark.note ? ` — note: ${note.mark.note}` : ''}`;
              } else if (mappingStatus.status === 'no_subject' || mappingStatus.status === 'empty') {
                cellTitle = 'No valid subject mapping exists - subject may be deleted';
              } else if (mappingStatus.status === 'no_teacher') {
                cellTitle = 'Subject exists but teacher is not assigned';
              }
              
              return (
                <div 
                  key={`${day}-p${p}`} 
                  className={cellClassName}
                  title={cellTitle}
                >
                  {editMode && targetClass === selectedClass ? (
                    <div className="edit-slot no-print">
                      <select 
                        value={slot?.subject || ''} 
                        onChange={(e) => handleSlotUpdate(day, p, 'subject', e.target.value, slot?.subject, slot?.teacher)}
                        style={{ fontSize: '0.8rem', padding: '2px', width: '100%', background: '#fff', border: '1px solid #ccc', borderRadius: '2px' }}
                      >
                        <option value="">- Subject -</option>
                        {targetClass && getAllowedSubjectsForClass(targetClass).map(sub => (
                          <option key={sub} value={sub}>{sub}</option>
                        ))}
                      </select>
                      {adminOverride && (
                        <input 
                          type="text"
                          list="class-teacher-list"
                          value={slot?.teacher || ''} 
                          onChange={(e) => handleSlotUpdate(day, p, 'teacher', e.target.value, slot?.subject, slot?.teacher)}
                          style={{ fontSize: '0.8rem', padding: '2px', width: '100%' }}
                          placeholder="- Teacher Override -"
                        />
                      )}
                    </div>
                  ) : (
                    <>
                      {slot?.subject ? (
                        <>
                          {mappingStatus.status === 'no_subject' ? (
                            // Deleted subject - show message
                            <div className="slot-subject font-bold" style={{ color: '#1e40af', fontSize: '0.75rem' }}>No Subject or Teacher Assigned</div>
                          ) : mappingStatus.status === 'no_teacher' ? (
                            // Subject exists but no teacher
                            <>
                              <div className="slot-subject font-bold">{slot.subject}</div>
                              <div className="slot-teacher">No Teacher</div>
                            </>
                          ) : (
                            // Valid mapping - show normally
                            <>
                              <div className="slot-subject font-bold">{slot.subject}</div>
                              <div className="slot-teacher">
                                {slot.assignedTeachers && slot.assignedTeachers.length > 0 
                                  ? slot.assignedTeachers.map((at, idx) => {
                                      if (typeof at === 'string') return <span key={idx}>{at}{idx < slot.assignedTeachers.length - 1 ? ', ' : ''}</span>;
                                      return (
                                        <span key={idx} style={{ color: at.clash ? '#ef4444' : 'inherit' }} title={at.clashWith ? `Clash: ${at.clashWith}` : ''}>
                                          {at.teacher}{at.clash ? ` ⚠ (${at.clashWith})` : ''}{idx < slot.assignedTeachers.length - 1 ? ', ' : ''}
                                        </span>
                                      );
                                    })
                                  : (slot.teacher ? slot.teacher : 'No Teacher')}
                              </div>
                            </>
                          )}
                        </>
                      ) : (
                        <div className="slot-subject" style={{ color: '#1e40af', fontSize: '0.75rem', opacity: 1 }}>No Subject or Teacher Assigned</div>
                      )}
                    </>
                  )}
                </div>
              );
            })}
          </React.Fragment>
        ))}
      </div>
    </div>
  );

  return (
    <div>
      <div className="page-header no-print">
        <h1 className="page-title">Class Timetables</h1>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button
            className="btn"
            onClick={handleAutoArrange}
            disabled={!selectedClass}
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: '#7c3aed', color: 'white', border: 'none', borderRadius: '4px', padding: '0.5rem 1rem', fontWeight: 600, cursor: 'pointer' }}
            title="Auto-fill this class's timetable from Load Master & Teacher Mapping"
          >
            <Zap size={16} /> Auto Arrange
          </button>
          <button
            className="btn"
            onClick={handleDetectClashes}
            disabled={!selectedClass}
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: '#ea580c', color: 'white', border: 'none', borderRadius: '4px', padding: '0.5rem 1rem', fontWeight: 600, cursor: 'pointer' }}
            title="Scan for teacher clashes in the selected class (badge = clashes you have NOT checked yet, school-wide)"
          >
            <Search size={16} /> Detect Clashes
            {globalSummary.unchecked > 0 && (
              <span style={{ background: '#fff', color: '#b91c1c', borderRadius: '10px', padding: '1px 8px', fontSize: '0.75rem', fontWeight: 800 }}>
                {globalSummary.unchecked} unchecked
              </span>
            )}
          </button>
          <button
            className="btn"
            onClick={handleResolveClashes}
            disabled={!selectedClass}
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: '#0d9488', color: 'white', border: 'none', borderRadius: '4px', padding: '0.5rem 1rem', fontWeight: 600, cursor: 'pointer' }}
            title="Auto-resolve clashes by swapping periods within this class only"
          >
            <Wrench size={16} /> Resolve Clashes
          </button>
          <button
            className="btn"
            onClick={handleSeparateCombined}
            disabled={!selectedClass}
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: '#0369a1', color: 'white', border: 'none', borderRadius: '4px', padding: '0.5rem 1rem', fontWeight: 600, cursor: 'pointer' }}
            title="Move this class's slots out of combined-section cells and put Maths/Science in both halves (P1-5 AND P6-9) of every day. Preview shown before anything changes; only THIS class is touched."
          >
            <Scissors size={16} /> Separate Combined
          </button>
          <button
            className="btn"
            onClick={handleDesignFirstHalf}
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: '#7c3aed', color: 'white', border: 'none', borderRadius: '4px', padding: '0.5rem 1rem', fontWeight: 600, cursor: 'pointer' }}
            title="Rebuild P1-5 for classes 6-10: Maths/Science/SST daily, weekly quotas, no adjacent repeats, fixed per-section teachers, science rotation. Preview shown before anything changes; classes 11/12 are never touched."
          >
            <CalendarRange size={16} /> Design First Half (6–10)
          </button>
          <button className="btn btn-outline" onClick={handlePrintCurrent} title="Print or Download PDF for this class">
            🖨️ Print Class
          </button>
          <button className="btn btn-outline" onClick={handlePrintAll} title="Print or Download PDF for ALL classes">
            🖨️ Print All
          </button>
          <button
            className="btn btn-outline"
            onClick={handlePrintFiltered}
            title="Print filtered timetable: classes 1-5 keep P6-P9 only, classes 6-11 keep P1-P6 only, class 12 skipped, other periods left blank (A4 landscape, one class per page)"
          >
            🖨️ Print Filtered (1-5: P6-9 · 6-11: P1-6)
          </button>
          <button 
            className={adminOverride ? "btn btn-primary" : "btn"}
            onClick={() => setAdminOverride(!adminOverride)}
            title="Enable manual teacher selection"
          >
            {adminOverride ? 'Disable Override' : 'Admin Override'}
          </button>
          <button 
            className={editMode ? "btn" : "btn btn-primary"}
            onClick={() => setEditMode(!editMode)}
            disabled={!selectedClass}
          >
            {editMode ? 'Done Editing' : 'Edit Timetable'}
          </button>
        </div>
      </div>

      {notification && (
        <div className="no-print" style={{
          padding: '1rem', 
          marginBottom: '1rem', 
          borderRadius: '0.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          backgroundColor: notification.type === 'error' ? '#fef2f2' : '#ecfdf5',
          border: `1px solid ${notification.type === 'error' ? '#ef4444' : '#10b981'}`,
          color: notification.type === 'error' ? '#991b1b' : '#065f46'
        }}>
          {notification.type === 'error' ? <AlertTriangle size={20} /> : <CheckCircle2 size={20} />}
          {notification.message}
        </div>
      )}

      {fixPlan && (
        <div className="no-print" style={{
          margin: '1rem 0',
          padding: '1rem',
          borderRadius: '0.5rem',
          background: '#f0f9ff',
          border: '1px solid #0369a1',
          color: '#0c4a6e'
        }}>
          <strong>
            Preview — {fixPlan.classId.toUpperCase()}: {fixPlan.moves.length} move(s)
            {fixPlan.expected.combined.length === 0 && fixPlan.expected.band.length === 0
              ? ' (result: 0 combined cells, Maths/Science in both halves every day)'
              : ' (partial result — see below)'}
          </strong>
          <div style={{ fontSize: '0.8rem', opacity: 0.8, marginTop: '0.15rem' }}>
            Only {fixPlan.classId.toUpperCase()}'s own slots move. Teachers, loads, and every other class stay untouched.
          </div>
          <ul style={{ margin: '0.6rem 0', paddingLeft: '1.2rem', maxHeight: '220px', overflowY: 'auto', fontSize: '0.85rem' }}>
            {fixPlan.moves.map((m, i) => (
              <li key={i}>
                <strong>[{m.reason}]</strong> {m.subject} ({m.teacher || 'no teacher'}) — {m.fromDay} P{m.fromPeriod} → {m.toDay} P{m.toPeriod}
              </li>
            ))}
          </ul>
          {fixPlan.manual.length > 0 && (
            <div style={{ color: '#b91c1c', fontSize: '0.85rem', marginBottom: '0.6rem' }}>
              <AlertTriangle size={13} style={{ display: 'inline' }} /> {fixPlan.manual.length} need manual fix:{' '}
              {fixPlan.manual.map((m) => `${m.day} ${m.half || `P${m.period}`} ${m.subject || ''} (${m.note})`).join(' · ')}
            </div>
          )}
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              className="btn btn-primary"
              onClick={applyFixPlan}
              style={{ background: '#0369a1', color: 'white', border: 'none', borderRadius: '4px', padding: '0.5rem 1rem', fontWeight: 600, cursor: 'pointer' }}
            >
              Apply {fixPlan.moves.length} move(s)
            </button>
            <button className="btn btn-outline" onClick={() => setFixPlan(null)}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {fhPlan && (
        <div className="no-print" style={{
          margin: '1rem 0',
          padding: '1rem',
          borderRadius: '0.5rem',
          background: '#faf5ff',
          border: '1px solid #7c3aed',
          color: '#5b21b6'
        }}>
          <strong>
            Preview — First-half design: {fhPlan.classes.length} classes (6-10), {fhPlan.updates.length} cell(s) to change
          </strong>
          <div style={{ fontSize: '0.8rem', opacity: 0.8, marginTop: '0.15rem' }}>
            Rebuilds P1-5 daily (Maths/Science/SST + language rotation), rest of the week in P6-8. Classes 11/12 and all other data stay untouched.
          </div>
          <div style={{ fontSize: '0.85rem', marginTop: '0.4rem' }}>
            {fhPlan.ok ? (
              <span style={{ color: '#047857' }}>✓ All checks passed — 5 first-half cells and 3 second-half cells per class, loads preserved, no teacher clashes.</span>
            ) : (
              <span style={{ color: '#b45309' }}>
                ⚠ {fhPlan.report.failures.length} check(s), {fhPlan.manual.length} need manual review — applying is still possible, but review first.
              </span>
            )}
          </div>
          {!fhPlan.ok && fhPlan.report.failures.length > 0 && (
            <ul style={{ margin: '0.6rem 0', paddingLeft: '1.2rem', maxHeight: '180px', overflowY: 'auto', fontSize: '0.85rem' }}>
              {fhPlan.report.failures.slice(0, 20).map((f, i) => (
                <li key={i}>{typeof f === 'string' ? f : `${f.classId} ${f.day}: ${f.note}`}</li>
              ))}
            </ul>
          )}
          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
            <button
              className="btn btn-primary"
              onClick={applyFhPlan}
              style={{ background: '#7c3aed', color: 'white', border: 'none', borderRadius: '4px', padding: '0.5rem 1rem', fontWeight: 600, cursor: 'pointer' }}
            >
              Apply to {fhPlan.classes.length} classes ({fhPlan.updates.length} cells)
            </button>
            <button className="btn btn-outline" onClick={() => setFhPlan(null)}>
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="filter-bar no-print">
        <div className="filter-group">
          <label>Select Class:</label>
          <select 
            value={selectedClass} 
            onChange={(e) => {
              setSelectedClass(e.target.value);
              setResolveLog(null);
              setFixPlan(null);
              setFhPlan(null);
            }}
            style={{ width: '150px' }}
            disabled={classes.length === 0}
          >
            {classes.length === 0 ? (
              <option value="">No classes</option>
            ) : (
              classes.map(cls => (
                <option key={cls} value={cls}>{cls.toUpperCase()}</option>
              ))
            )}
          </select>
        </div>
        <div className="filter-group">
          <button
            className="btn"
            onClick={() => setShowLoadBalance(!showLoadBalance)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.5rem 1rem',
              borderRadius: '4px',
              fontWeight: 600,
              cursor: 'pointer',
              background: showLoadBalance ? '#059669' : '#f8fafc',
              color: showLoadBalance ? 'white' : '#374151',
              border: showLoadBalance ? 'none' : '1px solid #e5e7eb'
            }}
            disabled={!selectedClass}
          >
            📊 Load Balance
            {selectedClass && loadBalance.length > 0 && (
              <span style={{
                background: overloadedCount > 0 ? '#ef4444' : underloadedCount > 0 ? '#f59e0b' : '#10b981',
                color: 'white',
                padding: '1px 6px',
                borderRadius: '10px',
                fontSize: '0.7rem',
                marginLeft: '4px'
              }}>
                {overloadedCount > 0 ? `${overloadedCount} Over` : underloadedCount > 0 ? `${underloadedCount} Under` : '✓'}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Load Balance Panel */}
      {showLoadBalance && selectedClass && (
        <div className="no-print" style={{
          marginBottom: '1rem',
          padding: '1.25rem',
          borderRadius: '0.75rem',
          border: '1px solid #e2e8f0',
          background: 'linear-gradient(to bottom, #ffffff, #f8fafc)',
          boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05), 0 2px 4px -2px rgb(0 0 0 / 0.05)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.75rem' }}>
            <h3 style={{ margin: 0, color: '#1e293b', fontSize: '1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '28px', height: '28px', borderRadius: '50%', background: '#f1f5f9', color: '#0f766e' }}>📊</span>
              Load Balance Report — {selectedClass.toUpperCase()}
            </h3>
            <div style={{ display: 'flex', gap: '0.5rem', fontSize: '0.75rem' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 8px', borderRadius: '4px', background: '#fef2f2', color: '#991b1b', border: '1px solid #fecaca' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ef4444' }}></span>
                Overloaded ({overloadedCount})
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 8px', borderRadius: '4px', background: '#fffbeb', color: '#92400e', border: '1px solid #fde68a' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#f59e0b' }}></span>
                Underloaded ({underloadedCount})
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 8px', borderRadius: '4px', background: '#f0fdf4', color: '#166534', border: '1px solid #bbf7d0' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }}></span>
                Balanced ({balancedCount})
              </span>
            </div>
          </div>
          
          {loadBalance.length === 0 ? (
            <div style={{ padding: '1rem', textAlign: 'center', color: '#6b7280', fontSize: '0.875rem' }}>
              No load data available. Add subjects in Load Master first.
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '0.75rem' }}>
              {loadBalance.map((item, idx) => (
                <div 
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.75rem 1rem',
                    borderRadius: '0.5rem',
                    border: `1px solid ${item.status === 'overloaded' ? '#fecaca' : item.status === 'underloaded' ? '#fde68a' : '#bbf7d0'}`,
                    background: item.status === 'overloaded' ? '#fef2f2' : item.status === 'underloaded' ? '#fffbeb' : '#f0fdf4'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span style={{
                      width: '10px',
                      height: '10px',
                      borderRadius: '50%',
                      background: item.status === 'overloaded' ? '#ef4444' : item.status === 'underloaded' ? '#f59e0b' : '#10b981',
                      flexShrink: 0
                    }}></span>
                    <div>
                      <div style={{ fontWeight: 600, color: '#1e293b', fontSize: '0.875rem' }}>{item.subject}</div>
                      <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                        Expected: {item.expected} periods | Actual: {item.actual} periods
                      </div>
                    </div>
                  </div>
                  <div style={{
                    padding: '4px 10px',
                    borderRadius: '12px',
                    fontWeight: 700,
                    fontSize: '0.8rem',
                    background: item.status === 'overloaded' ? '#dc2626' : item.status === 'underloaded' ? '#d97706' : '#059669',
                    color: 'white'
                  }}>
                    {item.status === 'overloaded' ? `+${item.diff}` : item.status === 'underloaded' ? `${item.diff}` : '✓'}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <datalist id="class-teacher-list">
        {teachers.map(t => <option key={t} value={t} />)}
      </datalist>

      {/* Check-Memory progress bar — resumes where you left off next day */}
      {classSummary.total > 0 && (
        <div className="no-print" style={{ marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap', fontSize: '0.85rem', color: '#334155' }}>
          <span style={{ fontWeight: 700 }}>
            Clash check: {classSummary.reviewed}/{classSummary.total} reviewed
          </span>
          <div style={{ flex: '1 1 200px', height: '10px', background: '#e5e7eb', borderRadius: '5px', overflow: 'hidden', display: 'flex', minWidth: '160px' }}>
            <div style={{ width: `${(classSummary.intentional / classSummary.total) * 100}%`, background: '#16a34a' }} />
            <div style={{ width: `${(classSummary.checked / classSummary.total) * 100}%`, background: '#f59e0b' }} />
            <div style={{ width: `${(classSummary.unchecked / classSummary.total) * 100}%`, background: '#ef4444' }} />
          </div>
          <span style={{ color: '#dc2626', fontWeight: 700 }}>{classSummary.unchecked} unchecked</span>
          {classSummary.newCount > 0 && (
            <span style={{ background: '#dc2626', color: '#fff', borderRadius: '10px', padding: '1px 8px', fontSize: '0.72rem', fontWeight: 800 }}>
              {classSummary.newCount} NEW since last visit
            </span>
          )}
          {globalSummary.unchecked - classSummary.unchecked > 0 && (
            <span style={{ color: '#b45309' }}>
              + {globalSummary.unchecked - classSummary.unchecked} unchecked in other classes
            </span>
          )}
          <span style={{ color: '#64748b', fontSize: '0.78rem' }}>Last visit: {formatTimestamp(lastVisit)}</span>
        </div>
      )}

      {/* Clash Report Panel — every clash in this class, listed at once */}
      {clashReport.length > 0 && (
        <div className="no-print" style={{ marginBottom: '1rem', padding: '1rem', borderRadius: '0.5rem', border: '1px solid #fca5a5', background: '#fef2f2' }}>
          <h3 style={{ margin: '0 0 0.75rem 0', color: '#991b1b', fontSize: '1rem', fontWeight: 700 }}>
            ⚠️ Clash Report — {selectedClass.toUpperCase()} ({classSummary.unchecked} unchecked • {classSummary.checked} checked • {classSummary.intentional} intentional)
          </h3>
          <p style={{ fontSize: '0.8rem', color: '#6b7280', margin: '0 0 0.75rem 0' }}>
            All clashes are shown together (including every teacher of a combination subject). Mark each one so you remember next day:
            <strong> ✓ Checked</strong> = real, fix later (add a note) · <strong>Intentional</strong> = combined class, leave it.
            Unchecked clashes stay red &amp; pulsing until reviewed.
          </p>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
            <thead><tr style={{ background: '#fee2e2' }}>
              <th style={{ padding: '6px 10px', textAlign: 'left', borderBottom: '2px solid #fca5a5' }}>Day</th>
              <th style={{ padding: '6px 10px', textAlign: 'center', borderBottom: '2px solid #fca5a5' }}>Period</th>
              <th style={{ padding: '6px 10px', textAlign: 'left', borderBottom: '2px solid #fca5a5' }}>Subject</th>
              <th style={{ padding: '6px 10px', textAlign: 'center', borderBottom: '2px solid #fca5a5' }}>Teachers</th>
              <th style={{ padding: '6px 10px', textAlign: 'left', borderBottom: '2px solid #fca5a5' }}>Clashes With</th>
              <th style={{ padding: '6px 10px', textAlign: 'center', borderBottom: '2px solid #fca5a5' }}>Status</th>
              <th style={{ padding: '6px 10px', textAlign: 'left', borderBottom: '2px solid #fca5a5' }}>Note</th>
              <th style={{ padding: '6px 10px', textAlign: 'center', borderBottom: '2px solid #fca5a5' }}>Action</th>
            </tr></thead>
            <tbody>{clashReport.map((c, i) => (
              <tr key={`${c.day}-${c.period}-${i}`} style={{ background: c.state === 'intentional' ? '#f0fdf4' : c.state === 'checked' ? '#fffbeb' : '#fef2f2' }}>
                <td style={{ padding: '6px 10px', borderBottom: '1px solid #fecaca' }}>{c.day}</td>
                <td style={{ padding: '6px 10px', textAlign: 'center', borderBottom: '1px solid #fecaca', fontWeight: 700 }}>{c.period}</td>
                <td style={{ padding: '6px 10px', borderBottom: '1px solid #fecaca' }}>
                  {c.subject}
                  {c.isComposite && <span style={{ marginLeft: '6px', fontSize: '0.7rem', background: '#dbeafe', color: '#1e40af', padding: '1px 6px', borderRadius: '4px' }}>Combination</span>}
                </td>
                <td style={{ padding: '6px 10px', textAlign: 'center', borderBottom: '1px solid #fecaca' }}>
                  {(c.allTeachers.length > 0 ? c.allTeachers : c.entries.map(e => e.teacher)).map((t, ti) => {
                    const entry = c.entries.find(e => e.teacher.toUpperCase() === t.toUpperCase());
                    const mark = entry ? entry.mark : null;
                    const color = !mark ? '#dc2626' : mark.status === CHECKED ? '#b45309' : '#166534';
                    return (
                      <span key={ti} style={{ fontWeight: 700, color }}>
                        {t}{mark ? ' ✓' : ''}{ti < (c.allTeachers.length || c.entries.length) - 1 ? ', ' : ''}
                      </span>
                    );
                  })}
                </td>
                <td style={{ padding: '6px 10px', borderBottom: '1px solid #fecaca' }}>
                  {c.clashClasses.map(cl => cl.toUpperCase()).join(', ')}
                </td>
                <td style={{ padding: '6px 10px', borderBottom: '1px solid #fecaca', textAlign: 'center', whiteSpace: 'nowrap', fontWeight: 700, fontSize: '0.78rem' }}>
                  {c.state === 'unchecked' && (
                    <span style={{ color: '#dc2626' }}>
                      {c.uncheckedIds.length} unchecked{c.checkedIds.length > 0 ? ` · ${c.checkedIds.length} checked` : ''}
                    </span>
                  )}
                  {c.state === 'checked' && <span style={{ color: '#b45309' }}>✓ Checked · to fix</span>}
                  {c.state === 'intentional' && <span style={{ color: '#166534' }}>✓ Intentional</span>}
                </td>
                <td style={{ padding: '6px 10px', borderBottom: '1px solid #fecaca', fontSize: '0.78rem', color: '#475569', fontStyle: 'italic', maxWidth: '160px' }}>
                  {c.notes.length > 0 ? c.notes.join(' · ') : '—'}
                </td>
                <td style={{ padding: '6px 10px', borderBottom: '1px solid #fecaca', textAlign: 'center', whiteSpace: 'nowrap' }}>
                  {c.state !== 'intentional' && (
                    <>
                      <button
                        onClick={() => handleResolveSingle(c.day, c.period, false)}
                        style={{ background: '#0d9488', color: 'white', border: 'none', borderRadius: '4px', padding: '4px 8px', fontWeight: 600, cursor: 'pointer', fontSize: '0.78rem', marginRight: '4px' }}
                        title="Auto-resolve this specific clash by swapping within the class"
                      >Resolve</button>
                      <button
                        onClick={() => handleResolveSingle(c.day, c.period, true)}
                        style={{ background: '#7c3aed', color: 'white', border: 'none', borderRadius: '4px', padding: '4px 8px', fontWeight: 600, cursor: 'pointer', fontSize: '0.78rem', marginRight: '4px' }}
                        title="Try Deep Resolve: fixes the clash by swapping in other classes if internal swap fails"
                      >Deep</button>
                    </>
                  )}
                  {c.uncheckedIds.length > 0 && (
                    <button
                      onClick={() => handleMarkChecked(c)}
                      style={{ background: '#d97706', color: 'white', border: 'none', borderRadius: '4px', padding: '4px 8px', fontWeight: 600, cursor: 'pointer', fontSize: '0.78rem', marginRight: '4px' }}
                      title="Mark as reviewed: a real clash you will fix later (you can add a note)"
                    >✓ Checked</button>
                  )}
                  {c.state === 'checked' && (
                    <button
                      onClick={() => handleUndoChecked(c)}
                      style={{ background: '#6b7280', color: 'white', border: 'none', borderRadius: '4px', padding: '4px 8px', fontWeight: 600, cursor: 'pointer', fontSize: '0.78rem', marginRight: '4px' }}
                      title="Undo the check mark — back to unchecked"
                    >Undo</button>
                  )}
                  {c.state === 'intentional' ? (
                    <button
                      onClick={() => handleUnmarkIntentional(c)}
                      style={{ background: '#16a34a', color: 'white', border: 'none', borderRadius: '4px', padding: '4px 8px', fontWeight: 600, cursor: 'pointer', fontSize: '0.78rem' }}
                      title="This is marked as an intentional combined class — click to unmark"
                    >✓ Intentional — Unmark</button>
                  ) : (
                    <button
                      onClick={() => handleMarkIntentional(c)}
                      style={{ background: '#16a34a', color: 'white', border: 'none', borderRadius: '4px', padding: '4px 8px', fontWeight: 600, cursor: 'pointer', fontSize: '0.78rem' }}
                      title="Mark as intentional combined class (reviewed — not a real clash)"
                    >Intentional</button>
                  )}
                </td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}

      {/* Cleared history — clashes you marked that no longer exist (fixed) */}
      {clearedMarks.length > 0 && (
        <div className="no-print" style={{ marginBottom: '1rem', padding: '0.75rem 1rem', borderRadius: '0.5rem', border: '1px solid #bbf7d0', background: '#f0fdf4', fontSize: '0.8rem', color: '#166534' }}>
          <strong>✓ Already cleared ({clearedMarks.length}):</strong>{' '}
          {clearedMarks.slice(0, 5).map(([id, m]) => id.split('|').slice(0, 3).join(' ') + (m.note ? ` “${m.note}”` : '')).join(' · ')}
          {clearedMarks.length > 5 ? ` … +${clearedMarks.length - 5} more` : ''}
          <button
            onClick={handleClearHistory}
            style={{ marginLeft: '8px', background: 'none', border: '1px solid #86efac', color: '#15803d', borderRadius: '4px', padding: '2px 8px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600 }}
            title="Remove these finished entries from memory"
          >Clear list</button>
        </div>
      )}

      {/* Resolve Log Panel */}
      {resolveLog && resolveLog.length > 0 && (
        <div className="no-print" style={{ 
          marginBottom: '1.5rem', 
          padding: '1.25rem', 
          borderRadius: '0.75rem', 
          border: '1px solid #e2e8f0', 
          background: 'linear-gradient(to bottom, #ffffff, #f8fafc)', 
          boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05), 0 2px 4px -2px rgb(0 0 0 / 0.05)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.75rem' }}>
            <h3 style={{ margin: 0, color: '#1e293b', fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '28px', height: '28px', borderRadius: '50%', background: '#f1f5f9', color: '#0f766e' }}>🔧</span>
              Resolution & Adjustment Log
            </h3>
            <button 
              onClick={() => setResolveLog(null)}
              style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 500 }}
              title="Clear all resolution entries"
            >
              Clear Log
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {resolveLog.map((msg, i) => {
              const details = getLogDetails(msg);
              return (
                <div key={i} style={{ 
                  display: 'flex', 
                  alignItems: 'flex-start', 
                  gap: '0.75rem', 
                  padding: '0.75rem 1rem', 
                  borderRadius: '0.5rem', 
                  border: `1px solid ${details.border}`, 
                  background: details.bg,
                  fontSize: '0.875rem',
                  lineHeight: '1.5',
                  boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.02)'
                }}>
                  <span style={{ fontSize: '1.1rem', lineHeight: '1', marginTop: '2px' }}>{details.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                      <span style={{ fontWeight: 700, color: details.color, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        {details.title}
                      </span>
                    </div>
                    <div style={{ color: '#334155' }}>
                      {formatLogText(details.text)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="card printable-area">
        {classes.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
            No classes available. Please add classes in the Class & Section Manager first.
          </div>
        ) : (
          printAllClasses ? classes.map(cls => renderTimetableGrid(cls)) : renderTimetableGrid(selectedClass)
        )}
      </div>
    </div>
  );
};

export default ClassTimetable;
