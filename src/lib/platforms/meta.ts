import type { PlatformClient, PlatformTokens, CreateCampaignInput, CreateAdInput, CampaignSummary, CampaignMetrics } from "./types";

const API_VERSION = "v21.0";
const BASE = `https://graph.facebook.com/${API_VERSION}`;

export async function fbApi(path: string, token: string, method = "GET", body?: Record<string, unknown>) {
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

/** Follow pagination - Meta returns full URLs */
async function fbApiFullUrl(fullUrl: string): Promise<Record<string, unknown>> {
  const res = await fetch(fullUrl);
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
    const data = await fbApi(
      `/${campaignId}/insights?fields=${INSIGHT_FIELDS}&time_range={"since":"${dateRange.start}","until":"${dateRange.end}"}&time_increment=1`,
      tokens.accessToken
    );
    return (data.data || []).map((d: Record<string, unknown>) => parseInsightRow(d));
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

// ── Meta Discovery APIs ──────────────────────────────────────────

export interface MetaBusinessManager {
  id: string;
  name: string;
}

export interface MetaAdAccount {
  id: string;          // act_XXXXX format
  account_id: string;  // numeric ID
  name: string;
  currency: string;
  timezone_name: string;
  account_status: number; // 1=ACTIVE, 2=DISABLED, 3=UNSETTLED, etc
  business_manager?: MetaBusinessManager;
}

export interface MetaAdSummary {
  id: string;
  name: string;
  status: string;
  campaign_id: string;
  campaign_name: string;
  adset_id: string;
  adset_name: string;
  creative_id?: string;
  preview_url?: string;
  created_time: string;
}

/** Fetch all Business Managers the user has access to */
export async function getBusinessManagers(token: string): Promise<MetaBusinessManager[]> {
  const data = await fbApi("/me/businesses?fields=id,name&limit=100", token);
  return (data.data || []).map((b: Record<string, unknown>) => ({
    id: b.id as string,
    name: b.name as string,
  }));
}

/** Fetch all ad accounts - both personal and under BMs */
export async function getAllAdAccounts(token: string): Promise<MetaAdAccount[]> {
  const allAccounts: MetaAdAccount[] = [];
  const seenIds = new Set<string>();

  // 1. Personal ad accounts (directly owned by user)
  let url: string = "/me/adaccounts?fields=id,account_id,name,currency,timezone_name,account_status&limit=100";
  while (url) {
    const data = url.startsWith("http") ? await fbApiFullUrl(url) : await fbApi(url, token);
    for (const a of (data.data as Array<Record<string, unknown>>) || []) {
      if (!seenIds.has(a.id as string)) {
        seenIds.add(a.id as string);
        allAccounts.push({
          id: a.id as string,
          account_id: a.account_id as string,
          name: (a.name as string) || `Account ${a.account_id}`,
          currency: (a.currency as string) || "USD",
          timezone_name: (a.timezone_name as string) || "",
          account_status: (a.account_status as number) ?? 1,
        });
      }
    }
    // Handle pagination
    url = (data.paging as Record<string, unknown>)?.next as string || "";
  }

  // 2. Ad accounts under each Business Manager
  const bms = await getBusinessManagers(token);
  for (const bm of bms) {
    let bmUrl: string = `/${bm.id}/owned_ad_accounts?fields=id,account_id,name,currency,timezone_name,account_status&limit=100`;
    while (bmUrl) {
      const data = bmUrl.startsWith("http") ? await fbApiFullUrl(bmUrl) : await fbApi(bmUrl, token);
      for (const a of (data.data as Array<Record<string, unknown>>) || []) {
        if (!seenIds.has(a.id as string)) {
          seenIds.add(a.id as string);
          allAccounts.push({
            id: a.id as string,
            account_id: a.account_id as string,
            name: (a.name as string) || `Account ${a.account_id}`,
            currency: (a.currency as string) || "USD",
            timezone_name: (a.timezone_name as string) || "",
            account_status: (a.account_status as number) ?? 1,
            business_manager: bm,
          });
        }
      }
      bmUrl = (data.paging as Record<string, unknown>)?.next as string || "";
    }

    // Also check client ad accounts
    let clientUrl: string = `/${bm.id}/client_ad_accounts?fields=id,account_id,name,currency,timezone_name,account_status&limit=100`;
    while (clientUrl) {
      const data = clientUrl.startsWith("http") ? await fbApiFullUrl(clientUrl) : await fbApi(clientUrl, token);
      for (const a of (data.data as Array<Record<string, unknown>>) || []) {
        if (!seenIds.has(a.id as string)) {
          seenIds.add(a.id as string);
          allAccounts.push({
            id: a.id as string,
            account_id: a.account_id as string,
            name: (a.name as string) || `Account ${a.account_id}`,
            currency: (a.currency as string) || "USD",
            timezone_name: (a.timezone_name as string) || "",
            account_status: (a.account_status as number) ?? 1,
            business_manager: bm,
          });
        }
      }
      clientUrl = (data.paging as Record<string, unknown>)?.next as string || "";
    }
  }

  return allAccounts;
}

/** Fetch all ads from an ad account with campaign/adset context */
export async function getAdsFromAccount(token: string, accountId: string): Promise<MetaAdSummary[]> {
  const ads: MetaAdSummary[] = [];
  let url: string = `/${accountId}/ads?fields=id,name,status,campaign_id,campaign{name},adset_id,adset{name},creative{id,effective_object_story_id},created_time&limit=100`;

  while (url) {
    const data = url.startsWith("http") ? await fbApiFullUrl(url) : await fbApi(url, token);
    for (const ad of (data.data as Array<Record<string, unknown>>) || []) {
      ads.push({
        id: ad.id as string,
        name: (ad.name as string) || "",
        status: ((ad.status as string) || "").toLowerCase(),
        campaign_id: (ad.campaign_id as string) || "",
        campaign_name: (ad.campaign as Record<string, unknown>)?.name as string || "",
        adset_id: (ad.adset_id as string) || "",
        adset_name: (ad.adset as Record<string, unknown>)?.name as string || "",
        creative_id: (ad.creative as Record<string, unknown>)?.id as string | undefined,
        created_time: (ad.created_time as string) || "",
      });
    }
    url = (data.paging as Record<string, unknown>)?.next as string || "";
  }

  return ads;
}

const INSIGHT_FIELDS = [
  "impressions","reach","clicks","unique_clicks","spend","cpc","cpm","ctr","unique_ctr",
  "actions","action_values","cost_per_action_type",
  "frequency",
  "video_p25_watched_actions",
  "video_p50_watched_actions","video_p75_watched_actions","video_p100_watched_actions",
  "video_play_actions","video_30_sec_watched_actions",
  "outbound_clicks",
  "inline_link_clicks","inline_link_click_ctr","cost_per_inline_link_click",
  "engagement_rate_ranking","quality_ranking","conversion_rate_ranking",
].join(",");

/** Helper: extract conversions from actions array (purchase > lead > complete_registration) */
function extractConversions(actions: Array<{ action_type: string; value: string }>): number {
  const purchase = actions.find(a => a.action_type === "offsite_conversion.fb_pixel_purchase");
  if (purchase) return Number(purchase.value) || 0;
  const lead = actions.find(a => a.action_type === "lead");
  if (lead) return Number(lead.value) || 0;
  const reg = actions.find(a => a.action_type === "complete_registration");
  if (reg) return Number(reg.value) || 0;
  // Fallback to generic offsite_conversion
  const generic = actions.find(a => a.action_type === "offsite_conversion");
  return Number(generic?.value) || 0;
}

/** Helper: extract revenue from action_values array */
function extractRevenue(actionValues: Array<{ action_type: string; value: string }>): number {
  const purchase = actionValues.find(a => a.action_type === "offsite_conversion.fb_pixel_purchase");
  if (purchase) return Number(purchase.value) || 0;
  const generic = actionValues.find(a => a.action_type === "offsite_conversion");
  return Number(generic?.value) || 0;
}

/** Helper: extract cost_per_conversion from cost_per_action_type array */
function extractCostPerConversion(costPerAction: Array<{ action_type: string; value: string }>): number {
  const purchase = costPerAction.find(a => a.action_type === "offsite_conversion.fb_pixel_purchase");
  if (purchase) return Number(purchase.value) || 0;
  const lead = costPerAction.find(a => a.action_type === "lead");
  if (lead) return Number(lead.value) || 0;
  const reg = costPerAction.find(a => a.action_type === "complete_registration");
  if (reg) return Number(reg.value) || 0;
  const generic = costPerAction.find(a => a.action_type === "offsite_conversion");
  return Number(generic?.value) || 0;
}

/** Helper: sum video view values from video_p25_watched_actions */
function extractVideoViews(videoActions: Array<{ action_type: string; value: string }> | undefined): number {
  if (!videoActions || !Array.isArray(videoActions)) return 0;
  return videoActions.reduce((sum, a) => sum + (Number(a.value) || 0), 0);
}

/** Parse a full insight row into our extended metrics shape */
function parseInsightRow(d: Record<string, unknown>) {
  const actions = d.actions as Array<{ action_type: string; value: string }> || [];
  const actionValues = d.action_values as Array<{ action_type: string; value: string }> || [];
  const costPerAction = d.cost_per_action_type as Array<{ action_type: string; value: string }> || [];

  const conversions = extractConversions(actions);
  const revenue = extractRevenue(actionValues);
  const costPerConversion = extractCostPerConversion(costPerAction);
  const videoViews = extractVideoViews(d.video_p25_watched_actions as Array<{ action_type: string; value: string }> | undefined);

  // Engagement from actions
  const engagement = actions.reduce((sum, a) => {
    if (a.action_type === 'post_engagement') return sum + Number(a.value);
    return sum;
  }, 0);
  const postReactions = actions.reduce((sum, a) => {
    if (a.action_type === 'post_reaction') return sum + Number(a.value);
    return sum;
  }, 0);
  const postComments = actions.reduce((sum, a) => {
    if (a.action_type === 'comment') return sum + Number(a.value);
    return sum;
  }, 0);
  const postShares = actions.reduce((sum, a) => {
    if (a.action_type === 'post' || a.action_type === 'onsite_conversion.post_save') return sum + Number(a.value);
    return sum;
  }, 0);

  // Instagram / Page
  const followersGained = actions.reduce((sum, a) => {
    if (a.action_type === 'follow' || a.action_type === 'like' || a.action_type === 'page_like') return sum + Number(a.value);
    return sum;
  }, 0);
  const profileVisits = actions.reduce((sum, a) => {
    if (a.action_type === 'landing_page_view' || a.action_type === 'link_click') return sum + Number(a.value);
    return sum;
  }, 0);

  // Video extended
  const videoPlays = extractVideoViews(d.video_play_actions as Array<{ action_type: string; value: string }> | undefined);
  const videoThruplay = extractVideoViews(d.video_30_sec_watched_actions as Array<{ action_type: string; value: string }> | undefined);
  const videoComplete = extractVideoViews(d.video_p100_watched_actions as Array<{ action_type: string; value: string }> | undefined);

  const impressionsNum = Number(d.impressions) || 0;
  const engagementRate = impressionsNum > 0 ? (engagement / impressionsNum) * 100 : 0;
  const followerConversionRate = profileVisits > 0 ? (followersGained / profileVisits) * 100 : 0;
  const videoCompletionRate = videoPlays > 0 ? (videoComplete / videoPlays) * 100 : 0;

  // Creative fatigue: based on frequency and quality ranking
  const freq = Number(d.frequency) || 0;
  const qualRank = (d.quality_ranking as string) || "";
  const engRank = (d.engagement_rate_ranking as string) || "";
  let creativeFatigueScore = 0;
  if (freq > 3) creativeFatigueScore += 20;
  if (freq > 5) creativeFatigueScore += 20;
  if (freq > 7) creativeFatigueScore += 20;
  if (qualRank === 'BELOW_AVERAGE_35' || qualRank === 'BELOW_AVERAGE_20') creativeFatigueScore += 20;
  if (engRank === 'BELOW_AVERAGE_35' || engRank === 'BELOW_AVERAGE_20') creativeFatigueScore += 20;
  creativeFatigueScore = Math.min(creativeFatigueScore, 100);

  return {
    date: d.date_start as string,
    impressions: impressionsNum,
    reach: Number(d.reach) || 0,
    clicks: Number(d.clicks) || 0,
    uniqueClicks: Number(d.unique_clicks) || 0,
    spend: Number(d.spend) || 0,
    cpc: Number(d.cpc) || 0,
    ctr: Number(d.ctr) || 0,
    uniqueCtr: Number(d.unique_ctr) || 0,
    cpm: Number(d.cpm) || 0,
    frequency: freq,
    conversions,
    revenue,
    costPerConversion,
    linkClicks: Number(d.inline_link_clicks) || 0,
    linkCtr: Number(d.inline_link_click_ctr) || 0,
    costPerLinkClick: Number(d.cost_per_inline_link_click) || 0,
    socialImpressions: 0,
    socialClicks: 0,
    videoViews,
    engagementRateRanking: engRank,
    qualityRanking: qualRank,
    conversionRateRanking: (d.conversion_rate_ranking as string) || "",
    // Engagement
    engagement,
    postReactions,
    postComments,
    postShares,
    engagementRate,
    // Instagram
    followersGained,
    profileVisits,
    followerConversionRate,
    // Video extended
    videoPlays,
    videoThruplay,
    videoComplete,
    videoCompletionRate,
    // Creative fatigue
    creativeFatigueScore,
  };
}

/** Fetch account-level daily insights (single API call, much faster than per-campaign) */
export async function getAccountInsights(token: string, accountId: string, dateRange: { start: string; end: string }) {
  const data = await fbApi(
    `/${accountId}/insights?fields=${INSIGHT_FIELDS}&time_range={"since":"${dateRange.start}","until":"${dateRange.end}"}&time_increment=1`,
    token
  );
  return (data.data || []).map((d: Record<string, unknown>) => parseInsightRow(d));
}

/** Fetch campaigns with aggregated insights in ONE call */
export async function getCampaignsWithInsights(token: string, accountId: string, dateRange: { start: string; end: string }) {
  const data = await fbApi(
    `/${accountId}/campaigns?fields=id,name,status,objective,daily_budget,lifetime_budget,insights.time_range({"since":"${dateRange.start}","until":"${dateRange.end}"}){${INSIGHT_FIELDS}}&limit=200`,
    token
  );
  return (data.data || []).map((c: Record<string, unknown>) => {
    const insights = (c.insights as Record<string, unknown>)?.data as Array<Record<string, unknown>> || [];
    const row = insights[0] || {};
    const parsed = parseInsightRow(row);
    return {
      id: c.id as string,
      name: c.name as string,
      status: (c.status as string || "").toLowerCase(),
      objective: c.objective as string || "",
      budget: ((c.daily_budget || c.lifetime_budget) as number) / 100 || 0,
      ...parsed,
    };
  });
}
