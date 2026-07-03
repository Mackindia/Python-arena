import {
  BookOpen,
  GraduationCap,
  ArrowUpDown,
  ClipboardList,
  FileText,
  UploadCloud,
  Users,
  ShieldCheck,
  RefreshCw,
  Lock,
  RotateCcw,
  ChartColumn,
  Megaphone,
  Calendar,
  Clock,
  Grid,
  Code,
  History,
  Settings,
  MessageSquare,
  Download
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type Engine = {
  id: string;
  title: string;
  description: string;
  href: string;
  category:
    | "Academic Tools"
    | "AI Generators"
    | "Administration"
    | "Analytics"
    | "Communication"
    | "Automation"
    | "Utilities";
  iconName: string;
  roleRestriction?: string[];
  external?: boolean;
};

export const ENGINES_LIST: Engine[] = [
  // AI Generators
  {
    id: "document-writer",
    title: "Document Writer",
    description: "Create and edit structured school documents, holiday homework, and curriculum plans with dynamic templates.",
    href: "/admin/document-writer",
    category: "AI Generators",
    iconName: "FileText"
  },
  {
    id: "upload-lesson",
    title: "Upload & Ingest Lesson",
    description: "Upload textbook PDFs and generate vector index embeddings for AI-assisted teaching and quiz creation.",
    href: "/admin/upload",
    category: "AI Generators",
    iconName: "UploadCloud"
  },
  {
    id: "ebook-extractor",
    title: "Ebook Page Extractor",
    description: "Extract specific pages from Touchpad AI ebooks (Class 9-12), preview content, and generate topic-wise PDFs for sharing.",
    href: "/admin/ebook-extractor",
    category: "AI Generators",
    iconName: "Download"
  },
  {
    id: "practice-question-papers",
    title: "Practice Question Paper",
    description: "Create subjects, upload question papers and important PDFs, then publish them for students.",
    href: "/admin/practice-question-papers",
    category: "AI Generators",
    iconName: "FileText"
  },
  // Academic Tools
  {
    id: "manage-lessons",
    title: "Manage Lessons",
    description: "Draft, edit, publish, and delete interactive lesson notes, quizzes, and attachments for LMS classrooms.",
    href: "/admin/lessons",
    category: "Academic Tools",
    iconName: "BookOpen"
  },
  {
    id: "manage-subjects",
    title: "Manage Subjects",
    description: "Configure core subjects, grade levels, classes, and organize academic modules in the LMS curriculum.",
    href: "/admin/courses",
    category: "Academic Tools",
    iconName: "GraduationCap"
  },
  {
    id: "lesson-ordering",
    title: "Lesson Ordering",
    description: "Adjust sequence sorting of academic lessons and topics within subjects using drag-and-drop hierarchy.",
    href: "/admin/ordering",
    category: "Academic Tools",
    iconName: "ArrowUpDown"
  },
  {
    id: "manage-quizzes",
    title: "Manage Quizzes",
    description: "Create assessment questionnaires, customize grading metrics, and deploy online student tests.",
    href: "/admin/quizzes",
    category: "Academic Tools",
    iconName: "ClipboardList"
  },
  // Administration
  {
    id: "students-staff",
    title: "Students & Staff",
    description: "Review enrolled student profiles, track logs, manage user roles, and import bulk staff datasets via CSV.",
    href: "/admin/users",
    category: "Administration",
    iconName: "Users"
  },
  {
    id: "content-moderation",
    title: "Content Moderation",
    description: "Audit flags on public student posts, review comments, and moderate community forum discussions.",
    href: "/admin/moderation",
    category: "Administration",
    iconName: "ShieldCheck"
  },
  {
    id: "lms-sync",
    title: "LMS Integrator",
    description: "Synchronize offline class lessons with MongoDB servers and verify database indexing state.",
    href: "/admin/lms",
    category: "Administration",
    iconName: "RefreshCw"
  },
  {
    id: "private-folder",
    title: "Private Vault",
    description: "Access and manage highly confidential administration assets, templates, and server settings.",
    href: "/admin/private",
    category: "Administration",
    iconName: "Lock",
    roleRestriction: ["super_admin"]
  },
  {
    id: "system-resets",
    title: "System Resets",
    description: "Reset demo classrooms, clean temporary databases, and restore backup timetable slots.",
    href: "/admin/resets",
    category: "Administration",
    iconName: "RotateCcw"
  },
  // Analytics
  {
    id: "system-analytics",
    title: "System Analytics",
    description: "Track platform activity logs, lesson completion rates, student grades, and LMS session graphs.",
    href: "/admin/analytics",
    category: "Analytics",
    iconName: "ChartColumn"
  },
  // Communication
  {
    id: "announcements",
    title: "Announcements",
    description: "Broadcast campus notifications, schedule news alerts, and dispatch system-wide emails to users.",
    href: "/admin/announcements",
    category: "Communication",
    iconName: "Megaphone"
  },
  {
    id: "user-messages",
    title: "User Messages",
    description: "View and reply to messages from students and users. Only admins have access.",
    href: "/admin/messages",
    category: "Communication",
    iconName: "MessageSquare",
    roleRestriction: ["super_admin", "admin"]
  },
  // Automation
  {
    id: "timetable-system",
    title: "School Timetable System",
    description: "View and edit weekly schedules, configure default hours, and optimize classroom assignments.",
    href: process.env.NODE_ENV === "development" ? "http://localhost:5173" : "/admin/timetable",
    category: "Automation",
    iconName: "Calendar",
    external: process.env.NODE_ENV === "development"
  },
  {
    id: "online-scheduler",
    title: "Online 7-Period Scheduler",
    description: "Build custom timetable grids using interactive drag-and-drop slots and cross-reference teacher loads.",
    href: "/admin/online-scheduler",
    category: "Automation",
    iconName: "Clock"
  },
  {
    id: "timetable-management",
    title: "Timetable Management",
    description: "Synchronize class allocations and resolve scheduling conflicts for active school terms.",
    href: "/admin/school-timetable-management-system",
    category: "Automation",
    iconName: "Grid"
  },
  // Utilities
  {
    id: "program-manager",
    title: "Program Manager",
    description: "Inspect, debug, and run student-submitted Python programming script files in safe sandbox environments.",
    href: "/admin/programs",
    category: "Utilities",
    iconName: "Code",
    external: true
  },
  {
    id: "upload-history",
    title: "Upload History",
    description: "Browse raw PDF logs, trace document ingestion timestamps, and review processing statuses.",
    href: "/admin/uploads",
    category: "Utilities",
    iconName: "History"
  },
  {
    id: "system-settings",
    title: "System Settings",
    description: "Configure authentication provider rules, API keys, file storage limits, and general website parameters.",
    href: "/admin/settings",
    category: "Utilities",
    iconName: "Settings"
  }
];

export const iconMap: Record<string, LucideIcon> = {
  BookOpen,
  GraduationCap,
  ArrowUpDown,
  ClipboardList,
  FileText,
  UploadCloud,
  Users,
  ShieldCheck,
  RefreshCw,
  Lock,
  RotateCcw,
  ChartColumn,
  Megaphone,
  Calendar,
  Clock,
  Grid,
  Code,
  History,
  Settings,
  MessageSquare,
  Download
};
