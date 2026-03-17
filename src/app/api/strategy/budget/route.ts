import { NextResponse } from "next/server";
import { getSupabase, getUserId } from "@/lib/auth-helper";
import { aiCall, type ToolSchema } from "@/lib/ai-provider";
import { buildBudgetPrompt } from "@/lib/prompts/strategy";

const budgetTool: ToolSchema = {
  name: "budget_optimizer",
  description:
    "Devuelve recomendaciones de redistribucion de presupuesto para maximizar ROAS.",
  properties: {
    recommendations: {
      type: "array",
      description: "Recomendaciones por campana",
      items: {
        type: "object",
        properties: {
          campaign: { type: "string", description: "Nombre de la campana" },
          currentBudget: {
            type: "number",
            description: "Presupuesto actual",
          },
          recommendedBudget: {
            type: "number",
            description: "Presupuesto recomendado",
          },
          reason: {
            type: "string",
            description: "Razon de la recomendacion",
          },
        },
        required: [
          "campaign",
          "currentBudget",
          "recommendedBudget",
          "reason",
        ],
      },
    },
    totalSavings: {
      type: "number",
      description: "Ahorro total estimado",
    },
    projectedROAS: {
      type: "number",
      description: "ROAS proyectado con la redistribucion",
    },
  },
  required: ["recommendations", "totalSavings", "projectedROAS"],
};

export async function POST() {
  try {
    const supabase = getSupabase();

    const { data: mappings, error: mapErr } = await supabase
      .from("campaign_mappings")
      .select("*");

    if (mapErr) throw new Error(mapErr.message);

    const { data: metrics, error: metErr } = await supabase
      .from("campaign_metrics")
      .select("*")
      .order("date", { ascending: false });

    if (metErr) throw new Error(metErr.message);

    let totalBudget = 0;
    const campaigns: Array<{
      name: string;
      platform: string;
      currentBudget: number;
      spend: number;
      roas: number;
      conversions: number;
      ctr: number;
    }> = [];

    for (const m of mappings || []) {
      const campaignMetrics = (metrics || []).filter(
        (met) => met.campaign_mapping_id === m.id
      );
      const totalSpend = campaignMetrics.reduce(
        (s, met) => s + (met.spend || 0),
        0
      );
      const totalImpressions = campaignMetrics.reduce(
        (s, met) => s + (met.impressions || 0),
        0
      );
      const totalClicks = campaignMetrics.reduce(
        (s, met) => s + (met.clicks || 0),
        0
      );
      const totalConversions = campaignMetrics.reduce(
        (s, met) => s + (met.conversions || 0),
        0
      );

      const budget = m.daily_budget
        ? m.daily_budget * 30
        : totalSpend > 0
          ? totalSpend
          : 1000;
      totalBudget += budget;

      campaigns.push({
        name: m.campaign_name || m.id,
        platform: m.platform || "unknown",
        currentBudget: budget,
        spend: totalSpend,
        roas:
          totalSpend > 0
            ? (totalConversions * (m.avg_order_value || 50)) / totalSpend
            : 0,
        conversions: totalConversions,
        ctr: totalImpressions > 0 ? totalClicks / totalImpressions : 0,
      });
    }

    if (campaigns.length === 0) {
      return NextResponse.json({
        recommendations: [],
        totalSavings: 0,
        projectedROAS: 0,
      });
    }

    const prompt = buildBudgetPrompt({ totalBudget, campaigns });
    const result = await aiCall(prompt, budgetTool, {
      maxTokens: 4096,
      temperature: 0.2,
      thinking: 1024,
    });

    return NextResponse.json(result);
  } catch (err) {
    console.error("Budget optimizer error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error en optimizacion" },
      { status: 500 }
    );
  }
}
