import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import Course from "@/models/Course";
import Quiz from "@/models/Quiz";
import QuizResult from "@/models/QuizResult";
import EnginePageLayout from "@/src/components/admin/EnginePageLayout";
import AnalyticsDashboardClient from "@/src/components/admin/analytics/AnalyticsDashboardClient";

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

  const initialStats = {
    totalUsers,
    activeStudents,
    publishedCourses,
    quizCount,
    averageQuiz
  };

  return (
    <EnginePageLayout
      title="System Analytics"
      category="Analytics"
      description="Track platform activity logs, lesson completion rates, student grades, and LMS session graphs."
    >
      <AnalyticsDashboardClient initialStats={initialStats} />
    </EnginePageLayout>
  );
}