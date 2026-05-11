import type { ReactNode } from "react";

type AppCardProps = {
  title?: string;
  children: ReactNode;
  className?: string;
};

export default function AppCard({ title, children, className = "" }: AppCardProps) {
  return (
    <article className={`rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur ${className}`}>
      {title ? <h3 className="text-lg font-semibold text-white">{title}</h3> : null}
      <div className={title ? "mt-2" : ""}>{children}</div>
    </article>
  );
}
