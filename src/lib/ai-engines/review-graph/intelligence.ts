import { analyzePrompt } from "../recommendation/analyzer";
import { IModelRegistry } from "@/models/ModelRegistry";
import { IReviewNode } from "@/models/ReviewGraphRecommendation";

export function generateReviewPlan(prompt: string, activeModels: IModelRegistry[]): { reviews: IReviewNode[], totalTokens: number } {
  const analysis = analyzePrompt(prompt);
  const text = prompt.toLowerCase();
  const reviews: IReviewNode[] = [];
  let totalTokens = 0;

  // Fallback models if registry is empty
  const defaultQuality = "gemini-2.5-pro";
  const defaultBalanced = "gemini-2.5-flash";
  const defaultSpeed = "gemini-2.0-flash-lite";

  const getModel = (type: "quality" | "balanced" | "speed") => {
    if (!activeModels || activeModels.length === 0) {
      if (type === "quality") return defaultQuality;
      if (type === "balanced") return defaultBalanced;
      return defaultSpeed;
    }
    if (type === "quality") return [...activeModels].sort((a, b) => b.reasoningScore - a.reasoningScore)[0].name;
    if (type === "balanced") return [...activeModels].sort((a, b) => ((b.reasoningScore + b.codingScore) / 2) - ((a.reasoningScore + a.codingScore) / 2))[0].name;
    return [...activeModels].sort((a, b) => b.speedScore - a.speedScore)[0].name;
  };

  const addReview = (type: string, priority: number, modelPref: "quality" | "balanced" | "speed", reasoning: string, tokenWeight: number) => {
    const tokens = Math.round(analysis.contextScore * 200 * tokenWeight);
    reviews.push({
      reviewType: type,
      priority,
      recommendedModel: getModel(modelPref),
      reasoning,
      estimatedTokens: tokens
    });
    totalTokens += tokens;
  };

  // 1. Security Review (Highest Priority)
  const securityKeywords = ["auth", "login", "password", "token", "security", "crypt", "jwt", "sql", "injection", "vulnerability"];
  if (securityKeywords.some(kw => text.includes(kw))) {
    addReview("Security Review", 1, "quality", "Prompt touches sensitive authentication or data protection layers.", 2.5);
  }

  // 2. Architecture Review
  const archKeywords = ["architect", "system", "design", "database", "schema", "microservices"];
  if (analysis.reasoningScore >= 6 || archKeywords.some(kw => text.includes(kw))) {
    addReview("Architecture Review", 2, "quality", "Complex structural changes or database schema modifications detected.", 3.0);
  }

  // 3. Scalability Review
  const scaleKeywords = ["scale", "millions", "concurrent", "load", "bottleneck"];
  if (scaleKeywords.some(kw => text.includes(kw))) {
    addReview("Scalability Review", 3, "balanced", "Prompt addresses high concurrency or scale bottlenecks.", 1.5);
  }

  // 4. Performance Review
  const perfKeywords = ["fast", "optimize", "speed", "latency", "memory", "cache", "slow"];
  if (perfKeywords.some(kw => text.includes(kw))) {
    addReview("Performance Review", 4, "balanced", "Optimization requests necessitate execution profiling.", 1.5);
  }

  // 5. Repository Review
  if (analysis.repositoryImpactScore >= 6) {
    addReview("Repository Review", 5, "speed", "High blast radius across the codebase requires sweeping global file checks.", 4.0);
  }

  // 6. Agent Workflow Review
  if (analysis.agenticScore >= 6) {
    addReview("Agent Workflow Review", 6, "quality", "Agentic deployment requires safety and bounds-checking validation.", 2.0);
  }

  // 7. Code Quality Review
  if (analysis.codingScore >= 4) {
    addReview("Code Quality Review", 7, "speed", "Standard static analysis and syntax validation for generated code.", 1.0);
  }

  // Sort by priority so pipeline executes in logical order
  reviews.sort((a, b) => a.priority - b.priority);

  return { reviews, totalTokens };
}
