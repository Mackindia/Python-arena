import type { ButtonHTMLAttributes, ReactNode } from "react";

type AppButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  variant?: "primary" | "secondary" | "ghost";
};

export default function AppButton({ children, variant = "primary", className = "", ...props }: AppButtonProps) {
  const variantClass =
    variant === "primary"
      ? "bg-cyan-400 text-slate-950 hover:bg-cyan-300"
      : variant === "secondary"
        ? "border border-white/15 bg-white/5 text-white hover:bg-white/10"
        : "text-slate-200 hover:bg-white/10";

  return (
    <button
      className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${variantClass} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
