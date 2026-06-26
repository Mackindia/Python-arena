
import HeroSection from "@/src/components/hero/HeroSection";
import ProgramsSection from "@/src/sections/ProgramsSection";
import FeaturesSection from "@/src/sections/FeaturesSection";
import TestimonialsSection from "@/src/sections/TestimonialsSection";

import HomeDocumentEditor from "@/src/components/editor/HomeDocumentEditor";

export default function Home() {
  return (
    <div className="bg-white text-slate-900 w-full">
      <HeroSection />
      <HomeDocumentEditor />
      <ProgramsSection />
      <FeaturesSection />
      <TestimonialsSection />
    </div>
  );
}
