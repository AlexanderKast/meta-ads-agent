import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";

export const dynamic = "force-dynamic";

interface MetricRow {
  campaign_id: string;
  platform: string;
  date: string;
  impressions: number;
  clicks: number;
  spend: number;
  conversions: number;
  revenue: number;
  cpc: number;
  ctr: number;
  roas: number;
  budget?: number;
}

interface Alert {
  campaign_id: string;
  platform: string;
  type: "warning" | "critical";
  rule: string;
  message: string;
  metric_value: number;
  threshold_value: number;
  created_at: string;
}

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServiceClient();
  const alerts: Alert[] = [];
  const now = new Date();

  try {
    // Ensure alerts table exists
    try {
      await supabase.rpc("exec_sql", {
        query: `
          CREATE TABLE IF NOT EXISTS alerts (
            id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
            campaign_id text NOT NULL,
            platform text NOT NULL,
            type text NOT NULL,
            rule text NOT NULL,
            message text NOT NULL,
            metric_value numeric,
            threshold_value numeric,
            resolved boolean DEFAULT false,
            created_at timestamptz DEFAULT now()
          );
        `,
      });
    } catch {
      // Table may already exist or rpc may not be available - that's fine
    }

    // Fetch last 24h metrics
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split("T")[0];

    const { data: recentMetrics } = await supabase
      .from("campaign_metrics")
      .select("*")
      .gte("date", yesterdayStr) as { data: MetricRow[] | null };

    // Fetch 7-day average metrics for comparison
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const sevenDaysAgoStr = sevenDaysAgo.toISOString().split("T")[0];

    const { data: weekMetrics } = await supabase
      .from("campaign_metrics")
      .select("*")
      .gte("date", sevenDaysAgoStr)
      .lt("date", yesterdayStr) as { data: MetricRow[] | null };

    if (!recentMetrics || recentMetrics.length === 0) {
      return NextResponse.json({ alerts_created: 0, message: "No recent metrics" });
    }

    // Group 7-day metrics by campaign for averages
    const avgByCampaign: Record<string, { cpc: number; ctr: number; roas: number; impressions: number; days: number }> = {};

    for (const m of weekMetrics || []) {
      if (!avgByCampaign[m.campaign_id]) {
        avgByCampaign[m.campaign_id] = { cpc: 0, ctr: 0, roas: 0, impressions: 0, days: 0 };
      }
      const agg = avgByCampaign[m.campaign_id];
      agg.cpc += m.cpc || 0;
      agg.ctr += m.ctr || 0;
      agg.roas += m.roas || 0;
      agg.impressions += m.impressions || 0;
      agg.days += 1;
    }

    // Compute averages
    for (const key of Object.keys(avgByCampaign)) {
      const agg = avgByCampaign[key];
      if (agg.days > 0) {
        agg.cpc /= agg.days;
        agg.ctr /= agg.days;
        agg.roas /= agg.days;
        agg.impressions /= agg.days;
      }
    }

    // Check each recent metric against rules
    for (const m of recentMetrics) {
      const avg = avgByCampaign[m.campaign_id];
      const timestamp = now.toISOString();

      // Rule 1: CPC > 2x average
      if (avg && avg.cpc > 0 && m.cpc > avg.cpc * 2) {
        alerts.push({
          campaign_id: m.campaign_id,
          platform: m.platform,
          type: "warning",
          rule: "cpc_spike",
          message: `CPC ($${m.cpc.toFixed(2)}) is more than 2x the 7-day average ($${avg.cpc.toFixed(2)})`,
          metric_value: m.cpc,
          threshold_value: avg.cpc * 2,
          created_at: timestamp,
        });
      }

      // Rule 2: CTR < 0.3%
      if (m.impressions > 0 && m.ctr < 0.3) {
        alerts.push({
          campaign_id: m.campaign_id,
          platform: m.platform,
          type: "warning",
          rule: "low_ctr",
          message: `CTR (${m.ctr.toFixed(2)}%) is below 0.3% threshold`,
          metric_value: m.ctr,
          threshold_value: 0.3,
          created_at: timestamp,
        });
      }

      // Rule 3: 0 impressions in 24h
      if (m.impressions === 0) {
        alerts.push({
          campaign_id: m.campaign_id,
          platform: m.platform,
          type: "critical",
          rule: "zero_impressions",
          message: "Campaign received 0 impressions in the last 24 hours",
          metric_value: 0,
          threshold_value: 1,
          created_at: timestamp,
        });
      }

      // Rule 4: Budget > 90% spent
      if (m.budget && m.budget > 0 && m.spend > m.budget * 0.9) {
        alerts.push({
          campaign_id: m.campaign_id,
          platform: m.platform,
          type: "warning",
          rule: "budget_exhaustion",
          message: `Budget ${((m.spend / m.budget) * 100).toFixed(0)}% spent ($${m.spend.toFixed(2)} of $${m.budget.toFixed(2)})`,
          metric_value: m.spend,
          threshold_value: m.budget * 0.9,
          created_at: timestamp,
        });
      }
    }

    // Rule 5: ROAS < 1x for 3+ consecutive days
    const threeDaysAgo = new Date(now);
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    const threeDaysAgoStr = threeDaysAgo.toISOString().split("T")[0];

    const { data: threeDay } = await supabase
      .from("campaign_metrics")
      .select("campaign_id, platform, roas, date")
      .gte("date", threeDaysAgoStr) as { data: Array<{ campaign_id: string; platform: string; roas: number; date: string }> | null };

    if (threeDay) {
      const roasByCampaign: Record<string, { platform: string; belowCount: number; totalDays: number; avgRoas: number }> = {};
      for (const row of threeDay) {
        if (!roasByCampaign[row.campaign_id]) {
          roasByCampaign[row.campaign_id] = { platform: row.platform, belowCount: 0, totalDays: 0, avgRoas: 0 };
        }
        const agg = roasByCampaign[row.campaign_id];
        agg.totalDays++;
        agg.avgRoas += row.roas || 0;
        if ((row.roas || 0) < 1) agg.belowCount++;
      }

      for (const [campaignId, agg] of Object.entries(roasByCampaign)) {
        if (agg.belowCount >= 3) {
          const avgRoas = agg.totalDays > 0 ? agg.avgRoas / agg.totalDays : 0;
          alerts.push({
            campaign_id: campaignId,
            platform: agg.platform,
            type: "critical",
            rule: "low_roas",
            message: `ROAS below 1.0x for 3+ consecutive days (avg: ${avgRoas.toFixed(2)}x)`,
            metric_value: avgRoas,
            threshold_value: 1,
            created_at: now.toISOString(),
          });
        }
      }
    }

    // Insert alerts
    if (alerts.length > 0) {
      const { error: insertError } = await supabase
        .from("alerts")
        .insert(alerts);

      if (insertError) {
        console.error("Error inserting alerts:", insertError);
      }
    }
  } catch (err) {
    console.error("Check alerts error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }

  return NextResponse.json({ alerts_created: alerts.length });
}
