import { BookOpen, Calendar, ChartColumn, Code, FileText, FolderOpen, GraduationCap, LayoutDashboard, Lock, Settings, UploadCloud, Users } from "lucide-react";
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
  { label: "Private Folder", href: "/admin/private", icon: Lock },
  { label: "Upload Lesson", href: "/admin/upload", icon: UploadCloud },
  { label: "Document Writer", href: "/admin/document-writer", icon: FileText },
  { label: "Manage Lessons", href: "/admin/lessons", icon: BookOpen },
  { label: "Manage Subjects", href: "/admin/courses", icon: GraduationCap },
  { label: "Students", href: "/admin/users", icon: Users },
  { label: "Program Manager", href: "/admin/programs", icon: Code, external: true },
  { 
    label: "School Timetable System", 
    href: process.env.NODE_ENV === "development" ? "http://localhost:5173" : "/admin/timetable", 
    icon: Calendar, 
    external: process.env.NODE_ENV === "development" 
  },
  { label: "Online Scheduler (7-Period)", href: "/timetable-dashboard/online-scheduler", icon: Calendar },
  { label: "Analytics", href: "/admin/analytics", icon: ChartColumn },
  { label: "Settings", href: "/admin/settings", icon: Settings },
];
