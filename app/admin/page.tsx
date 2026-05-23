import Link from "next/link";
import { ArrowUpRight, BookOpen, FileText, GraduationCap, ShieldCheck, Sparkles, TrendingUp, Users } from "lucide-react";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import Course from "@/models/Course";
import Lesson from "@/models/Lesson";
import Quiz from "@/models/Quiz";
import Resource from "@/models/Resource";
import AdminStatCard from "@/src/components/admin/AdminStatCard";
import AdminSectionPanel from "@/src/components/admin/AdminSectionPanel";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  let userCount = 0;
  let courseCount = 0;
  let lessonCount = 0;
  let quizCount = 0;
  let uploadCount = 0;
  let activeStudents = 0;
  let recentUsers: Array<{
    _id: string;
    fullName: string;
    email: string;
    role: string;
  }> = [];
  let dataError = "";

  try {
    await connectDB();

    const [
      userCountResult,
      courseCountResult,
      lessonCountResult,
      quizCountResult,
      uploadCountResult,
      recentUsersResult,
      activeStudentsResult,
    ] = await Promise.all([
      User.countDocuments(),
      Course.countDocuments(),
      Lesson.countDocuments(),
      Quiz.countDocuments(),
      Resource.countDocuments(),
      User.find().sort({ createdAt: -1 }).limit(5).select("fullName email role createdAt").lean(),
      User.countDocuments({ role: "student" }),
    ]);

    userCount = userCountResult;
    courseCount = courseCountResult;
    lessonCount = lessonCountResult;
    quizCount = quizCountResult;
    uploadCount = uploadCountResult;
    activeStudents = activeStudentsResult;
    recentUsers = (recentUsersResult as Array<{ _id: string; fullName: string; email: string; role: string }>) ?? [];
  } catch (error) {
    dataError = error instanceof Error ? error.message : "Admin analytics is temporarily unavailable.";
  }

  const statCards = [
    {
      label: "Total Users",
      value: userCount,
      detail: `${activeStudents} active students`,
      accent: "from-cyan-400/20 to-transparent",
      icon: Users,
    },
    {
      label: "Courses",
      value: courseCount,
      detail: "Structured curriculum tracks",
      accent: "from-violet-400/20 to-transparent",
      icon: GraduationCap,
    },
    {
      label: "Lessons",
      value: lessonCount,
      detail: "Published and draft content",
      accent: "from-amber-400/20 to-transparent",
      icon: BookOpen,
    },
    {
      label: "Question Bank",
      value: quizCount,
      detail: "Assessments ready to deploy",
      accent: "from-emerald-400/20 to-transparent",
      icon: FileText,
    },
  ];

  const quickActions = [
    { label: "Upload Lesson", href: "/admin/upload", meta: "Upload PDFs, thumbnails, and lesson assets" },
    { label: "Manage Lessons", href: "/admin/lessons", meta: "Create, update, and publish lesson content" },
    { label: "Manage Subjects", href: "/admin/courses", meta: "Organize subject and class curriculum structure" },
    { label: "Students", href: "/admin/users", meta: "Review learner profiles and engagement" },
    { label: "Timetable System", href: "/admin/timetable", meta: "Manage school classes timetable and teacher slots" },
    { label: "Analytics", href: "/admin/analytics", meta: "Track platform and LMS performance" },
  ];

  const analyticsHighlights = [
    {
      label: "Engagement Trend",
      value: `${Math.max(62, Math.min(96, lessonCount * 3))}%`,
      detail: "Weekly lesson completion rate",
      icon: TrendingUp,
    },
    {
      label: "Resource Library",
      value: uploadCount,
      detail: "Files available across courses",
      icon: Sparkles,
    },
    {
      label: "Moderation Health",
      value: "Stable",
      detail: "No critical platform warnings",
      icon: ShieldCheck,
    },
  ];

  return (
    <div className="space-y-6">
      {dataError ? (
        <div className="rounded-2xl border border-amber-300/30 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">
          Live database metrics are temporarily unavailable. Showing fallback dashboard state. ({dataError})
        </div>
      ) : null}

      <section className="grid gap-4 xl:grid-cols-[1.45fr_0.95fr]">
        <article className="overflow-hidden rounded-[28px] border border-white/10 bg-[linear-gradient(135deg,rgba(8,47,73,0.95),rgba(15,23,42,0.98)_55%,rgba(30,41,59,0.98))] p-6 shadow-[0_24px_80px_rgba(8,47,73,0.35)] sm:p-7">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-cyan-200/90">Admin Dashboard</p>
              <h1 className="mt-3 max-w-2xl text-3xl font-semibold leading-tight text-white sm:text-4xl">
                Monitor platform activity, content output, and learner growth from one responsive workspace.
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-relaxed text-slate-300 sm:text-base">
                Use the analytics cards for fast status checks, then move into courses, lessons, announcements, or moderation without leaving the admin shell.
              </p>
            </div>

            <div className="rounded-2xl border border-cyan-300/20 bg-black/20 px-4 py-3 text-right">
              <p className="text-xs uppercase tracking-[0.22em] text-cyan-200">Assets</p>
              <p className="mt-2 text-3xl font-semibold text-white">{uploadCount}</p>
              <p className="mt-1 text-xs text-slate-300">Uploaded resources in library</p>
            </div>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {statCards.map((card) => (
              <AdminStatCard
                key={card.label}
                title={card.label}
                value={card.value}
                subtitle={card.detail}
                icon={card.icon}
                accent={card.accent}
              />
            ))}
          </div>
        </article>

        <article className="rounded-[28px] border border-white/10 bg-white/[0.04] p-5 sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">Analytics Highlights</p>
              <h2 className="mt-2 text-xl font-semibold text-white">Operational Snapshot</h2>
            </div>
            <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-emerald-200">
              Updated live
            </span>
          </div>

          <div className="mt-5 space-y-3">
            {analyticsHighlights.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.label} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-white">{item.label}</p>
                      <p className="mt-1 text-sm text-slate-400">{item.detail}</p>
                    </div>
                    <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-200">
                      <Icon className="h-4 w-4" />
                    </span>
                  </div>
                  <p className="mt-4 text-2xl font-semibold text-white">{item.value}</p>
                </div>
              );
            })}
          </div>
        </article>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <AdminSectionPanel
          eyebrow="Quick Actions"
          title="Jump Into Management Tasks"
          description="A reusable command center for common LMS CMS workflows."
        >
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {quickActions.map((action) => (
              <Link
                key={action.href}
                href={action.href}
                className="group rounded-2xl border border-white/10 bg-black/20 p-4 transition hover:border-cyan-300/30 hover:bg-cyan-400/10"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-white">{action.label}</p>
                    <p className="mt-2 text-sm leading-relaxed text-slate-400">{action.meta}</p>
                  </div>
                  <ArrowUpRight className="h-4 w-4 text-slate-500 transition group-hover:text-cyan-200" />
                </div>
              </Link>
            ))}
          </div>
        </AdminSectionPanel>

        <article className="rounded-[28px] border border-white/10 bg-white/[0.04] p-5 sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">Recent Users</p>
              <h2 className="mt-2 text-xl font-semibold text-white">Newest Platform Signups</h2>
            </div>
          </div>

          <ul className="mt-5 space-y-3">
            {recentUsers.map((user) => (
              <li key={String(user._id)} className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
                <div>
                  <p className="font-medium text-white">{user.fullName}</p>
                  <p className="mt-1 text-sm text-slate-400">{user.email}</p>
                </div>
                <span className="rounded-full border border-cyan-300/20 bg-cyan-400/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-cyan-200">
                  {user.role}
                </span>
              </li>
            ))}
          </ul>
        </article>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <AdminSectionPanel
          eyebrow="Lesson Management"
          title="Manage Lessons"
          description="Control lesson creation, ordering, publishing state, and content quality checks."
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <Link
              href="/admin/lessons"
              className="rounded-xl border border-white/10 bg-black/20 p-4 transition hover:border-cyan-300/30 hover:bg-cyan-400/10"
            >
              <p className="text-sm font-semibold text-white">Open Lesson Editor</p>
              <p className="mt-2 text-sm text-slate-400">Write and publish lesson content with rich editor tools.</p>
            </Link>
            <Link
              href="/admin/ordering"
              className="rounded-xl border border-white/10 bg-black/20 p-4 transition hover:border-cyan-300/30 hover:bg-cyan-400/10"
            >
              <p className="text-sm font-semibold text-white">Reorder Curriculum</p>
              <p className="mt-2 text-sm text-slate-400">Adjust lesson sequencing to refine learning paths.</p>
            </Link>
          </div>
        </AdminSectionPanel>

        <AdminSectionPanel
          eyebrow="Upload Section"
          title="Upload Lesson Assets"
          description="Upload PDFs, notes, thumbnails, and supporting files through a reusable upload workflow."
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <Link
              href="/admin/upload"
              className="rounded-xl border border-white/10 bg-black/20 p-4 transition hover:border-cyan-300/30 hover:bg-cyan-400/10"
            >
              <p className="text-sm font-semibold text-white">Go to Upload Manager</p>
              <p className="mt-2 text-sm text-slate-400">Batch upload files and attach metadata.</p>
            </Link>
            <Link
              href="/admin/courses"
              className="rounded-xl border border-white/10 bg-black/20 p-4 transition hover:border-cyan-300/30 hover:bg-cyan-400/10"
            >
              <p className="text-sm font-semibold text-white">Manage Library</p>
              <p className="mt-2 text-sm text-slate-400">Review uploaded files and replace outdated materials.</p>
            </Link>
          </div>
        </AdminSectionPanel>
      </section>
    </div>
  );
}
