import { IModelRegistry } from "@/models/ModelRegistry";
import { IUserModelPreference } from "@/models/UserModelPreference";
import { PromptAnalysis, analyzePrompt } from "./analyzer";
import { defaultModelsConfig } from "@/src/config/defaultModels";

export type Recommendations = {
  quality: IModelRegistry | null;
  speed: IModelRegistry | null;
  quota: IModelRegistry | null;
  balanced: IModelRegistry | null;
};

export function getRecommendations(
  prompt: string,
  activeModels: IModelRegistry[],
  userPreference?: IUserModelPreference
): { analysis: PromptAnalysis, recommendations: Recommendations, confidenceScore: number } {
  const analysis = analyzePrompt(prompt);

  let modelsToUse = activeModels;
  if (!modelsToUse || modelsToUse.length === 0) {
    modelsToUse = defaultModelsConfig as any[];
  }

  if (!modelsToUse || modelsToUse.length === 0) {
    return { analysis, recommendations: { quality: null, speed: null, quota: null, balanced: null }, confidenceScore: 0 };
  }

  // Adjust weighting based on User Preferences
  const prefSpeedBoost = userPreference?.speedPreference === "high" ? 1.5 : 1.0;
  const prefQuotaBoost = (userPreference?.maxCostPerRequest || 1) < 0.05 ? 1.5 : 1.0;

  // Calculate Fit Score for Quality
  const scoredModels = modelsToUse.map(model => {
    let qualityFitScore = 0;
    let weightSum = 0;

    const addWeight = (modelScore: number, demandScore: number) => {
      const weight = demandScore > 0 ? demandScore : 1;
      qualityFitScore += modelScore * weight;
      weightSum += weight;
    };

    addWeight(model.reasoningScore, analysis.reasoningScore);
    addWeight(model.codingScore, analysis.codingScore);
    addWeight(model.contextScore, analysis.contextScore);
    addWeight(model.architectureScore, Math.max(analysis.agenticScore, analysis.repositoryImpactScore));

    const normalizedQuality = weightSum > 0 ? (qualityFitScore / weightSum) : model.reasoningScore;

    // Balanced score incorporates operational metrics with User Preference Boosts
    const balancedScore = (normalizedQuality * 0.5) + ((model.speedScore / 10) * 2.5 * prefSpeedBoost) + ((model.quotaEfficiencyScore / 10) * 2.5 * prefQuotaBoost);

    return {
      model,
      qualityFit: normalizedQuality,
      balancedScore: balancedScore
    };
  });

  const byQuality = [...scoredModels].sort((a, b) => b.qualityFit - a.qualityFit);
  const byBalanced = [...scoredModels].sort((a, b) => b.balancedScore - a.balancedScore);

  const baselineQuality = 5;
  const capableModels = scoredModels.filter(m => m.qualityFit >= baselineQuality);
  const pool = capableModels.length > 0 ? capableModels : scoredModels;

  const bySpeed = [...pool].sort((a, b) => b.model.speedScore - a.model.speedScore);
  const byQuota = [...pool].sort((a, b) => b.model.quotaEfficiencyScore - a.model.quotaEfficiencyScore);

  // Confidence Score Logic
  // Confidence is high if the top quality model strictly outperforms the runner up,
  // or if the prompt complexity is low (easy to recommend).
  let confidenceScore = 70; // Base confidence
  if (byQuality.length > 1) {
    const margin = byQuality[0].qualityFit - byQuality[1].qualityFit;
    confidenceScore += (margin * 10); // A 1-point margin adds 10% confidence
  }
  // Penalize confidence if complexity is extremely high (hard to predict)
  if (analysis.complexityScore > 8) confidenceScore -= 15;

  confidenceScore = Math.max(10, Math.min(99, Math.round(confidenceScore)));

  return {
    analysis,
    recommendations: {
      quality: byQuality[0]?.model || null,
      speed: bySpeed[0]?.model || null,
      quota: byQuota[0]?.model || null,
      balanced: byBalanced[0]?.model || null,
    },
    confidenceScore
  };
}
