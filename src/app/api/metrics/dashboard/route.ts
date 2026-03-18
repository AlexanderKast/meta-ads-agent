import { NextRequest, NextResponse } from "next/server";
import { getSupabase, getUserId } from "@/lib/auth-helper";
import { decryptToken } from "@/lib/platforms/token-manager";
import { getAccountInsights, getCampaignsWithInsights } from "@/lib/platforms/meta";

export const dynamic = "force-dynamic";

const emptyKpis = {
  spend: 0, impressions: 0, clicks: 0, ctr: 0, cpc: 0, conversions: 0, roas: 0,
  prevSpend: 0, prevImpressions: 0, prevClicks: 0, prevCtr: 0, prevCpc: 0, prevConversions: 0, prevRoas: 0,
};

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
    return NextResponse.json({ kpis: emptyKpis, daily: [], byPlatform: [], topCampaigns: [] });
  }

  // Aggregate data across all matched accounts
  const dailyMap = new Map<string, { date: string; spend: number; impressions: number; clicks: number }>();
  let totalSpend = 0, totalImpressions = 0, totalClicks = 0, totalConversions = 0, totalRevenue = 0;
  let prevSpend = 0, prevImpressions = 0, prevClicks = 0, prevConversions = 0, prevRevenue = 0;
  const allCampaigns: Array<{
    id: string; name: string; status: string; objective: string;
    budget: number; spend: number; impressions: number; clicks: number;
    conversions: number; revenue: number; platform: string;
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
        totalClicks += r.clicks;
        totalConversions += r.conversions;
        totalRevenue += r.revenue;
        accountSpend += r.spend;
        accountImpressions += r.impressions;

        const existing = dailyMap.get(r.date);
        if (existing) {
          existing.spend += r.spend;
          existing.impressions += r.impressions;
          existing.clicks += r.clicks;
        } else {
          dailyMap.set(r.date, { date: r.date, spend: r.spend, impressions: r.impressions, clicks: r.clicks });
        }
      }

      // Previous period insights (aggregated, not daily)
      try {
        const prevDaily = await getAccountInsights(token, account.platform_account_id, { start: prevStartDate, end: prevEndDate });
        for (const r of prevDaily) {
          prevSpend += r.spend;
          prevImpressions += r.impressions;
          prevClicks += r.clicks;
          prevConversions += r.conversions;
          prevRevenue += r.revenue;
        }
      } catch {
        // Previous period may fail if account is too new - that's OK
      }

      // Top campaigns
      try {
        const campaigns = await getCampaignsWithInsights(token, account.platform_account_id, { start: startDate, end: endDate });
        for (const c of campaigns) {
          allCampaigns.push({ ...c, platform });
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

  // Build daily chart sorted by date
  const dailyChart = Array.from(dailyMap.values()).sort((a, b) => a.date.localeCompare(b.date));

  // Compute derived KPIs
  const ctr = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;
  const cpc = totalClicks > 0 ? totalSpend / totalClicks : 0;
  const roas = totalSpend > 0 ? totalRevenue / totalSpend : 0;
  const prevCtr = prevImpressions > 0 ? (prevClicks / prevImpressions) * 100 : 0;
  const prevCpc = prevClicks > 0 ? prevSpend / prevClicks : 0;
  const prevRoas = prevSpend > 0 ? prevRevenue / prevSpend : 0;

  // Top campaigns sorted by ROAS (revenue/spend), top 5
  const topCampaigns = allCampaigns
    .filter(c => c.spend > 0)
    .map(c => ({
      name: c.name,
      platform: c.platform,
      spend: c.spend,
      roas: c.spend > 0 ? c.revenue / c.spend : 0,
      status: c.status,
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
      spend: totalSpend, impressions: totalImpressions, clicks: totalClicks,
      ctr, cpc, conversions: totalConversions, roas,
      prevSpend, prevImpressions, prevClicks,
      prevCtr, prevCpc, prevConversions, prevRoas,
    },
    daily: dailyChart,
    byPlatform: byPlatform.length > 0 ? byPlatform : [{ platform: "meta", spend: totalSpend, impressions: totalImpressions }],
    topCampaigns,
  });
}
