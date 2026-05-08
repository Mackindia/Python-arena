import ScrollReveal from "@/src/components/ScrollReveal"
import FeatureCard from "@/src/components/features/FeatureCard"
import type { FeatureItem } from "@/src/types/feature"

type FeaturesSectionProps = {
  id?: string
  title: string
  subtitle: string
  features: FeatureItem[]
}

export default function FeaturesSection({
  id = "features",
  title,
  subtitle,
  features,
}: FeaturesSectionProps) {
  return (
    <section id={id} className="px-4 py-20 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <ScrollReveal>
          <h2 className="text-3xl font-bold text-white sm:text-4xl">{title}</h2>
          <p className="mt-3 max-w-2xl text-slate-300">{subtitle}</p>
        </ScrollReveal>

        <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {features.map((feature, index) => (
            <ScrollReveal key={feature.title} delay={index * 0.08}>
              <FeatureCard feature={feature} />
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  )
}
