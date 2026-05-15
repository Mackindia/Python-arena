import HeroSection from "@/src/components/hero/HeroSection";
import PopularCoursesSection from "@/src/sections/PopularCoursesSection";
import LearningPathsSection from "@/src/sections/LearningPathsSection";
import ArticlesVideosSection from "@/src/sections/ArticlesVideosSection";
import FeaturesSection from "@/src/sections/FeaturesSection";
import TestimonialsSection from "@/src/sections/TestimonialsSection";

export default function Home() {
  return (
    <div className="bg-slate-50 text-slate-900 w-full">
      <HeroSection />
      <PopularCoursesSection />
      <LearningPathsSection />
      <ArticlesVideosSection />
      <FeaturesSection />
      <TestimonialsSection />
    </div>
  );
}
