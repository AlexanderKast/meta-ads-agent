import type { AdPlatform, PlatformClient } from "./types";
import { metaClient } from "./meta";
import { googleClient } from "./google";
import { tiktokClient } from "./tiktok";
import { linkedinClient } from "./linkedin";

const clients: Record<AdPlatform, PlatformClient> = {
  meta: metaClient,
  google: googleClient,
  tiktok: tiktokClient,
  linkedin: linkedinClient,
};

export function getPlatformClient(platform: AdPlatform): PlatformClient {
  const client = clients[platform];
  if (!client) throw new Error(`Platform ${platform} not supported`);
  return client;
}

export function isSupportedPlatform(platform: string): platform is AdPlatform {
  return platform in clients;
}

export type { AdPlatform, PlatformClient, PlatformTokens, CreateCampaignInput, CreateAdInput, CampaignSummary, CampaignMetrics } from "./types";
