export type Platform = "meta" | "tiktok" | "google" | "youtube" | "linkedin" | "pinterest" | "twitter" | "microsoft";
export type Objective = "awareness" | "consideration" | "conversion";
export type Tone = "profesional" | "casual" | "urgente" | "emocional" | "divertido";
export type Language = "es" | "en" | "pt" | "fr";

export interface AdRequest {
  platform: Platform;
  objective: Objective;
  tone: Tone;
  product: string;
  audience: string;
  extras?: string;
  variations: number;
  language?: Language;
  generateImagePrompts?: boolean;
}

export interface AdVariation {
  headline: string;
  primaryText: string;
  description?: string;
  cta: string;
  hook?: string;
  imagePrompt?: string;
}

export interface AdResponse {
  platform: Platform;
  variations: AdVariation[];
  tips: string[];
}

export interface StreamChunk {
  type: "variation" | "tips" | "error" | "done";
  data: AdVariation | string[] | string;
  index?: number;
}

export interface ApiError {
  error: string;
  code?: string;
  status: number;
}

export interface GenerateState {
  variations: AdVariation[];
  tips: string[];
  isStreaming: boolean;
  error: string | null;
  progress: number;
}

export interface QualityScore {
  clarity: number;
  engagement: number;
  ctaRelevance: number;
  platformCompliance: number;
  overall: number;
  summary: string;
}

export interface AnalysisResult {
  strengths: string[];
  weaknesses: string[];
  improvements: AdVariation[];
  tips: string[];
}

export interface ABTestResult {
  hypotheses: Array<{
    variation: string;
    hypothesis: string;
    predictedWinner: boolean;
    confidence: string;
  }>;
  metricsToTrack: string[];
  recommendedDuration: string;
  sampleSize: string;
}
