import React from 'react';
import { NavLink } from 'react-router-dom';
import { Calendar, Users, BookOpen, LayoutGrid, Settings, Layers } from 'lucide-react';

const Navigation = () => {
  return (
    <div className="sidebar">
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
          <span>Teacher View</span>
        </NavLink>
        
        <NavLink to="/load-master" className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>
          <Settings size={20} />
          <span>Load Master</span>
        </NavLink>
      </div>
    </div>
  );
};

export default Navigation;
