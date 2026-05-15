import * as React from "react";

export default function AppAlert({ 
  children, 
  variant = "info" 
}: { 
  children: React.ReactNode; 
  variant?: "info" | "success" | "error" 
}) {
  const bgColors = {
    info: "bg-blue-500/10 border-blue-500/20 text-blue-400",
    success: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400",
    error: "bg-red-500/10 border-red-500/20 text-red-400"
  };

  return (
    <div className={`rounded-xl border p-4 text-sm ${bgColors[variant]}`}>
      {children}
    </div>
  );
}
