import { NextRequest, NextResponse } from "next/server";
import { getSupabase, getUserId } from "@/lib/auth-helper";
import { decryptToken } from "@/lib/platforms/token-manager";
import { getAccountInsights } from "@/lib/platforms/meta";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const supabase = getSupabase();
  const userId = getUserId();
  const { searchParams } = new URL(request.url);

  const now = new Date();
  const daysBack = parseInt(searchParams.get("days") || "30");
  const endDate = searchParams.get("endDate") || now.toISOString().split("T")[0];
  const startDate = searchParams.get("startDate") || new Date(now.getTime() - daysBack * 86400000).toISOString().split("T")[0];
  const accountId = searchParams.get("accountId");

  const emptyKpis = { spend: 0, impressions: 0, clicks: 0, ctr: 0, cpc: 0, conversions: 0, roas: 0,
    prevSpend: 0, prevImpressions: 0, prevClicks: 0, prevCtr: 0, prevCpc: 0, prevConversions: 0, prevRoas: 0 };

  // Get ONE account only
  let query = supabase.from("connected_accounts").select("*").eq("user_id", userId).eq("is_active", true).eq("platform", "meta");
  if (accountId) query = query.eq("id", accountId);
  const { data: accounts } = await query.limit(1);

  if (!accounts || accounts.length === 0) {
    return NextResponse.json({ kpis: emptyKpis, daily: [], byPlatform: [], topCampaigns: [] });
  }

  const account = accounts[0];

  try {
    const token = decryptToken(account.access_token);

    // ONE single API call - account-level daily insights
    const daily = await getAccountInsights(token, account.platform_account_id, { start: startDate, end: endDate });

    // Aggregate KPIs from daily data
    let spend = 0, impressions = 0, clicks = 0, conversions = 0, revenue = 0;
    for (const r of daily) {
      spend += r.spend; impressions += r.impressions; clicks += r.clicks;
      conversions += r.conversions; revenue += r.revenue;
    }

    const dailyChart = daily.map((d: { date: string; spend: number; impressions: number; clicks: number }) => ({
      date: d.date, spend: d.spend, impressions: d.impressions, clicks: d.clicks,
    }));

    return NextResponse.json({
      kpis: {
        spend, impressions, clicks,
        ctr: impressions > 0 ? (clicks / impressions) * 100 : 0,
        cpc: clicks > 0 ? spend / clicks : 0,
        conversions, roas: spend > 0 ? revenue / spend : 0,
        // No prev period (would require 2nd API call) - set to 0
        prevSpend: 0, prevImpressions: 0, prevClicks: 0, prevCtr: 0, prevCpc: 0, prevConversions: 0, prevRoas: 0,
      },
      daily: dailyChart,
      byPlatform: [{ platform: "meta", spend, impressions }],
      topCampaigns: [],
    });
  } catch (err) {
    console.error("Dashboard error:", err);
    return NextResponse.json({ kpis: emptyKpis, daily: [], byPlatform: [], topCampaigns: [] });
  }
}
