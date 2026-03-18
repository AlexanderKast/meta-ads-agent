import { NextRequest, NextResponse } from "next/server";
import { getSupabase, getUserId } from "@/lib/auth-helper";
import { decryptToken } from "@/lib/platforms/token-manager";
import { getAccountInsights } from "@/lib/platforms/meta";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const supabase = getSupabase();
  const userId = getUserId();

  const now = new Date();
  const defaultStart = new Date(now);
  defaultStart.setDate(defaultStart.getDate() - 30);

  const startDate = searchParams.get("startDate") || defaultStart.toISOString().split("T")[0];
  const endDate = searchParams.get("endDate") || now.toISOString().split("T")[0];
  const accountId = searchParams.get("accountId");

  const emptyResponse = {
    byPlatform: [],
    daily: [],
    totals: { spend: 0, impressions: 0, clicks: 0, conversions: 0, revenue: 0, ctr: 0, cpc: 0, cpm: 0, roas: 0 },
  };

  let query = supabase.from("connected_accounts").select("*").eq("user_id", userId).eq("is_active", true);
  if (accountId) {
    query = query.eq("id", accountId);
  } else {
    query = query.limit(10);
  }
  const { data: rawAccounts } = await query;

  if (!rawAccounts || rawAccounts.length === 0) return NextResponse.json(emptyResponse);

  // Deduplicate: one account per platform
  const seen = new Set<string>();
  const accounts = accountId ? rawAccounts : rawAccounts.filter(a => {
    if (seen.has(a.platform)) return false;
    seen.add(a.platform);
    return true;
  });

  // Fetch account-level insights per platform
  const platformAgg: Record<string, { spend: number; impressions: number; clicks: number; conversions: number; revenue: number }> = {};
  const dailyMap: Record<string, Record<string, { spend: number; impressions: number; clicks: number; conversions: number; revenue: number }>> = {};

  for (const account of accounts) {
    if (account.platform !== "meta") continue;
    try {
      const token = decryptToken(account.access_token);
      const insights = await getAccountInsights(token, account.platform_account_id, { start: startDate, end: endDate });

      const platform = account.platform;
      if (!platformAgg[platform]) platformAgg[platform] = { spend: 0, impressions: 0, clicks: 0, conversions: 0, revenue: 0 };

      for (const row of insights) {
        platformAgg[platform].spend += row.spend;
        platformAgg[platform].impressions += row.impressions;
        platformAgg[platform].clicks += row.clicks;
        platformAgg[platform].conversions += row.conversions;
        platformAgg[platform].revenue += row.revenue;

        if (!dailyMap[row.date]) dailyMap[row.date] = {};
        if (!dailyMap[row.date][platform]) dailyMap[row.date][platform] = { spend: 0, impressions: 0, clicks: 0, conversions: 0, revenue: 0 };
        dailyMap[row.date][platform].spend += row.spend;
        dailyMap[row.date][platform].impressions += row.impressions;
        dailyMap[row.date][platform].clicks += row.clicks;
        dailyMap[row.date][platform].conversions += row.conversions;
        dailyMap[row.date][platform].revenue += row.revenue;
      }
    } catch (err) {
      console.error(`Analytics error for ${account.account_name}:`, err);
    }
  }

  const allPlatforms = Object.keys(platformAgg);
  if (allPlatforms.length === 0) return NextResponse.json(emptyResponse);

  const byPlatform = allPlatforms.map(platform => {
    const p = platformAgg[platform];
    return {
      platform, spend: p.spend, impressions: p.impressions, clicks: p.clicks, conversions: p.conversions, revenue: p.revenue,
      ctr: p.impressions > 0 ? (p.clicks / p.impressions) * 100 : 0,
      cpc: p.clicks > 0 ? p.spend / p.clicks : 0,
      cpm: p.impressions > 0 ? (p.spend / p.impressions) * 1000 : 0,
      roas: p.spend > 0 ? p.revenue / p.spend : 0,
    };
  });

  const sortedDates = Object.keys(dailyMap).sort();
  const daily = sortedDates.map(date => {
    const entry: Record<string, string | number> = { date };
    for (const platform of allPlatforms) {
      const d = dailyMap[date]?.[platform] || { spend: 0, impressions: 0, clicks: 0, conversions: 0, revenue: 0 };
      entry[`${platform}_spend`] = d.spend;
      entry[`${platform}_impressions`] = d.impressions;
      entry[`${platform}_clicks`] = d.clicks;
      entry[`${platform}_ctr`] = d.impressions > 0 ? Number(((d.clicks / d.impressions) * 100).toFixed(2)) : 0;
      entry[`${platform}_cpc`] = d.clicks > 0 ? Number((d.spend / d.clicks).toFixed(2)) : 0;
      entry[`${platform}_roas`] = d.spend > 0 ? Number((d.revenue / d.spend).toFixed(2)) : 0;
    }
    return entry;
  });

  const totalSpend = byPlatform.reduce((s, p) => s + p.spend, 0);
  const totalImpressions = byPlatform.reduce((s, p) => s + p.impressions, 0);
  const totalClicks = byPlatform.reduce((s, p) => s + p.clicks, 0);
  const totalConversions = byPlatform.reduce((s, p) => s + p.conversions, 0);
  const totalRevenue = byPlatform.reduce((s, p) => s + p.revenue, 0);

  return NextResponse.json({
    byPlatform,
    daily,
    totals: {
      spend: totalSpend, impressions: totalImpressions, clicks: totalClicks, conversions: totalConversions, revenue: totalRevenue,
      ctr: totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0,
      cpc: totalClicks > 0 ? totalSpend / totalClicks : 0,
      cpm: totalImpressions > 0 ? (totalSpend / totalImpressions) * 1000 : 0,
      roas: totalSpend > 0 ? totalRevenue / totalSpend : 0,
    },
  });
}
