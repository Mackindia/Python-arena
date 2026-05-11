import { Bot, Clock3, Code, Database, LucideIcon, Users } from "lucide-react"
import ScrollReveal from "@/src/components/ScrollReveal"

type Course = {
  title: string
  description: string
  grade: string
  duration: string
  learners: string
  icon: LucideIcon
}

const courses: Course[] = [
  {
    title: "Python Fundamentals",
    description: "Variables, conditions, loops, and beginner problem solving.",
    grade: "Class 9",
    duration: "6 Weeks",
    learners: "3.2k learners",
    icon: Code,
  },
  {
    title: "AI Starter Lab",
    description: "Build your first intelligent mini-projects with guided workflows.",
    grade: "Class 10",
    duration: "8 Weeks",
    learners: "2.7k learners",
    icon: Bot,
  },
  {
    title: "Data Science Essentials",
    description: "Explore data analysis, visualization, and practical insights.",
    grade: "Class 11",
    duration: "10 Weeks",
    learners: "1.9k learners",
    icon: Database,
  },
]

export default function PopularCoursesSection() {
  return (
    <section id="popular-courses" className="px-4 py-16 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <ScrollReveal>
          <h2 className="text-3xl font-bold text-slate-900 sm:text-4xl">Popular Courses</h2>
          <p className="mt-3 max-w-2xl text-slate-600">
            High-demand programs that combine coding rigor with future-focused AI skills.
          </p>
        </ScrollReveal>

        <div className="mt-10 grid gap-5 lg:grid-cols-3">
          {courses.map((course, index) => {
            const Icon = course.icon
            return (
              <ScrollReveal key={course.title} delay={index * 0.08}>
                <article className="h-full rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                  <div className="flex items-center justify-between">
                    <span className="rounded-lg bg-slate-100 p-2.5 text-slate-700">
                      <Icon className="h-5 w-5" />
                    </span>
                    <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">{course.grade}</span>
                  </div>
                  <h3 className="mt-4 text-xl font-semibold text-slate-900">{course.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">{course.description}</p>

                  <div className="mt-5 grid gap-2 text-sm text-slate-600 sm:grid-cols-2">
                    <span className="inline-flex items-center gap-2">
                      <Clock3 className="h-4 w-4" />
                      {course.duration}
                    </span>
                    <span className="inline-flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      {course.learners}
                    </span>
                  </div>

                  <button className="mt-6 w-full rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800">
                    View Course
                  </button>
                </article>
              </ScrollReveal>
            )
          })}
        </div>
      </div>
    </section>
  )
}
