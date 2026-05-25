export const getMappedTeachers = (subject, classId, teacherSubjectMap) => {
  if (!subject || !classId || !teacherSubjectMap) return [];
  
  let bestMatch = null;
  const normalizedId = classId.replace(/\s+/g, '').toUpperCase();
  
  for (const mSubj of Object.keys(teacherSubjectMap)) {
    const parts = mSubj.split('/');
    let isMatch = false;
    
    for (const p of parts) {
      const partNorm = p.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
      const inputNorm = subject.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
      
      if (partNorm === inputNorm) {
        isMatch = true;
        break;
      }
      
      const regex = new RegExp(`(^|\\s)${partNorm}(\\s|$)`, 'i');
      const reverseRegex = new RegExp(`(^|\\s)${inputNorm}(\\s|$)`, 'i');
      if (regex.test(inputNorm) || reverseRegex.test(partNorm)) {
        isMatch = true;
        break;
      }
    }
    
    if (isMatch) {
      const mappedTeacher = teacherSubjectMap[mSubj][normalizedId];
      if (mappedTeacher) {
        bestMatch = mappedTeacher;
        break;
      }
    }
  }
  
  if (bestMatch) {
    return bestMatch.split(',').map(t => t.trim()).filter(Boolean);
  }
  return [];
};
