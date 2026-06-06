export type NavLink = {
  label: string;
  href: string;
};

export type LearnCategory = {
  id: string;
  title: string;
  items: NavLink[];
};

export const primaryNavLinks: NavLink[] = [
  { label: "Home", href: "/" },
  { label: "Educational AI", href: "/educational-ai" },
  { label: "Articles", href: "/articles" },
  { label: "Videos", href: "/videos" },
  { label: "Practice", href: "/practice" },
  { label: "Resources", href: "/resources" },
  { label: "Online Class", href: "/online-class" },
];

export const learnMenu: LearnCategory[] = [
  {
    id: "ai",
    title: "AI",
    items: [
      { label: "Class 6", href: "/learn/ai/class-6" },
      { label: "Class 7", href: "/learn/ai/class-7" },
      { label: "Class 8", href: "/learn/ai/class-8" },
      { label: "Class 9", href: "/learn/ai/class-9" },
      { label: "Class 10", href: "/learn/ai/class-10" },
      { label: "Class 11", href: "/learn/ai/class-11" },
      { label: "Class 12", href: "/learn/ai/class-12" },
    ],
  },
  {
    id: "python",
    title: "Python",
    items: [
      { label: "Basics", href: "/learn/python/basics" },
      { label: "Class 9", href: "/learn/python/class-9" },
      { label: "Class 10", href: "/learn/python/class-10" },
      { label: "Class 11", href: "/learn/python/class-11" },
      { label: "Class 12", href: "/learn/python/class-12" },
    ],
  },
  {
    id: "computer-science",
    title: "Computer Science",
    items: [
      { label: "Class 11", href: "/learn/computer-science/class-11" },
      { label: "Class 12", href: "/learn/computer-science/class-12" },
    ],
  },
];

export const signedOutAuthLinks: NavLink[] = [
  { label: "Sign In", href: "/sign-in" },
  { label: "Sign Up", href: "/sign-up" },
];
