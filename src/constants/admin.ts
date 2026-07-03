import { FolderOpen, LayoutDashboard, Settings, Sparkles, Users, GraduationCap, FileText } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type AdminNavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  external?: boolean;
};

export const adminSidebarLinks: AdminNavItem[] = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { label: "Content Hub", href: "/admin/content", icon: FolderOpen },
  { label: "Practice Question Paper", href: "/admin/practice-question-papers", icon: FileText },
  { label: "Learn Navigation", href: "/admin/navigation", icon: GraduationCap },
  { label: "Students", href: "/admin/users", icon: Users },
  { label: "AI Engines", href: "/admin/engines", icon: Sparkles },
  { label: "Settings", href: "/admin/settings", icon: Settings },
];
