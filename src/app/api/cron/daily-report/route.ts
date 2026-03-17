import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { aiCall } from "@/lib/ai-provider";
import type { ToolSchema } from "@/lib/ai-provider";

export const dynamic = "force-dynamic";

const reportTool: ToolSchema = {
  name: "generate_daily_report",
  description: "Generate a daily advertising performance report with AI analysis and recommendations",
  properties: {
    summary: {
      type: "string",
      description: "Executive summary of yesterday's performance (2-3 sentences)",
    },
    highlights: {
      type: "array",
      description: "Key highlights and notable changes",
      items: { type: "string" },
    },
    recommendations: {
      type: "array",
      description: "Actionable recommendations based on the data",
      items: { type: "string" },
    },
    risk_areas: {
      type: "array",
      description: "Areas of concern that need attention",
      items: { type: "string" },
    },
    overall_score: {
      type: "number",
      description: "Overall performance score 1-10",
    },
  },
  required: ["summary", "highlights", "recommendations", "risk_areas", "overall_score"],
};

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServiceClient();

  try {
    // Ensure reports table exists
    try {
      await supabase.rpc("exec_sql", {
        query: `
          CREATE TABLE IF NOT EXISTS reports (
            id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
            type text NOT NULL,
            date_from date NOT NULL,
            date_to date NOT NULL,
            metrics jsonb,
            ai_analysis jsonb,
            created_at timestamptz DEFAULT now()
          );
        `,
      });
    } catch {
      // Table may already exist or rpc may not be available
    }

    // Fetch yesterday's metrics
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split("T")[0];

    const { data: yesterdayMetrics } = await supabase
      .from("campaign_metrics")
      .select("*")
      .eq("date", yesterdayStr);

    // Fetch 7-day average for comparison
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 8);
    const sevenDaysAgoStr = sevenDaysAgo.toISOString().split("T")[0];

    const { data: weekMetrics } = await supabase
      .from("campaign_metrics")
      .select("*")
      .gte("date", sevenDaysAgoStr)
      .lt("date", yesterdayStr);

    // Aggregate yesterday's totals
    const yesterdayTotals = aggregateMetrics(yesterdayMetrics || []);
    const weekAvg = aggregateMetrics(weekMetrics || [], true);

    // Calculate deltas
    const deltas = {
      impressions: calcDelta(yesterdayTotals.impressions, weekAvg.impressions),
      clicks: calcDelta(yesterdayTotals.clicks, weekAvg.clicks),
      spend: calcDelta(yesterdayTotals.spend, weekAvg.spend),
      conversions: calcDelta(yesterdayTotals.conversions, weekAvg.conversions),
      revenue: calcDelta(yesterdayTotals.revenue, weekAvg.revenue),
      ctr: calcDelta(yesterdayTotals.ctr, weekAvg.ctr),
      cpc: calcDelta(yesterdayTotals.cpc, weekAvg.cpc),
      roas: calcDelta(yesterdayTotals.roas, weekAvg.roas),
    };

    // Generate AI analysis
    const prompt = `Analyze this daily ad performance report for ${yesterdayStr}.

Yesterday's metrics:
- Impressions: ${yesterdayTotals.impressions.toLocaleString()} (${deltas.impressions > 0 ? "+" : ""}${deltas.impressions.toFixed(1)}% vs 7-day avg)
- Clicks: ${yesterdayTotals.clicks.toLocaleString()} (${deltas.clicks > 0 ? "+" : ""}${deltas.clicks.toFixed(1)}%)
- Spend: $${yesterdayTotals.spend.toFixed(2)} (${deltas.spend > 0 ? "+" : ""}${deltas.spend.toFixed(1)}%)
- Conversions: ${yesterdayTotals.conversions} (${deltas.conversions > 0 ? "+" : ""}${deltas.conversions.toFixed(1)}%)
- Revenue: $${yesterdayTotals.revenue.toFixed(2)} (${deltas.revenue > 0 ? "+" : ""}${deltas.revenue.toFixed(1)}%)
- CTR: ${yesterdayTotals.ctr.toFixed(2)}% (${deltas.ctr > 0 ? "+" : ""}${deltas.ctr.toFixed(1)}%)
- CPC: $${yesterdayTotals.cpc.toFixed(2)} (${deltas.cpc > 0 ? "+" : ""}${deltas.cpc.toFixed(1)}%)
- ROAS: ${yesterdayTotals.roas.toFixed(2)}x (${deltas.roas > 0 ? "+" : ""}${deltas.roas.toFixed(1)}%)

Active campaigns: ${(yesterdayMetrics || []).length}

Provide actionable insights and recommendations.`;

    let aiAnalysis: Record<string, unknown> = {};
    try {
      aiAnalysis = await aiCall(prompt, reportTool, { temperature: 0.7 });
    } catch (aiErr) {
      console.error("AI analysis failed:", aiErr);
      aiAnalysis = {
        summary: "AI analysis unavailable. Review metrics manually.",
        highlights: [],
        recommendations: [],
        risk_areas: [],
        overall_score: 5,
      };
    }

    // Store report
    const { data: report, error: insertError } = await supabase
      .from("reports")
      .insert({
        type: "daily",
        date_from: yesterdayStr,
        date_to: yesterdayStr,
        metrics: {
          totals: yesterdayTotals,
          week_average: weekAvg,
          deltas,
          campaign_count: (yesterdayMetrics || []).length,
        },
        ai_analysis: aiAnalysis,
      })
      .select("id")
      .single();

    if (insertError) {
      console.error("Error inserting report:", insertError);
      return NextResponse.json({ error: "Failed to store report" }, { status: 500 });
    }

    return NextResponse.json({ report_id: report?.id });
  } catch (err) {
    console.error("Daily report error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

interface AggregatedMetrics {
  impressions: number;
  clicks: number;
  spend: number;
  conversions: number;
  revenue: number;
  ctr: number;
  cpc: number;
  roas: number;
}

function aggregateMetrics(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  metrics: any[],
  average = false
): AggregatedMetrics {
  if (metrics.length === 0) {
    return { impressions: 0, clicks: 0, spend: 0, conversions: 0, revenue: 0, ctr: 0, cpc: 0, roas: 0 };
  }

  const totals = metrics.reduce(
    (acc, m) => ({
      impressions: acc.impressions + (m.impressions || 0),
      clicks: acc.clicks + (m.clicks || 0),
      spend: acc.spend + (m.spend || 0),
      conversions: acc.conversions + (m.conversions || 0),
      revenue: acc.revenue + (m.revenue || 0),
    }),
    { impressions: 0, clicks: 0, spend: 0, conversions: 0, revenue: 0 }
  );

  // Get unique days for averaging
  const uniqueDays = new Set(metrics.map((m) => m.date)).size;
  const divisor = average && uniqueDays > 0 ? uniqueDays : 1;

  const imp = totals.impressions / divisor;
  const cl = totals.clicks / divisor;
  const sp = totals.spend / divisor;
  const conv = totals.conversions / divisor;
  const rev = totals.revenue / divisor;

  return {
    impressions: imp,
    clicks: cl,
    spend: sp,
    conversions: conv,
    revenue: rev,
    ctr: imp > 0 ? (cl / imp) * 100 : 0,
    cpc: cl > 0 ? sp / cl : 0,
    roas: sp > 0 ? rev / sp : 0,
  };
}

function calcDelta(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
}
