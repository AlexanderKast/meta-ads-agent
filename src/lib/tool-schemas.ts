import type { ToolSchema } from "./ai-provider";

const variationProps = {
  headline: { type: "string" as const, description: "Ad headline" },
  primaryText: { type: "string" as const, description: "Main ad copy" },
  description: { type: "string" as const, description: "Short description (if applicable)" },
  cta: { type: "string" as const, description: "Call to action" },
  hook: { type: "string" as const, description: "Attention hook for first seconds" },
};

export function generateAdsTool(includeImagePrompt = false): ToolSchema {
  const props = { ...variationProps };
  if (includeImagePrompt) {
    (props as Record<string, { type: "string"; description: string }>).imagePrompt = {
      type: "string",
      description: "Detailed image generation prompt for DALL-E/Midjourney/Gemini",
    };
  }

  return {
    name: "generate_ads",
    description: "Generate ad variations with tips",
    properties: {
      variations: {
        type: "array",
        items: {
          type: "object",
          properties: props,
          required: ["headline", "primaryText", "cta"],
        },
      },
      tips: {
        type: "array",
        items: { type: "string" },
        description: "3 optimization tips",
      },
    },
    required: ["variations", "tips"],
  };
}

export const analyzeAdTool: ToolSchema = {
  name: "analyze_ad",
  description: "Analyze an ad and provide improvements",
  properties: {
    strengths: { type: "array", items: { type: "string" }, description: "What works well" },
    weaknesses: { type: "array", items: { type: "string" }, description: "What can be improved" },
    improvements: {
      type: "array",
      items: {
        type: "object",
        properties: variationProps,
        required: ["headline", "primaryText", "cta"],
      },
      description: "Improved ad variations",
    },
    tips: { type: "array", items: { type: "string" }, description: "Specific improvement tips" },
  },
  required: ["strengths", "weaknesses", "improvements", "tips"],
};

export const abTestTool: ToolSchema = {
  name: "ab_test_analysis",
  description: "Analyze ad variations for A/B testing",
  properties: {
    hypotheses: {
      type: "array",
      items: {
        type: "object",
        properties: {
          variation: { type: "string", description: "Which variation" },
          hypothesis: { type: "string", description: "Performance prediction" },
          predictedWinner: { type: "boolean", description: "Predicted to win?" },
          confidence: { type: "string", description: "low/medium/high" },
        },
        required: ["variation", "hypothesis", "predictedWinner", "confidence"],
      },
    },
    metricsToTrack: { type: "array", items: { type: "string" }, description: "Key metrics" },
    recommendedDuration: { type: "string", description: "Test duration" },
    sampleSize: { type: "string", description: "Sample size per variation" },
  },
  required: ["hypotheses", "metricsToTrack", "recommendedDuration", "sampleSize"],
};

export const scoreAdTool: ToolSchema = {
  name: "score_ad",
  description: "Score an ad variation on quality metrics",
  properties: {
    clarity: { type: "number", description: "Clarity score 0-100" },
    engagement: { type: "number", description: "Predicted engagement 0-100" },
    ctaRelevance: { type: "number", description: "CTA relevance 0-100" },
    platformCompliance: { type: "number", description: "Platform compliance 0-100" },
    overall: { type: "number", description: "Weighted overall 0-100" },
    summary: { type: "string", description: "1-2 line summary" },
  },
  required: ["clarity", "engagement", "ctaRelevance", "platformCompliance", "overall", "summary"],
};

export const optimizeAdTool: ToolSchema = {
  name: "optimize_ad",
  description: "Analyze and optimize an underperforming ad",
  properties: {
    analysis: { type: "string", description: "Diagnostic of why the ad underperforms" },
    issues: { type: "array", items: { type: "string" }, description: "Problems identified" },
    recommendations: { type: "array", items: { type: "string" }, description: "Actionable recommendations" },
    optimizedVariations: {
      type: "array",
      items: {
        type: "object",
        properties: variationProps,
        required: ["headline", "primaryText", "cta"],
      },
    },
  },
  required: ["analysis", "issues", "recommendations", "optimizedVariations"],
};
