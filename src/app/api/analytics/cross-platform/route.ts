import { NextRequest, NextResponse } from "next/server";
import { getSupabase, getUserId } from "@/lib/auth-helper";
import { decryptToken } from "@/lib/platforms/token-manager";
import { getAccountInsights } from "@/lib/platforms/meta";

export const dynamic = "force-dynamic";

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

  // Get ONE account only
  let query = supabase.from("connected_accounts").select("*").eq("user_id", userId).eq("is_active", true).eq("platform", "meta");
  if (accountId) query = query.eq("id", accountId);
  const { data: accounts } = await query.limit(1);

  if (!accounts || accounts.length === 0) return NextResponse.json(emptyResponse);

  const account = accounts[0];

  try {
    const token = decryptToken(account.access_token);

    // ONE single API call
    const insights = await getAccountInsights(token, account.platform_account_id, { start: startDate, end: endDate });

    if (insights.length === 0) return NextResponse.json(emptyResponse);

    const platform = "meta";
    let totalSpend = 0, totalImpressions = 0, totalClicks = 0, totalConversions = 0, totalRevenue = 0;

    const daily = insights.map((row: { date: string; spend: number; impressions: number; clicks: number; conversions: number; revenue: number }) => {
      totalSpend += row.spend;
      totalImpressions += row.impressions;
      totalClicks += row.clicks;
      totalConversions += row.conversions;
      totalRevenue += row.revenue;

      return {
        date: row.date,
        [`${platform}_spend`]: row.spend,
        [`${platform}_impressions`]: row.impressions,
        [`${platform}_clicks`]: row.clicks,
        [`${platform}_ctr`]: row.impressions > 0 ? Number(((row.clicks / row.impressions) * 100).toFixed(2)) : 0,
        [`${platform}_cpc`]: row.clicks > 0 ? Number((row.spend / row.clicks).toFixed(2)) : 0,
        [`${platform}_roas`]: row.spend > 0 ? Number((row.revenue / row.spend).toFixed(2)) : 0,
      };
    });

    return NextResponse.json({
      byPlatform: [{
        platform, spend: totalSpend, impressions: totalImpressions, clicks: totalClicks,
        conversions: totalConversions, revenue: totalRevenue,
        ctr: totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0,
        cpc: totalClicks > 0 ? totalSpend / totalClicks : 0,
        cpm: totalImpressions > 0 ? (totalSpend / totalImpressions) * 1000 : 0,
        roas: totalSpend > 0 ? totalRevenue / totalSpend : 0,
      }],
      daily,
      totals: {
        spend: totalSpend, impressions: totalImpressions, clicks: totalClicks,
        conversions: totalConversions, revenue: totalRevenue,
        ctr: totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0,
        cpc: totalClicks > 0 ? totalSpend / totalClicks : 0,
        cpm: totalImpressions > 0 ? (totalSpend / totalImpressions) * 1000 : 0,
        roas: totalSpend > 0 ? totalRevenue / totalSpend : 0,
      },
    });
  } catch (err) {
    console.error("Analytics error:", err);
    return NextResponse.json(emptyResponse);
  }
}
