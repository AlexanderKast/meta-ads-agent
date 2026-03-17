import { NextRequest, NextResponse } from "next/server";
import { getSupabase, getUserId } from "@/lib/auth-helper";
import { getPlatformClient, isSupportedPlatform } from "@/lib/platforms";
import { decryptToken } from "@/lib/platforms/token-manager";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

export async function GET(request: NextRequest) {
  const supabase = getSupabase();
  const userId = getUserId();
  const { searchParams } = new URL(request.url);

  const now = new Date();
  const endDate = searchParams.get("endDate") || now.toISOString().split("T")[0];
  const daysBack = parseInt(searchParams.get("days") || "30");
  const startDate =
    searchParams.get("startDate") ||
    new Date(now.getTime() - daysBack * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
  const accountId = searchParams.get("accountId");

  // Calculate previous period for deltas
  const startMs = new Date(startDate).getTime();
  const endMs = new Date(endDate).getTime();
  const periodMs = endMs - startMs;
  const prevStartDate = new Date(startMs - periodMs).toISOString().split("T")[0];
  const prevEndDate = startDate;

  // Get connected accounts
  let query = supabase
    .from("connected_accounts")
    .select("*")
    .eq("user_id", userId)
    .eq("is_active", true);

  if (accountId) query = query.eq("id", accountId);

  const { data: accounts } = await query;

  if (!accounts || accounts.length === 0) {
    return NextResponse.json({
      kpis: {
        spend: 0, impressions: 0, clicks: 0, ctr: 0, cpc: 0, conversions: 0, roas: 0,
        prevSpend: 0, prevImpressions: 0, prevClicks: 0, prevCtr: 0, prevCpc: 0, prevConversions: 0, prevRoas: 0,
      },
      daily: [],
      byPlatform: [],
      topCampaigns: [],
    });
  }

  // Fetch metrics from all connected accounts via platform APIs
  interface MetricRow {
    date: string;
    impressions: number;
    clicks: number;
    spend: number;
    conversions: number;
    revenue: number;
    campaignName: string;
    platform: string;
  }
  const allMetrics: MetricRow[] = [];
  const allPrevMetrics: MetricRow[] = [];

  for (const account of accounts) {
    if (!isSupportedPlatform(account.platform)) continue;
    try {
      const client = getPlatformClient(account.platform);
      const token = decryptToken(account.access_token);
      const tokens = { accessToken: token };

      // List campaigns - this already returns spend from Meta insights
      const campaigns = await client.listCampaigns(tokens, account.platform_account_id);

      // Only fetch detailed metrics for active campaigns with spend, limit to top 20
      const activeCampaigns = campaigns
        .filter((c) => c.status === "active" || c.status === "paused")
        .sort((a, b) => (Number(b.spend) || 0) - (Number(a.spend) || 0))
        .slice(0, 20);

      // Fetch metrics in parallel (batches of 5 to avoid rate limits)
      const BATCH_SIZE = 5;
      for (let i = 0; i < activeCampaigns.length; i += BATCH_SIZE) {
        const batch = activeCampaigns.slice(i, i + BATCH_SIZE);
        const results = await Promise.allSettled(
          batch.map(async (campaign) => {
            const [metrics, prevMetrics] = await Promise.all([
              client.getMetrics(tokens, campaign.id, account.platform_account_id, {
                start: startDate,
                end: endDate,
              }),
              client.getMetrics(tokens, campaign.id, account.platform_account_id, {
                start: prevStartDate,
                end: prevEndDate,
              }),
            ]);
            return { campaign, metrics, prevMetrics };
          })
        );

        for (const result of results) {
          if (result.status !== "fulfilled") continue;
          const { campaign, metrics, prevMetrics } = result.value;
          for (const m of metrics) {
            allMetrics.push({ ...m, campaignName: campaign.name, platform: account.platform });
          }
          for (const m of prevMetrics) {
            allPrevMetrics.push({ ...m, campaignName: campaign.name, platform: account.platform });
          }
        }
      }

      // Also include campaigns we didn't fetch detailed metrics for (use listCampaigns spend)
      const detailedIds = new Set(activeCampaigns.map((c) => c.id));
      for (const campaign of campaigns) {
        if (detailedIds.has(campaign.id)) continue;
        if (Number(campaign.spend) > 0) {
          allMetrics.push({
            date: endDate,
            impressions: 0,
            clicks: 0,
            spend: Number(campaign.spend) || 0,
            conversions: 0,
            revenue: 0,
            campaignName: campaign.name,
            platform: account.platform,
          });
        }
      }
    } catch (err) {
      console.error(`Dashboard: error fetching ${account.platform} ${account.account_name}:`, err);
    }
  }

  // Aggregate KPIs
  const agg = aggregate(allMetrics);
  const prevAgg = aggregate(allPrevMetrics);

  // Daily breakdown
  const dailyMap = new Map<string, { date: string; spend: number; impressions: number; clicks: number }>();
  for (const r of allMetrics) {
    const existing = dailyMap.get(r.date) || { date: r.date, spend: 0, impressions: 0, clicks: 0 };
    existing.spend += r.spend;
    existing.impressions += r.impressions;
    existing.clicks += r.clicks;
    dailyMap.set(r.date, existing);
  }
  const daily = Array.from(dailyMap.values()).sort((a, b) => a.date.localeCompare(b.date));

  // By platform
  const platMap = new Map<string, { platform: string; spend: number; impressions: number }>();
  for (const r of allMetrics) {
    const existing = platMap.get(r.platform) || { platform: r.platform, spend: 0, impressions: 0 };
    existing.spend += r.spend;
    existing.impressions += r.impressions;
    platMap.set(r.platform, existing);
  }
  const byPlatform = Array.from(platMap.values());

  // Top campaigns by spend
  const campMap = new Map<string, { name: string; platform: string; spend: number; revenue: number }>();
  for (const r of allMetrics) {
    const existing = campMap.get(r.campaignName) || {
      name: r.campaignName,
      platform: r.platform,
      spend: 0,
      revenue: 0,
    };
    existing.spend += r.spend;
    existing.revenue += r.revenue;
    campMap.set(r.campaignName, existing);
  }
  const topCampaigns = Array.from(campMap.values())
    .map((c) => ({
      name: c.name,
      platform: c.platform,
      spend: c.spend,
      roas: c.spend > 0 ? c.revenue / c.spend : 0,
      status: "active",
    }))
    .sort((a, b) => b.spend - a.spend)
    .slice(0, 10);

  return NextResponse.json({
    kpis: {
      spend: agg.spend,
      impressions: agg.impressions,
      clicks: agg.clicks,
      ctr: agg.impressions > 0 ? (agg.clicks / agg.impressions) * 100 : 0,
      cpc: agg.clicks > 0 ? agg.spend / agg.clicks : 0,
      conversions: agg.conversions,
      roas: agg.spend > 0 ? agg.revenue / agg.spend : 0,
      prevSpend: prevAgg.spend,
      prevImpressions: prevAgg.impressions,
      prevClicks: prevAgg.clicks,
      prevCtr: prevAgg.impressions > 0 ? (prevAgg.clicks / prevAgg.impressions) * 100 : 0,
      prevCpc: prevAgg.clicks > 0 ? prevAgg.spend / prevAgg.clicks : 0,
      prevConversions: prevAgg.conversions,
      prevRoas: prevAgg.spend > 0 ? prevAgg.revenue / prevAgg.spend : 0,
    },
    daily,
    byPlatform,
    topCampaigns,
    meta: {
      accounts: accounts.length,
      totalCampaigns: campMap.size,
      period: { start: startDate, end: endDate },
    },
  });
}

function aggregate(rows: { spend: number; impressions: number; clicks: number; conversions: number; revenue: number }[]) {
  let spend = 0,
    impressions = 0,
    clicks = 0,
    conversions = 0,
    revenue = 0;
  for (const r of rows) {
    spend += r.spend;
    impressions += r.impressions;
    clicks += r.clicks;
    conversions += r.conversions;
    revenue += r.revenue;
  }
  return { spend, impressions, clicks, conversions, revenue };
}
