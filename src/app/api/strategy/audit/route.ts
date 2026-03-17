import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { aiCall, type ToolSchema } from "@/lib/ai-provider";
import { buildAuditPrompt } from "@/lib/prompts/strategy";

const auditTool: ToolSchema = {
  name: "portfolio_audit",
  description:
    "Devuelve el audit completo del portafolio de campanas publicitarias con health score, issues y acciones recomendadas.",
  properties: {
    campaigns: {
      type: "array",
      description: "Lista de campanas auditadas",
      items: {
        type: "object",
        properties: {
          name: { type: "string", description: "Nombre de la campana" },
          healthScore: {
            type: "number",
            description: "Puntuacion de salud 0-100",
          },
          issues: {
            type: "array",
            description: "Problemas identificados",
            items: { type: "string" },
          },
          action: {
            type: "string",
            description: "Accion recomendada",
          },
          priority: {
            type: "string",
            description: "Prioridad: alta, media, baja",
            enum: ["alta", "media", "baja"],
          },
        },
        required: ["name", "healthScore", "issues", "action", "priority"],
      },
    },
    summary: {
      type: "string",
      description: "Resumen general del estado del portafolio",
    },
    topActions: {
      type: "array",
      description: "Top 3 acciones mas impactantes",
      items: { type: "string" },
    },
  },
  required: ["campaigns", "summary", "topActions"],
};

export async function POST() {
  try {
    const supabase = await createClient();

    // Fetch campaigns with their latest metrics
    const { data: mappings, error: mapErr } = await supabase
      .from("campaign_mappings")
      .select("*");

    if (mapErr) throw new Error(mapErr.message);

    const { data: metrics, error: metErr } = await supabase
      .from("campaign_metrics")
      .select("*")
      .order("date", { ascending: false });

    if (metErr) throw new Error(metErr.message);

    // Build campaign data by joining mappings with latest metrics
    const campaignMap = new Map<
      string,
      {
        name: string;
        platform: string;
        status: string;
        spend: number;
        impressions: number;
        clicks: number;
        conversions: number;
        roas: number;
        ctr: number;
        cpc: number;
      }
    >();

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

      campaignMap.set(m.id, {
        name: m.campaign_name || m.id,
        platform: m.platform || "unknown",
        status: m.status || "active",
        spend: totalSpend,
        impressions: totalImpressions,
        clicks: totalClicks,
        conversions: totalConversions,
        roas:
          totalSpend > 0
            ? (totalConversions * (m.avg_order_value || 50)) / totalSpend
            : 0,
        ctr: totalImpressions > 0 ? totalClicks / totalImpressions : 0,
        cpc: totalClicks > 0 ? totalSpend / totalClicks : 0,
      });
    }

    const campaigns = Array.from(campaignMap.values());

    if (campaigns.length === 0) {
      return NextResponse.json({
        campaigns: [],
        summary: "No hay campanas para auditar. Conecta tus plataformas publicitarias primero.",
        topActions: [
          "Conecta tu cuenta de Meta Ads",
          "Conecta tu cuenta de Google Ads",
          "Importa tus campanas activas",
        ],
      });
    }

    const prompt = buildAuditPrompt(campaigns);
    const result = await aiCall(prompt, auditTool, {
      maxTokens: 4096,
      temperature: 0.3,
      thinking: 1024,
    });

    return NextResponse.json(result);
  } catch (err) {
    console.error("Strategy audit error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error en audit" },
      { status: 500 }
    );
  }
}
