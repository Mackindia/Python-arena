import { analyzePrompt } from "../recommendation/analyzer";
import { getRecommendations } from "../recommendation/recommender";
import { IModelRegistry } from "@/models/ModelRegistry";
import { IWorkflowStage } from "@/models/WorkflowRecommendation";

export function generateWorkflow(prompt: string, activeModels: IModelRegistry[]): { stages: IWorkflowStage[], totalTokens: number, totalTimeMs: number, complexity: number } {
  const analysis = analyzePrompt(prompt);
  const stages: IWorkflowStage[] = [];
  let totalTokens = 0;
  let totalTimeMs = 0;

  // Base fallback models if registry is empty
  const defaultHighReasoning = "gemini-2.5-pro";
  const defaultBalanced = "gemini-2.5-flash";
  const defaultFast = "gemini-2.0-flash-lite";

  // Helper to get best model for a specific need
  const getModel = (type: "quality" | "balanced" | "speed") => {
    if (!activeModels || activeModels.length === 0) {
      if (type === "quality") return defaultHighReasoning;
      if (type === "balanced") return defaultBalanced;
      return defaultFast;
    }
    // Very simplified routing for the workflow generator
    if (type === "quality") return [...activeModels].sort((a, b) => b.reasoningScore - a.reasoningScore)[0].name;
    if (type === "balanced") return [...activeModels].sort((a, b) => ((b.reasoningScore + b.codingScore) / 2) - ((a.reasoningScore + a.codingScore) / 2))[0].name;
    return [...activeModels].sort((a, b) => b.speedScore - a.speedScore)[0].name;
  };

  // 1. Planning Stage (Required for highly agentic or complex tasks)
  if (analysis.agenticScore >= 5 || analysis.complexityScore >= 6) {
    const tokens = Math.round(analysis.contextScore * 500);
    stages.push({
      stageId: "stage_1_plan",
      stageName: "Architecture & Execution Planning",
      actionType: "planning",
      recommendedModel: getModel("quality"),
      estimatedTokens: tokens,
      dependsOn: [],
      transitionLogic: "Pass generated step-by-step plan to the generation stage."
    });
    totalTokens += tokens;
    totalTimeMs += 4000;
  }

  // 2. Generation / Execution Stage (Always required)
  const genTokens = Math.round(analysis.contextScore * 1000 + analysis.codingScore * 500);
  const genDepends = stages.length > 0 ? ["stage_1_plan"] : [];
  stages.push({
    stageId: "stage_2_gen",
    stageName: analysis.codingScore > 4 ? "Code Generation" : "Content Generation",
    actionType: "generation",
    recommendedModel: analysis.complexityScore >= 8 ? getModel("quality") : getModel("balanced"),
    estimatedTokens: genTokens,
    dependsOn: genDepends,
    transitionLogic: analysis.repositoryImpactScore >= 5 ? "Extract diffs and pass to Review Graph." : "Return final output."
  });
  totalTokens += genTokens;
  totalTimeMs += 6000;

  // 3. Review Graph Stage (Dynamic Integration with Phase 2.3)
  if (analysis.repositoryImpactScore >= 5 || analysis.codingScore >= 7) {
    const revTokens = Math.round(genTokens * 0.5);
    stages.push({
      stageId: "stage_3_review",
      stageName: "Dynamic Review Graph (Architecture/Security/Quality)",
      actionType: "review_graph",
      recommendedModel: getModel("speed"), // Fast model orchestrates the sub-reviews
      estimatedTokens: revTokens,
      dependsOn: ["stage_2_gen"],
      transitionLogic: "Invoke ReviewGraph Engine to generate granular review paths. If pass, continue."
    });
    totalTokens += revTokens;
    totalTimeMs += 2500;

    // 4. Refinement Stage (Only if review graph is present)
    const refTokens = Math.round(revTokens * 1.2);
    stages.push({
      stageId: "stage_4_refine",
      stageName: "Code Refinement & Polish",
      actionType: "refinement",
      recommendedModel: getModel("balanced"),
      estimatedTokens: refTokens,
      dependsOn: ["stage_3_review"],
      transitionLogic: "Return final validated code."
    });
    totalTokens += refTokens;
    totalTimeMs += 3500;
  }

  return {
    stages,
    totalTokens,
    totalTimeMs,
    complexity: analysis.complexityScore
  };
}
