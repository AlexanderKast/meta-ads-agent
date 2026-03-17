import type { Platform } from "@/lib/types";
import { metaConfig } from "./meta";
import { tiktokConfig } from "./tiktok";
import { googleConfig } from "./google";
import { youtubeConfig } from "./youtube";
import { linkedinConfig } from "./linkedin";
import { pinterestConfig } from "./pinterest";
import { twitterConfig } from "./twitter";
import { microsoftConfig } from "./microsoft";

export interface PlatformPromptConfig {
  name: string;
  specs: string;
  bestPractices: string;
  copywritingFormulas: string[];
  outputFields: string[];
}

const platformRegistry: Record<Platform, PlatformPromptConfig> = {
  meta: metaConfig,
  tiktok: tiktokConfig,
  google: googleConfig,
  youtube: youtubeConfig,
  linkedin: linkedinConfig,
  pinterest: pinterestConfig,
  twitter: twitterConfig,
  microsoft: microsoftConfig,
};

export function getPlatformConfig(platform: Platform): PlatformPromptConfig {
  return platformRegistry[platform];
}

export function getAllPlatforms(): Platform[] {
  return Object.keys(platformRegistry) as Platform[];
}
