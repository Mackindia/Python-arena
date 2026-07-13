"use client";

import { useUser } from "@clerk/nextjs";
import HeroSection from "@/src/components/hero/HeroSection";
import ProgramsSection from "@/src/sections/ProgramsSection";
import FeaturesSection from "@/src/sections/FeaturesSection";
import CommandCenter from "@/src/sections/CommandCenter";
import HomeDocumentEditor from "@/src/components/editor/HomeDocumentEditor";

export default function Home() {
  const { user } = useUser();
  const role = user?.publicMetadata?.role as string | undefined;
  const isAdmin = role === "admin" || role === "super_admin";

  return (
    <div className="bg-white text-slate-900 w-full">
      <HeroSection />
      <HomeDocumentEditor />
      <ProgramsSection />
      <FeaturesSection />
      {isAdmin && <CommandCenter />}
    </div>
  );
}
