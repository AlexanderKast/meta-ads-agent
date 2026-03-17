import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const now = new Date();
  const defaultStart = new Date(now);
  defaultStart.setDate(defaultStart.getDate() - 30);

  const startDate = searchParams.get("startDate") || defaultStart.toISOString().split("T")[0];
  const endDate = searchParams.get("endDate") || now.toISOString().split("T")[0];

  const supabase = await createClient();

  // Fetch campaign_metrics joined with campaign_mappings to get platform
  const { data: rows, error } = await supabase
    .from("campaign_metrics")
    .select(`
      date,
      spend,
      impressions,
      clicks,
      conversions,
      revenue,
      campaign_mappings!inner (
        platform
      )
    `)
    .gte("date", startDate)
    .lte("date", endDate)
    .order("date", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!rows || rows.length === 0) {
    return NextResponse.json({
      byPlatform: [],
      daily: [],
      totals: {
        spend: 0,
        impressions: 0,
        clicks: 0,
        conversions: 0,
        revenue: 0,
        ctr: 0,
        cpc: 0,
        cpm: 0,
        roas: 0,
      },
    });
  }

  // Aggregate by platform
  const platformAgg: Record<
    string,
    { spend: number; impressions: number; clicks: number; conversions: number; revenue: number }
  > = {};

  // Daily breakdown
  const dailyMap: Record<string, Record<string, { spend: number; impressions: number; clicks: number; conversions: number; revenue: number }>> = {};

  for (const row of rows) {
    const mapping = row.campaign_mappings as unknown as { platform: string };
    const platform = mapping.platform;
    const spend = Number(row.spend) || 0;
    const impressions = Number(row.impressions) || 0;
    const clicks = Number(row.clicks) || 0;
    const conversions = Number(row.conversions) || 0;
    const revenue = Number(row.revenue) || 0;

    // Platform aggregation
    if (!platformAgg[platform]) {
      platformAgg[platform] = { spend: 0, impressions: 0, clicks: 0, conversions: 0, revenue: 0 };
    }
    platformAgg[platform].spend += spend;
    platformAgg[platform].impressions += impressions;
    platformAgg[platform].clicks += clicks;
    platformAgg[platform].conversions += conversions;
    platformAgg[platform].revenue += revenue;

    // Daily aggregation
    const date = row.date as string;
    if (!dailyMap[date]) dailyMap[date] = {};
    if (!dailyMap[date][platform]) {
      dailyMap[date][platform] = { spend: 0, impressions: 0, clicks: 0, conversions: 0, revenue: 0 };
    }
    dailyMap[date][platform].spend += spend;
    dailyMap[date][platform].impressions += impressions;
    dailyMap[date][platform].clicks += clicks;
    dailyMap[date][platform].conversions += conversions;
    dailyMap[date][platform].revenue += revenue;
  }

  const allPlatforms = Object.keys(platformAgg);

  // Build byPlatform with derived metrics
  const byPlatform = allPlatforms.map((platform) => {
    const p = platformAgg[platform];
    return {
      platform,
      spend: p.spend,
      impressions: p.impressions,
      clicks: p.clicks,
      conversions: p.conversions,
      revenue: p.revenue,
      ctr: p.impressions > 0 ? (p.clicks / p.impressions) * 100 : 0,
      cpc: p.clicks > 0 ? p.spend / p.clicks : 0,
      cpm: p.impressions > 0 ? (p.spend / p.impressions) * 1000 : 0,
      roas: p.spend > 0 ? p.revenue / p.spend : 0,
    };
  });

  // Build daily array with platform-prefixed keys
  const sortedDates = Object.keys(dailyMap).sort();
  const daily = sortedDates.map((date) => {
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

  // Totals
  const totalSpend = byPlatform.reduce((s, p) => s + p.spend, 0);
  const totalImpressions = byPlatform.reduce((s, p) => s + p.impressions, 0);
  const totalClicks = byPlatform.reduce((s, p) => s + p.clicks, 0);
  const totalConversions = byPlatform.reduce((s, p) => s + p.conversions, 0);
  const totalRevenue = byPlatform.reduce((s, p) => s + p.revenue, 0);

  const totals = {
    spend: totalSpend,
    impressions: totalImpressions,
    clicks: totalClicks,
    conversions: totalConversions,
    revenue: totalRevenue,
    ctr: totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0,
    cpc: totalClicks > 0 ? totalSpend / totalClicks : 0,
    cpm: totalImpressions > 0 ? (totalSpend / totalImpressions) * 1000 : 0,
    roas: totalSpend > 0 ? totalRevenue / totalSpend : 0,
  };

  return NextResponse.json({ byPlatform, daily, totals });
}
