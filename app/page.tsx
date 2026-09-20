
import HeroSection from "@/src/components/hero/HeroSection";
import ProgramsSection from "@/src/sections/ProgramsSection";
import FeaturesSection from "@/src/sections/FeaturesSection";

import HomeDocumentEditor from "@/src/components/editor/HomeDocumentEditor";
import TrafficSignalPanel from "@/src/components/engine-status/TrafficSignalPanel";
import GamingConsole from "@/src/components/engine-status/GamingConsole";

export default function Home() {
  return (
    <div className="bg-white text-slate-900 w-full">
      {/* Floating Gaming Console - Top Left */}
      <div className="fixed left-4 top-20 z-50 w-72">
        <GamingConsole />
      </div>

      <HeroSection />
      <HomeDocumentEditor />
      <ProgramsSection />
      <FeaturesSection />

      {/* Traffic Signal Servers */}
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <TrafficSignalPanel />
      </div>
    </div>
  );
}
