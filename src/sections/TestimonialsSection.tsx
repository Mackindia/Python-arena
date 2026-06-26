import { MessageSquare, Star } from "lucide-react"
import ScrollReveal from "@/src/components/ScrollReveal"

type Testimonial = {
  name: string
  role: string
  quote: string
  rating: number
}

const testimonials: Testimonial[] = [
  {
    name: "Aarav Mehta",
    role: "Class 10 Student",
    quote: "The weekly coding practice made Python much easier. I can now solve school questions without memorizing steps.",
    rating: 5,
  },
  {
    name: "Ritika Sharma",
    role: "Class 11 Student",
    quote: "I like the path-based structure. It feels organized like a real course, not random notes.",
    rating: 5,
  },
  {
    name: "Neha Verma",
    role: "Parent",
    quote: "Clear progress and short lessons helped my child stay consistent. The platform feels simple and focused.",
    rating: 5,
  },
]

export default function TestimonialsSection() {
  return (
    <section id="testimonials" className="relative overflow-hidden bg-gradient-to-b from-slate-50 to-white px-4 py-16 sm:px-6 lg:py-20">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-indigo-500/5 blur-3xl"></div>
      </div>

      <div className="relative mx-auto max-w-7xl">
        <ScrollReveal>
          <div className="text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-4 py-1.5 text-sm font-medium text-indigo-700">
              <MessageSquare className="h-4 w-4" />
              <span>Testimonials</span>
            </div>
            <h2 className="mt-4 text-3xl font-bold text-slate-900 sm:text-4xl lg:text-5xl">
              Loved by{" "}
              <span className="bg-gradient-to-r from-indigo-600 to-cyan-600 bg-clip-text text-transparent">
                Students
              </span>
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-base text-slate-600">
              Students and parents share how structured learning has improved confidence and outcomes.
            </p>
          </div>
        </ScrollReveal>

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {testimonials.map((item, index) => (
            <ScrollReveal key={item.name} delay={index * 0.1}>
              <article className="group relative h-full overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 transition-all duration-300 hover:border-transparent hover:shadow-xl hover:shadow-slate-200/50">
                {/* Stars */}
                <div className="flex items-center gap-1">
                  {Array.from({ length: item.rating }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>

                {/* Quote */}
                <p className="mt-4 text-sm leading-relaxed text-slate-600">&ldquo;{item.quote}&rdquo;</p>

                {/* Author */}
                <div className="mt-5 border-t border-slate-100 pt-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-cyan-500 text-sm font-bold text-white">
                      {item.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{item.name}</p>
                      <p className="text-xs text-slate-500">{item.role}</p>
                    </div>
                  </div>
                </div>

                {/* Hover gradient */}
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-indigo-500/5 to-cyan-500/5 opacity-0 transition-opacity group-hover:opacity-100"></div>
              </article>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  )
}
