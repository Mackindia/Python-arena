"use client";

import type { ReactNode } from "react";

type GlassCardProps = {
  children: ReactNode;
  className?: string;
};

export default function GlassCard({ children, className }: GlassCardProps) {
  return (
    <div
      className={`rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-[0_12px_48px_rgba(0,0,0,0.35)] p-4 ${className || ""}`}
    >
      {children}
    </div>
  );
}
