import { courses, type ChapterItem } from "@/src/data/courses";

export function getSubjectClass(subject: string, className: string) {
  const subjectMap = courses[subject];
  if (!subjectMap) {
    return null;
  }

  return subjectMap[className] ?? null;
}

export function getChapterBySlug(subject: string, className: string, slug: string): ChapterItem | null {
  const courseClass = getSubjectClass(subject, className);
  if (!courseClass) {
    return null;
  }

  return courseClass.chapters.find((chapter) => chapter.slug === slug) ?? null;
}

export function getPrevNextChapter(subject: string, className: string, slug: string) {
  const courseClass = getSubjectClass(subject, className);
  if (!courseClass) {
    return { previous: null, next: null };
  }

  const index = courseClass.chapters.findIndex((chapter) => chapter.slug === slug);
  if (index === -1) {
    return { previous: null, next: null };
  }

  return {
    previous: index > 0 ? courseClass.chapters[index - 1] : null,
    next: index < courseClass.chapters.length - 1 ? courseClass.chapters[index + 1] : null,
  };
}
