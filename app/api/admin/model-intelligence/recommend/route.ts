import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import ModelRegistry from "@/models/ModelRegistry";
import RecommendationHistory from "@/models/RecommendationHistory";
import { getRecommendations } from "@/src/lib/ai-engines/recommendation/recommender";
import { generateWorkflow } from "@/src/lib/ai-engines/workflow/engine";
import { evaluateReviewGraphComplexity } from "@/src/lib/ai-engines/review-graph/engine";
import { defaultModelsConfig } from "@/src/config/defaultModels";

export async function POST(request: NextRequest) {
  try {
    const { prompt, userId } = await request.json();

    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json({ message: "Prompt is required" }, { status: 400 });
    }

    await connectDB();

    // Seed default models if registry is empty
    let activeModels = await ModelRegistry.find({ isActive: true }).lean();
    if (!activeModels || activeModels.length === 0) {
      const totalModelsCount = await ModelRegistry.countDocuments();
      if (totalModelsCount === 0) {
        await ModelRegistry.insertMany(defaultModelsConfig);
      }
      activeModels = await ModelRegistry.find({ isActive: true }).lean();
    }

    if (!activeModels || activeModels.length === 0) {
      return NextResponse.json(
        { message: "No active models available in registry" },
        { status: 503 }
      );
    }

    // 1. Analyze & recommend core models
    const { analysis, recommendations, confidenceScore } = getRecommendations(
      prompt,
      activeModels as any[],
      undefined
    );

    // 2. Generate workflow orchestration
    const workflow = generateWorkflow(prompt, activeModels as any[]);

    // 3. Generate review-graph sub-router (mock diff derived from analysis)
    const mockDiffStats = {
      filesChanged: 1,
      linesAdded: Math.max(10, analysis.codingScore * 10),
      linesRemoved: 0,
      communitiesAffected: 1,
      hasCoreArchitectureChanges: (analysis.repositoryImpactScore || 0) > 6,
    };
    const reviewGraph = evaluateReviewGraphComplexity(mockDiffStats, activeModels as any[]);

    // 4. Log history
    const historyEntry = await RecommendationHistory.create({
      promptPreview:
        prompt.substring(0, 150) + (prompt.length > 150 ? "..." : ""),
      analysis,
      recommendations: {
        quality: recommendations.quality?.name || "fallback-quality",
        speed: recommendations.speed?.name || "fallback-speed",
        quota: recommendations.quota?.name || "fallback-quota",
        balanced: recommendations.balanced?.name || "fallback-balanced",
      },
      userId: userId || "anonymous",
    });

    // 5. Return complete payload for the UI
    return NextResponse.json({
      message: "Recommendations generated successfully",
      historyId: historyEntry._id,
      analysis,
      confidenceScore,
      recommendations: {
        quality: recommendations.quality,
        speed: recommendations.speed,
        quota: recommendations.quota,
        balanced: recommendations.balanced,
        workflow,
        reviewGraph,
      },
    });
  } catch (error) {
    console.error("Recommendation Engine Error:", error);
    return NextResponse.json(
      {
        message: "Failed to process recommendation",
        error: error instanceof Error ? error.message : "Unknown",
      },
      { status: 500 }
    );
  }
}
