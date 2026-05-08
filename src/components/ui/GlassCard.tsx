import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

type GlassCardProps = {
  children: ReactNode
  className?: string
}

export default function GlassCard({ children, className }: GlassCardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-[0_12px_48px_rgba(0,0,0,0.35)]",
        className,
      )}
    >
      {children}
    </div>
  )
}
