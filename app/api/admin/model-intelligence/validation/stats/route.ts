import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import RecommendationHistory from "@/models/RecommendationHistory";

export async function GET() {
  try {
    await connectDB();

    const totalEvaluated = await RecommendationHistory.countDocuments({ isAccurate: { $exists: true } });
    const totalAccurate = await RecommendationHistory.countDocuments({ isAccurate: true });

    const accuracyRate = totalEvaluated > 0 ? (totalAccurate / totalEvaluated) * 100 : 0;

    // Aggregate to find most and least successful models
    const modelStats = await RecommendationHistory.aggregate([
      { $match: { successRating: { $exists: true } } },
      {
        $group: {
          _id: "$actualModelUsed",
          avgRating: { $avg: "$successRating" },
          usageCount: { $sum: 1 }
        }
      },
      { $sort: { avgRating: -1 } }
    ]);

    const mostSuccessfulModels = modelStats.filter(m => m.avgRating >= 4).slice(0, 3);
    const leastSuccessfulModels = [...modelStats].sort((a, b) => a.avgRating - b.avgRating).filter(m => m.avgRating < 3).slice(0, 3);

    return NextResponse.json({
      totalEvaluated,
      accuracyRate: Math.round(accuracyRate * 10) / 10,
      mostSuccessfulModels,
      leastSuccessfulModels
    });
  } catch (error) {
    return NextResponse.json({ message: "Failed to fetch validation stats" }, { status: 500 });
  }
}
