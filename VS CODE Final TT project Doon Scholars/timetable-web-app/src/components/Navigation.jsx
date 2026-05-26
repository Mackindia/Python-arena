import React from 'react';
import { NavLink } from 'react-router-dom';
import { Calendar, Users, BookOpen, LayoutGrid, Settings, Layers, UserMinus, FileSpreadsheet } from 'lucide-react';

const Navigation = () => {

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
      reader.onload = event => {
        try {
          const data = JSON.parse(event.target.result);
          Object.keys(data).forEach(k => localStorage.setItem(k, data[k]));
          alert('Data imported successfully! The page will now reload.');
          window.location.reload();
        } catch (err) {
          alert('Error importing data: ' + err.message);
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

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
