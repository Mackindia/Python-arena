import React, { useState } from 'react';
import { useTimetable } from '../context/TimetableContext';
import { Plus, Trash2 } from 'lucide-react';

const ClassSectionManager = () => {
  const { masterClasses, addMasterClass, addMasterSection, deleteMasterClass, deleteMasterSection, timetables } = useTimetable();
  const [newClass, setNewClass] = useState('');
  const [newSection, setNewSection] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(null);

  const [showAddClass, setShowAddClass] = useState(false);
  const [showAddSection, setShowAddSection] = useState(false);

  const handleAddClass = (e) => {
    e.preventDefault();
    if (newClass.trim()) {
      addMasterClass(newClass);
      setNewClass('');
      setShowAddClass(false);
    }
  };

  const handleAddSection = (e) => {
    e.preventDefault();
    if (selectedClass && newSection.trim()) {
      addMasterSection(selectedClass, newSection);
      setNewSection('');
      setShowAddSection(false);
    }
  };

  const handleDeleteClass = (className) => {
    // Check if any section has timetable data
    const cls = masterClasses.find(c => c.className === className);
    let hasData = false;
    if (cls) {
      cls.sections.forEach(s => {
        const section = s ? s.trim().toUpperCase() : '';
        const needsSpace = section.length > 1;
        const id = needsSpace ? `${className} ${section}` : `${className}${section.toLowerCase()}`;
        if (timetables[id] && timetables[id].length > 0) hasData = true;
      });
    }

    if (hasData) {
      setConfirmDelete({ type: 'class', name: className, message: `Class ${className} has active timetable data. Are you sure you want to delete it?` });
    } else {
      deleteMasterClass(className);
    }
  };

  const handleDeleteSection = (className, sectionName) => {
    const section = sectionName ? sectionName.trim().toUpperCase() : '';
    const needsSpace = section.length > 1;
    const id = needsSpace ? `${className} ${section}` : `${className}${section.toLowerCase()}`;
    
    if (timetables[id] && timetables[id].length > 0) {
      setConfirmDelete({ type: 'section', className, section, message: `Section ${className}-${section} has active timetable data. Are you sure you want to delete it?` });
    } else {
      deleteMasterSection(className, section);
    }
  };

  const executeDelete = () => {
    if (confirmDelete.type === 'class') {
      deleteMasterClass(confirmDelete.name);
    } else if (confirmDelete.type === 'section') {
      deleteMasterSection(confirmDelete.className, confirmDelete.section);
    }
    setConfirmDelete(null);
  };

  return (
    <div className="content-panel">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="page-title">Class & Section Management</h1>
          <p className="page-subtitle">Dynamically manage classes and sections for the ERP</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            className="btn" 
            style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem', border: '1px solid var(--border)', borderRadius: '4px', cursor: 'pointer', padding: '0.5rem 1rem' }}
            onClick={() => setShowAddClass(true)}
          >
            <Plus size={16} /> Add Class
          </button>
          <button 
            className="btn btn-primary" 
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', borderRadius: '4px', cursor: 'pointer', padding: '0.5rem 1rem' }}
            onClick={() => setShowAddSection(true)}
          >
            <Plus size={16} /> Add Section
          </button>
        </div>
      </div>

      <div style={{ marginTop: '2rem' }}>
        {masterClasses.length === 0 ? (
          <div style={{ padding: '3rem 2rem', textAlign: 'center', background: 'var(--bg-secondary)', borderRadius: '8px', color: 'var(--text-secondary)' }}>
            No classes configured yet. Start by adding a new class.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {masterClasses.map(cls => (
              <div key={cls.className} style={{ padding: '1.5rem', background: 'var(--bg-secondary)', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', border: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '2rem', flexWrap: 'wrap' }}>
                  <h4 style={{ margin: 0, fontSize: '1.25rem', minWidth: '80px', color: 'var(--text-primary)' }}>Class {cls.className}</h4>
                  <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                    {cls.sections.map(sec => (
                      <span key={sec} style={{ 
                        background: 'var(--accent)', 
                        color: 'white', 
                        padding: '0.35rem 0.85rem', 
                        borderRadius: '999px', 
                        fontSize: '0.875rem',
                        fontWeight: '500',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                      }}>
                        {sec}
                        <button 
                          onClick={() => handleDeleteSection(cls.className, sec)}
                          style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.8)', cursor: 'pointer', padding: 0, display: 'flex', transition: 'color 0.2s' }}
                          title="Delete section"
                          onMouseOver={(e) => e.currentTarget.style.color = 'white'}
                          onMouseOut={(e) => e.currentTarget.style.color = 'rgba(255,255,255,0.8)'}
                        >
                          <Trash2 size={14} />
                        </button>
                      </span>
                    ))}
                    {cls.sections.length === 0 && (
                      <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', fontStyle: 'italic', padding: '0.35rem 0' }}>No sections added</span>
                    )}
                  </div>
                </div>
                
                <button 
                  onClick={() => handleDeleteClass(cls.className)}
                  style={{ background: 'transparent', color: 'var(--danger)', border: '1px solid var(--danger)', display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', borderRadius: '4px', cursor: 'pointer', transition: 'all 0.2s', fontSize: '0.875rem' }}
                  onMouseOver={(e) => { e.currentTarget.style.background = 'var(--danger)'; e.currentTarget.style.color = 'white'; }}
                  onMouseOut={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--danger)'; }}
                >
                  <Trash2 size={14} /> Delete Class
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {showAddClass && (
        <div style={{ 
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
          background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 
        }}>
          <div style={{ background: 'var(--bg-primary)', padding: '2rem', borderRadius: '12px', maxWidth: '400px', width: '90%', boxShadow: '0 10px 25px rgba(0,0,0,0.2)' }}>
            <h3 style={{ margin: '0 0 1.5rem 0', fontSize: '1.25rem' }}>Add New Class</h3>
            <form onSubmit={handleAddClass}>
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Class Name/Number</label>
                <input 
                  type="text" 
                  placeholder="e.g. 6, 7, 12" 
                  value={newClass} 
                  onChange={(e) => setNewClass(e.target.value)} 
                  className="form-control"
                  style={{ width: '100%', padding: '0.75rem', boxSizing: 'border-box' }}
                  autoFocus
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                <button 
                  type="button"
                  style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border)', padding: '0.5rem 1rem', borderRadius: '4px', cursor: 'pointer' }}
                  onClick={() => setShowAddClass(false)}
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  style={{ background: 'var(--accent)', color: 'white', border: 'none', padding: '0.5rem 1.5rem', borderRadius: '4px', cursor: 'pointer', fontWeight: '500' }}
                  disabled={!newClass.trim()}
                >
                  Save Class
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showAddSection && (
        <div style={{ 
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
          background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 
        }}>
          <div style={{ background: 'var(--bg-primary)', padding: '2rem', borderRadius: '12px', maxWidth: '400px', width: '90%', boxShadow: '0 10px 25px rgba(0,0,0,0.2)' }}>
            <h3 style={{ margin: '0 0 1.5rem 0', fontSize: '1.25rem' }}>Add New Section</h3>
            <form onSubmit={handleAddSection}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Select Class</label>
                <select 
                  value={selectedClass} 
                  onChange={(e) => setSelectedClass(e.target.value)} 
                  className="form-control"
                  style={{ width: '100%', padding: '0.75rem', boxSizing: 'border-box' }}
                >
                  <option value="">Select Class...</option>
                  {masterClasses.map(c => (
                    <option key={c.className} value={c.className}>Class {c.className}</option>
                  ))}
                </select>
              </div>
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Section Name</label>
                <input 
                  type="text" 
                  placeholder="e.g. A, B, PCM" 
                  value={newSection} 
                  onChange={(e) => setNewSection(e.target.value)} 
                  className="form-control"
                  style={{ width: '100%', padding: '0.75rem', boxSizing: 'border-box' }}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                <button 
                  type="button"
                  style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border)', padding: '0.5rem 1rem', borderRadius: '4px', cursor: 'pointer' }}
                  onClick={() => setShowAddSection(false)}
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  style={{ background: 'var(--accent)', color: 'white', border: 'none', padding: '0.5rem 1.5rem', borderRadius: '4px', cursor: 'pointer', fontWeight: '500' }}
                  disabled={!selectedClass || !newSection.trim()}
                >
                  Save Section
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {confirmDelete && (
        <div style={{ 
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
          background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 
        }}>
          <div style={{ background: 'var(--bg-primary)', padding: '2rem', borderRadius: '12px', maxWidth: '400px', width: '90%', boxShadow: '0 10px 25px rgba(0,0,0,0.2)' }}>
            <h3 style={{ margin: '0 0 1rem 0', color: 'var(--danger)', fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Trash2 size={20} /> Confirm Deletion
            </h3>
            <p style={{ margin: '0 0 2rem 0', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
              {confirmDelete.message}
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
              <button 
                style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border)', padding: '0.5rem 1rem', borderRadius: '4px', cursor: 'pointer' }}
                onClick={() => setConfirmDelete(null)}
              >
                Cancel
              </button>
              <button 
                style={{ background: 'var(--danger)', color: 'white', border: 'none', padding: '0.5rem 1.5rem', borderRadius: '4px', cursor: 'pointer', fontWeight: '500' }}
                onClick={executeDelete}
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClassSectionManager;
