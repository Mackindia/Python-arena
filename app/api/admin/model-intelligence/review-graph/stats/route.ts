import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import ReviewGraphRecommendation from "@/models/ReviewGraphRecommendation";

export async function GET() {
  try {
    await connectDB();

    const totalPlans = await ReviewGraphRecommendation.countDocuments();

    const typeStats = await ReviewGraphRecommendation.aggregate([
      { $unwind: "$reviews" },
      { $group: { _id: "$reviews.reviewType", count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    const recentPlans = await ReviewGraphRecommendation.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select("promptPreview reviews.reviewType createdAt")
      .lean();

    return NextResponse.json({
      totalPlans,
      commonReviews: typeStats,
      recentPlans
    });
  } catch (error) {
    return NextResponse.json({ message: "Failed to fetch review graph stats" }, { status: 500 });
  }
}
