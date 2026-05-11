import type { ReactNode } from "react";

type AppBadgeProps = {
  children: ReactNode;
};

export default function AppBadge({ children }: AppBadgeProps) {
  return (
    <span className="inline-flex rounded-full border border-cyan-300/30 bg-cyan-300/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-cyan-200">
      {children}
    </span>
  );
}
