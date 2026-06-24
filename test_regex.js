const teacherSubjectMap = { 'Food_P/AI': { '11HUM': 'AR' }, 'Maths': { '1A': 'TP' }, 'AI': {'9A': 'TP'} };
const value = 'maths';
const subjLower = value.toLowerCase();

const sortedMappedSubjects = Object.keys(teacherSubjectMap).sort((a, b) => b.length - a.length);

for (const mSubj of sortedMappedSubjects) {
  const mSubjLower = mSubj.toLowerCase();
  const escapedMSubj = mSubjLower.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const escapedValue = subjLower.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp('(^|[^a-z0-9])' + escapedMSubj + '([^a-z0-9]|$)', 'i');
  const reverseRegex = new RegExp('(^|[^a-z0-9])' + escapedValue + '([^a-z0-9]|$)', 'i');
  if (regex.test(subjLower) || reverseRegex.test(mSubjLower)) {
    console.log('Matched:', mSubj);
  }
}
