import type { ReactNode } from "react";
import AdminSidebar from "@/components/admin/AdminSidebar";
import CommandPalette from "@/src/components/admin/CommandPalette";
import { ADMIN_PANEL_ROLES, requireRolePage } from "@/lib/rbac";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const ctx = await requireRolePage(ADMIN_PANEL_ROLES);

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-5 text-white sm:px-6 sm:py-6 lg:px-8">
      <CommandPalette />
      <div className="mx-auto flex max-w-7xl flex-col gap-4 lg:flex-row lg:gap-6">
        <AdminSidebar role={ctx.role} />
        <section className="relative flex-1 overflow-hidden rounded-[28px] border border-white/10 bg-slate-900/85 p-5 shadow-[0_24px_80px_rgba(15,23,42,0.45)] ring-1 ring-white/5 backdrop-blur sm:p-6 lg:p-7">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-[radial-gradient(circle_at_top,rgba(56,189,248,0.14),transparent_58%)]" />
          <div className="relative">{children}</div>
        </section>
      </div>
    </main>
  );
}
