import HeroSectionBlock from "@/src/components/hero/HeroSection"

export default function HeroSection() {
  return (
    <HeroSectionBlock
      title="Learn Python & AI From Class 6 to Class 12"
      subtitle="Build coding confidence with project-driven lessons, live AI labs, and clear pathways from beginner logic to advanced machine learning."
      primaryCta={{ label: "Start Learning", href: "#learning-paths" }}
      secondaryCta={{ label: "Explore Classes", href: "#popular-courses" }}
    />
  )
}
