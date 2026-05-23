import Link from "next/link";
import { redirect } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import { auth, currentUser } from "@clerk/nextjs/server";
import { getDashboardData } from "@/lib/user-sync";
import { cookies } from "next/headers";

const DASHBOARD_DATA_TIMEOUT_MS = 4000;

async function getDashboardDataSafe() {
  try {
    const timeoutPromise = new Promise<null>((resolve) => {
      setTimeout(() => resolve(null), DASHBOARD_DATA_TIMEOUT_MS);
    });

    return await Promise.race([getDashboardData(), timeoutPromise]);
  } catch {
    return null;
  }
}

function formatList(items: string[], fallback: string) {
  return items.length > 0 ? items : [fallback];
}

export default async function DashboardPage() {
  const { userId } = await auth();
  if (!userId) {
    const cookieStore = await cookies();
    const localUserId = cookieStore.get("local_user_id")?.value;
    if (localUserId) {
      redirect("/online-class");
    }
    redirect("/sign-in?redirect_url=/dashboard");
  }

  const clerkUser = await currentUser();
  const dashboardData = await getDashboardDataSafe();

  if (!dashboardData) {
    const displayName = clerkUser
      ? [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ").trim() ||
        clerkUser.username ||
        clerkUser.primaryEmailAddress?.emailAddress ||
        "Student"
      : "Student";
    const email = clerkUser?.primaryEmailAddress?.emailAddress ?? clerkUser?.emailAddresses[0]?.emailAddress ?? "";

    return (
      <main className="min-h-screen bg-black px-4 py-10 text-white sm:px-6 lg:px-10">
        <div className="mx-auto max-w-5xl space-y-6">
          <section className="rounded-[2rem] border border-white/10 bg-white/5 p-6 shadow-[0_24px_80px_rgba(0,0,0,0.35)] backdrop-blur-xl sm:p-8">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.24em] text-cyan-200">Authenticated Dashboard</p>
                <h1 className="mt-2 text-3xl font-bold sm:text-4xl">{displayName}</h1>
                {email ? <p className="mt-2 text-sm text-slate-300">{email}</p> : null}
              </div>

              <div className="flex items-center gap-3">
                <Link
                  href="/lms"
                  className="rounded-xl border border-white/10 px-4 py-2 text-sm font-medium text-slate-200 transition hover:bg-white/10"
                >
                  Open LMS
                </Link>
                {clerkUser?.publicMetadata?.role === "admin" && (
                  <Link
                    href="/admin/resets"
                    className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm font-medium text-red-200 transition hover:bg-red-500/20"
                  >
                    Manage Resets
                  </Link>
                )}
                <UserButton afterSignOutUrl="/" appearance={{ elements: { avatarBox: "h-10 w-10" } }} />
              </div>
            </div>
          </section>

          <section className="rounded-[2rem] border border-amber-500/20 bg-amber-500/10 p-6 text-amber-100">
            <p className="font-semibold">Real dashboard data is temporarily unavailable</p>
            <p className="mt-2 text-sm text-amber-100/80">
              Your login is active, but the dashboard could not load live learner data from MongoDB.
              Once the database connection is healthy, this page will show progress, quiz results, saved lessons, and recent activity.
            </p>
          </section>
        </div>
      </main>
    );
  }

  const { user, enrollments, quizResults, progressSummary } = dashboardData;
  const recentLessons = formatList(user.recentLessons ?? user.completedLessons ?? [], "No lessons completed yet");
  const savedLessons = formatList(user.savedLessons ?? [], "No saved lessons yet");
  const enrolledCourses = formatList(
    enrollments.length > 0 ? enrollments.map((enrollment) => enrollment.courseId) : user.enrolledCourses ?? [],
    "No enrolled courses yet",
  );
  const bestQuizScore = quizResults.length > 0 ? Math.max(...quizResults.map((result) => result.score)) : 0;
  const averageAccuracy = quizResults.length > 0
    ? Math.round(quizResults.reduce((total, result) => total + result.accuracy, 0) / quizResults.length)
    : 0;

  return (
    <main className="min-h-screen bg-black px-4 py-10 text-white sm:px-6 lg:px-10">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="rounded-[2rem] border border-white/10 bg-white/5 p-6 shadow-[0_24px_80px_rgba(0,0,0,0.35)] backdrop-blur-xl sm:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl border border-cyan-300/20 bg-cyan-400/10 text-xl font-semibold text-cyan-100">
                {user.image ? (
                  <img src={user.image} alt={user.fullName} className="h-full w-full object-cover" />
                ) : (
                  <span>{user.fullName?.slice(0, 1) ?? "S"}</span>
                )}
              </div>
              <div>
                <p className="text-sm uppercase tracking-[0.24em] text-cyan-200">
                    Authenticated Dashboard
                </p>
                <h1 className="mt-1 text-3xl font-bold sm:text-4xl">{user.fullName}</h1>
                <p className="mt-2 text-sm text-slate-300">{user.email}</p>
              </div>
            </div>

              <div className="flex items-center gap-3">
                <Link
                  href="/lms"
                  className="rounded-xl border border-white/10 px-4 py-2 text-sm font-medium text-slate-200 transition hover:bg-white/10"
                >
                  Open LMS
                </Link>
                {user.role === "admin" && (
                  <Link
                    href="/admin/resets"
                    className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm font-medium text-red-200 transition hover:bg-red-500/20"
                  >
                    Manage Resets
                  </Link>
                )}
                <UserButton afterSignOutUrl="/" appearance={{ elements: { avatarBox: "h-10 w-10" } }} />
              </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Class</p>
                <p className="mt-1 text-lg font-semibold">{user.studentClass}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Role</p>
                <p className="mt-1 text-lg font-semibold capitalize">{user.role}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Progress</p>
                <p className="mt-1 text-lg font-semibold">{progressSummary?.overallPercent ?? user.progress}%</p>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-4">
          <article className="rounded-2xl border border-cyan-400/20 bg-gradient-to-b from-cyan-400/15 to-transparent p-5">
            <p className="text-xs uppercase tracking-[0.2em] text-cyan-200">Enrolled Courses</p>
            <p className="mt-3 text-3xl font-bold">{enrollments.length}</p>
          </article>
          <article className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Recent Lessons</p>
            <p className="mt-3 text-3xl font-bold">{recentLessons.length}</p>
          </article>
          <article className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Best Quiz Score</p>
            <p className="mt-3 text-3xl font-bold">{bestQuizScore}</p>
          </article>
          <article className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Average Accuracy</p>
            <p className="mt-3 text-3xl font-bold">{averageAccuracy}%</p>
          </article>
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
          <article className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <h2 className="text-lg font-semibold">Enrolled Courses</h2>
            <ul className="mt-4 space-y-3 text-sm text-slate-300">
              {enrolledCourses.map((course) => (
                <li key={course} className="rounded-xl border border-white/5 bg-black/20 px-4 py-3">
                  {course}
                </li>
              ))}
            </ul>
          </article>

          <article className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <h2 className="text-lg font-semibold">Recent Lessons</h2>
            <ul className="mt-4 space-y-3 text-sm text-slate-300">
              {recentLessons.map((lesson) => (
                <li key={lesson} className="rounded-xl border border-white/5 bg-black/20 px-4 py-3">
                  {lesson}
                </li>
              ))}
            </ul>
          </article>

          <article className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <h2 className="text-lg font-semibold">Saved Lessons</h2>
            <ul className="mt-4 space-y-3 text-sm text-slate-300">
              {savedLessons.map((lesson) => (
                <li key={lesson} className="rounded-xl border border-white/5 bg-black/20 px-4 py-3">
                  {lesson}
                </li>
              ))}
            </ul>
          </article>

          <article className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <h2 className="text-lg font-semibold">Class Completion</h2>
            <ul className="mt-4 space-y-3 text-sm text-slate-300">
              {(progressSummary?.byClass?.length ? progressSummary.byClass : []).slice(0, 5).map((item) => (
                <li key={item.id} className="rounded-xl border border-white/5 bg-black/20 px-4 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-medium text-white">{item.name}</p>
                    <p className="text-xs text-cyan-200">{item.percent}%</p>
                  </div>
                  <p className="mt-1 text-xs text-slate-400">{item.completedLessons}/{item.totalLessons} lessons completed</p>
                </li>
              ))}

              {!(progressSummary?.byClass?.length) ? (
                <li className="rounded-xl border border-white/5 bg-black/20 px-4 py-3">No class progress yet</li>
              ) : null}
            </ul>
          </article>

          <article className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <h2 className="text-lg font-semibold">Course Completion</h2>
            <ul className="mt-4 space-y-3 text-sm text-slate-300">
              {(progressSummary?.bySubject?.length ? progressSummary.bySubject : []).slice(0, 5).map((item) => (
                <li key={item.id} className="rounded-xl border border-white/5 bg-black/20 px-4 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-medium text-white">{item.name}</p>
                    <p className="text-xs text-cyan-200">{item.percent}%</p>
                  </div>
                  <p className="mt-1 text-xs text-slate-400">{item.completedLessons}/{item.totalLessons} lessons completed</p>
                </li>
              ))}

              {!(progressSummary?.bySubject?.length) ? (
                <li className="rounded-xl border border-white/5 bg-black/20 px-4 py-3">No course progress yet</li>
              ) : null}
            </ul>
          </article>

          <article className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <h2 className="text-lg font-semibold">Recent Quiz Results</h2>
            <ul className="mt-4 space-y-3 text-sm text-slate-300">
              {quizResults.length > 0 ? (
                quizResults.map((result) => (
                  <li key={String(result._id)} className="rounded-xl border border-white/5 bg-black/20 px-4 py-3">
                    <p className="font-medium text-white">{result.chapter}</p>
                    <p className="mt-1">Score: {result.score} | Accuracy: {result.accuracy}% | Attempts: {result.attempts}</p>
                  </li>
                ))
              ) : (
                <li className="rounded-xl border border-white/5 bg-black/20 px-4 py-3">No quiz results yet</li>
              )}
            </ul>
          </article>
        </section>
      </div>
    </main>
  );
}