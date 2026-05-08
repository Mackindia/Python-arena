import type { FeatureItem } from "@/src/types/feature"
import GlassCard from "@/src/components/ui/GlassCard"

type FeatureCardProps = {
  feature: FeatureItem
}

export default function FeatureCard({ feature }: FeatureCardProps) {
  const Icon = feature.icon

  return (
    <GlassCard className="group h-full p-5 transition-transform duration-300 hover:-translate-y-1">
      <div className="inline-flex rounded-xl border border-cyan-300/20 bg-cyan-300/10 p-2.5">
        <Icon className="h-5 w-5 text-cyan-300" />
      </div>
      <h3 className="mt-4 text-lg font-semibold text-white">{feature.title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-slate-300">{feature.description}</p>
    </GlassCard>
  )
}
