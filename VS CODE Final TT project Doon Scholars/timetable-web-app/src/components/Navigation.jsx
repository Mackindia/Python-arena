import React from 'react';
import { NavLink } from 'react-router-dom';
import { Calendar, Users, BookOpen, LayoutGrid, Settings, Layers, UserMinus, FileSpreadsheet, Wifi, WifiOff } from 'lucide-react';
import { useTimetable } from '../context/TimetableContext';

const Navigation = () => {
  const { syncStatus, importBackup } = useTimetable();

  const handleExport = () => {
    const data = JSON.stringify(localStorage);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'doon_scholars_timetable_backup.json';
    a.click();
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    input.onchange = e => {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = async event => {
        try {
          const data = JSON.parse(event.target.result);
          await importBackup(data);
        } catch (err) {
          alert('Error importing data: ' + err.message);
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  const syncColors = {
    idle:       { dot: '#64748b', label: 'Live Sync Active',      icon: <Wifi size={14} /> },
    synced:     { dot: '#22c55e', label: 'Changes Pushed ✓',      icon: <Wifi size={14} /> },
    receiving:  { dot: '#3b82f6', label: 'Receiving Updates…',    icon: <Wifi size={14} /> },
  };
  const sc = syncColors[syncStatus] || syncColors.idle;

  return (
    <div className="sidebar flex flex-col justify-between h-full">
      <div>
        <div className="sidebar-logo">
          <Calendar size={28} />
          <span>Doon Scholars</span>
        </div>
        
        <div className="sidebar-nav">
          <NavLink to="/" className={({isActive}) => isActive ? "nav-item active" : "nav-item"} end>
            <LayoutGrid size={20} />
            <span>Mastersheet</span>
          </NavLink>
          
          <NavLink to="/manage-classes" className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>
            <Layers size={20} />
            <span>Manage Classes</span>
          </NavLink>
          
          <NavLink to="/classes" className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>
            <BookOpen size={20} />
            <span>Class Timetables</span>
          </NavLink>
          
          <NavLink to="/teachers" className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>
            <Users size={20} />
            <span>Teacher Schedule & Load</span>
          </NavLink>
          
          <NavLink to="/load-master" className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>
            <Settings size={20} />
            <span>Load Master</span>
          </NavLink>

          <NavLink to="/teacher-mapping" className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>
            <FileSpreadsheet size={20} />
            <span>Teacher Mapping</span>
          </NavLink>

          <NavLink to="/substitutions" className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>
            <UserMinus size={20} />
            <span>Substitution Maker</span>
          </NavLink>
        </div>
      </div>

      <div className="sidebar-nav mt-auto border-t border-slate-700 pt-4">

        {/* Live Sync Status Indicator */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '8px 12px',
          marginBottom: '8px',
          borderRadius: '8px',
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.06)',
          color: sc.dot,
          fontSize: '0.75rem',
          fontWeight: 600,
          transition: 'all 0.4s ease',
        }}>
          <span style={{
            width: 8, height: 8,
            borderRadius: '50%',
            background: sc.dot,
            boxShadow: syncStatus !== 'idle' ? `0 0 6px 2px ${sc.dot}` : 'none',
            animation: syncStatus === 'receiving' ? 'syncPulse 0.8s ease-in-out infinite alternate' : 'none',
            flexShrink: 0,
          }} />
          <span style={{ color: '#94a3b8', fontWeight: 500 }}>{sc.label}</span>
          <style>{`
            @keyframes syncPulse {
              from { opacity: 0.4; transform: scale(0.9); }
              to   { opacity: 1;   transform: scale(1.2); }
            }
          `}</style>
        </div>

        <button onClick={handleExport} className="nav-item w-full text-left bg-transparent border-none cursor-pointer text-slate-300 hover:text-white transition">
          <Settings size={20} className="text-cyan-400" />
          <span>Export Data</span>
        </button>
        <button onClick={handleImport} className="nav-item w-full text-left bg-transparent border-none cursor-pointer text-slate-300 hover:text-white transition mt-2">
          <Settings size={20} className="text-teal-400" />
          <span>Import Data</span>
        </button>
      </div>
    </div>
  );
};

export default Navigation;

