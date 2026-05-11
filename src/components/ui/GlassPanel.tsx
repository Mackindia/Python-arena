import type { ReactNode } from "react";

type GlassPanelProps = {
  children: ReactNode;
  className?: string;
};

export default function GlassPanel({ children, className = "" }: GlassPanelProps) {
  return (
    <div
      className={`rounded-2xl border border-white/15 bg-white/5 backdrop-blur-xl shadow-[0_14px_40px_rgba(0,0,0,0.45)] ${className}`}
    >
      {children}
    </div>
  );
}
