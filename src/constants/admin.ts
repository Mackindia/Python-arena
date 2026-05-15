import { BookOpen, ChartColumn, FolderOpen, GraduationCap, LayoutDashboard, Settings, UploadCloud, Users } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type AdminNavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
};

export const adminSidebarLinks: AdminNavItem[] = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { label: "Content Hub", href: "/admin/content", icon: FolderOpen },
  { label: "Upload Lesson", href: "/admin/upload", icon: UploadCloud },
  { label: "Manage Lessons", href: "/admin/lessons", icon: BookOpen },
  { label: "Manage Subjects", href: "/admin/courses", icon: GraduationCap },
  { label: "Students", href: "/admin/users", icon: Users },
  { label: "Analytics", href: "/admin/analytics", icon: ChartColumn },
  { label: "Settings", href: "/admin/settings", icon: Settings },
];
