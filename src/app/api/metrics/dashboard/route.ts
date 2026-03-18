import { NextRequest, NextResponse } from "next/server";
import { getSupabase, getUserId } from "@/lib/auth-helper";
import { decryptToken } from "@/lib/platforms/token-manager";
import { getAccountInsights, getCampaignsWithInsights } from "@/lib/platforms/meta";

export const dynamic = "force-dynamic";

const emptyKpis = {
  spend: 0, revenue: 0, profit: 0, impressions: 0, reach: 0, frequency: 0,
  clicks: 0, uniqueClicks: 0, linkClicks: 0,
  ctr: 0, uniqueCtr: 0, linkCtr: 0,
  cpc: 0, cpm: 0, costPerResult: 0, costPerConversion: 0,
  conversions: 0, conversionRate: 0,
  roas: 0, roi: 0,
  videoViews: 0,
  prevSpend: 0, prevRevenue: 0, prevProfit: 0, prevImpressions: 0, prevReach: 0, prevFrequency: 0,
  prevClicks: 0, prevUniqueClicks: 0, prevLinkClicks: 0,
  prevCtr: 0, prevUniqueCtr: 0, prevLinkCtr: 0,
  prevCpc: 0, prevCpm: 0, prevCostPerResult: 0, prevCostPerConversion: 0,
  prevConversions: 0, prevConversionRate: 0,
  prevRoas: 0, prevRoi: 0,
  prevVideoViews: 0,
};

/** Compute derived KPIs from raw totals */
function computeDerived(totals: {
  spend: number; revenue: number; impressions: number; reach: number;
  clicks: number; uniqueClicks: number; linkClicks: number;
  conversions: number; videoViews: number;
}) {
  const { spend, revenue, impressions, reach, clicks, uniqueClicks, linkClicks, conversions, videoViews } = totals;
  return {
    spend, revenue, impressions, reach, clicks, uniqueClicks, linkClicks, conversions, videoViews,
    profit: revenue - spend,
    frequency: reach > 0 ? impressions / reach : 0,
    ctr: impressions > 0 ? (clicks / impressions) * 100 : 0,
    uniqueCtr: impressions > 0 ? (uniqueClicks / impressions) * 100 : 0,
    linkCtr: impressions > 0 ? (linkClicks / impressions) * 100 : 0,
    cpc: clicks > 0 ? spend / clicks : 0,
    cpm: impressions > 0 ? (spend / impressions) * 1000 : 0,
    costPerConversion: conversions > 0 ? spend / conversions : 0,
    costPerResult: (conversions || clicks) > 0 ? spend / (conversions || clicks) : 0,
    conversionRate: clicks > 0 ? (conversions / clicks) * 100 : 0,
    roas: spend > 0 ? revenue / spend : 0,
    roi: spend > 0 ? ((revenue - spend) / spend) * 100 : 0,
  };
}

export async function GET(request: NextRequest) {
  const supabase = getSupabase();
  const userId = getUserId();
  const { searchParams } = new URL(request.url);

  const now = new Date();
  const daysBack = parseInt(searchParams.get("days") || "30");
  const endDate = searchParams.get("endDate") || now.toISOString().split("T")[0];
  const startDate = searchParams.get("startDate") || new Date(now.getTime() - daysBack * 86400000).toISOString().split("T")[0];
  const accountId = searchParams.get("accountId");

  // Previous period for comparison (same duration, immediately before)
  const periodMs = daysBack * 86400000;
  const prevEndDate = new Date(new Date(startDate).getTime() - 86400000).toISOString().split("T")[0];
  const prevStartDate = new Date(new Date(startDate).getTime() - periodMs).toISOString().split("T")[0];

  // Get accounts - one specific or all active Meta accounts
  let query = supabase.from("connected_accounts").select("*").eq("user_id", userId).eq("is_active", true).eq("platform", "meta");
  if (accountId) query = query.eq("id", accountId);
  const { data: accounts } = await query;

  if (!accounts || accounts.length === 0) {
    return NextResponse.json({ kpis: emptyKpis, daily: [], byPlatform: [], topCampaigns: [], sparklines: {} });
  }

  // Aggregate data across all matched accounts
  type DailyRow = {
    date: string; spend: number; impressions: number; reach: number; clicks: number;
    conversions: number; revenue: number; cpc: number; cpm: number; ctr: number; roas: number;
  };
  const dailyMap = new Map<string, DailyRow>();

  // Current period totals
  let totalSpend = 0, totalImpressions = 0, totalReach = 0, totalClicks = 0;
  let totalUniqueClicks = 0, totalLinkClicks = 0;
  let totalConversions = 0, totalRevenue = 0, totalVideoViews = 0;

  // Previous period totals
  let prevSpend = 0, prevImpressions = 0, prevReach = 0, prevClicks = 0;
  let prevUniqueClicks = 0, prevLinkClicks = 0;
  let prevConversions = 0, prevRevenue = 0, prevVideoViews = 0;

  const allCampaigns: Array<{
    id: string; name: string; status: string; objective: string;
    budget: number; spend: number; impressions: number; clicks: number;
    conversions: number; revenue: number; ctr: number; cpc: number;
    linkClicks: number; uniqueClicks: number; videoViews: number;
    platform: string;
  }> = [];
  const platformSpend: Record<string, { spend: number; impressions: number }> = {};

  for (const account of accounts) {
    try {
      const token = decryptToken(account.access_token);
      const platform = account.platform || "meta";

      // Current period daily insights
      const daily = await getAccountInsights(token, account.platform_account_id, { start: startDate, end: endDate });

      let accountSpend = 0, accountImpressions = 0;
      for (const r of daily) {
        totalSpend += r.spend;
        totalImpressions += r.impressions;
        totalReach += r.reach;
        totalClicks += r.clicks;
        totalUniqueClicks += r.uniqueClicks;
        totalLinkClicks += r.linkClicks;
        totalConversions += r.conversions;
        totalRevenue += r.revenue;
        totalVideoViews += r.videoViews;
        accountSpend += r.spend;
        accountImpressions += r.impressions;

        const existing = dailyMap.get(r.date);
        if (existing) {
          existing.spend += r.spend;
          existing.impressions += r.impressions;
          existing.reach += r.reach;
          existing.clicks += r.clicks;
          existing.conversions += r.conversions;
          existing.revenue += r.revenue;
        } else {
          dailyMap.set(r.date, {
            date: r.date, spend: r.spend, impressions: r.impressions, reach: r.reach,
            clicks: r.clicks, conversions: r.conversions, revenue: r.revenue,
            cpc: 0, cpm: 0, ctr: 0, roas: 0,
          });
        }
      }

      // Previous period insights
      try {
        const prevDaily = await getAccountInsights(token, account.platform_account_id, { start: prevStartDate, end: prevEndDate });
        for (const r of prevDaily) {
          prevSpend += r.spend;
          prevImpressions += r.impressions;
          prevReach += r.reach;
          prevClicks += r.clicks;
          prevUniqueClicks += r.uniqueClicks;
          prevLinkClicks += r.linkClicks;
          prevConversions += r.conversions;
          prevRevenue += r.revenue;
          prevVideoViews += r.videoViews;
        }
      } catch {
        // Previous period may fail if account is too new - that's OK
      }

      // Top campaigns
      try {
        const campaigns = await getCampaignsWithInsights(token, account.platform_account_id, { start: startDate, end: endDate });
        for (const c of campaigns) {
          allCampaigns.push({
            id: c.id,
            name: c.name,
            status: c.status,
            objective: c.objective,
            budget: c.budget,
            spend: c.spend,
            impressions: c.impressions,
            clicks: c.clicks,
            conversions: c.conversions,
            revenue: c.revenue,
            ctr: c.ctr,
            cpc: c.cpc,
            linkClicks: c.linkClicks,
            uniqueClicks: c.uniqueClicks,
            videoViews: c.videoViews,
            platform,
          });
        }
      } catch {
        // Campaign data is optional
      }

      // Platform spend
      if (!platformSpend[platform]) platformSpend[platform] = { spend: 0, impressions: 0 };
      platformSpend[platform].spend += accountSpend;
      platformSpend[platform].impressions += accountImpressions;
    } catch (err) {
      console.error(`Dashboard error for account ${account.id}:`, err);
      // Continue with other accounts
    }
  }

  // Build daily chart sorted by date, with derived daily metrics
  const dailyChart = Array.from(dailyMap.values())
    .sort((a, b) => a.date.localeCompare(b.date))
    .map(d => ({
      ...d,
      cpc: d.clicks > 0 ? d.spend / d.clicks : 0,
      cpm: d.impressions > 0 ? (d.spend / d.impressions) * 1000 : 0,
      ctr: d.impressions > 0 ? (d.clicks / d.impressions) * 100 : 0,
      roas: d.spend > 0 ? d.revenue / d.spend : 0,
    }));

  // Compute KPIs for current period
  const currentDerived = computeDerived({
    spend: totalSpend, revenue: totalRevenue, impressions: totalImpressions, reach: totalReach,
    clicks: totalClicks, uniqueClicks: totalUniqueClicks, linkClicks: totalLinkClicks,
    conversions: totalConversions, videoViews: totalVideoViews,
  });

  // Compute KPIs for previous period
  const prevDerived = computeDerived({
    spend: prevSpend, revenue: prevRevenue, impressions: prevImpressions, reach: prevReach,
    clicks: prevClicks, uniqueClicks: prevUniqueClicks, linkClicks: prevLinkClicks,
    conversions: prevConversions, videoViews: prevVideoViews,
  });

  // Build sparklines from last 7 days of daily data
  const last7 = dailyChart.slice(-7);
  const sparklines: Record<string, number[]> = {
    spend: last7.map(d => d.spend),
    impressions: last7.map(d => d.impressions),
    clicks: last7.map(d => d.clicks),
    conversions: last7.map(d => d.conversions),
    revenue: last7.map(d => d.revenue),
    cpc: last7.map(d => d.cpc),
    cpm: last7.map(d => d.cpm),
    ctr: last7.map(d => d.ctr),
    roas: last7.map(d => d.roas),
    reach: last7.map(d => d.reach),
  };

  // Top campaigns sorted by ROAS, top 10
  const topCampaigns = allCampaigns
    .filter(c => c.spend > 0)
    .map(c => ({
      name: c.name,
      platform: c.platform,
      status: c.status,
      objective: c.objective,
      spend: c.spend,
      revenue: c.revenue,
      roas: c.spend > 0 ? c.revenue / c.spend : 0,
      ctr: c.ctr,
      cpc: c.cpc,
      conversions: c.conversions,
      impressions: c.impressions,
      clicks: c.clicks,
    }))
    .sort((a, b) => b.roas - a.roas)
    .slice(0, 10);

  // Platform breakdown
  const byPlatform = Object.entries(platformSpend).map(([platform, data]) => ({
    platform,
    spend: data.spend,
    impressions: data.impressions,
  }));

  return NextResponse.json({
    kpis: {
      ...currentDerived,
      prevSpend: prevDerived.spend,
      prevRevenue: prevDerived.revenue,
      prevProfit: prevDerived.profit,
      prevImpressions: prevDerived.impressions,
      prevReach: prevDerived.reach,
      prevFrequency: prevDerived.frequency,
      prevClicks: prevDerived.clicks,
      prevUniqueClicks: prevDerived.uniqueClicks,
      prevLinkClicks: prevDerived.linkClicks,
      prevCtr: prevDerived.ctr,
      prevUniqueCtr: prevDerived.uniqueCtr,
      prevLinkCtr: prevDerived.linkCtr,
      prevCpc: prevDerived.cpc,
      prevCpm: prevDerived.cpm,
      prevCostPerResult: prevDerived.costPerResult,
      prevCostPerConversion: prevDerived.costPerConversion,
      prevConversions: prevDerived.conversions,
      prevConversionRate: prevDerived.conversionRate,
      prevRoas: prevDerived.roas,
      prevRoi: prevDerived.roi,
      prevVideoViews: prevDerived.videoViews,
    },
    daily: dailyChart,
    byPlatform: byPlatform.length > 0 ? byPlatform : [{ platform: "meta", spend: totalSpend, impressions: totalImpressions }],
    topCampaigns,
    sparklines,
  });
}
