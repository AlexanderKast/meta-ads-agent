import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { aiCall } from "@/lib/ai-provider";
import type { ToolSchema } from "@/lib/ai-provider";

export const dynamic = "force-dynamic";

const reportTool: ToolSchema = {
  name: "generate_weekly_report",
  description: "Generate a weekly advertising performance report with AI analysis, trends, and strategic recommendations",
  properties: {
    summary: {
      type: "string",
      description: "Executive summary of this week's performance (3-4 sentences)",
    },
    platform_breakdown: {
      type: "array",
      description: "Performance analysis per platform",
      items: {
        type: "object",
        properties: {
          platform: { type: "string" },
          assessment: { type: "string" },
        },
      },
    },
    trends: {
      type: "array",
      description: "Key trends observed over the week",
      items: { type: "string" },
    },
    recommendations: {
      type: "array",
      description: "Strategic recommendations for next week",
      items: { type: "string" },
    },
    budget_advice: {
      type: "string",
      description: "Budget allocation advice based on platform performance",
    },
    overall_score: {
      type: "number",
      description: "Overall weekly performance score 1-10",
    },
  },
  required: ["summary", "platform_breakdown", "trends", "recommendations", "budget_advice", "overall_score"],
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

    const today = new Date();

    // This week: last 7 days
    const thisWeekEnd = new Date(today);
    thisWeekEnd.setDate(thisWeekEnd.getDate() - 1);
    const thisWeekStart = new Date(today);
    thisWeekStart.setDate(thisWeekStart.getDate() - 7);

    // Previous week: 8-14 days ago
    const prevWeekEnd = new Date(today);
    prevWeekEnd.setDate(prevWeekEnd.getDate() - 8);
    const prevWeekStart = new Date(today);
    prevWeekStart.setDate(prevWeekStart.getDate() - 14);

    const thisWeekStartStr = thisWeekStart.toISOString().split("T")[0];
    const thisWeekEndStr = thisWeekEnd.toISOString().split("T")[0];
    const prevWeekStartStr = prevWeekStart.toISOString().split("T")[0];
    const prevWeekEndStr = prevWeekEnd.toISOString().split("T")[0];

    // Fetch this week's metrics
    const { data: thisWeekMetrics } = await supabase
      .from("campaign_metrics")
      .select("*")
      .gte("date", thisWeekStartStr)
      .lte("date", thisWeekEndStr);

    // Fetch previous week's metrics
    const { data: prevWeekMetrics } = await supabase
      .from("campaign_metrics")
      .select("*")
      .gte("date", prevWeekStartStr)
      .lte("date", prevWeekEndStr);

    // Aggregate by platform for this week
    const thisWeekByPlatform = aggregateByPlatform(thisWeekMetrics || []);
    const prevWeekByPlatform = aggregateByPlatform(prevWeekMetrics || []);

    // Overall totals
    const thisWeekTotals = aggregateAll(thisWeekMetrics || []);
    const prevWeekTotals = aggregateAll(prevWeekMetrics || []);

    const overallDeltas = {
      impressions: calcDelta(thisWeekTotals.impressions, prevWeekTotals.impressions),
      clicks: calcDelta(thisWeekTotals.clicks, prevWeekTotals.clicks),
      spend: calcDelta(thisWeekTotals.spend, prevWeekTotals.spend),
      conversions: calcDelta(thisWeekTotals.conversions, prevWeekTotals.conversions),
      revenue: calcDelta(thisWeekTotals.revenue, prevWeekTotals.revenue),
      ctr: calcDelta(thisWeekTotals.ctr, prevWeekTotals.ctr),
      cpc: calcDelta(thisWeekTotals.cpc, prevWeekTotals.cpc),
      roas: calcDelta(thisWeekTotals.roas, prevWeekTotals.roas),
    };

    // Build platform breakdown for prompt
    const platformLines = Object.entries(thisWeekByPlatform)
      .map(([platform, metrics]) => {
        const prev = prevWeekByPlatform[platform];
        const spendDelta = prev ? calcDelta(metrics.spend, prev.spend) : 0;
        const roasDelta = prev ? calcDelta(metrics.roas, prev.roas) : 0;
        return `- ${platform}: Spend $${metrics.spend.toFixed(2)} (${spendDelta > 0 ? "+" : ""}${spendDelta.toFixed(1)}%), ROAS ${metrics.roas.toFixed(2)}x (${roasDelta > 0 ? "+" : ""}${roasDelta.toFixed(1)}%), CTR ${metrics.ctr.toFixed(2)}%, ${metrics.conversions} conversions`;
      })
      .join("\n");

    const prompt = `Analyze this weekly ad performance report (${thisWeekStartStr} to ${thisWeekEndStr}).

Overall metrics (this week vs previous week):
- Impressions: ${thisWeekTotals.impressions.toLocaleString()} (${overallDeltas.impressions > 0 ? "+" : ""}${overallDeltas.impressions.toFixed(1)}%)
- Clicks: ${thisWeekTotals.clicks.toLocaleString()} (${overallDeltas.clicks > 0 ? "+" : ""}${overallDeltas.clicks.toFixed(1)}%)
- Spend: $${thisWeekTotals.spend.toFixed(2)} (${overallDeltas.spend > 0 ? "+" : ""}${overallDeltas.spend.toFixed(1)}%)
- Conversions: ${thisWeekTotals.conversions} (${overallDeltas.conversions > 0 ? "+" : ""}${overallDeltas.conversions.toFixed(1)}%)
- Revenue: $${thisWeekTotals.revenue.toFixed(2)} (${overallDeltas.revenue > 0 ? "+" : ""}${overallDeltas.revenue.toFixed(1)}%)
- CTR: ${thisWeekTotals.ctr.toFixed(2)}% (${overallDeltas.ctr > 0 ? "+" : ""}${overallDeltas.ctr.toFixed(1)}%)
- CPC: $${thisWeekTotals.cpc.toFixed(2)} (${overallDeltas.cpc > 0 ? "+" : ""}${overallDeltas.cpc.toFixed(1)}%)
- ROAS: ${thisWeekTotals.roas.toFixed(2)}x (${overallDeltas.roas > 0 ? "+" : ""}${overallDeltas.roas.toFixed(1)}%)

Platform breakdown:
${platformLines || "No platform data available"}

Provide strategic recommendations for budget allocation and optimization next week.`;

    let aiAnalysis: Record<string, unknown> = {};
    try {
      aiAnalysis = await aiCall(prompt, reportTool, { temperature: 0.7 });
    } catch (aiErr) {
      console.error("AI analysis failed:", aiErr);
      aiAnalysis = {
        summary: "AI analysis unavailable. Review metrics manually.",
        platform_breakdown: [],
        trends: [],
        recommendations: [],
        budget_advice: "Review platform ROAS to optimize budget allocation.",
        overall_score: 5,
      };
    }

    // Store report
    const { data: report, error: insertError } = await supabase
      .from("reports")
      .insert({
        type: "weekly",
        date_from: thisWeekStartStr,
        date_to: thisWeekEndStr,
        metrics: {
          totals: thisWeekTotals,
          previous_totals: prevWeekTotals,
          deltas: overallDeltas,
          by_platform: thisWeekByPlatform,
          previous_by_platform: prevWeekByPlatform,
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
    console.error("Weekly report error:", err);
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function aggregateAll(metrics: any[]): AggregatedMetrics {
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

  return {
    ...totals,
    ctr: totals.impressions > 0 ? (totals.clicks / totals.impressions) * 100 : 0,
    cpc: totals.clicks > 0 ? totals.spend / totals.clicks : 0,
    roas: totals.spend > 0 ? totals.revenue / totals.spend : 0,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function aggregateByPlatform(metrics: any[]): Record<string, AggregatedMetrics> {
  const grouped: Record<string, typeof metrics> = {};
  for (const m of metrics) {
    const p = m.platform || "unknown";
    if (!grouped[p]) grouped[p] = [];
    grouped[p].push(m);
  }

  const result: Record<string, AggregatedMetrics> = {};
  for (const [platform, group] of Object.entries(grouped)) {
    result[platform] = aggregateAll(group);
  }
  return result;
}

function calcDelta(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
}
