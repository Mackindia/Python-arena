import Navbar from "@/components/navbar/Navbar";
import HeroSection from "@/components/hero/HeroSection";
import PopularCoursesSection from "@/src/sections/PopularCoursesSection";
import LearningPathsSection from "@/src/sections/LearningPathsSection";
import ArticlesVideosSection from "../src/sections/ArticlesVideosSection";
import FeaturesSection from "@/src/sections/FeaturesSection";
import TestimonialsSection from "../src/sections/TestimonialsSection";
import Footer from "@/components/footer/Footer";

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <Navbar />
      <HeroSection />
      <PopularCoursesSection />
      <LearningPathsSection />
      <ArticlesVideosSection />
      <FeaturesSection />
      <TestimonialsSection />
      <Footer />
    </main>
  );
}
