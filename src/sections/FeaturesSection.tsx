import { BrainCircuit, ChartNoAxesCombined, FlaskConical, ShieldCheck } from "lucide-react"
import FeaturesSectionBlock from "@/src/components/features/FeaturesSection"
import type { FeatureItem } from "@/src/types/feature"

const features: FeatureItem[] = [
  {
    icon: BrainCircuit,
    title: "AI Lab Simulations",
    description: "Experiment with prompts, models, and mini projects in a safe visual sandbox.",
  },
  {
    icon: ChartNoAxesCombined,
    title: "Progress Analytics",
    description: "Track class-wise progress with skill maps and adaptive learning recommendations.",
  },
  {
    icon: FlaskConical,
    title: "Practical Projects",
    description: "Every chapter has guided builds so concepts move from theory into real code quickly.",
  },
  {
    icon: ShieldCheck,
    title: "Curriculum Aligned",
    description: "Structured tracks mapped to school progression from Class 6 through Class 12.",
  },
]

export default function FeaturesSection() {
  return (
    <FeaturesSectionBlock
      title="Features"
      subtitle="A future-ready learning stack built for students and educators who want depth, speed, and clarity."
      features={features}
    />
  )
}
