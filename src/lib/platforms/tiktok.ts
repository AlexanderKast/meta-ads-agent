import type { PlatformClient, PlatformTokens, CreateCampaignInput, CreateAdInput, CampaignSummary, CampaignMetrics } from "./types";

const BASE = "https://business-api.tiktok.com/open_api/v1.3";

async function tiktokApi(path: string, token: string, method = "GET", body?: Record<string, unknown>) {
  const url = `${BASE}${path}`;
  const opts: RequestInit = {
    method,
    headers: {
      "Access-Token": token,
      "Content-Type": "application/json",
    },
  };
  if (body) opts.body = JSON.stringify(body);

  const res = await fetch(url, opts);
  const data = await res.json();
  if (data.code !== 0) throw new Error(data.message || "TikTok API error");
  return data.data;
}

const OBJECTIVE_MAP: Record<string, string> = {
  awareness: "REACH",
  consideration: "TRAFFIC",
  conversion: "CONVERSIONS",
};

export const tiktokClient: PlatformClient = {
  getAuthUrl(redirectUri: string, state: string): string {
    const params = new URLSearchParams({
      app_id: process.env.TIKTOK_APP_ID || "",
      redirect_uri: redirectUri,
      state,
      scope: "campaign_creation,campaign_read,ad_creation,ad_read,report_read",
    });
    return `https://business-api.tiktok.com/portal/auth?${params}`;
  },

  async exchangeCode(code: string, _redirectUri: string) {
    const res = await fetch(`${BASE}/oauth2/access_token/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        app_id: process.env.TIKTOK_APP_ID,
        secret: process.env.TIKTOK_APP_SECRET,
        auth_code: code,
      }),
    });
    const data = await res.json();
    if (data.code !== 0) throw new Error(data.message || "TikTok OAuth error");

    const tokenData = data.data;
    const advertiserId = tokenData.advertiser_ids?.[0] || "";

    return {
      accessToken: tokenData.access_token,
      accountId: String(advertiserId),
      accountName: `TikTok Ads ${advertiserId}`,
      expiresAt: new Date(Date.now() + 86400 * 1000), // 24h default
    };
  },

  async createCampaign(tokens: PlatformTokens, accountId: string, input: CreateCampaignInput) {
    const campaign = await tiktokApi("/campaign/create/", tokens.accessToken, "POST", {
      advertiser_id: accountId,
      campaign_name: input.name,
      objective_type: OBJECTIVE_MAP[input.objective] || "TRAFFIC",
      budget_mode: input.budget.type === "daily" ? "BUDGET_MODE_DAY" : "BUDGET_MODE_TOTAL",
      budget: input.budget.amount,
    });

    // Create Ad Group
    const adGroup = await tiktokApi("/adgroup/create/", tokens.accessToken, "POST", {
      advertiser_id: accountId,
      campaign_id: campaign.campaign_id,
      adgroup_name: `${input.name} - Ad Group`,
      placement_type: "PLACEMENT_TYPE_AUTOMATIC",
      budget_mode: input.budget.type === "daily" ? "BUDGET_MODE_DAY" : "BUDGET_MODE_TOTAL",
      budget: input.budget.amount,
      schedule_start_time: input.startDate,
      schedule_end_time: input.endDate,
      optimization_goal: input.objective === "conversion" ? "CONVERT" : "CLICK",
      bid_type: "BID_TYPE_NO_BID",
      billing_event: "CPC",
      operation_status: "DISABLE",
    });

    return { campaignId: campaign.campaign_id, adSetId: adGroup.adgroup_id };
  },

  async createAd(tokens: PlatformTokens, accountId: string, input: CreateAdInput) {
    const ad = await tiktokApi("/ad/create/", tokens.accessToken, "POST", {
      advertiser_id: accountId,
      adgroup_id: input.adSetId,
      creatives: [{
        ad_name: input.headline,
        ad_text: input.primaryText,
        call_to_action: input.cta.toUpperCase().replace(/\s+/g, "_"),
        landing_page_url: input.landingUrl,
        image_ids: input.imageUrl ? [input.imageUrl] : undefined,
      }],
    });

    return { adId: ad.ad_ids?.[0] || "" };
  },

  async listCampaigns(tokens: PlatformTokens, accountId: string): Promise<CampaignSummary[]> {
    const data = await tiktokApi(`/campaign/get/?advertiser_id=${accountId}&page_size=50`, tokens.accessToken);
    return (data.list || []).map((c: Record<string, unknown>) => ({
      id: String(c.campaign_id),
      name: c.campaign_name as string,
      status: (c.operation_status as string || "").toLowerCase(),
      objective: c.objective_type as string,
      budget: c.budget as number,
    }));
  },

  async getMetrics(tokens: PlatformTokens, campaignId: string, accountId: string, dateRange: { start: string; end: string }): Promise<CampaignMetrics[]> {
    const data = await tiktokApi("/report/integrated/get/", tokens.accessToken, "POST", {
      advertiser_id: accountId,
      report_type: "BASIC",
      data_level: "AUCTION_CAMPAIGN",
      dimensions: ["campaign_id", "stat_time_day"],
      metrics: ["impressions", "clicks", "spend", "conversion", "total_complete_payment_rate"],
      filters: [{ field_name: "campaign_id", filter_type: "IN", filter_value: JSON.stringify([campaignId]) }],
      start_date: dateRange.start,
      end_date: dateRange.end,
      page_size: 100,
    });

    return (data.list || []).map((d: Record<string, Record<string, unknown>>) => {
      const impressions = Number(d.metrics?.impressions || 0);
      const clicks = Number(d.metrics?.clicks || 0);
      const spend = Number(d.metrics?.spend || 0);
      const conversions = Number(d.metrics?.conversion || 0);
      return {
        date: (d.dimensions?.stat_time_day as string || "").split(" ")[0],
        impressions, reach: 0, clicks, uniqueClicks: 0, spend,
        cpc: clicks > 0 ? spend / clicks : 0,
        ctr: impressions > 0 ? (clicks / impressions) * 100 : 0,
        uniqueCtr: 0, cpm: impressions > 0 ? (spend / impressions) * 1000 : 0,
        frequency: 0, conversions, revenue: 0,
        costPerConversion: conversions > 0 ? spend / conversions : 0,
        linkClicks: 0, linkCtr: 0, costPerLinkClick: 0,
        socialImpressions: 0, socialClicks: 0, videoViews: 0,
        engagementRateRanking: "", qualityRanking: "", conversionRateRanking: "",
      };
    });
  },
};
