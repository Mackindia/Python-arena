import { courses } from "@/src/data/courses";
import { lmsSubjects } from "@/src/constants/lms";

export const navbarLinks = [
  { label: "Practice", href: "/#features" },
  { label: "Projects", href: "/dashboard" },
  { label: "Resources", href: "/resources" },
];

export function buildLearnGroups() {
  const subjectHrefMap: Record<string, string> = {
    "python-basics": "/learn/python",
    ai: "/learn/ai",
    python: "/learn/python",
    "computer-science": "/learn/computer-science",
  };

  const dynamicDataMap: Record<string, Record<string, unknown> | undefined> = {
    ai: courses.ai,
    python: courses.python,
  };

  return [
    ...lmsSubjects.map((subject) => {
      const baseHref = subjectHrefMap[subject.slug] ?? `/learn/${subject.slug}`;
      const dynamicClasses = dynamicDataMap[subject.slug]
        ? Object.keys(dynamicDataMap[subject.slug] ?? {}).map((classSlug) => ({
            label: classSlug.replace("class-", "Class "),
            href: `${baseHref}/${classSlug}`,
          }))
        : subject.classes.map((classConfig) => ({
            label: classConfig.label,
            href: `${baseHref}/${classConfig.slug}`,
          }));

      return {
        title: subject.name,
        items: dynamicClasses,
      };
    }),
  ];
}
