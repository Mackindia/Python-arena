import { normalizeSubject } from './subjectNormalizationEngine';

export const parseCompositeSubject = (subject, classId, teacherSubjectMap) => {
  if (!subject || !classId || !teacherSubjectMap) return [];
  
  const normalizedClassId = classId.replace(/\s+/g, '').toUpperCase();
  let mergedTeachers = [];

  // Helper function to safely look up a normalized token
  const findTeacher = (token) => {
    const normToken = normalizeSubject(token);
    for (const mSubj of Object.keys(teacherSubjectMap)) {
      const mappingTokens = mSubj.split('/').map(t => normalizeSubject(t));
      if (mappingTokens.includes(normToken)) {
        return teacherSubjectMap[mSubj][normalizedClassId];
      }
    }
    return null;
  };

  // 1. Try standard explicit delimiters first (/, +, &, ,)
  const tokens = subject.split(/[\/\+&,]/).map(t => t.trim()).filter(Boolean);
  
  if (tokens.length === 1) {
    // 2. The user didn't use standard delimiters. Try looking up the whole string first.
    const exactMatch = findTeacher(tokens[0]);
    if (exactMatch) {
      mergedTeachers.push(...exactMatch.split(',').map(t => t.trim()));
      return [...new Set(mergedTeachers.filter(Boolean))];
    }
    
    // 3. Whole string failed. If it has spaces, split by spaces (e.g., "Maths Music Hindi")
    if (subject.includes(' ')) {
      const spaceTokens = subject.split(' ').map(t => t.trim()).filter(Boolean);
      spaceTokens.forEach(st => {
        const tMatch = findTeacher(st);
        if (tMatch) {
          mergedTeachers.push(...tMatch.split(',').map(t => t.trim()));
        }
      });
      return [...new Set(mergedTeachers.filter(Boolean))];
    }
  }

  // 4. Handle standard explicit delimiters
  tokens.forEach(token => {
    const match = findTeacher(token);
    if (match) {
      mergedTeachers.push(...match.split(',').map(t => t.trim()));
    }
  });

  return [...new Set(mergedTeachers.filter(Boolean))];
};
