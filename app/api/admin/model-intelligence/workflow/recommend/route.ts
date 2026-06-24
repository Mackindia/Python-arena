import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import ModelRegistry from "@/models/ModelRegistry";
import WorkflowRecommendation from "@/models/WorkflowRecommendation";
import { generateWorkflow } from "@/src/lib/ai-engines/workflow/engine";

export async function POST(request: NextRequest) {
  try {
    const { prompt, userId } = await request.json();

    if (!prompt) {
      return NextResponse.json({ message: "Prompt is required" }, { status: 400 });
    }

    await connectDB();
    const activeModels = await ModelRegistry.find({ isActive: true }).lean();

    // Generate multi-stage workflow DAG
    const { stages, totalTokens, totalTimeMs, complexity } = generateWorkflow(prompt, activeModels as any[]);

    // Log Workflow Recommendation
    const workflowEntry = await WorkflowRecommendation.create({
      promptPreview: prompt.substring(0, 150) + (prompt.length > 150 ? "..." : ""),
      complexityScore: complexity,
      stages,
      totalEstimatedTokens: totalTokens,
      estimatedTotalTimeMs: totalTimeMs,
      userId: userId || "anonymous"
    });

    return NextResponse.json({
      message: "Workflow generated successfully",
      workflowId: workflowEntry._id,
      complexity,
      stages,
      totalEstimatedTokens: totalTokens,
      estimatedTotalTimeMs: totalTimeMs
    });

  } catch (error) {
    console.error("Workflow Engine Error:", error);
    return NextResponse.json({ message: "Failed to process workflow", error: error instanceof Error ? error.message : "Unknown" }, { status: 500 });
  }
}
