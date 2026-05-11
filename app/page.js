import HeroSection from "@/components/sections/HeroSection";
import FeaturesSection from "@/components/sections/FeaturesSection";
import FoundationSection from "@/components/sections/FoundationSection";
import IntelligenceChartSection from "@/components/sections/IntelligenceChartSection";
import ChapterPreviewSection from "@/components/sections/ChapterPreviewSection";
import AiSection from "@/components/sections/AiSection";
import PythonProgramsSection from "@/components/sections/PythonProgramsSection";
import FooterSection from "@/components/sections/FooterSection";
import MarqueeBar from "@/components/MarqueeBar";
import NavBar from "@/components/NavBar";

export default function Home() {
  return (
    <>
      <NavBar />
      <main className="overflow-x-clip">
        <HeroSection />
        <MarqueeBar />
        <FeaturesSection />
        <FoundationSection />
        <IntelligenceChartSection />
        <ChapterPreviewSection />
        <AiSection />
        <PythonProgramsSection />
        <FooterSection />
      </main>
    </>
  );
}
