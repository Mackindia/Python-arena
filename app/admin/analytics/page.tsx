import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import Course from "@/models/Course";
import Quiz from "@/models/Quiz";
import QuizResult from "@/models/QuizResult";

export const dynamic = "force-dynamic";

export default async function AdminAnalyticsPage() {
  await connectDB();

  const [totalUsers, activeStudents, publishedCourses, quizCount, avgQuizScore] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ role: "student" }),
    Course.countDocuments({ status: "published" }),
    Quiz.countDocuments(),
    QuizResult.aggregate([{ $group: { _id: null, avgScore: { $avg: "$score" } } }]),
  ]);

  const averageQuiz = Math.round(avgQuizScore[0]?.avgScore ?? 0);

  const cards = [
    { label: "Total Users", value: totalUsers },
    { label: "Active Students", value: activeStudents },
    { label: "Published Courses", value: publishedCourses },
    { label: "Question Bank", value: quizCount },
    { label: "Avg Quiz Score", value: `${averageQuiz}%` },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold">Analytics</h1>
      <p className="mt-2 text-sm text-slate-300">Track platform growth and learning performance.</p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((card) => (
          <div key={card.label} className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-400">{card.label}</p>
            <p className="mt-3 text-3xl font-bold">{card.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
