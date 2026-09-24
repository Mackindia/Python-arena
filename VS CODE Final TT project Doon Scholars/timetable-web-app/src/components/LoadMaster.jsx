import React, { useState } from 'react';
import { useTimetable } from '../context/TimetableContext';
import { Plus } from 'lucide-react';

const LoadMaster = () => {
  const { loadMaster, timetables, masterClasses, addLoadMasterEntry, removeLoadMasterEntry, renameLoadMasterSubject, updateTotalLoad } = useTimetable();
  const [filterClass, setFilterClass] = useState('');
  
  // Add Subject Mapping Modal State
  const [showAddSubject, setShowAddSubject] = useState(false);
  const [selectedMappingClass, setSelectedMappingClass] = useState('');
  const [selectedMappingSection, setSelectedMappingSection] = useState('');
  const [newSubject, setNewSubject] = useState('');
  const [newLoad, setNewLoad] = useState('0');

  // Calculate actual used load based on the current timetables
  const getCalculatedLoadData = () => {
    return loadMaster.map(item => {
      let used = 0;
      const classId = item.class_id;
      
      if (timetables[classId]) {
        timetables[classId].forEach(slot => {
          if (slot.subject === item.subject) {
            used++;
          }
        });
      }
      
      return {
        ...item,
        actual_used: used,
        actual_remaining: item.total_load - used
      };
    });
  };

  const calculatedData = getCalculatedLoadData();
  
  const filteredData = filterClass 
    ? calculatedData.filter(item => item.class_val === filterClass)
    : calculatedData;

  const uniqueClasses = [...new Set(loadMaster.map(item => item.class_val))].sort((a,b) => parseInt(a) - parseInt(b));

  const handleAddSubjectMapping = (e) => {
    e.preventDefault();
    if (selectedMappingClass && selectedMappingSection && newSubject.trim()) {
      addLoadMasterEntry(selectedMappingClass, selectedMappingSection, newSubject.trim(), newLoad);
      // Reset form
      setSelectedMappingClass('');
      setSelectedMappingSection('');
      setNewSubject('');
      setNewLoad('0');
      setShowAddSubject(false);
    }
  };

  // Get sections for the selected class in the modal
  const getSectionsForMappingClass = () => {
    if (!selectedMappingClass) return [];
    const cls = masterClasses.find(c => c.className === selectedMappingClass);
    return cls ? cls.sections : [];
  };

  const handleRename = (classId, oldSubject) => {
    const newName = prompt(`Enter new name for subject "${oldSubject}":`, oldSubject);
    if (newName && newName.trim() !== '' && newName !== oldSubject) {
      renameLoadMasterSubject(classId, oldSubject, newName);
    }
  };

  const handleDelete = (classId, subject) => {
    if (window.confirm(`Are you sure you want to delete the subject "${subject}" from class ${classId}?`)) {
      removeLoadMasterEntry(classId, subject);
    }
  };

  const handlePrintFullSheet = () => {
    if (filterClass) setFilterClass('');
    setTimeout(() => window.print(), 150);
  };

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 className="page-title">Load Master</h1>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            className="btn btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', borderRadius: '4px', padding: '0.5rem 1rem', background: '#3b82f6', border: 'none' }}
            onClick={handlePrintFullSheet}
            title="Print the full Load Master sheet or save it as PDF"
          >
            🖨️ Print / Download PDF
          </button>
          <button
            className="btn btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', borderRadius: '4px', padding: '0.5rem 1rem' }}
            onClick={() => setShowAddSubject(true)}
          >
            <Plus size={16} /> Add Subject Mapping
          </button>
        </div>
      </div>

      <div className="filter-bar">
        <div className="filter-group">
          <label>Filter by Class Number:</label>
          <select 
            value={filterClass} 
            onChange={(e) => setFilterClass(e.target.value)}
            style={{ width: '150px' }}
          >
            <option value="">All Classes</option>
            {uniqueClasses.map(cls => (
              <option key={cls} value={cls}>Class {cls}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="card printable-area" style={{ padding: 0, overflow: 'hidden' }}>
        <style>{`
          @media print {
            @page { size: landscape; margin: 8mm; }
            body { background: white !important; }
            body * { visibility: hidden !important; }
            .printable-area, .printable-area * { visibility: visible !important; }
            .printable-area {
              position: absolute !important;
              left: 0 !important; top: 0 !important;
              width: 100% !important;
              overflow: visible !important;
              border: none !important; box-shadow: none !important; padding: 0 !important;
            }
            .print-only-title { display: block !important; }
            .no-print, .sidebar, .page-header, .filter-bar, button, select, input { display: none !important; }
            .load-master-table-wrap { overflow: visible !important; }
            .data-table {
              width: 100% !important; min-width: 100% !important;
              border-collapse: collapse !important;
              font-size: 11px !important; color: #000 !important;
            }
            .data-table thead { display: table-header-group; }
            .data-table tr { page-break-inside: avoid; }
            .data-table th, .data-table td {
              border: 1px solid #94a3b8 !important;
              padding: 4px 6px !important;
              color: #000 !important;
              background: #fff !important;
              -webkit-print-color-adjust: exact; print-color-adjust: exact;
            }
            .data-table th {
              background: #e2e8f0 !important;
              font-size: 10px !important; text-transform: uppercase !important;
              -webkit-print-color-adjust: exact; print-color-adjust: exact;
            }
            .badge { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          }
        `}</style>

        <div className="print-only-title" style={{ display: 'none', padding: '10px 12px', borderBottom: '2px solid #1e3a8a', color: '#000' }}>
          <div style={{ fontSize: '16px', fontWeight: 700, textAlign: 'center', color: '#1e3a8a' }}>
            Doon Scholars — Full Load Master Sheet
          </div>
          <div style={{ fontSize: '11px', textAlign: 'center', color: '#334155', marginTop: '4px' }}>
            {filteredData.length} subject mappings · Printed {new Date().toLocaleString()}
          </div>
        </div>

        <div className="load-master-table-wrap" style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Subject</th>
                <th>Class</th>
                <th>Section</th>
                <th>Total Required Load</th>
                <th>Actual Used Load</th>
                <th>Remaining Load</th>
                <th>Status</th>
                <th className="no-print">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.map((row, idx) => (
                <tr key={`${row.class_id}-${row.subject}-${idx}`}>
                  <td style={{ fontWeight: 500 }}>{row.subject}</td>
                  <td>{row.class_val}</td>
                  <td>{row.section}</td>
                  <td style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <button
                      className="no-print"
                      onClick={() => updateTotalLoad(row.class_id, row.subject, -1)}
                      style={{ padding: '2px 8px', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--bg-secondary)', cursor: 'pointer' }}
                      disabled={row.total_load <= 0}
                    >
                      -
                    </button>
                    <span style={{ minWidth: '20px', textAlign: 'center' }}>{row.total_load}</span>
                    <button
                      className="no-print"
                      onClick={() => updateTotalLoad(row.class_id, row.subject, 1)}
                      style={{ padding: '2px 8px', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--bg-secondary)', cursor: 'pointer' }}
                    >
                      +
                    </button>
                  </td>
                  <td>{row.actual_used}</td>
                  <td style={{ fontWeight: 600, color: row.actual_remaining < 0 ? 'var(--danger)' : (row.actual_remaining > 0 ? 'var(--warning)' : 'var(--success)') }}>
                    {row.actual_remaining}
                  </td>
                  <td>
                    {row.actual_remaining === 0 && <span className="badge badge-success" style={{ background: '#ecfdf5', color: '#065f46', padding: '4px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600 }}>Balanced</span>}
                    {row.actual_remaining > 0 && <span className="badge badge-warning" style={{ background: '#fffbeb', color: '#b45309', padding: '4px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600 }}>Underloaded</span>}
                    {row.actual_remaining < 0 && <span className="badge badge-danger" style={{ background: '#fef2f2', color: '#991b1b', padding: '4px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600 }}>Overloaded</span>}
                  </td>
                  <td className="no-print" style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      onClick={() => handleRename(row.class_id, row.subject)}
                      style={{ padding: '4px 8px', borderRadius: '4px', border: 'none', background: '#3b82f6', color: 'white', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600 }}
                      title="Rename this subject in Load Master and Timetable"
                    >Rename</button>
                    <button
                      onClick={() => handleDelete(row.class_id, row.subject)}
                      style={{ padding: '4px 8px', borderRadius: '4px', border: 'none', background: '#ef4444', color: 'white', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600 }}
                      title="Delete this subject mapping entirely"
                    >Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showAddSubject && (
        <div className="no-print" style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div style={{ background: '#1e293b', color: '#f8fafc', padding: '2rem', borderRadius: '12px', maxWidth: '400px', width: '90%', boxShadow: '0 10px 25px rgba(0,0,0,0.5)', border: '1px solid #334155' }}>
            <h3 style={{ margin: '0 0 1.5rem 0', fontSize: '1.25rem', color: '#f8fafc' }}>Add Subject Mapping</h3>
            <form onSubmit={handleAddSubjectMapping}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: '#cbd5e1' }}>Select Class</label>
                <select 
                  value={selectedMappingClass} 
                  onChange={(e) => {
                    setSelectedMappingClass(e.target.value);
                    setSelectedMappingSection(''); // Reset section when class changes
                  }} 
                  className="form-control"
                  style={{ width: '100%', padding: '0.75rem', boxSizing: 'border-box', background: '#0f172a', color: '#f8fafc', border: '1px solid #334155', borderRadius: '6px' }}
                  required
                >
                  <option value="">Select Class...</option>
                  {masterClasses.map(c => (
                    <option key={c.className} value={c.className}>Class {c.className}</option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: '#cbd5e1' }}>Select Section</label>
                <select 
                  value={selectedMappingSection} 
                  onChange={(e) => setSelectedMappingSection(e.target.value)} 
                  className="form-control"
                  style={{ width: '100%', padding: '0.75rem', boxSizing: 'border-box', background: '#0f172a', color: '#f8fafc', border: '1px solid #334155', borderRadius: '6px' }}
                  disabled={!selectedMappingClass}
                  required
                >
                  <option value="">Select Section...</option>
                  {getSectionsForMappingClass().map(sec => (
                    <option key={sec} value={sec}>Section {sec}</option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: '#cbd5e1' }}>Subject Name</label>
                <input 
                  type="text" 
                  placeholder="e.g. Physics, History, AI" 
                  value={newSubject} 
                  onChange={(e) => setNewSubject(e.target.value)} 
                  className="form-control"
                  style={{ width: '100%', padding: '0.75rem', boxSizing: 'border-box', background: '#0f172a', color: '#f8fafc', border: '1px solid #334155', borderRadius: '6px' }}
                  required
                />
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: '#cbd5e1' }}>Total Required Load (Periods/Week)</label>
                <input 
                  type="number" 
                  min="0"
                  max="40"
                  value={newLoad} 
                  onChange={(e) => setNewLoad(e.target.value)} 
                  className="form-control"
                  style={{ width: '100%', padding: '0.75rem', boxSizing: 'border-box', background: '#0f172a', color: '#f8fafc', border: '1px solid #334155', borderRadius: '6px' }}
                  required
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem' }}>
                <button 
                  type="button"
                  style={{ background: '#334155', color: '#f8fafc', border: '1px solid #475569', padding: '0.5rem 1rem', borderRadius: '6px', cursor: 'pointer', fontWeight: '500' }}
                  onClick={() => setShowAddSubject(false)}
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  style={{ background: '#3b82f6', color: 'white', border: 'none', padding: '0.5rem 1.5rem', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', boxShadow: '0 4px 6px -1px rgba(59, 130, 246, 0.5)' }}
                  disabled={!selectedMappingClass || !selectedMappingSection || !newSubject.trim()}
                >
                  Save Mapping
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default LoadMaster;
