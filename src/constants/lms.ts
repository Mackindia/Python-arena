export type LmsClassConfig = {
  classNumber: number;
  label: string;
  slug: string;
};

export type LmsSubjectConfig = {
  name: string;
  slug: string;
  description: string;
  classes: LmsClassConfig[];
};

function createClassConfig(classNumber: number): LmsClassConfig {
  return {
    classNumber,
    label: `Class ${classNumber}`,
    slug: `class-${classNumber}`,
  };
}

function createClassRange(start: number, end: number): LmsClassConfig[] {
  const classes: LmsClassConfig[] = [];

  for (let classNumber = start; classNumber <= end; classNumber += 1) {
    classes.push(createClassConfig(classNumber));
  }

  return classes;
}

export const lmsSubjects: LmsSubjectConfig[] = [
  {
    name: "AI",
    slug: "ai",
    description: "AI curriculum for middle and senior school levels.",
    classes: createClassRange(6, 12),
  },
  {
    name: "Python Basics",
    slug: "python-basics",
    description: "Foundational Python pathway for school learners.",
    classes: [createClassConfig(11), createClassConfig(12)],
  },
  {
    name: "Python",
    slug: "python",
    description: "Core Python track for higher classes.",
    classes: createClassRange(9, 12),
  },
  {
    name: "Computer Science",
    slug: "computer-science",
    description: "Computer Science pathway for board-focused classes.",
    classes: createClassRange(11, 12),
  },
];

export function getLmsSubjectBySlug(subjectSlug: string) {
  return lmsSubjects.find((subject) => subject.slug === subjectSlug);
}
