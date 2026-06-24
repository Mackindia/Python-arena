import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import ModelRegistry from "@/models/ModelRegistry";
import ReviewGraphRecommendation from "@/models/ReviewGraphRecommendation";
import { generateReviewPlan } from "@/src/lib/ai-engines/review-graph/intelligence";

export async function POST(request: NextRequest) {
  try {
    const { prompt, userId } = await request.json();

    if (!prompt) {
      return NextResponse.json({ message: "Prompt is required" }, { status: 400 });
    }

    await connectDB();
    const activeModels = await ModelRegistry.find({ isActive: true }).lean();

    const { reviews, totalTokens } = generateReviewPlan(prompt, activeModels as any[]);

    const planEntry = await ReviewGraphRecommendation.create({
      promptPreview: prompt.substring(0, 150) + (prompt.length > 150 ? "..." : ""),
      reviews,
      totalEstimatedReviewTokens: totalTokens,
      userId: userId || "anonymous"
    });

    return NextResponse.json({
      message: "Review Plan generated successfully",
      planId: planEntry._id,
      reviews,
      totalEstimatedReviewTokens: totalTokens
    });

  } catch (error) {
    console.error("Review Graph Engine Error:", error);
    return NextResponse.json({ message: "Failed to process review graph plan", error: error instanceof Error ? error.message : "Unknown" }, { status: 500 });
  }
}
