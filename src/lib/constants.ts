import type { Platform, Objective, Tone, Language } from "./types";

export const PLATFORMS: Record<Platform, { label: string; icon: string; description: string }> = {
  meta: { label: "Meta Ads", icon: "📘", description: "Facebook e Instagram" },
  tiktok: { label: "TikTok Ads", icon: "🎵", description: "TikTok In-Feed y TopView" },
  google: { label: "Google Ads", icon: "🔍", description: "Search y Display" },
  youtube: { label: "YouTube Ads", icon: "▶️", description: "Pre-roll y Bumper" },
  linkedin: { label: "LinkedIn Ads", icon: "💼", description: "Sponsored Content e InMail" },
  pinterest: { label: "Pinterest Ads", icon: "📌", description: "Pins e Idea Ads" },
  twitter: { label: "X/Twitter Ads", icon: "𝕏", description: "Promoted Tweets" },
  microsoft: { label: "Microsoft Ads", icon: "🔷", description: "Bing Search y Audience" },
};

export const OBJECTIVES: Record<Objective, { label: string; desc: string }> = {
  awareness: { label: "Awareness (TOFU)", desc: "Alcance y reconocimiento" },
  consideration: { label: "Consideration (MOFU)", desc: "Tráfico y leads" },
  conversion: { label: "Conversion (BOFU)", desc: "Ventas y registros" },
};

export const TONES: Record<Tone, string> = {
  profesional: "Profesional",
  casual: "Casual / Organico",
  urgente: "Urgente / Escasez",
  emocional: "Emocional / Storytelling",
  divertido: "Divertido / Trending",
};

export const LANGUAGES: Record<Language, string> = {
  es: "Espanol",
  en: "English",
  pt: "Portugues",
  fr: "Francais",
};

export const LIMITS = {
  product: 500,
  audience: 300,
  extras: 500,
  variations: { min: 1, max: 5 },
} as const;
