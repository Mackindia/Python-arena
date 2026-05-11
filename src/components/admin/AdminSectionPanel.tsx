import type { ReactNode } from "react";

type AdminSectionPanelProps = {
  eyebrow: string;
  title: string;
  description?: string;
  children: ReactNode;
};

export default function AdminSectionPanel({
  eyebrow,
  title,
  description,
  children,
}: AdminSectionPanelProps) {
  return (
    <section className="rounded-[24px] border border-white/10 bg-white/[0.04] p-5 sm:p-6">
      <header className="mb-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">{eyebrow}</p>
        <h2 className="mt-2 text-xl font-semibold text-white">{title}</h2>
        {description ? <p className="mt-2 text-sm text-slate-300">{description}</p> : null}
      </header>
      {children}
    </section>
  );
}
