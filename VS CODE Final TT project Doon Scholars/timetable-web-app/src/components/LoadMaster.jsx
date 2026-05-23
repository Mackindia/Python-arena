import React, { useState } from 'react';
import { useTimetable } from '../context/TimetableContext';
import { Plus } from 'lucide-react';

const LoadMaster = () => {
  const { loadMaster, timetables, masterClasses, addLoadMasterEntry } = useTimetable();
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

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 className="page-title">Load Master</h1>
        <button 
          className="btn btn-primary" 
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', borderRadius: '4px', padding: '0.5rem 1rem' }}
          onClick={() => setShowAddSubject(true)}
        >
          <Plus size={16} /> Add Subject Mapping
        </button>
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

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
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
              </tr>
            </thead>
            <tbody>
              {filteredData.map((row, idx) => (
                <tr key={`${row.class_id}-${row.subject}-${idx}`}>
                  <td style={{ fontWeight: 500 }}>{row.subject}</td>
                  <td>{row.class_val}</td>
                  <td>{row.section}</td>
                  <td>{row.total_load}</td>
                  <td>{row.actual_used}</td>
                  <td style={{ fontWeight: 600, color: row.actual_remaining < 0 ? 'var(--danger)' : (row.actual_remaining > 0 ? 'var(--warning)' : 'var(--success)') }}>
                    {row.actual_remaining}
                  </td>
                  <td>
                    {row.actual_remaining === 0 && <span className="badge badge-success" style={{ background: '#ecfdf5', color: '#065f46', padding: '4px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600 }}>Balanced</span>}
                    {row.actual_remaining > 0 && <span className="badge badge-warning" style={{ background: '#fffbeb', color: '#b45309', padding: '4px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600 }}>Underloaded</span>}
                    {row.actual_remaining < 0 && <span className="badge badge-danger" style={{ background: '#fef2f2', color: '#991b1b', padding: '4px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600 }}>Overloaded</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showAddSubject && (
        <div style={{ 
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
