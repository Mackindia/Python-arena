import ScrollReveal from "@/src/components/ScrollReveal"

type Testimonial = {
  name: string
  role: string
  quote: string
}

const testimonials: Testimonial[] = [
  {
    name: "Aarav Mehta",
    role: "Class 10 Student",
    quote: "The weekly coding practice made Python much easier. I can now solve school questions without memorizing steps.",
  },
  {
    name: "Ritika Sharma",
    role: "Class 11 Student",
    quote: "I like the path-based structure. It feels organized like a real course, not random notes.",
  },
  {
    name: "Neha Verma",
    role: "Parent",
    quote: "Clear progress and short lessons helped my child stay consistent. The platform feels simple and focused.",
  },
]

export default function TestimonialsSection() {
  return (
    <section id="testimonials" className="px-4 py-16 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <ScrollReveal>
          <h2 className="text-3xl font-bold text-slate-900 sm:text-4xl">Testimonials</h2>
          <p className="mt-3 max-w-2xl text-slate-600">
            Students and parents share how structured learning has improved confidence and outcomes.
          </p>
        </ScrollReveal>

        <div className="mt-10 grid gap-5 lg:grid-cols-3">
          {testimonials.map((item, index) => (
            <ScrollReveal key={item.name} delay={index * 0.08}>
              <article className="h-full rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <p className="text-sm leading-relaxed text-slate-600">"{item.quote}"</p>
                <div className="mt-5 border-t border-slate-200 pt-4">
                  <p className="text-sm font-semibold text-slate-900">{item.name}</p>
                  <p className="text-xs text-slate-500">{item.role}</p>
                </div>
              </article>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  )
}
