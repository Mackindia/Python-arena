export type NavLink = {
  label: string;
  href: string;
};

/** A class entry with optional sub-links (e.g. Course + CBSE PDF). */
export type NavClassEntry = {
  label: string;
  /** Base href used when there are no subItems, or for the class overview. */
  href: string;
  subItems?: NavLink[];
};

export type LearnCategory = {
  id: string;
  title: string;
  items: (NavClassEntry | NavLink)[];
};

export const primaryNavLinks: NavLink[] = [
  { label: "Home", href: "/" },
  { label: "Articles", href: "/articles" },
  { label: "Videos", href: "/videos" },
  { label: "Practice", href: "/practice" },
  { label: "Resources", href: "/resources" },
];

function makeClassEntry(subject: string, classSlug: string, label: string): NavClassEntry {
  const base = `/learn/${subject}/${classSlug}`;
  return {
    label,
    href: base,
    subItems: [
      { label: "Course", href: `${base}/course` },
      { label: "CBSE PDF", href: `${base}/cbse-pdf` },
    ],
  };
}

export const learnMenu: LearnCategory[] = [
  {
    id: "ai",
    title: "AI",
    items: [
      makeClassEntry("ai", "class-6", "Class 6"),
      makeClassEntry("ai", "class-7", "Class 7"),
      makeClassEntry("ai", "class-8", "Class 8"),
      makeClassEntry("ai", "class-9", "Class 9"),
      makeClassEntry("ai", "class-10", "Class 10"),
      makeClassEntry("ai", "class-11", "Class 11"),
      makeClassEntry("ai", "class-12", "Class 12"),
    ],
  },
  {
    id: "python",
    title: "Python",
    items: [
      { label: "Basics", href: "/learn/python/basics" },
      makeClassEntry("python", "class-9", "Class 9"),
      makeClassEntry("python", "class-10", "Class 10"),
      makeClassEntry("python", "class-11", "Class 11"),
      makeClassEntry("python", "class-12", "Class 12"),
    ],
  },
  {
    id: "computer-science",
    title: "Computer Science",
    items: [
      makeClassEntry("computer-science", "class-11", "Class 11"),
      makeClassEntry("computer-science", "class-12", "Class 12"),
    ],
  },
];

export const signedOutAuthLinks: NavLink[] = [
  { label: "Sign In", href: "/sign-in" },
  { label: "Sign Up", href: "/sign-up" },
];
