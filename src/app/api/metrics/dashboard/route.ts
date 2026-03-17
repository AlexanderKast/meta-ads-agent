import { NextRequest, NextResponse } from "next/server";
import { getSupabase, getUserId } from "@/lib/auth-helper";

export async function GET(request: NextRequest) {
  const supabase = getSupabase();
  const { searchParams } = new URL(request.url);

  const now = new Date();
  const endDate = searchParams.get("endDate") || now.toISOString().split("T")[0];
  const startDate =
    searchParams.get("startDate") ||
    new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

  const accountId = searchParams.get("accountId");

  // Calculate previous period for deltas
  const startMs = new Date(startDate).getTime();
  const endMs = new Date(endDate).getTime();
  const periodMs = endMs - startMs;
  const prevStartDate = new Date(startMs - periodMs).toISOString().split("T")[0];
  const prevEndDate = startDate;

  // If filtering by account, get relevant mapping IDs
  let mappingIds: string[] | null = null;
  if (accountId) {
    const { data: mappings } = await supabase
      .from("campaign_mappings")
      .select("id")
      .eq("connected_account_id", accountId);
    mappingIds = (mappings || []).map((m: { id: string }) => m.id);
  }

  if (mappingIds !== null && mappingIds.length === 0) {
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

  // Current period metrics
  let currentQuery = supabase
    .from("campaign_metrics")
    .select("*, campaign_mappings(campaign_name, platform, status)")
    .gte("date", startDate)
    .lte("date", endDate);

  if (mappingIds !== null) {
    currentQuery = currentQuery.in("campaign_mapping_id", mappingIds);
  }

  const { data: currentMetrics } = await currentQuery;

  // Previous period metrics
  let prevQuery = supabase
    .from("campaign_metrics")
    .select("*")
    .gte("date", prevStartDate)
    .lt("date", prevEndDate);

  if (mappingIds !== null) {
    prevQuery = prevQuery.in("campaign_mapping_id", mappingIds);
  }

  const { data: prevMetrics } = await prevQuery;

  const rows = currentMetrics || [];
  const prevRows = prevMetrics || [];

  // Aggregate KPIs
  const agg = aggregate(rows);
  const prevAgg = aggregate(prevRows);

  // Daily breakdown
  const dailyMap = new Map<string, { date: string; spend: number; impressions: number; clicks: number }>();
  for (const r of rows) {
    const d = r.date as string;
    const existing = dailyMap.get(d) || { date: d, spend: 0, impressions: 0, clicks: 0 };
    existing.spend += Number(r.spend) || 0;
    existing.impressions += Number(r.impressions) || 0;
    existing.clicks += Number(r.clicks) || 0;
    dailyMap.set(d, existing);
  }
  const daily = Array.from(dailyMap.values()).sort((a, b) => a.date.localeCompare(b.date));

  // By platform
  const platMap = new Map<string, { platform: string; spend: number; impressions: number }>();
  for (const r of rows) {
    const mapping = r.campaign_mappings as { campaign_name: string; platform: string; status: string } | null;
    const platform = mapping?.platform || "unknown";
    const existing = platMap.get(platform) || { platform, spend: 0, impressions: 0 };
    existing.spend += Number(r.spend) || 0;
    existing.impressions += Number(r.impressions) || 0;
    platMap.set(platform, existing);
  }
  const byPlatform = Array.from(platMap.values());

  // Top campaigns by ROAS
  const campMap = new Map<string, { name: string; platform: string; spend: number; revenue: number; status: string }>();
  for (const r of rows) {
    const mapping = r.campaign_mappings as { campaign_name: string; platform: string; status: string } | null;
    const name = mapping?.campaign_name || "Unknown";
    const platform = mapping?.platform || "unknown";
    const status = mapping?.status || "active";
    const existing = campMap.get(name) || { name, platform, spend: 0, revenue: 0, status };
    existing.spend += Number(r.spend) || 0;
    existing.revenue += Number(r.revenue) || 0;
    campMap.set(name, existing);
  }
  const topCampaigns = Array.from(campMap.values())
    .map((c) => ({
      name: c.name,
      platform: c.platform,
      spend: c.spend,
      roas: c.spend > 0 ? c.revenue / c.spend : 0,
      status: c.status,
    }))
    .sort((a, b) => b.roas - a.roas)
    .slice(0, 5);

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
  });
}

function aggregate(rows: Record<string, unknown>[]) {
  let spend = 0;
  let impressions = 0;
  let clicks = 0;
  let conversions = 0;
  let revenue = 0;
  for (const r of rows) {
    spend += Number(r.spend) || 0;
    impressions += Number(r.impressions) || 0;
    clicks += Number(r.clicks) || 0;
    conversions += Number(r.conversions) || 0;
    revenue += Number(r.revenue) || 0;
  }
  return { spend, impressions, clicks, conversions, revenue };
}
