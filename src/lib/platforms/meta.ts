import type { PlatformClient, PlatformTokens, CreateCampaignInput, CreateAdInput, CampaignSummary, CampaignMetrics } from "./types";

const API_VERSION = "v21.0";
const BASE = `https://graph.facebook.com/${API_VERSION}`;

async function fbApi(path: string, token: string, method = "GET", body?: Record<string, unknown>) {
  const url = new URL(`${BASE}${path}`);
  const opts: RequestInit = {
    method,
    headers: { "Content-Type": "application/json" },
  };

  if (method === "GET") {
    url.searchParams.set("access_token", token);
  } else {
    opts.body = JSON.stringify({ ...body, access_token: token });
  }

  const res = await fetch(url.toString(), opts);
  const data = await res.json();
  if (data.error) throw new Error(data.error.message || "Meta API error");
  return data;
}

const OBJECTIVE_MAP: Record<string, string> = {
  awareness: "OUTCOME_AWARENESS",
  consideration: "OUTCOME_TRAFFIC",
  conversion: "OUTCOME_SALES",
};

const appId = () => (process.env.META_APP_ID || "").trim();
const appSecret = () => (process.env.META_APP_SECRET || "").trim();

export const metaClient: PlatformClient = {
  getAuthUrl(redirectUri: string, state: string): string {
    const params = new URLSearchParams({
      client_id: appId(),
      redirect_uri: redirectUri.trim(),
      state,
      scope: "ads_management,ads_read,business_management",
      response_type: "code",
    });
    return `https://www.facebook.com/${API_VERSION}/dialog/oauth?${params}`;
  },

  async exchangeCode(code: string, redirectUri: string) {
    // Exchange short-lived token
    const tokenRes = await fbApi(`/oauth/access_token?client_id=${appId()}&client_secret=${appSecret()}&redirect_uri=${encodeURIComponent(redirectUri.trim())}&code=${code}`, "");

    // Exchange for long-lived token
    const longToken = await fbApi(`/oauth/access_token?grant_type=fb_exchange_token&client_id=${appId()}&client_secret=${appSecret()}&fb_exchange_token=${tokenRes.access_token}`, "");

    // Get ad accounts
    const me = await fbApi("/me?fields=name", longToken.access_token || tokenRes.access_token);
    const accounts = await fbApi("/me/adaccounts?fields=name,account_id", longToken.access_token || tokenRes.access_token);
    const firstAccount = accounts.data?.[0];

    return {
      accessToken: longToken.access_token || tokenRes.access_token,
      expiresAt: longToken.expires_in ? new Date(Date.now() + longToken.expires_in * 1000) : undefined,
      accountId: firstAccount?.id || "",
      accountName: firstAccount?.name || me.name || "Meta Ads",
    };
  },

  async createCampaign(tokens: PlatformTokens, accountId: string, input: CreateCampaignInput) {
    // Create Campaign
    const campaign = await fbApi(`/${accountId}/campaigns`, tokens.accessToken, "POST", {
      name: input.name,
      objective: OBJECTIVE_MAP[input.objective] || "OUTCOME_TRAFFIC",
      status: "PAUSED",
      special_ad_categories: [],
    });

    // Create Ad Set
    const adSet = await fbApi(`/${accountId}/adsets`, tokens.accessToken, "POST", {
      name: `${input.name} - Ad Set`,
      campaign_id: campaign.id,
      billing_event: "IMPRESSIONS",
      optimization_goal: input.objective === "conversion" ? "CONVERSIONS" : "LINK_CLICKS",
      daily_budget: input.budget.type === "daily" ? Math.round(input.budget.amount * 100) : undefined,
      lifetime_budget: input.budget.type === "lifetime" ? Math.round(input.budget.amount * 100) : undefined,
      start_time: input.startDate,
      end_time: input.endDate,
      targeting: { geo_locations: { countries: ["US"] } },
      status: "PAUSED",
    });

    return { campaignId: campaign.id, adSetId: adSet.id };
  },

  async createAd(tokens: PlatformTokens, accountId: string, input: CreateAdInput) {
    // Create Creative
    const creative = await fbApi(`/${accountId}/adcreatives`, tokens.accessToken, "POST", {
      name: `Creative - ${input.headline}`,
      object_story_spec: {
        page_id: (await fbApi("/me/accounts?fields=id", tokens.accessToken)).data?.[0]?.id,
        link_data: {
          link: input.landingUrl,
          message: input.primaryText,
          name: input.headline,
          description: input.description,
          call_to_action: { type: input.cta.toUpperCase().replace(/\s+/g, "_"), value: { link: input.landingUrl } },
          image_url: input.imageUrl,
        },
      },
    });

    // Create Ad
    const ad = await fbApi(`/${accountId}/ads`, tokens.accessToken, "POST", {
      name: input.headline,
      adset_id: input.adSetId,
      creative: { creative_id: creative.id },
      status: "PAUSED",
    });

    return { adId: ad.id };
  },

  async listCampaigns(tokens: PlatformTokens, accountId: string): Promise<CampaignSummary[]> {
    const data = await fbApi(`/${accountId}/campaigns?fields=id,name,status,objective,daily_budget,lifetime_budget,insights{spend}`, tokens.accessToken);
    return (data.data || []).map((c: Record<string, unknown>) => ({
      id: c.id as string,
      name: c.name as string,
      status: (c.status as string || "").toLowerCase(),
      objective: c.objective as string,
      budget: ((c.daily_budget || c.lifetime_budget) as number) / 100,
      spend: ((c.insights as Record<string, unknown>)?.data as Array<Record<string, unknown>>)?.[0]?.spend,
    }));
  },

  async getMetrics(tokens: PlatformTokens, campaignId: string, _accountId: string, dateRange: { start: string; end: string }): Promise<CampaignMetrics[]> {
    const data = await fbApi(`/${campaignId}/insights?fields=impressions,clicks,spend,actions,action_values&time_range={"since":"${dateRange.start}","until":"${dateRange.end}"}&time_increment=1`, tokens.accessToken);
    return (data.data || []).map((d: Record<string, unknown>) => {
      const actions = d.actions as Array<{ action_type: string; value: string }> || [];
      const actionValues = d.action_values as Array<{ action_type: string; value: string }> || [];
      const conversions = actions.find((a) => a.action_type === "offsite_conversion")?.value || "0";
      const revenue = actionValues.find((a) => a.action_type === "offsite_conversion")?.value || "0";
      return {
        date: d.date_start as string,
        impressions: Number(d.impressions) || 0,
        clicks: Number(d.clicks) || 0,
        spend: Number(d.spend) || 0,
        conversions: Number(conversions),
        revenue: Number(revenue),
      };
    });
  },

  async refreshToken(refreshToken: string) {
    // Meta long-lived tokens last 60 days, refresh by exchanging again
    const data = await fbApi(`/oauth/access_token?grant_type=fb_exchange_token&client_id=${process.env.META_APP_ID}&client_secret=${process.env.META_APP_SECRET}&fb_exchange_token=${refreshToken}`, "");
    return {
      accessToken: data.access_token,
      expiresAt: data.expires_in ? new Date(Date.now() + data.expires_in * 1000) : undefined,
    };
  },
};
