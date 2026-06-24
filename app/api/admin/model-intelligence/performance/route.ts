import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { detectDrift } from "@/src/lib/ai-engines/analytics/tuner";
import ModelRegistry from "@/models/ModelRegistry";

export async function GET() {
  try {
    await connectDB();

    // Detect performance drift
    const driftAlerts = await detectDrift();

    // Generate Model Leaderboard based on current active registry scores
    const activeModels = await ModelRegistry.find({ isActive: true }).lean();

    const leaderboard = {
      coding: [...activeModels].sort((a, b) => b.codingScore - a.codingScore).slice(0, 3),
      reasoning: [...activeModels].sort((a, b) => b.reasoningScore - a.reasoningScore).slice(0, 3),
      speed: [...activeModels].sort((a, b) => b.speedScore - a.speedScore).slice(0, 3),
      quota: [...activeModels].sort((a, b) => b.quotaEfficiencyScore - a.quotaEfficiencyScore).slice(0, 3),
    };

    return NextResponse.json({
      driftAlerts,
      leaderboard
    });
  } catch (error) {
    console.error("Performance API Error:", error);
    return NextResponse.json({ message: "Failed to fetch performance stats" }, { status: 500 });
  }
}
