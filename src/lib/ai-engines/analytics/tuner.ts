import ModelRegistry from "@/models/ModelRegistry";
import RecommendationHistory from "@/models/RecommendationHistory";

export type DriftAlert = {
  model: string;
  metric: string;
  previousScore: number;
  recentScore: number;
  driftValue: number;
  status: "degraded" | "improved" | "stable";
};

export async function selfTuneRegistry() {
  const tuningLogs: string[] = [];

  // 1. Fetch recent feedback
  const recentHistory = await RecommendationHistory.find({
    successRating: { $exists: true }
  }).sort({ createdAt: -1 }).limit(100).lean();

  if (recentHistory.length === 0) return { status: "skipped", message: "No feedback available for tuning." };

  const models = await ModelRegistry.find().lean();

  for (const model of models) {
    // Filter history for this model
    const modelHistory = recentHistory.filter(h => h.actualModelUsed === model.name);
    if (modelHistory.length < 5) continue; // Not enough data to tune securely

    let avgRating = 0;
    modelHistory.forEach(h => avgRating += (h.successRating || 0));
    avgRating /= modelHistory.length;

    const updates: any = {};
    let tuned = false;

    // Base adjustment delta
    const delta = (avgRating - 3.0) * 0.1; // If rating is 5 -> +0.2. If 1 -> -0.2.

    // Adjust specific scores based on task classifications in the history
    const codingTasks = modelHistory.filter(h => h.analysis.taskClassification === "code_generation");
    if (codingTasks.length >= 3) {
      const taskAvg = codingTasks.reduce((acc, h) => acc + (h.successRating || 0), 0) / codingTasks.length;
      const newScore = Math.max(1, Math.min(10, model.codingScore + ((taskAvg - 3.0) * 0.15)));
      if (Math.abs(newScore - model.codingScore) > 0.1) {
        updates.codingScore = newScore;
        tuned = true;
      }
    }

    const reasoningTasks = modelHistory.filter(h => ["architecture_design", "autonomous_refactor"].includes(h.analysis.taskClassification));
    if (reasoningTasks.length >= 3) {
      const taskAvg = reasoningTasks.reduce((acc, h) => acc + (h.successRating || 0), 0) / reasoningTasks.length;
      const newScore = Math.max(1, Math.min(10, model.reasoningScore + ((taskAvg - 3.0) * 0.15)));
      if (Math.abs(newScore - model.reasoningScore) > 0.1) {
        updates.reasoningScore = newScore;
        tuned = true;
      }
    }

    // Apply generic delta to context/architecture if globally praised/penalized
    if (Math.abs(delta) >= 0.1) {
      updates.architectureScore = Math.max(1, Math.min(10, model.architectureScore + delta));
      tuned = true;
    }

    if (tuned) {
      await ModelRegistry.findByIdAndUpdate(model._id, { $set: updates });
      tuningLogs.push(`Tuned ${model.name}: ${JSON.stringify(updates)}`);
    }
  }

  return { status: "success", logs: tuningLogs };
}

export async function detectDrift(): Promise<DriftAlert[]> {
  const alerts: DriftAlert[] = [];

  // Aggregate all-time average ratings
  const allTimeStats = await RecommendationHistory.aggregate([
    { $match: { successRating: { $exists: true } } },
    { $group: { _id: "$actualModelUsed", allTimeAvg: { $avg: "$successRating" }, count: { $sum: 1 } } }
  ]);

  // Aggregate last 7 days average ratings
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const recentStats = await RecommendationHistory.aggregate([
    { $match: { successRating: { $exists: true }, createdAt: { $gte: sevenDaysAgo } } },
    { $group: { _id: "$actualModelUsed", recentAvg: { $avg: "$successRating" }, recentCount: { $sum: 1 } } }
  ]);

  for (const all of allTimeStats) {
    if (all.count < 10) continue; // Ignore models with low sample size
    const recent = recentStats.find(r => r._id === all._id);
    if (!recent || recent.recentCount < 3) continue;

    const driftValue = recent.recentAvg - all.allTimeAvg;

    if (Math.abs(driftValue) >= 0.5) {
      alerts.push({
        model: all._id,
        metric: "Success Rating",
        previousScore: Math.round(all.allTimeAvg * 10) / 10,
        recentScore: Math.round(recent.recentAvg * 10) / 10,
        driftValue: Math.round(driftValue * 10) / 10,
        status: driftValue < 0 ? "degraded" : "improved"
      });
    }
  }

  return alerts;
}
