// analyzer.ts
export type PromptAnalysis = {
  taskClassification: string;
  complexityScore: number;
  reasoningScore: number;
  codingScore: number;
  contextScore: number;
  agenticScore: number;
  repositoryImpactScore: number;
  confidence: number; // 0..1, how sure the classifier is
};

export function analyzePrompt(prompt: string): PromptAnalysis {
  const text = prompt.toLowerCase().trim();
  const wordCount = text.split(/\s+/).filter(Boolean).length;

  // 1. Keyword signals
  const codingKeywords = [
    "const", "let", "def", "function", "import", "class", "return",
    "type", "interface", "code", "debug", "error", "api", "endpoint",
  ];
  const reasoningKeywords = [
    "why", "explain", "analyze", "evaluate", "compare", "architect",
    "design", "solve", "think", "strategy", "trade-off", "tradeoff",
  ];
  const agenticKeywords = [
    "execute", "run", "search", "find", "build", "deploy", "fix",
    "plan", "orchestrate", "automate", "pipeline",
  ];
  const repoKeywords = [
    "refactor", "project", "workspace", "directory", "repository",
    "global", "all files", "structure", "codebase", "monorepo",
  ];

  const countMatches = (keywords: string[]) =>
    keywords.filter(kw => text.includes(kw)).length;

  const codingCount = countMatches(codingKeywords);
  const reasoningCount = countMatches(reasoningKeywords);
  const agenticCount = countMatches(agenticKeywords);
  const repoCount = countMatches(repoKeywords);

  // 2. Intent detectors (tightened patterns)
  const archPatterns = [
    /\bdesign\b/, /\barchitect(ure)?\b/, /\bschema\b/,
    /\bworkflow engine\b/, /\bscheduling engine\b/, /\borchestrat\w*\b/,
    /database schema/, /data model/, /system design/, /auth system/,
  ];
  const isArchitecture =
    archPatterns.some(p => p.test(text)) ||
    /\brbac\b/.test(text) ||
    /\bauthentication system\b/.test(text);

  const secPatterns = [
    /\brbac\b/, /\bauthentication\b/, /\bauthorization\b/, /\bclerk\b/,
    /\bjwt\b/, /session management/, /access control/, /\bpermissions\b/,
    /\bsecurity\b/, /\boauth\b/, /\bsso\b/,
  ];
  const isSecurity = secPatterns.some(p => p.test(text));

  // Repo-wide requires an explicit scope cue, not just "navigation"
  const repoWidePatterns = [
    /refactor (the )?(application|app|codebase|system|project)/,
    /redesign (the )?(application|app|codebase|system|navigation)/,
    /change architecture/, /update entire/, /entire (system|app|codebase)/,
    /workspace changes/, /global change/, /restructure codebase/,
    /analyze (my |the )?(next\.?js |react )?(repo(sitory)?|codebase|project)/,
  ];
  const isRepoWide = repoWidePatterns.some(p => p.test(text));

  const codingPatterns = [
    /\bbuild\b/, /\bimplement\b/, /\bcreate\b/, /\bdevelop\b/,
    /\bgenerate\b/, /\bwrite\b/, /\bcode\b/,
  ];
  const isCoding = codingPatterns.some(p => p.test(text));

  // Simple/utility task: short prompt + extraction/format verb + no heavy intent
  const simpleVerbs = ["extract", "format", "regex", "convert", "parse", "what is", "list"];
  const isSimpleTask =
    wordCount <= 12 &&
    simpleVerbs.some(v => text.includes(v)) &&
    !(isSecurity || isArchitecture || isRepoWide);

  // 3. Base scores
  let codingScore = Math.min(10, codingCount * 2.0);
  let reasoningScore = Math.min(10, reasoningCount * 2.0);
  let agenticScore = Math.min(10, agenticCount * 3.0);
  let repositoryImpactScore = Math.min(10, repoCount * 3.0);
  const contextScore = Math.min(10, (prompt.length / 5000) * 10);

  // 4. Intent-based boosts
  if (isCoding) {
    codingScore = Math.max(codingScore, 6.0);
    agenticScore = Math.max(agenticScore, 4.0);
  }
  if (isArchitecture) {
    reasoningScore = Math.max(reasoningScore, 7.0);
    agenticScore = Math.max(agenticScore, 5.0);
    codingScore = Math.max(codingScore, 5.0);
  }
  if (isSecurity) {
    reasoningScore = Math.max(reasoningScore, 7.5);
    codingScore = Math.max(codingScore, 8.0);
    agenticScore = Math.max(agenticScore, 5.0);
  }
  if (isRepoWide) {
    repositoryImpactScore = Math.max(repositoryImpactScore, 8.0);
    agenticScore = Math.max(agenticScore, 7.0);
    reasoningScore = Math.max(reasoningScore, 6.5);
    codingScore = Math.max(codingScore, 7.0);
  }

  // 5. Simple-task clamp (applied last so it wins)
  if (isSimpleTask) {
    codingScore = Math.min(codingScore, 2.0);
    reasoningScore = Math.min(reasoningScore, 1.0);
    agenticScore = Math.min(agenticScore, 2.0);
    repositoryImpactScore = 0;
  }

  // 6. Complexity: weighted combo, with security/repo-wide bumps
  const baseComplexity = Math.max(codingScore, reasoningScore);
  const impactFactor = agenticScore * 0.15 + repositoryImpactScore * 0.2;
  let complexityScore =
    baseComplexity * 0.7 + impactFactor + contextScore * 0.05;
  if (isSecurity) complexityScore += 0.5;
  if (isRepoWide) complexityScore += 0.3;
  complexityScore = Math.min(10, complexityScore);

  // 7. Classification
  let taskClassification = "general";
  if (isSimpleTask) {
    taskClassification = "simple_utility";
  } else if (repositoryImpactScore >= 7.0 && agenticScore >= 6.0) {
    taskClassification = "autonomous_refactor";
  } else if (isSecurity) {
    taskClassification = "security_implementation";
  } else if (isArchitecture && codingScore < 7.0) {
    taskClassification = "architecture_design";
  } else if (codingScore >= 7.0) {
    taskClassification = "code_generation";
  } else if (reasoningScore >= 6.0) {
    taskClassification = "architecture_design";
  } else if (contextScore >= 7.0) {
    taskClassification = "large_context_qa";
  }

  // 8. Confidence: more matched signals -> higher confidence
  const signalHits =
    (isCoding ? 1 : 0) +
    (isArchitecture ? 1 : 0) +
    (isSecurity ? 1 : 0) +
    (isRepoWide ? 1 : 0) +
    (isSimpleTask ? 1 : 0);
  const keywordDensity = Math.min(
    1,
    (codingCount + reasoningCount + agenticCount + repoCount) / 6
  );
  const confidence = Math.min(1, signalHits * 0.25 + keywordDensity * 0.4 + 0.1);

  const round1 = (n: number) => Math.round(n * 10) / 10;
  return {
    taskClassification,
    complexityScore: round1(complexityScore),
    reasoningScore: round1(reasoningScore),
    codingScore: round1(codingScore),
    contextScore: round1(contextScore),
    agenticScore: round1(agenticScore),
    repositoryImpactScore: round1(repositoryImpactScore),
    confidence: round1(confidence),
  };
}
