import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import RecommendationHistory from "@/models/RecommendationHistory";

export async function POST(request: NextRequest) {
  try {
    const { historyId, actualModelUsed, successRating, userFeedback, completionTimeMs, primaryTarget } = await request.json();

    if (!historyId || !actualModelUsed) {
      return NextResponse.json({ message: "historyId and actualModelUsed are required" }, { status: 400 });
    }

    await connectDB();

    const history = await RecommendationHistory.findById(historyId);
    if (!history) {
      return NextResponse.json({ message: "History record not found" }, { status: 404 });
    }

    // Determine accuracy based on what the user's primary target was (quality, speed, quota, balanced)
    // Defaulting to "balanced" if not provided
    const target = primaryTarget || "balanced";
    const recommendedModel = history.recommendations[target];
    const isAccurate = recommendedModel === actualModelUsed;

    history.actualModelUsed = actualModelUsed;
    history.successRating = successRating;
    history.userFeedback = userFeedback;
    history.completionTimeMs = completionTimeMs;
    history.isAccurate = isAccurate;

    await history.save();

    return NextResponse.json({ message: "Feedback recorded successfully", isAccurate });
  } catch (error) {
    return NextResponse.json({ message: "Failed to record feedback" }, { status: 500 });
  }
}
