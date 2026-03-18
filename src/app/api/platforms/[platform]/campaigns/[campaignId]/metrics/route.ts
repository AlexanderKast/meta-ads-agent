import { NextRequest } from "next/server";
import { getPlatformClient, isSupportedPlatform } from "@/lib/platforms";
import { decryptToken } from "@/lib/platforms/token-manager";
import { getSupabase, getUserId } from "@/lib/auth-helper";
import type { CampaignMetrics } from "@/lib/platforms/types";

/** Resolve period string to { start, end } ISO date strings and the previous period */
function resolvePeriod(period: string | null, startDate: string | null, endDate: string | null) {
  const now = new Date();
  let end: Date;
  let start: Date;

  if (period === "7d" || period === "30d" || period === "90d") {
    const days = parseInt(period);
    end = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    start = new Date(end);
    start.setDate(start.getDate() - days);
  } else if (startDate && endDate) {
    start = new Date(startDate);
    end = new Date(endDate);
  } else {
    // Default to 30d
    end = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    start = new Date(end);
    start.setDate(start.getDate() - 30);
  }

  const diffMs = end.getTime() - start.getTime();
  const prevEnd = new Date(start);
  prevEnd.setDate(prevEnd.getDate() - 1);
  const prevStart = new Date(prevEnd.getTime() - diffMs);

  const fmt = (d: Date) => d.toISOString().slice(0, 10);

  return {
    current: { start: fmt(start), end: fmt(end) },
    previous: { start: fmt(prevStart), end: fmt(prevEnd) },
  };
}

/** Sum an array of daily metrics into totals, then compute derived fields */
function computeTotals(rows: CampaignMetrics[]) {
  const sum = (fn: (r: CampaignMetrics) => number) => rows.reduce((s, r) => s + fn(r), 0);

  const spend = sum(r => r.spend);
  const revenue = sum(r => r.revenue);
  const impressions = sum(r => r.impressions);
  const reach = sum(r => r.reach);
  const clicks = sum(r => r.clicks);
  const uniqueClicks = sum(r => r.uniqueClicks);
  const linkClicks = sum(r => r.linkClicks);
  const conversions = sum(r => r.conversions);
  const videoViews = sum(r => r.videoViews);

  const profit = revenue - spend;
  const frequency = reach > 0 ? impressions / reach : 0;
  const ctr = impressions > 0 ? (clicks / impressions) * 100 : 0;
  const uniqueCtr = reach > 0 ? (uniqueClicks / reach) * 100 : 0;
  const cpc = clicks > 0 ? spend / clicks : 0;
  const cpm = impressions > 0 ? (spend / impressions) * 1000 : 0;
  const conversionRate = clicks > 0 ? (conversions / clicks) * 100 : 0;
  const costPerConversion = conversions > 0 ? spend / conversions : 0;
  const roas = spend > 0 ? revenue / spend : 0;
  const roi = spend > 0 ? ((revenue - spend) / spend) * 100 : 0;

  return {
    spend, revenue, profit, impressions, reach, frequency,
    clicks, uniqueClicks, linkClicks,
    ctr, uniqueCtr, cpc, cpm,
    conversions, conversionRate, costPerConversion,
    roas, roi, videoViews,
  };
}

/** Build sparkline arrays (one value per day) for key metrics */
function buildSparklines(rows: CampaignMetrics[]) {
  return {
    spend: rows.map(r => r.spend),
    impressions: rows.map(r => r.impressions),
    clicks: rows.map(r => r.clicks),
    conversions: rows.map(r => r.conversions),
    revenue: rows.map(r => r.revenue),
    ctr: rows.map(r => (r.impressions > 0 ? (r.clicks / r.impressions) * 100 : 0)),
    roas: rows.map(r => (r.spend > 0 ? r.revenue / r.spend : 0)),
  };
}

/** Build daily summary rows */
function buildDaily(rows: CampaignMetrics[]) {
  return rows.map(r => ({
    date: r.date,
    spend: r.spend,
    revenue: r.revenue,
    impressions: r.impressions,
    reach: r.reach,
    clicks: r.clicks,
    conversions: r.conversions,
    ctr: r.impressions > 0 ? (r.clicks / r.impressions) * 100 : 0,
    cpc: r.clicks > 0 ? r.spend / r.clicks : 0,
    cpm: r.impressions > 0 ? (r.spend / r.impressions) * 1000 : 0,
    roas: r.spend > 0 ? r.revenue / r.spend : 0,
  }));
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ platform: string; campaignId: string }> }
) {
  const { platform, campaignId } = await params;
  if (!isSupportedPlatform(platform)) return Response.json({ error: "Plataforma no soportada" }, { status: 400 });

  const supabase = getSupabase();
  const userId = getUserId();

  const searchParams = request.nextUrl.searchParams;
  const period = searchParams.get("period");
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");

  const { current, previous } = resolvePeriod(period, startDate, endDate);

  const { data: mapping } = await supabase
    .from("campaign_mappings")
    .select("*, connected_accounts(*)")
    .eq("id", campaignId)
    .eq("user_id", userId)
    .single();

  if (!mapping) return Response.json({ error: "Campana no encontrada" }, { status: 404 });

  const account = mapping.connected_accounts;
  if (!account) return Response.json({ error: "Cuenta no encontrada" }, { status: 404 });

  try {
    const client = getPlatformClient(platform);
    const token = decryptToken(account.access_token);

    // Fetch current and previous period in parallel
    const [metrics, prevMetrics] = await Promise.all([
      client.getMetrics(
        { accessToken: token },
        mapping.platform_campaign_id,
        account.platform_account_id,
        current
      ),
      client.getMetrics(
        { accessToken: token },
        mapping.platform_campaign_id,
        account.platform_account_id,
        previous
      ),
    ]);

    // Upsert current period metrics to DB
    for (const m of metrics) {
      await supabase.from("campaign_metrics").upsert({
        campaign_mapping_id: campaignId,
        date: m.date,
        impressions: m.impressions,
        clicks: m.clicks,
        spend: m.spend,
        conversions: m.conversions,
        revenue: m.revenue,
        ctr: m.impressions > 0 ? m.clicks / m.impressions : 0,
        cpc: m.clicks > 0 ? m.spend / m.clicks : 0,
        cpm: m.impressions > 0 ? (m.spend / m.impressions) * 1000 : 0,
        roas: m.spend > 0 ? m.revenue / m.spend : 0,
      }, { onConflict: "campaign_mapping_id,date" });
    }

    await supabase.from("campaign_mappings").update({ last_synced_at: new Date().toISOString() }).eq("id", campaignId);

    // Build campaign info
    const campaign = {
      id: campaignId,
      name: mapping.campaign_name || mapping.platform_campaign_id,
      status: mapping.status || "unknown",
      objective: mapping.objective || "",
      budget: mapping.budget || 0,
      platform,
    };

    const totals = computeTotals(metrics);
    const prevTotals = computeTotals(prevMetrics);
    const daily = buildDaily(metrics);
    const sparklines = buildSparklines(metrics);

    return Response.json({ campaign, totals, prevTotals, daily, sparklines });
  } catch (err) {
    return Response.json({ error: err instanceof Error ? err.message : "Error al obtener metricas" }, { status: 500 });
  }
}
