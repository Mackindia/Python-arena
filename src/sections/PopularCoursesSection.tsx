import { Bot, Code, Database, LucideIcon } from "lucide-react"
import ScrollReveal from "@/src/components/ScrollReveal"
import GlassCard from "@/src/components/ui/GlassCard"

type Course = {
  title: string
  grade: string
  duration: string
  icon: LucideIcon
}

const courses: Course[] = [
  {
    title: "Python Fundamentals",
    grade: "Class 9",
    duration: "6 Weeks",
    icon: Code,
  },
  {
    title: "AI Starter Lab",
    grade: "Class 10",
    duration: "8 Weeks",
    icon: Bot,
  },
  {
    title: "Data Science Essentials",
    grade: "Class 11",
    duration: "10 Weeks",
    icon: Database,
  },
]

export default function PopularCoursesSection() {
  return (
    <section id="popular-courses" className="px-4 py-20 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <ScrollReveal>
          <h2 className="text-3xl font-bold text-white sm:text-4xl">Popular Courses</h2>
          <p className="mt-3 max-w-2xl text-slate-300">
            High-demand programs that combine coding rigor with future-focused AI skills.
          </p>
        </ScrollReveal>

        <div className="mt-10 grid gap-5 lg:grid-cols-3">
          {courses.map((course, index) => {
            const Icon = course.icon
            return (
              <ScrollReveal key={course.title} delay={index * 0.08}>
                <GlassCard className="h-full p-6">
                  <Icon className="h-6 w-6 text-cyan-300" />
                  <h3 className="mt-4 text-xl font-semibold text-white">{course.title}</h3>
                  <div className="mt-4 flex items-center justify-between text-sm text-slate-300">
                    <span>{course.grade}</span>
                    <span>{course.duration}</span>
                  </div>
                  <button className="mt-6 w-full rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10">
                    View Course
                  </button>
                </GlassCard>
              </ScrollReveal>
            )
          })}
        </div>
      </div>
    </section>
  )
}
