import { NextRequest, NextResponse } from "next/server";
import { getSupabase, getUserId } from "@/lib/auth-helper";
import { decryptToken } from "@/lib/platforms/token-manager";
import { getAccountInsights, getCampaignsWithInsights } from "@/lib/platforms/meta";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

export async function GET(request: NextRequest) {
  const supabase = getSupabase();
  const userId = getUserId();
  const { searchParams } = new URL(request.url);

  const now = new Date();
  const daysBack = parseInt(searchParams.get("days") || "30");
  const endDate = searchParams.get("endDate") || now.toISOString().split("T")[0];
  const startDate = searchParams.get("startDate") || new Date(now.getTime() - daysBack * 86400000).toISOString().split("T")[0];
  const accountId = searchParams.get("accountId");

  // Previous period for deltas
  const periodMs = new Date(endDate).getTime() - new Date(startDate).getTime();
  const prevStartDate = new Date(new Date(startDate).getTime() - periodMs).toISOString().split("T")[0];
  const prevEndDate = startDate;

  const emptyKpis = { spend: 0, impressions: 0, clicks: 0, ctr: 0, cpc: 0, conversions: 0, roas: 0,
    prevSpend: 0, prevImpressions: 0, prevClicks: 0, prevCtr: 0, prevCpc: 0, prevConversions: 0, prevRoas: 0 };

  // Get connected accounts - limit scope to avoid timeout
  let query = supabase.from("connected_accounts").select("*").eq("user_id", userId).eq("is_active", true);
  if (accountId) {
    query = query.eq("id", accountId);
  } else {
    // Without filter: only get first account per platform to avoid 138 accounts × 3 API calls
    query = query.limit(10);
  }
  const { data: rawAccounts } = await query;

  if (!rawAccounts || rawAccounts.length === 0) {
    return NextResponse.json({ kpis: emptyKpis, daily: [], byPlatform: [], topCampaigns: [] });
  }

  // Deduplicate: one account per platform (first one = primary)
  const seen = new Set<string>();
  const accounts = accountId ? rawAccounts : rawAccounts.filter(a => {
    if (seen.has(a.platform)) return false;
    seen.add(a.platform);
    return true;
  });

  // Aggregate across all accounts
  interface DailyRow { date: string; impressions: number; clicks: number; spend: number; conversions: number; revenue: number; }
  const allDaily: DailyRow[] = [];
  const allPrevDaily: DailyRow[] = [];
  const allCampaigns: { name: string; platform: string; spend: number; impressions: number; clicks: number; conversions: number; revenue: number; status: string }[] = [];
  const platformSpend: Record<string, { platform: string; spend: number; impressions: number }> = {};

  for (const account of accounts) {
    if (account.platform !== "meta") continue; // Only Meta for now
    try {
      const token = decryptToken(account.access_token);

      // 1. Account-level daily insights (ONE call)
      const [daily, prevDaily, campaigns] = await Promise.all([
        getAccountInsights(token, account.platform_account_id, { start: startDate, end: endDate }),
        getAccountInsights(token, account.platform_account_id, { start: prevStartDate, end: prevEndDate }),
        getCampaignsWithInsights(token, account.platform_account_id, { start: startDate, end: endDate }),
      ]);

      allDaily.push(...daily);
      allPrevDaily.push(...prevDaily);

      for (const c of campaigns) {
        allCampaigns.push({ ...c, platform: account.platform, status: c.status });
      }

      // Platform aggregation
      const totalSpend = daily.reduce((s: number, d: { spend: number }) => s + d.spend, 0);
      const totalImpr = daily.reduce((s: number, d: { impressions: number }) => s + d.impressions, 0);
      if (!platformSpend[account.platform]) platformSpend[account.platform] = { platform: account.platform, spend: 0, impressions: 0 };
      platformSpend[account.platform].spend += totalSpend;
      platformSpend[account.platform].impressions += totalImpr;
    } catch (err) {
      console.error(`Dashboard error for ${account.account_name}:`, err);
    }
  }

  // Aggregate KPIs
  const agg = aggregate(allDaily);
  const prevAgg = aggregate(allPrevDaily);

  // Daily breakdown (merge by date)
  const dailyMap = new Map<string, { date: string; spend: number; impressions: number; clicks: number }>();
  for (const r of allDaily) {
    const e = dailyMap.get(r.date) || { date: r.date, spend: 0, impressions: 0, clicks: 0 };
    e.spend += r.spend; e.impressions += r.impressions; e.clicks += r.clicks;
    dailyMap.set(r.date, e);
  }
  const daily = Array.from(dailyMap.values()).sort((a, b) => a.date.localeCompare(b.date));

  // Top campaigns by spend
  const topCampaigns = allCampaigns
    .filter(c => c.spend > 0)
    .sort((a, b) => b.spend - a.spend)
    .slice(0, 10)
    .map(c => ({
      name: c.name,
      platform: c.platform,
      spend: c.spend,
      roas: c.spend > 0 ? c.revenue / c.spend : 0,
      status: c.status,
    }));

  return NextResponse.json({
    kpis: {
      spend: agg.spend, impressions: agg.impressions, clicks: agg.clicks,
      ctr: agg.impressions > 0 ? (agg.clicks / agg.impressions) * 100 : 0,
      cpc: agg.clicks > 0 ? agg.spend / agg.clicks : 0,
      conversions: agg.conversions, roas: agg.spend > 0 ? agg.revenue / agg.spend : 0,
      prevSpend: prevAgg.spend, prevImpressions: prevAgg.impressions, prevClicks: prevAgg.clicks,
      prevCtr: prevAgg.impressions > 0 ? (prevAgg.clicks / prevAgg.impressions) * 100 : 0,
      prevCpc: prevAgg.clicks > 0 ? prevAgg.spend / prevAgg.clicks : 0,
      prevConversions: prevAgg.conversions, prevRoas: prevAgg.spend > 0 ? prevAgg.revenue / prevAgg.spend : 0,
    },
    daily,
    byPlatform: Object.values(platformSpend),
    topCampaigns,
  });
}

function aggregate(rows: { spend: number; impressions: number; clicks: number; conversions: number; revenue: number }[]) {
  let spend = 0, impressions = 0, clicks = 0, conversions = 0, revenue = 0;
  for (const r of rows) { spend += r.spend; impressions += r.impressions; clicks += r.clicks; conversions += r.conversions; revenue += r.revenue; }
  return { spend, impressions, clicks, conversions, revenue };
}
