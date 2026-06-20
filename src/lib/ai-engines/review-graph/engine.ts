import { IModelRegistry } from "@/models/ModelRegistry";

export type DiffStats = {
  filesChanged: number;
  linesAdded: number;
  linesRemoved: number;
  communitiesAffected: number;
  hasCoreArchitectureChanges: boolean;
};

export type ReviewRecommendation = {
  suggestedModel: string;
  reasoning: string;
  estimatedTokens: number;
};

export function evaluateReviewGraphComplexity(diffStats: DiffStats, activeModels: IModelRegistry[]): ReviewRecommendation {
  const totalLines = diffStats.linesAdded + diffStats.linesRemoved;

  // Complexity heuristic for Code Review
  let complexity = 0;

  if (diffStats.filesChanged > 10) complexity += 3;
  if (totalLines > 500) complexity += 3;
  if (diffStats.communitiesAffected > 2) complexity += 2;
  if (diffStats.hasCoreArchitectureChanges) complexity += 4;

  const estimatedTokens = totalLines * 12 + diffStats.filesChanged * 50; // Rough token estimation

  // Fallback if no models available in DB
  if (!activeModels || activeModels.length === 0) {
    return {
      suggestedModel: "gemini-2.5-flash",
      reasoning: "Fallback default router.",
      estimatedTokens
    };
  }

  // Filter models that can handle the estimated context
  // (Assuming contextScore of 10 = ~1 million tokens, 1 = ~10k tokens)
  const capableModels = activeModels.filter(m => (m.contextScore * 100000) >= estimatedTokens);
  const pool = capableModels.length > 0 ? capableModels : activeModels;

  // Decision Logic tailored for Reviews
  if (complexity >= 7 || diffStats.hasCoreArchitectureChanges) {
    // High complexity demands the absolute best reasoning model
    const topReasoning = [...pool].sort((a, b) => b.reasoningScore - a.reasoningScore)[0];
    return {
      suggestedModel: topReasoning.name,
      reasoning: `High complexity diff (${totalLines} lines, ${diffStats.communitiesAffected} domains affected). Max reasoning required.`,
      estimatedTokens
    };
  } else if (complexity >= 4) {
    // Medium complexity demands a balanced model
    const balanced = [...pool].sort((a, b) => ((b.reasoningScore + b.speedScore) / 2) - ((a.reasoningScore + a.speedScore) / 2))[0];
    return {
      suggestedModel: balanced.name,
      reasoning: `Moderate diff (${totalLines} lines). Balanced evaluation sufficient.`,
      estimatedTokens
    };
  } else {
    // Low complexity allows for max speed/quota efficiency
    const topSpeed = [...pool].sort((a, b) => b.speedScore - a.speedScore)[0];
    return {
      suggestedModel: topSpeed.name,
      reasoning: `Simple diff (${totalLines} lines). Routing for speed and quota efficiency.`,
      estimatedTokens
    };
  }
}
