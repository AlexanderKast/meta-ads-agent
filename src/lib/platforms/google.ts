import type { PlatformClient, PlatformTokens, CreateCampaignInput, CreateAdInput, CampaignSummary, CampaignMetrics } from "./types";

const OAUTH_BASE = "https://accounts.google.com/o/oauth2/v2/auth";
const TOKEN_URL = "https://oauth2.googleapis.com/token";
const ADS_BASE = "https://googleads.googleapis.com/v18";

async function googleAdsApi(
  path: string,
  token: string,
  customerId: string,
  method = "GET",
  body?: unknown
) {
  const res = await fetch(`${ADS_BASE}/customers/${customerId}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      "developer-token": process.env.GOOGLE_ADS_DEVELOPER_TOKEN || "",
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error.message || "Google Ads API error");
  return data;
}

async function searchGoogleAds(token: string, customerId: string, query: string) {
  return googleAdsApi("/googleAds:searchStream", token, customerId, "POST", { query });
}

const OBJECTIVE_MAP: Record<string, string> = {
  awareness: "BRAND_AWARENESS",
  consideration: "WEBSITE_TRAFFIC",
  conversion: "PERFORMANCE_MAX",
};

export const googleClient: PlatformClient = {
  getAuthUrl(redirectUri: string, state: string): string {
    const params = new URLSearchParams({
      client_id: process.env.GOOGLE_ADS_CLIENT_ID || "",
      redirect_uri: redirectUri,
      response_type: "code",
      scope: "https://www.googleapis.com/auth/adwords",
      access_type: "offline",
      prompt: "consent",
      state,
    });
    return `${OAUTH_BASE}?${params}`;
  },

  async exchangeCode(code: string, redirectUri: string) {
    const res = await fetch(TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_ADS_CLIENT_ID || "",
        client_secret: process.env.GOOGLE_ADS_CLIENT_SECRET || "",
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });
    const data = await res.json();
    if (data.error) throw new Error(data.error_description || "Google OAuth error");

    // Get accessible customer IDs
    const customersRes = await fetch(`${ADS_BASE}/customers:listAccessibleCustomers`, {
      headers: {
        Authorization: `Bearer ${data.access_token}`,
        "developer-token": process.env.GOOGLE_ADS_DEVELOPER_TOKEN || "",
      },
    });
    const customers = await customersRes.json();
    const firstCustomer = customers.resourceNames?.[0]?.replace("customers/", "") || "";

    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresAt: new Date(Date.now() + (data.expires_in || 3600) * 1000),
      accountId: firstCustomer,
      accountName: `Google Ads ${firstCustomer}`,
    };
  },

  async createCampaign(tokens: PlatformTokens, accountId: string, input: CreateCampaignInput) {
    const budgetRes = await googleAdsApi("/campaignBudgets:mutate", tokens.accessToken, accountId, "POST", {
      operations: [{
        create: {
          name: `${input.name} Budget`,
          amount_micros: String(Math.round(input.budget.amount * 1_000_000)),
          delivery_method: "STANDARD",
          ...(input.budget.type === "daily"
            ? {}
            : { total_amount_micros: String(Math.round(input.budget.amount * 1_000_000)) }),
        },
      }],
    });

    const budgetResourceName = budgetRes.results?.[0]?.resourceName;

    const campaignRes = await googleAdsApi("/campaigns:mutate", tokens.accessToken, accountId, "POST", {
      operations: [{
        create: {
          name: input.name,
          advertisingChannelType: "SEARCH",
          status: "PAUSED",
          campaignBudget: budgetResourceName,
          startDate: input.startDate.replace(/-/g, ""),
          endDate: input.endDate?.replace(/-/g, ""),
        },
      }],
    });

    const campaignResourceName = campaignRes.results?.[0]?.resourceName;
    const campaignId = campaignResourceName?.split("/").pop() || "";

    return { campaignId };
  },

  async createAd(tokens: PlatformTokens, accountId: string, input: CreateAdInput) {
    // Create Ad Group first
    const adGroupRes = await googleAdsApi("/adGroups:mutate", tokens.accessToken, accountId, "POST", {
      operations: [{
        create: {
          name: input.headline,
          campaign: `customers/${accountId}/campaigns/${input.campaignId}`,
          type: "SEARCH_STANDARD",
          status: "PAUSED",
        },
      }],
    });

    const adGroupResourceName = adGroupRes.results?.[0]?.resourceName;

    // Create Responsive Search Ad
    const adRes = await googleAdsApi("/adGroupAds:mutate", tokens.accessToken, accountId, "POST", {
      operations: [{
        create: {
          adGroup: adGroupResourceName,
          status: "PAUSED",
          ad: {
            responsiveSearchAd: {
              headlines: [
                { text: input.headline, pinnedField: "HEADLINE_1" },
              ],
              descriptions: [
                { text: input.primaryText.slice(0, 90) },
                ...(input.description ? [{ text: input.description.slice(0, 90) }] : []),
              ],
            },
            finalUrls: [input.landingUrl],
          },
        },
      }],
    });

    const adId = adRes.results?.[0]?.resourceName?.split("/").pop() || "";
    return { adId };
  },

  async listCampaigns(tokens: PlatformTokens, accountId: string): Promise<CampaignSummary[]> {
    const data = await searchGoogleAds(tokens.accessToken, accountId,
      "SELECT campaign.id, campaign.name, campaign.status, campaign.campaign_budget, metrics.cost_micros FROM campaign ORDER BY campaign.id DESC LIMIT 50"
    );

    const results = data[0]?.results || [];
    return results.map((r: Record<string, Record<string, unknown>>) => ({
      id: String(r.campaign?.id),
      name: r.campaign?.name as string,
      status: (r.campaign?.status as string || "").toLowerCase(),
      spend: Number(r.metrics?.costMicros || 0) / 1_000_000,
    }));
  },

  async getMetrics(tokens: PlatformTokens, campaignId: string, accountId: string, dateRange: { start: string; end: string }): Promise<CampaignMetrics[]> {
    const data = await searchGoogleAds(tokens.accessToken, accountId,
      `SELECT segments.date, metrics.impressions, metrics.clicks, metrics.cost_micros, metrics.conversions, metrics.conversions_value FROM campaign WHERE campaign.id = ${campaignId} AND segments.date BETWEEN '${dateRange.start}' AND '${dateRange.end}' ORDER BY segments.date`
    );

    const results = data[0]?.results || [];
    return results.map((r: Record<string, Record<string, unknown>>) => ({
      date: r.segments?.date as string,
      impressions: Number(r.metrics?.impressions || 0),
      clicks: Number(r.metrics?.clicks || 0),
      spend: Number(r.metrics?.costMicros || 0) / 1_000_000,
      conversions: Number(r.metrics?.conversions || 0),
      revenue: Number(r.metrics?.conversionsValue || 0),
    }));
  },

  async refreshToken(refreshToken: string) {
    const res = await fetch(TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        refresh_token: refreshToken,
        client_id: process.env.GOOGLE_ADS_CLIENT_ID || "",
        client_secret: process.env.GOOGLE_ADS_CLIENT_SECRET || "",
        grant_type: "refresh_token",
      }),
    });
    const data = await res.json();
    return {
      accessToken: data.access_token,
      refreshToken,
      expiresAt: new Date(Date.now() + (data.expires_in || 3600) * 1000),
    };
  },
};
