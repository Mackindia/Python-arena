export const defaultModelsConfig = [
  {
    name: "gemini-2.5-flash",
    provider: "google",
    reasoningScore: 7,
    codingScore: 7,
    architectureScore: 6,
    speedScore: 10,
    quotaEfficiencyScore: 9,
    contextScore: 8,
    bestUseCases: ["quick_answers", "summarization", "simple_extraction"],
    worstUseCases: ["complex_logic", "large_refactors"],
    isActive: true
  },
  {
    name: "gemini-2.5-pro",
    provider: "google",
    reasoningScore: 9,
    codingScore: 9,
    architectureScore: 9,
    speedScore: 6,
    quotaEfficiencyScore: 5,
    contextScore: 10,
    bestUseCases: ["complex_architecture", "deep_reasoning", "code_generation"],
    worstUseCases: ["low_latency_chat", "simple_tasks"],
    isActive: true
  },
  {
    name: "gemini-2.0-flash-lite",
    provider: "google",
    reasoningScore: 5,
    codingScore: 4,
    architectureScore: 4,
    speedScore: 10,
    quotaEfficiencyScore: 10,
    contextScore: 7,
    bestUseCases: ["simple_qa", "quick_checks", "bulk_classification"],
    worstUseCases: ["coding", "multi_step_reasoning"],
    isActive: true
  }
];
