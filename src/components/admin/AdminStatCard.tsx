import type { LucideIcon } from "lucide-react";

type AdminStatCardProps = {
  title: string;
  value: string | number;
  subtitle: string;
  icon: LucideIcon;
  accent?: string;
};

export default function AdminStatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  accent = "from-cyan-400/20 to-transparent",
}: AdminStatCardProps) {
  return (
    <article className={`rounded-2xl border border-white/10 bg-gradient-to-b ${accent} p-4 backdrop-blur`}>
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs uppercase tracking-[0.18em] text-slate-300">{title}</p>
        <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-black/20 text-cyan-100">
          <Icon className="h-4 w-4" />
        </span>
      </div>
      <p className="mt-4 text-3xl font-semibold text-white">{value}</p>
      <p className="mt-2 text-sm text-slate-300">{subtitle}</p>
    </article>
  );
}
