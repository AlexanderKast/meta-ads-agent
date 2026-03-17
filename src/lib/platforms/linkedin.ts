import type { PlatformClient, PlatformTokens, CreateCampaignInput, CreateAdInput, CampaignSummary, CampaignMetrics } from "./types";

const OAUTH_BASE = "https://www.linkedin.com/oauth/v2";
const API_BASE = "https://api.linkedin.com/rest";

async function linkedinApi(path: string, token: string, method = "GET", body?: Record<string, unknown>) {
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "X-Restli-Protocol-Version": "2.0.0",
      "LinkedIn-Version": "202401",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json();
  if (data.status && data.status >= 400) throw new Error(data.message || "LinkedIn API error");
  return data;
}

const OBJECTIVE_MAP: Record<string, string> = {
  awareness: "BRAND_AWARENESS",
  consideration: "WEBSITE_VISITS",
  conversion: "LEAD_GENERATION",
};

export const linkedinClient: PlatformClient = {
  getAuthUrl(redirectUri: string, state: string): string {
    const params = new URLSearchParams({
      response_type: "code",
      client_id: process.env.LINKEDIN_CLIENT_ID || "",
      redirect_uri: redirectUri,
      state,
      scope: "r_ads rw_ads r_ads_reporting r_organization_admin",
    });
    return `${OAUTH_BASE}/authorization?${params}`;
  },

  async exchangeCode(code: string, redirectUri: string) {
    const res = await fetch(`${OAUTH_BASE}/accessToken`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: redirectUri,
        client_id: process.env.LINKEDIN_CLIENT_ID || "",
        client_secret: process.env.LINKEDIN_CLIENT_SECRET || "",
      }),
    });
    const data = await res.json();
    if (data.error) throw new Error(data.error_description || "LinkedIn OAuth error");

    // Get ad accounts
    const accounts = await linkedinApi("/adAccounts?q=search&search=(status:(values:List(ACTIVE)))", data.access_token);
    const first = accounts.elements?.[0];
    const accountId = first ? String(first.id) : "";

    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresAt: new Date(Date.now() + (data.expires_in || 5184000) * 1000),
      accountId,
      accountName: first?.name || `LinkedIn Ads ${accountId}`,
    };
  },

  async createCampaign(tokens: PlatformTokens, accountId: string, input: CreateCampaignInput) {
    // Create Campaign Group
    const group = await linkedinApi("/adCampaignGroups", tokens.accessToken, "POST", {
      account: `urn:li:sponsoredAccount:${accountId}`,
      name: input.name,
      status: "DRAFT",
      runSchedule: {
        start: new Date(input.startDate).getTime(),
        end: input.endDate ? new Date(input.endDate).getTime() : undefined,
      },
      totalBudget: input.budget.type === "lifetime" ? { amount: String(input.budget.amount), currencyCode: input.budget.currency } : undefined,
    });

    const groupId = group.id || group.elements?.[0]?.id;

    // Create Campaign
    const campaign = await linkedinApi("/adCampaigns", tokens.accessToken, "POST", {
      account: `urn:li:sponsoredAccount:${accountId}`,
      campaignGroup: `urn:li:sponsoredCampaignGroup:${groupId}`,
      name: `${input.name} - Campaign`,
      type: "SPONSORED_UPDATES",
      objectiveType: OBJECTIVE_MAP[input.objective] || "WEBSITE_VISITS",
      status: "DRAFT",
      costType: "CPM",
      dailyBudget: input.budget.type === "daily" ? { amount: String(input.budget.amount), currencyCode: input.budget.currency } : undefined,
    });

    return { campaignId: String(campaign.id || campaign.elements?.[0]?.id) };
  },

  async createAd(tokens: PlatformTokens, _accountId: string, input: CreateAdInput) {
    const creative = await linkedinApi("/adCreatives", tokens.accessToken, "POST", {
      campaign: `urn:li:sponsoredCampaign:${input.campaignId}`,
      status: "DRAFT",
      intendedStatus: "ACTIVE",
      content: {
        singleImage: {
          commentary: input.primaryText,
          headline: input.headline,
          description: input.description,
          ctaLabel: input.cta.toUpperCase().replace(/\s+/g, "_"),
          landingPageUrl: input.landingUrl,
        },
      },
    });

    return { adId: String(creative.id || "") };
  },

  async listCampaigns(tokens: PlatformTokens, accountId: string): Promise<CampaignSummary[]> {
    const data = await linkedinApi(`/adCampaigns?q=search&search=(account:(values:List(urn:li:sponsoredAccount:${accountId})))&count=50`, tokens.accessToken);
    return (data.elements || []).map((c: Record<string, unknown>) => ({
      id: String(c.id),
      name: c.name as string,
      status: (c.status as string || "").toLowerCase(),
      objective: c.objectiveType as string,
    }));
  },

  async getMetrics(tokens: PlatformTokens, campaignId: string, _accountId: string, dateRange: { start: string; end: string }): Promise<CampaignMetrics[]> {
    const data = await linkedinApi(
      `/adAnalytics?q=analytics&pivot=CAMPAIGN&dateRange=(start:(year:${dateRange.start.split("-")[0]},month:${Number(dateRange.start.split("-")[1])},day:${Number(dateRange.start.split("-")[2])}),end:(year:${dateRange.end.split("-")[0]},month:${Number(dateRange.end.split("-")[1])},day:${Number(dateRange.end.split("-")[2])}))&timeGranularity=DAILY&campaigns=List(urn:li:sponsoredCampaign:${campaignId})&fields=impressions,clicks,costInLocalCurrency,externalWebsiteConversions`,
      tokens.accessToken
    );

    return (data.elements || []).map((d: Record<string, unknown>) => {
      const dr = d.dateRange as Record<string, Record<string, number>>;
      return {
        date: `${dr?.start?.year}-${String(dr?.start?.month).padStart(2, "0")}-${String(dr?.start?.day).padStart(2, "0")}`,
        impressions: Number(d.impressions || 0),
        clicks: Number(d.clicks || 0),
        spend: Number(d.costInLocalCurrency || 0),
        conversions: Number(d.externalWebsiteConversions || 0),
        revenue: 0,
      };
    });
  },

  async refreshToken(refreshToken: string) {
    const res = await fetch(`${OAUTH_BASE}/accessToken`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: refreshToken,
        client_id: process.env.LINKEDIN_CLIENT_ID || "",
        client_secret: process.env.LINKEDIN_CLIENT_SECRET || "",
      }),
    });
    const data = await res.json();
    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token || refreshToken,
      expiresAt: new Date(Date.now() + (data.expires_in || 5184000) * 1000),
    };
  },
};
