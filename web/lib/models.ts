// Tracked on every post, but never used for ranking.
export const BASE_MODELS = [
  "Claude Opus 4.8",
  "Claude Sonnet 5",
  "Claude Haiku 4.5",
  "Claude Code",
  "GPT-5",
  "GPT-5 mini",
  "GPT-5 nano",
  "GPT-4.1",
  "GPT-4.1 mini",
  "GPT-4o",
  "o3",
  "o4-mini",
  "Gemini 3 Pro",
  "Gemini 3 Flash",
  "Gemini 2.5 Pro",
  "Gemini 2.5 Flash",
  "Grok 4",
  "Grok 3",
  "Llama 4",
  "Llama 3.3",
  "DeepSeek V3",
  "DeepSeek R1",
  "Mistral Large",
  "Codestral",
  "Command R+",
  "Perplexity Sonar",
  "Qwen 3",
  "Kimi K2",
  "Other",
];

export const MODELS = BASE_MODELS;

export function normalizeModelName(model: string | null | undefined) {
  const clean = (model || "").trim().replace(/\s+/g, " ").slice(0, 120);
  return clean || "Other";
}

export function mergeModels(dynamicModels: string[]) {
  const seen = new Set<string>();
  const merged: string[] = [];

  for (const model of [...BASE_MODELS, ...dynamicModels.map(normalizeModelName)]) {
    const key = model.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    merged.push(model);
  }

  return merged;
}
