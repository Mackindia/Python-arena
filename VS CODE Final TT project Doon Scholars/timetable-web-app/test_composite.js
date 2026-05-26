import fs from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

// Mock normalization
const normalizeSubject = (subject) => {
  if (!subject) return '';
  return subject.trim().toLowerCase().replace(/\s+/g, '');
};

const parseCompositeSubject = (subject, classId, teacherSubjectMap) => {
  if (!subject || !classId || !teacherSubjectMap) return [];
  
  const tokens = subject.split('/').map(t => t.trim()).filter(Boolean);
  const normalizedClassId = classId.replace(/\s+/g, '').toUpperCase();
  
  let mergedTeachers = [];

  tokens.forEach(token => {
    const normToken = normalizeSubject(token);
    
    // Find exact normalized match in mapping
    let foundMatch = null;
    for (const mSubj of Object.keys(teacherSubjectMap)) {
      const mappingTokens = mSubj.split('/').map(t => normalizeSubject(t));
      if (mappingTokens.includes(normToken)) {
        foundMatch = teacherSubjectMap[mSubj][normalizedClassId];
        if (foundMatch) break;
      }
    }
    
    if (foundMatch) {
      const teachers = foundMatch.split(',').map(t => t.trim()).filter(Boolean);
      mergedTeachers = [...mergedTeachers, ...teachers];
    }
  });

  return [...new Set(mergedTeachers)];
};

// Mock map
const teacherSubjectMap = {
  "Food_P/AI/Lib_Sc": { "11A": "RN, AR, SP", "11B": "RN, AR, SP" },
  "Library": { "11A": "SP", "11B": "SP" }
};

console.log("Testing Food_P/AI/Lib_Sc in 11B:");
console.log(parseCompositeSubject("Food_P/AI/Lib_Sc", "11B", teacherSubjectMap));

console.log("Testing Library in 11A:");
console.log(parseCompositeSubject("Library", "11A", teacherSubjectMap));

