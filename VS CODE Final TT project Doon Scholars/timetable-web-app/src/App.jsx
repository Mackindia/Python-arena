import React from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import { TimetableProvider } from './context/TimetableContext';
import Navigation from './components/Navigation';
import Mastersheet from './components/Mastersheet';
import ClassTimetable from './components/ClassTimetable';
import TeacherView from './components/TeacherView';
import LoadMaster from './components/LoadMaster';
import ClassSectionManager from './components/ClassSectionManager';
import SubstitutionManager from './components/SubstitutionManager';
import TeacherSubjectMapping from './components/TeacherSubjectMapping';

function App() {
  return (
    <TimetableProvider>
      <Router>
        <div className="app-container">
          <Navigation />
          <main className="main-content">
            <Routes>
              <Route path="/" element={<Mastersheet />} />
              <Route path="/manage-classes" element={<ClassSectionManager />} />
              <Route path="/classes" element={<ClassTimetable />} />
              <Route path="/teachers" element={<TeacherView />} />
              <Route path="/teacher-mapping" element={<TeacherSubjectMapping />} />
              <Route path="/substitutions" element={<SubstitutionManager />} />
              <Route path="/load-master" element={<LoadMaster />} />
            </Routes>
          </main>
        </div>
      </Router>
    </TimetableProvider>
  );
}

export default App;
