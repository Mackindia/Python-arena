import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import WorkflowRecommendation from "@/models/WorkflowRecommendation";

export async function GET() {
  try {
    await connectDB();

    const totalWorkflows = await WorkflowRecommendation.countDocuments();

    // Aggregate average stages per workflow
    const stageStats = await WorkflowRecommendation.aggregate([
      { $project: { stageCount: { $size: "$stages" }, complexityScore: 1 } },
      { $group: {
          _id: null,
          avgStages: { $avg: "$stageCount" },
          avgComplexity: { $avg: "$complexityScore" }
        }
      }
    ]);

    // Aggregate most recommended models in workflows
    const modelStats = await WorkflowRecommendation.aggregate([
      { $unwind: "$stages" },
      { $group: { _id: "$stages.recommendedModel", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 4 }
    ]);

    const recentWorkflows = await WorkflowRecommendation.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select("promptPreview complexityScore stages.stageName createdAt")
      .lean();

    return NextResponse.json({
      totalWorkflows,
      avgStages: stageStats[0] ? Math.round(stageStats[0].avgStages * 10) / 10 : 0,
      avgComplexity: stageStats[0] ? Math.round(stageStats[0].avgComplexity * 10) / 10 : 0,
      topModels: modelStats,
      recentWorkflows
    });
  } catch (error) {
    return NextResponse.json({ message: "Failed to fetch workflow stats" }, { status: 500 });
  }
}
