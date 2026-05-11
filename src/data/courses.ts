export type ChapterItem = {
  title: string;
  slug: string;
  fileName: string;
  description?: string;
};

export type CourseClass = {
  title: string;
  chapters: ChapterItem[];
  quizFile?: string;
  resources?: {
    pdf?: string[];
    notes?: string[];
    worksheets?: string[];
    assignments?: string[];
    questionBanks?: string[];
  };
};

export type CoursesMap = Record<string, Record<string, CourseClass>>;

export const courses: CoursesMap = {
  python: {
    "class-11": {
      title: "Python Class 11",
      chapters: [
        {
          title: "Introduction to Python",
          slug: "introduction-to-python",
          fileName: "chapter-1.md",
          description: "What Python is, setup basics, and your first program.",
        },
        {
          title: "Variables and Data Types",
          slug: "variables",
          fileName: "chapter-2.md",
          description: "Store values and work with core Python data types.",
        },
      ],
      quizFile: "quiz.json",
      resources: {
        notes: ["chapter-1.md", "chapter-2.md"],
        questionBanks: ["quiz.json"],
      },
    },
    "class-12": {
      title: "Python Class 12",
      chapters: [
        {
          title: "Advanced Python Concepts",
          slug: "advanced-python",
          fileName: "chapter-1.md",
        },
        {
          title: "Data Handling and Modules",
          slug: "data-handling",
          fileName: "chapter-2.md",
        },
      ],
      quizFile: "quiz.json",
    },
  },
  ai: {
    "class-6": {
      title: "AI Class 6",
      chapters: [
        { title: "What is AI", slug: "what-is-ai", fileName: "chapter-1.md" },
        { title: "Patterns and Predictions", slug: "patterns-and-predictions", fileName: "chapter-2.md" },
      ],
      quizFile: "quiz.json",
    },
    "class-7": {
      title: "AI Class 7",
      chapters: [
        { title: "Introduction to Machine Learning", slug: "machine-learning-intro", fileName: "chapter-1.md" },
        { title: "Training Data and Fairness", slug: "training-data-and-fairness", fileName: "chapter-2.md" },
      ],
      quizFile: "quiz.json",
    },
  },
  "computer-science": {},
};
