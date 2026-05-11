import type { LearnMenu } from "@/src/types/navigation"
import { lmsSubjects } from "@/src/constants/lms"

export const learnMenu: LearnMenu = lmsSubjects.map((subject) => ({
  title: subject.name,
  items: subject.classes.map((classConfig) => classConfig.label),
}))

export const topNavLinks = [
  { label: "Features", href: "#features" },
  { label: "Learning Paths", href: "#learning-paths" },
  { label: "Popular Courses", href: "#popular-courses" },
]
