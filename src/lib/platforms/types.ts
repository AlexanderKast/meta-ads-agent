export type AdPlatform = "meta" | "google" | "tiktok" | "linkedin";

export interface PlatformTokens {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: Date;
}

export interface CreateCampaignInput {
  name: string;
  objective: "awareness" | "consideration" | "conversion";
  budget: { amount: number; currency: string; type: "daily" | "lifetime" };
  startDate: string;
  endDate?: string;
}

export interface CreateAdInput {
  campaignId: string;
  adSetId?: string;
  headline: string;
  primaryText: string;
  description?: string;
  cta: string;
  imageUrl?: string;
  landingUrl: string;
}

export interface CampaignSummary {
  id: string;
  name: string;
  status: string;
  objective?: string;
  budget?: number;
  spend?: number;
}

export interface CampaignMetrics {
  date: string;
  impressions: number;
  clicks: number;
  spend: number;
  conversions: number;
  revenue: number;
}

export interface PlatformClient {
  createCampaign(tokens: PlatformTokens, accountId: string, input: CreateCampaignInput): Promise<{ campaignId: string; adSetId?: string }>;
  createAd(tokens: PlatformTokens, accountId: string, input: CreateAdInput): Promise<{ adId: string }>;
  listCampaigns(tokens: PlatformTokens, accountId: string): Promise<CampaignSummary[]>;
  getMetrics(tokens: PlatformTokens, campaignId: string, accountId: string, dateRange: { start: string; end: string }): Promise<CampaignMetrics[]>;
  refreshToken?(refreshToken: string): Promise<PlatformTokens>;
  getAuthUrl(redirectUri: string, state: string): string;
  exchangeCode(code: string, redirectUri: string): Promise<PlatformTokens & { accountId: string; accountName: string }>;
}
