import { PlayCircle, BookOpenText } from "lucide-react"
import ScrollReveal from "@/src/components/ScrollReveal"

type Resource = {
  title: string
  type: "Article" | "Video"
  duration: string
  topic: string
}

const resources: Resource[] = [
  {
    title: "How Loops Work in Real Python Programs",
    type: "Article",
    duration: "6 min read",
    topic: "Python Basics",
  },
  {
    title: "Build a Quiz App with Conditions and Lists",
    type: "Video",
    duration: "14 min watch",
    topic: "Mini Project",
  },
  {
    title: "Understanding Data Types with Examples",
    type: "Article",
    duration: "8 min read",
    topic: "Class 9",
  },
  {
    title: "Functions Explained Step-by-Step",
    type: "Video",
    duration: "11 min watch",
    topic: "Class 10",
  },
]

export default function ArticlesVideosSection() {
  return (
    <section id="articles-videos" className="px-4 py-16 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <ScrollReveal>
          <h2 className="text-3xl font-bold text-slate-900 sm:text-4xl">Articles & Videos</h2>
          <p className="mt-3 max-w-2xl text-slate-600">
            Learn from bite-sized explainers and visual tutorials designed for fast revision.
          </p>
        </ScrollReveal>

        <div className="mt-10 grid gap-5 md:grid-cols-2">
          {resources.map((item, index) => {
            const isVideo = item.type === "Video"
            return (
              <ScrollReveal key={item.title} delay={index * 0.06}>
                <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md">
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                      {isVideo ? <PlayCircle className="h-4 w-4" /> : <BookOpenText className="h-4 w-4" />}
                      {item.type}
                    </span>
                    <span className="text-xs font-medium text-slate-500">{item.topic}</span>
                  </div>

                  <h3 className="mt-4 text-lg font-semibold text-slate-900">{item.title}</h3>
                  <p className="mt-2 text-sm text-slate-600">{item.duration}</p>
                </article>
              </ScrollReveal>
            )
          })}
        </div>
      </div>
    </section>
  )
}
