"use client";

import { useUser } from "@clerk/nextjs";
import { useState, useEffect } from "react";
import HeroSection from "@/src/components/hero/HeroSection";
import ProgramsSection from "@/src/sections/ProgramsSection";
import FeaturesSection from "@/src/sections/FeaturesSection";
import CommandCenter from "@/src/sections/CommandCenter";

export default function Home() {
  const { user } = useUser();
  const clerkRole = user?.publicMetadata?.role as string | undefined;
  const [dbRole, setDbRole] = useState<string | undefined>(undefined);
  const [isLocalhost, setIsLocalhost] = useState(false);

  const role = clerkRole || dbRole;
  const isAdmin = role === "admin" || role === "super_admin";

  useEffect(() => {
    setIsLocalhost(
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1"
    );
  }, []);

  useEffect(() => {
    async function fetchDbUser() {
      try {
        const res = await fetch("/api/auth/me");
        if (res.ok) {
          const data = await res.json();
          if (data.user?.role) {
            setDbRole(data.user.role);
          }
        }
      } catch {}
    }
    fetchDbUser();
  }, []);

  return (
    <div className="bg-white text-slate-900 w-full">
      <HeroSection />
      {isLocalhost && (
        <div className="p-8 text-center bg-gray-100 border-b">
          <p className="text-gray-600 text-sm italic">
            Document Editor available only in local development
          </p>
        </div>
      )}
      <ProgramsSection />
      <FeaturesSection />
      {isAdmin && <CommandCenter />}
    </div>
  );
}
