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
  reach: number;
  clicks: number;
  uniqueClicks: number;
  spend: number;
  cpc: number;
  ctr: number;
  uniqueCtr: number;
  cpm: number;
  frequency: number;
  conversions: number;
  revenue: number;
  costPerConversion: number;
  linkClicks: number;
  linkCtr: number;
  costPerLinkClick: number;
  socialImpressions: number;
  socialClicks: number;
  videoViews: number;
  engagementRateRanking: string;
  qualityRanking: string;
  conversionRateRanking: string;

  // Engagement
  engagement: number;         // total post_engagement actions
  postReactions: number;      // post_reaction
  postComments: number;       // comment
  postShares: number;         // post (shares)
  engagementRate: number;     // engagement / impressions * 100

  // Instagram
  followersGained: number;    // ig_follow action
  profileVisits: number;      // page_engagement or ig actions
  followerConversionRate: number; // followersGained / profileVisits * 100

  // Video extended
  videoPlays: number;         // video_play
  videoThruplay: number;      // video_thruplay (15s+ or complete)
  videoComplete: number;      // video_p100_watched
  videoCompletionRate: number; // videoComplete / videoPlays * 100

  // Creative fatigue
  creativeFatigueScore: number; // derived from frequency + ranking deterioration
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
