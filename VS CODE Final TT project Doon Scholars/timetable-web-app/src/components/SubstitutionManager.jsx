// SubstitutionManager.jsx

import React, { useState, useMemo, useEffect } from "react";
import { useTimetable } from '../context/TimetableContext';
import { Calendar as CalendarIcon, Users } from 'lucide-react';

import {
  normalizeTeacherId,
  normalizePeriod,
  normalizeClassId
} from "../services/substitution/normalization";

import {
  generateAllSubstitutions
} from "../services/substitution/engine";

import { buildTeacherScheduleMap } from "../services/timetable/buildTeacherScheduleMap";
import { buildTeacherUsageMap } from "../services/timetable/buildTeacherUsageMap";

const SubstitutionEngineUI = ({
  timetables,
  teachers,
  dailyAbsent,
  selectedDate,
  selectedDayName,
  stableTeacherUsage,
  dailySubstitutions,
  setDailySubstitutions,
  getTeacherFullName
}) => {

  const [manualOverrides, setManualOverrides] = useState({});

  // =========================================
  // BUILD TEACHER SCHEDULE MAP
  // =========================================

  const teacherScheduleMap = useMemo(() => {
    return buildTeacherScheduleMap(timetables);
  }, [timetables]);

  // =========================================
  // AUTO GENERATE SUBSTITUTIONS
  // =========================================

  useEffect(() => {

    if (selectedDayName === "Sun") return;

    // clear substitutions
    if (dailyAbsent.length === 0) {
      setDailySubstitutions(selectedDate, []);
      return;
    }

    const generatedSubs = generateAllSubstitutions(
      dailyAbsent,
      teacherScheduleMap,
      teachers,
      stableTeacherUsage,
      selectedDayName
    );

    console.log("GENERATED SUBSTITUTIONS", generatedSubs);

    setDailySubstitutions(selectedDate, generatedSubs);

  }, [
    dailyAbsent,
    selectedDate,
    selectedDayName,
    teacherScheduleMap,
    teachers,
    stableTeacherUsage,
    setDailySubstitutions
  ]);

  // =========================================
  // GET TEACHER DAILY LOAD
  // =========================================

  const getTeacherDailyLoad = (teacherName) => {
    if (selectedDayName === "Sun") return 0;

    const tId = normalizeTeacherId(teacherName);
    const usage = stableTeacherUsage?.[tId]?.[selectedDayName] || {};

    const baseLoad = Object.entries(usage).filter(([_, value]) => value).length;

    const extraLoad = dailySubstitutions.filter(
      s => normalizeTeacherId(s.substituteTeacher) === tId
    ).length;

    return baseLoad + extraLoad;
  };

  // =========================================
  // VALID MANUAL SUBSTITUTE TEACHERS
  // =========================================

  const getValidManualTeachers = (period) => {
    const normalizedPeriod = normalizePeriod(period);

    return teachers
      // remove absent teachers
      .filter(t => !dailyAbsent.map(normalizeTeacherId).includes(normalizeTeacherId(t)))
      // teacher free
      .filter(t => {
        const tId = normalizeTeacherId(t);
        const usage = stableTeacherUsage?.[tId]?.[selectedDayName] || {};
        const occupied = Object.entries(usage).filter(([_, value]) => value).map(([period]) => normalizePeriod(period));
        return !occupied.includes(normalizedPeriod);
      })
      // prevent duplicate substitute
      .filter(t => {
        const tId = normalizeTeacherId(t);
        return !dailySubstitutions.some(
          s => normalizeTeacherId(s.substituteTeacher) === tId && normalizePeriod(s.period) === normalizedPeriod
        );
      })
      // exempt from substitution duty
      .filter(t => !['AN', 'P', 'RN'].includes(normalizeTeacherId(t)))
      .map(t => {
        const tId = normalizeTeacherId(t);
        const usage = stableTeacherUsage?.[tId]?.[selectedDayName] || {};
        const baseLoad = Object.entries(usage).filter(([_, value]) => value).length;
        const extraLoad = dailySubstitutions.filter(
          s => normalizeTeacherId(s.substituteTeacher) === tId
        ).length;
        return { name: t, baseLoad, extraLoad, load: baseLoad + extraLoad };
      })
      // strictly enforce max 3 arrangements AND total periods < 8
      .filter(t => t.extraLoad < 3 && t.load < 8)
      .sort((a, b) => {
        if (a.extraLoad !== b.extraLoad) {
          return a.extraLoad - b.extraLoad;
        }
        return a.baseLoad - b.baseLoad;
      });
  };

  // =========================================
  // MANUAL OVERRIDE
  // =========================================

  const handleManualAssign = (slotId, teacher) => {
    const updated = dailySubstitutions.map(sub => {
      if (sub.slotId !== slotId) return sub;
      return {
        ...sub,
        substituteTeacher: teacher,
        substituteTeacherId: normalizeTeacherId(teacher),
        manualOverride: true
      };
    });
    setDailySubstitutions(selectedDate, updated);
  };

  // =========================================
  // GROUP BY ABSENT TEACHER
  // =========================================

  const groupedSubstitutions = useMemo(() => {
    const grouped = {};
    dailySubstitutions.forEach(sub => {
      const teacher = sub.absentTeacher;
      if (!grouped[teacher]) { grouped[teacher] = []; }
      grouped[teacher].push(sub);
    });
    return grouped;
  }, [dailySubstitutions]);

  // =========================================
  // UI
  // =========================================

  return (
    <div className="card printable-card printable-area" style={{ padding: '1.5rem', backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
      <style>{`
        @media print {
          @page {
            size: portrait !important;
            margin: 8mm !important;
          }
          body {
            background: white !important;
            color: black !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          /* Override general visibility rules from index.css print block */
          body * {
            visibility: hidden !important;
          }
          .printable-area, .printable-area * {
            visibility: visible !important;
          }
          .printable-area {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            display: block !important;
          }
          nav, .no-print, button, select, input {
            display: none !important;
          }
          .printable-card {
            border: none !important;
            box-shadow: none !important;
            padding: 0 !important;
            margin: 0 !important;
            width: 100% !important;
          }
          .print-only-header {
            display: block !important;
          }
          .substitution-group-card {
            border: 1px solid #cbd5e1 !important;
            margin-bottom: 12px !important;
            padding: 8px !important;
            page-break-inside: avoid;
            background: #fff !important;
            border-radius: 6px !important;
          }
          .substitution-title {
            font-size: 14px !important;
            color: #b91c1c !important;
            margin-bottom: 6px !important;
            margin-top: 0 !important;
            font-weight: bold !important;
          }
          .sub-table {
            width: 100% !important;
            border-collapse: collapse !important;
            font-size: 11px !important;
          }
          .sub-table th {
            background-color: #f3f4f6 !important;
            color: #000 !important;
            font-weight: bold !important;
            padding: 4px 6px !important;
            border: 1px solid #cbd5e1 !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .sub-table td {
            padding: 4px 6px !important;
            border: 1px solid #cbd5e1 !important;
          }
        }
      `}</style>

      {/* Print-only Header */}
      <div className="print-only-header" style={{ display: 'none' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 'bold', margin: '0 0 8px 0', textAlign: 'center', color: '#1e3a8a' }}>
          Doon Scholars ERP - Daily Substitution Arrangements
        </h2>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', borderBottom: '2px solid #1e3a8a', paddingBottom: '6px', marginBottom: '15px' }}>
          <span><strong>Date:</strong> {selectedDate}</span>
          <span><strong>Day:</strong> {selectedDayName}</span>
        </div>
      </div>

      <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '1rem' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', margin: 0 }}>
          Automatic Substitution Engine
        </h2>
        {Object.keys(groupedSubstitutions).length > 0 && (
          <button
            onClick={() => window.print()}
            style={{
              background: '#2563eb',
              color: 'white',
              border: 'none',
              padding: '0.5rem 1.25rem',
              borderRadius: '6px',
              fontWeight: 600,
              cursor: 'pointer',
              fontSize: '0.875rem',
              transition: 'background-color 0.2s',
              boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
            }}
            onMouseOver={(e) => e.target.style.background = '#1d4ed8'}
            onMouseOut={(e) => e.target.style.background = '#2563eb'}
          >
            Print / PDF Arrangements
          </button>
        )}
      </div>

      {Object.keys(groupedSubstitutions).length === 0 ? (
        <div style={{ color: '#6b7280', fontWeight: '500', textAlign: 'center', padding: '2rem 0' }}>
          No substitutions generated. Make sure to select absent teachers above.
        </div>
      ) : (
        Object.entries(groupedSubstitutions).map(([teacher, subs]) => (
          <div key={teacher} className="substitution-group-card" style={{ marginBottom: '1rem', border: '1px solid #e5e7eb', borderRadius: '0.5rem', padding: '0.75rem', boxShadow: '0 1px 2px rgba(0,0,0,0.05)', backgroundColor: '#fafafa' }}>
            <h3 className="substitution-title" style={{ fontSize: '1rem', fontWeight: 'bold', marginBottom: '0.5rem', color: '#dc2626', marginTop: 0 }}>
              {teacher} ({getTeacherFullName(teacher)}) Absent
            </h3>
            <table className="sub-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ backgroundColor: '#f3f4f6' }}>
                  <th style={{ padding: '0.35rem 0.5rem', borderBottom: '2px solid #e5e7eb', fontSize: '0.85rem' }}>Period</th>
                  <th style={{ padding: '0.35rem 0.5rem', borderBottom: '2px solid #e5e7eb', fontSize: '0.85rem' }}>Class</th>
                  <th style={{ padding: '0.35rem 0.5rem', borderBottom: '2px solid #e5e7eb', fontSize: '0.85rem' }}>Subject</th>
                  <th style={{ padding: '0.35rem 0.5rem', borderBottom: '2px solid #e5e7eb', fontSize: '0.85rem' }}>Substitute Arrangement</th>
                </tr>
              </thead>
              <tbody>
                {subs.map(sub => (
                  <tr key={sub.slotId}>
                    <td style={{ padding: '0.35rem 0.5rem', borderBottom: '1px solid #e5e7eb', textAlign: 'center', fontWeight: 'bold', fontSize: '0.8rem' }}>{sub.period}</td>
                    <td style={{ padding: '0.35rem 0.5rem', borderBottom: '1px solid #e5e7eb', textAlign: 'center', fontSize: '0.8rem' }}>{sub.classId.toUpperCase()}</td>
                    <td style={{ padding: '0.35rem 0.5rem', borderBottom: '1px solid #e5e7eb', textAlign: 'center', fontSize: '0.8rem' }}>{sub.subject}</td>
                    <td style={{ padding: '0.35rem 0.5rem', borderBottom: '1px solid #e5e7eb', fontSize: '0.8rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span
                          style={{
                            fontWeight: "bold",
                            color: sub.substituteTeacher === "UNASSIGNED" ? "#ef4444" : sub.manualOverride ? "#ca8a04" : "#059669"
                          }}
                        >
                          {sub.substituteTeacher === "UNASSIGNED" ? sub.substituteTeacher : `${sub.substituteTeacher} ${getTeacherFullName(sub.substituteTeacher) !== sub.substituteTeacher ? '- ' + getTeacherFullName(sub.substituteTeacher) : ''}`}
                        </span>
                        <select
                          className="no-print"
                          style={{ border: '1px solid #d1d5db', borderRadius: '4px', padding: '0.15rem 0.35rem', fontSize: '0.75rem', background: '#fff' }}
                          defaultValue=""
                          onChange={(e) => {
                            if (!e.target.value) return;
                            handleManualAssign(sub.slotId, e.target.value);
                          }}
                        >
                          <option value="">Change</option>
                          {getValidManualTeachers(sub.period).map(t => (
                            <option key={t.name} value={t.name}>
                              {t.name} {getTeacherFullName(t.name) !== t.name ? `- ${getTeacherFullName(t.name)}` : ''} (Load: {t.load}/8)
                            </option>
                          ))}
                        </select>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))
      )}
    </div>
  );
};

const SubstitutionManager = () => {
  const { 
    timetables, 
    teachers, 
    substitutions, 
    absentTeachers,
    teacherMapping,
    setDailySubstitutions,
    markTeacherAbsent,
    unmarkTeacherAbsent
  } = useTimetable();

  const getTeacherFullName = (shortName) => {
    if (!teacherMapping || !Array.isArray(teacherMapping)) return shortName;
    const match = teacherMapping.find(t => Object.values(t).includes(shortName) || t.Teacher === shortName || t.ID === shortName);
    return match ? (match['Teacher Name'] || match.Name || match.Teacher || shortName) : shortName;
  };

  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  
  const selectedDayName = useMemo(() => {
    if (!selectedDate) return '';
    const [year, month, day] = selectedDate.split('-');
    const d = new Date(year, parseInt(month) - 1, day);
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return days[d.getDay()];
  }, [selectedDate]);

  const dailySubstitutions = useMemo(() => substitutions[selectedDate] || [], [substitutions, selectedDate]);
  const dailyAbsent = useMemo(() => absentTeachers[selectedDate] || [], [absentTeachers, selectedDate]);

  const handleToggleAbsent = (teacherName) => {
    if (dailyAbsent.includes(teacherName)) {
      unmarkTeacherAbsent(selectedDate, teacherName);
    } else {
      markTeacherAbsent(selectedDate, teacherName);
    }
  };

  const stableTeacherUsage = useMemo(() => {
    const map = buildTeacherScheduleMap(timetables);
    return buildTeacherUsageMap(map);
  }, [timetables]);

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '1rem' }}>
      <h1 className="no-print" style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>Advanced Substitution Manager</h1>
      
      <div className="card no-print" style={{ marginBottom: '1.5rem', borderLeft: '4px solid #3b82f6', padding: '1rem', backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <h3 style={{ margin: '0 0 1rem 0' }}>STEP 1 — Select Date</h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <CalendarIcon size={20} color="#3b82f6" />
          <input 
            type="date" 
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            style={{ width: '200px', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc' }}
          />
          <span style={{ fontWeight: 'bold', color: '#3b82f6' }}>{selectedDayName}</span>
        </div>
      </div>

      <div className="card no-print" style={{ marginBottom: '1.5rem', borderLeft: '4px solid #ef4444', padding: '1rem', backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <h3 style={{ margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Users size={20} color="#ef4444" /> STEP 2 — Select Absent Teachers
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '0.5rem' }}>
          {teachers.map(t => (
            <label key={t} style={{ 
              display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem', 
              backgroundColor: dailyAbsent.includes(t) ? '#fee2e2' : '#f8fafc', 
              border: `1px solid ${dailyAbsent.includes(t) ? '#fca5a5' : '#e2e8f0'}`,
              borderRadius: '4px', cursor: 'pointer'
            }}>
              <input 
                type="checkbox" 
                checked={dailyAbsent.includes(t)}
                onChange={() => handleToggleAbsent(t)}
              />
              <span style={{ fontWeight: dailyAbsent.includes(t) ? 'bold' : 'normal', color: dailyAbsent.includes(t) ? '#b91c1c' : 'inherit' }}>
                {t} {getTeacherFullName(t) !== t ? `- ${getTeacherFullName(t)}` : ''}
              </span>
            </label>
          ))}
        </div>
      </div>

      <SubstitutionEngineUI 
        timetables={timetables}
        teachers={teachers}
        dailyAbsent={dailyAbsent}
        selectedDate={selectedDate}
        selectedDayName={selectedDayName}
        stableTeacherUsage={stableTeacherUsage}
        dailySubstitutions={dailySubstitutions}
        setDailySubstitutions={setDailySubstitutions}
        getTeacherFullName={getTeacherFullName}
      />
    </div>
  );
};

export default SubstitutionManager;