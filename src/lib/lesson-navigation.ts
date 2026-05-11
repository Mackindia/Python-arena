/**
 * Lesson Navigation System
 * 
 * A comprehensive navigation system for LMS lessons with:
 * - Sidebar chapter/lesson navigation with current highlighting
 * - Previous/next lesson buttons with status states
 * - Progress tracking with checkpoints
 * - Breadcrumb navigation for lesson path
 */

// ============================================================================
// Type Definitions
// ============================================================================

export type Lesson = {
  slug: string;
  title: string;
  completed?: boolean;
  progress?: number;
  description?: string;
};

export type Chapter = {
  name: string;
  lessons: Lesson[];
};

export type NavItem = {
  slug: string;
  title: string;
};

export type Checkpoint = {
  id: string;
  title: string;
  completed: boolean;
  icon?: string;
};

export type BreadcrumbItem = {
  label: string;
  href?: string;
  current?: boolean;
};

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Calculate overall progress across all chapters
 */
export function calculateOverallProgress(chapters: Chapter[]): {
  total: number;
  completed: number;
  percentage: number;
} {
  const total = chapters.reduce((sum, ch) => sum + ch.lessons.length, 0);
  const completed = chapters.reduce(
    (sum, ch) => sum + ch.lessons.filter((l) => l.completed).length,
    0
  );
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

  return { total, completed, percentage };
}

/**
 * Calculate chapter-specific progress
 */
export function calculateChapterProgress(chapter: Chapter): {
  total: number;
  completed: number;
  percentage: number;
} {
  const total = chapter.lessons.length;
  const completed = chapter.lessons.filter((l) => l.completed).length;
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

  return { total, completed, percentage };
}

/**
 * Find a lesson's position in the sequence for next/previous navigation
 */
export function findLessonPosition(
  chapters: Chapter[],
  targetSlug: string
): {
  current: Lesson | null;
  previous: Lesson | null;
  next: Lesson | null;
  chapterName: string;
  index: number;
  totalInChapter: number;
} {
  let currentIndex = 0;
  let totalInChapter = 0;
  let chapterName = "";
  let current: Lesson | null = null;
  const allLessons: Lesson[] = [];

  // Flatten all lessons with chapter info
  chapters.forEach((chapter) => {
    chapter.lessons.forEach((lesson) => {
      allLessons.push(lesson);
      if (lesson.slug === targetSlug) {
        current = lesson;
        chapterName = chapter.name;
        currentIndex = allLessons.length - 1;
        totalInChapter = chapter.lessons.length;
      }
    });
  });

  const previous = currentIndex > 0 ? allLessons[currentIndex - 1] : null;
  const next = currentIndex < allLessons.length - 1 ? allLessons[currentIndex + 1] : null;

  return {
    current,
    previous,
    next,
    chapterName,
    index: currentIndex,
    totalInChapter,
  };
}

/**
 * Check if a lesson is the first in its chapter
 */
export function isFirstLesson(chapters: Chapter[], lessonSlug: string): boolean {
  for (const chapter of chapters) {
    const lesson = chapter.lessons.find((l) => l.slug === lessonSlug);
    if (lesson) {
      return chapter.lessons[0].slug === lessonSlug;
    }
  }
  return false;
}

/**
 * Check if a lesson is the last in its chapter
 */
export function isLastLesson(chapters: Chapter[], lessonSlug: string): boolean {
  for (const chapter of chapters) {
    const lesson = chapter.lessons.find((l) => l.slug === lessonSlug);
    if (lesson) {
      const lastIndex = chapter.lessons.length - 1;
      return chapter.lessons[lastIndex].slug === lessonSlug;
    }
  }
  return false;
}

/**
 * Generate breadcrumb items for lesson navigation
 */
export function generateBreadcrumbs(
  subject: string,
  subjectSlug: string,
  classItem: string,
  classSlug: string,
  chapterName: string,
  lessonTitle: string
): BreadcrumbItem[] {
  return [
    {
      label: subject,
      href: `/lms/${subjectSlug}`,
    },
    {
      label: classItem,
      href: `/lms/${subjectSlug}/${classSlug}`,
    },
    {
      label: chapterName,
      href: `/lms/${subjectSlug}/${classSlug}`, // Chapter-specific filter
    },
    {
      label: lessonTitle,
      current: true,
    },
  ];
}

/**
 * Create default checkpoints for lesson
 */
export function createDefaultCheckpoints(content?: {
  hasPdf?: boolean;
  hasQuiz?: boolean;
  hasExercises?: boolean;
}): Checkpoint[] {
  const checkpoints: Checkpoint[] = [
    { id: "overview", title: "Read lesson overview", completed: false },
  ];

  if (content?.hasPdf !== false) {
    checkpoints.push({
      id: "pdf",
      title: "Review lesson PDF",
      completed: false,
    });
  }

  if (content?.hasQuiz !== false) {
    checkpoints.push({
      id: "quiz",
      title: "Attempt practice quiz",
      completed: false,
    });
  }

  if (content?.hasExercises) {
    checkpoints.push({
      id: "exercises",
      title: "Complete exercises",
      completed: false,
    });
  }

  return checkpoints;
}

/**
 * Update checkpoint completion status
 */
export function updateCheckpoint(
  checkpoints: Checkpoint[],
  checkpointId: string,
  completed: boolean
): Checkpoint[] {
  return checkpoints.map((cp) =>
    cp.id === checkpointId ? { ...cp, completed } : cp
  );
}

/**
 * Calculate lesson completion percentage based on checkpoints
 */
export function calculateLessonCompletion(checkpoints: Checkpoint[]): number {
  if (checkpoints.length === 0) return 0;
  const completed = checkpoints.filter((cp) => cp.completed).length;
  return Math.round((completed / checkpoints.length) * 100);
}

/**
 * Format lesson path for analytics/logging
 */
export function formatLessonPath(
  subjectSlug: string,
  classSlug: string,
  lessonSlug: string,
  separator = "/"
): string {
  return [subjectSlug, classSlug, lessonSlug].join(separator);
}

/**
 * Validate lesson navigation data
 */
export function validateLessonNavigation(chapters: Chapter[]): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!Array.isArray(chapters) || chapters.length === 0) {
    errors.push("Chapters array is empty or invalid");
  }

  chapters.forEach((chapter, idx) => {
    if (!chapter.name || typeof chapter.name !== "string") {
      errors.push(`Chapter ${idx} has invalid name`);
    }
    if (!Array.isArray(chapter.lessons) || chapter.lessons.length === 0) {
      errors.push(`Chapter "${chapter.name}" has no lessons`);
    }
    chapter.lessons.forEach((lesson, lessonIdx) => {
      if (!lesson.slug || typeof lesson.slug !== "string") {
        errors.push(
          `Lesson ${lessonIdx} in chapter "${chapter.name}" has invalid slug`
        );
      }
      if (!lesson.title || typeof lesson.title !== "string") {
        errors.push(
          `Lesson ${lessonIdx} in chapter "${chapter.name}" has invalid title`
        );
      }
    });
  });

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Group lessons by completion status
 */
export function groupLessonsByCompletion(chapters: Chapter[]): {
  completed: Lesson[];
  inProgress: Lesson[];
  notStarted: Lesson[];
} {
  const completed: Lesson[] = [];
  const inProgress: Lesson[] = [];
  const notStarted: Lesson[] = [];

  chapters.forEach((chapter) => {
    chapter.lessons.forEach((lesson) => {
      if (lesson.completed) {
        completed.push(lesson);
      } else if (lesson.progress && lesson.progress > 0) {
        inProgress.push(lesson);
      } else {
        notStarted.push(lesson);
      }
    });
  });

  return { completed, inProgress, notStarted };
}

/**
 * Get lessons by chapter name
 */
export function getLessonsByChapter(
  chapters: Chapter[],
  chapterName: string
): Lesson[] {
  const chapter = chapters.find((ch) => ch.name === chapterName);
  return chapter ? chapter.lessons : [];
}

/**
 * Filter lessons by search query
 */
export function filterLessonsByQuery(
  chapters: Chapter[],
  query: string
): Array<Lesson & { chapterName: string }> {
  const lowerQuery = query.toLowerCase();
  const results: Array<Lesson & { chapterName: string }> = [];

  chapters.forEach((chapter) => {
    chapter.lessons.forEach((lesson) => {
      if (
        lesson.title.toLowerCase().includes(lowerQuery) ||
        lesson.description?.toLowerCase().includes(lowerQuery)
      ) {
        results.push({ ...lesson, chapterName: chapter.name });
      }
    });
  });

  return results;
}

export default {
  calculateOverallProgress,
  calculateChapterProgress,
  findLessonPosition,
  isFirstLesson,
  isLastLesson,
  generateBreadcrumbs,
  createDefaultCheckpoints,
  updateCheckpoint,
  calculateLessonCompletion,
  formatLessonPath,
  validateLessonNavigation,
  groupLessonsByCompletion,
  getLessonsByChapter,
  filterLessonsByQuery,
};
