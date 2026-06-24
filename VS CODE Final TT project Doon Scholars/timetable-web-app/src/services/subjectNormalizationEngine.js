export const normalizeSubject = (subject) => {
  if (!subject) return '';
  return subject.trim().toLowerCase().replace(/[\s_]+/g, '');
};
