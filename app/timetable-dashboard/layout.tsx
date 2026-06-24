import type { ReactNode } from "react";
import { ADMIN_PANEL_ROLES, requireRolePage } from "@/lib/rbac";

export default async function TimetableDashboardLayout({ children }: { children: ReactNode }) {
  await requireRolePage(ADMIN_PANEL_ROLES);

  return (
    <div className="flex-1 w-full bg-slate-950 text-white">
      {children}
    </div>
  );
}
