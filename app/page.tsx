import FeaturesSection from "@/src/sections/FeaturesSection"
import FooterSection from "@/src/sections/FooterSection"
import HeroSection from "@/src/sections/HeroSection"
import LearningPathsSection from "@/src/sections/LearningPathsSection"
import NavBar from "@/src/sections/NavBar"
import PopularCoursesSection from "@/src/sections/PopularCoursesSection"

export default function Home() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_12%,rgba(56,189,248,0.16),transparent_34%),radial-gradient(circle_at_88%_20%,rgba(99,102,241,0.14),transparent_33%),radial-gradient(circle_at_50%_80%,rgba(20,184,166,0.12),transparent_28%)]" />
      <div className="relative z-10">
        <NavBar />
        <HeroSection />
        <FeaturesSection />
        <LearningPathsSection />
        <PopularCoursesSection />
        <FooterSection />
      </div>
    </div>
  )
}
