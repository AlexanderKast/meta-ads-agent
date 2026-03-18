import type { ToolSchema } from "@/lib/ai-provider";
import { createClient } from "@/lib/supabase/server";
import { generateAdsTool } from "@/lib/tool-schemas";
import { aiCall } from "@/lib/ai-provider";

// ---------- Tool Schemas ----------

export const getCampaignMetricsTool: ToolSchema = {
  name: "get_campaign_metrics",
  description: "Obtiene metricas de una campana especifica por plataforma y rango de fechas",
  properties: {
    platform: {
      type: "string",
      description: "Plataforma publicitaria (meta, google, tiktok, linkedin)",
      enum: ["meta", "google", "tiktok", "linkedin"],
    },
    campaign_id: {
      type: "string",
      description: "ID de la campana",
    },
    start_date: {
      type: "string",
      description: "Fecha de inicio (YYYY-MM-DD)",
    },
    end_date: {
      type: "string",
      description: "Fecha de fin (YYYY-MM-DD)",
    },
  },
  required: ["platform", "campaign_id"],
};

export const listActiveCampaignsTool: ToolSchema = {
  name: "list_active_campaigns",
  description: "Lista todas las campanas activas del usuario en todas las plataformas",
  properties: {},
  required: [],
};

export const getSpendSummaryTool: ToolSchema = {
  name: "get_spend_summary",
  description: "Obtiene un resumen de gasto publicitario agrupado por plataforma en un rango de fechas",
  properties: {
    start_date: {
      type: "string",
      description: "Fecha de inicio (YYYY-MM-DD)",
    },
    end_date: {
      type: "string",
      description: "Fecha de fin (YYYY-MM-DD)",
    },
  },
  required: ["start_date", "end_date"],
};

export const comparePlatformsTool: ToolSchema = {
  name: "compare_platforms",
  description: "Compara metricas clave (CTR, CPC, ROAS) entre plataformas en un rango de fechas",
  properties: {
    start_date: {
      type: "string",
      description: "Fecha de inicio (YYYY-MM-DD)",
    },
    end_date: {
      type: "string",
      description: "Fecha de fin (YYYY-MM-DD)",
    },
  },
  required: ["start_date", "end_date"],
};

export const generateAdCopyTool: ToolSchema = {
  name: "generate_ad_copy",
  description: "Genera copy publicitario optimizado para una plataforma especifica",
  properties: {
    platform: {
      type: "string",
      description: "Plataforma destino (meta, google, tiktok, linkedin)",
      enum: ["meta", "google", "tiktok", "linkedin"],
    },
    product: {
      type: "string",
      description: "Descripcion del producto o servicio",
    },
    audience: {
      type: "string",
      description: "Audiencia objetivo",
    },
    tone: {
      type: "string",
      description: "Tono del copy (profesional, casual, urgente, emocional, divertido)",
      enum: ["profesional", "casual", "urgente", "emocional", "divertido"],
    },
  },
  required: ["platform", "product", "audience", "tone"],
};

export const getRecommendationsTool: ToolSchema = {
  name: "get_recommendations",
  description: "Analiza metricas de una campana y genera recomendaciones de optimizacion",
  properties: {
    campaign_id: {
      type: "string",
      description: "ID de la campana a analizar",
    },
  },
  required: ["campaign_id"],
};

// ---------- All tools for registration ----------

export const agentTools: ToolSchema[] = [
  getCampaignMetricsTool,
  listActiveCampaignsTool,
  getSpendSummaryTool,
  comparePlatformsTool,
  generateAdCopyTool,
  getRecommendationsTool,
];

// ---------- Tool Execution ----------

export async function executeTool(
  name: string,
  args: Record<string, unknown>,
  accountId?: string | null
): Promise<string> {
  switch (name) {
    case "get_campaign_metrics":
      return executeGetCampaignMetrics(args, accountId);
    case "list_active_campaigns":
      return executeListActiveCampaigns(accountId);
    case "get_spend_summary":
      return executeGetSpendSummary(args, accountId);
    case "compare_platforms":
      return executeComparePlatforms(args, accountId);
    case "generate_ad_copy":
      return executeGenerateAdCopy(args);
    case "get_recommendations":
      return executeGetRecommendations(args, accountId);
    default:
      return JSON.stringify({ error: `Herramienta desconocida: ${name}` });
  }
}

async function getCampaignMappingIds(
  supabase: Awaited<ReturnType<typeof createClient>>,
  accountId?: string | null
): Promise<string[] | null> {
  if (!accountId) return null;
  const { data } = await supabase
    .from("campaign_mappings")
    .select("id")
    .eq("connected_account_id", accountId);
  return data?.map((r) => r.id as string) ?? [];
}

async function executeGetCampaignMetrics(
  args: Record<string, unknown>,
  accountId?: string | null
): Promise<string> {
  const supabase = await createClient();
  let query = supabase
    .from("campaign_metrics")
    .select("*")
    .eq("platform", args.platform)
    .eq("campaign_id", args.campaign_id);

  if (accountId) {
    const ids = await getCampaignMappingIds(supabase, accountId);
    if (ids && ids.length === 0) {
      return JSON.stringify({ message: "No se encontraron metricas para esta campana en la cuenta seleccionada" });
    }
    if (ids) query = query.in("campaign_mapping_id", ids);
  }

  if (args.start_date) {
    query = query.gte("date", args.start_date);
  }
  if (args.end_date) {
    query = query.lte("date", args.end_date);
  }

  const { data, error } = await query.order("date", { ascending: false });

  if (error) return JSON.stringify({ error: error.message });
  if (!data || data.length === 0) {
    return JSON.stringify({ message: "No se encontraron metricas para esta campana" });
  }
  return JSON.stringify(data);
}

async function executeListActiveCampaigns(
  accountId?: string | null
): Promise<string> {
  const supabase = await createClient();
  let query = supabase
    .from("campaign_mappings")
    .select("*");

  if (accountId) {
    query = query.eq("connected_account_id", accountId);
  }

  const { data, error } = await query.order("created_at", { ascending: false });

  if (error) return JSON.stringify({ error: error.message });
  if (!data || data.length === 0) {
    return JSON.stringify({ message: "No hay campanas activas" });
  }
  return JSON.stringify(data);
}

async function executeGetSpendSummary(
  args: Record<string, unknown>,
  accountId?: string | null
): Promise<string> {
  const supabase = await createClient();
  let query = supabase
    .from("campaign_metrics")
    .select("platform, spend, impressions, clicks, conversions, campaign_mapping_id")
    .gte("date", args.start_date)
    .lte("date", args.end_date);

  if (accountId) {
    const ids = await getCampaignMappingIds(supabase, accountId);
    if (ids && ids.length === 0) {
      return JSON.stringify({ message: "No hay datos de gasto en ese periodo para la cuenta seleccionada" });
    }
    if (ids) query = query.in("campaign_mapping_id", ids);
  }

  const { data, error } = await query;

  if (error) return JSON.stringify({ error: error.message });
  if (!data || data.length === 0) {
    return JSON.stringify({ message: "No hay datos de gasto en ese periodo" });
  }

  // Aggregate by platform
  const summary: Record<
    string,
    { spend: number; impressions: number; clicks: number; conversions: number }
  > = {};
  for (const row of data) {
    const p = row.platform as string;
    if (!summary[p]) {
      summary[p] = { spend: 0, impressions: 0, clicks: 0, conversions: 0 };
    }
    summary[p].spend += Number(row.spend) || 0;
    summary[p].impressions += Number(row.impressions) || 0;
    summary[p].clicks += Number(row.clicks) || 0;
    summary[p].conversions += Number(row.conversions) || 0;
  }

  return JSON.stringify(summary);
}

async function executeComparePlatforms(
  args: Record<string, unknown>,
  accountId?: string | null
): Promise<string> {
  const supabase = await createClient();
  let query = supabase
    .from("campaign_metrics")
    .select("platform, spend, impressions, clicks, conversions, revenue, campaign_mapping_id")
    .gte("date", args.start_date)
    .lte("date", args.end_date);

  if (accountId) {
    const ids = await getCampaignMappingIds(supabase, accountId);
    if (ids && ids.length === 0) {
      return JSON.stringify({ message: "No hay datos para comparar en ese periodo para la cuenta seleccionada" });
    }
    if (ids) query = query.in("campaign_mapping_id", ids);
  }

  const { data, error } = await query;

  if (error) return JSON.stringify({ error: error.message });
  if (!data || data.length === 0) {
    return JSON.stringify({ message: "No hay datos para comparar en ese periodo" });
  }

  // Aggregate by platform
  const agg: Record<
    string,
    { spend: number; impressions: number; clicks: number; conversions: number; revenue: number }
  > = {};
  for (const row of data) {
    const p = row.platform as string;
    if (!agg[p]) {
      agg[p] = { spend: 0, impressions: 0, clicks: 0, conversions: 0, revenue: 0 };
    }
    agg[p].spend += Number(row.spend) || 0;
    agg[p].impressions += Number(row.impressions) || 0;
    agg[p].clicks += Number(row.clicks) || 0;
    agg[p].conversions += Number(row.conversions) || 0;
    agg[p].revenue += Number(row.revenue) || 0;
  }

  // Calculate derived metrics
  const comparison = Object.entries(agg).map(([platform, m]) => ({
    platform,
    spend: m.spend,
    impressions: m.impressions,
    clicks: m.clicks,
    conversions: m.conversions,
    ctr: m.impressions > 0 ? ((m.clicks / m.impressions) * 100).toFixed(2) + "%" : "N/A",
    cpc: m.clicks > 0 ? "$" + (m.spend / m.clicks).toFixed(2) : "N/A",
    roas: m.spend > 0 ? (m.revenue / m.spend).toFixed(2) + "x" : "N/A",
  }));

  return JSON.stringify(comparison);
}

async function executeGenerateAdCopy(
  args: Record<string, unknown>
): Promise<string> {
  const prompt = `Genera 2 variaciones de copy publicitario para ${args.platform}.
Producto: ${args.product}
Audiencia: ${args.audience}
Tono: ${args.tone}

Incluye headline, texto principal, CTA y hook.`;

  try {
    const result = await aiCall(prompt, generateAdsTool(), {
      maxTokens: 4096,
      temperature: 1.0,
    });
    return JSON.stringify(result);
  } catch (err) {
    return JSON.stringify({
      error: err instanceof Error ? err.message : "Error generando copy",
    });
  }
}

async function executeGetRecommendations(
  args: Record<string, unknown>,
  accountId?: string | null
): Promise<string> {
  const supabase = await createClient();
  let query = supabase
    .from("campaign_metrics")
    .select("*")
    .eq("campaign_id", args.campaign_id);

  if (accountId) {
    const ids = await getCampaignMappingIds(supabase, accountId);
    if (ids && ids.length === 0) {
      return JSON.stringify({ message: "No se encontraron metricas para generar recomendaciones en la cuenta seleccionada" });
    }
    if (ids) query = query.in("campaign_mapping_id", ids);
  }

  const { data, error } = await query
    .order("date", { ascending: false })
    .limit(30);

  if (error) return JSON.stringify({ error: error.message });
  if (!data || data.length === 0) {
    return JSON.stringify({
      message: "No se encontraron metricas para generar recomendaciones",
    });
  }

  // Calculate averages
  const totals = data.reduce(
    (acc, row) => ({
      spend: acc.spend + (Number(row.spend) || 0),
      impressions: acc.impressions + (Number(row.impressions) || 0),
      clicks: acc.clicks + (Number(row.clicks) || 0),
      conversions: acc.conversions + (Number(row.conversions) || 0),
      revenue: acc.revenue + (Number(row.revenue) || 0),
    }),
    { spend: 0, impressions: 0, clicks: 0, conversions: 0, revenue: 0 }
  );

  const ctr = totals.impressions > 0 ? (totals.clicks / totals.impressions) * 100 : 0;
  const cpc = totals.clicks > 0 ? totals.spend / totals.clicks : 0;
  const roas = totals.spend > 0 ? totals.revenue / totals.spend : 0;
  const cpa = totals.conversions > 0 ? totals.spend / totals.conversions : 0;

  const recommendations: string[] = [];

  if (ctr < 1) {
    recommendations.push(
      `CTR bajo (${ctr.toFixed(2)}%). Considera mejorar el copy y creativos. Un CTR saludable es >2%.`
    );
  }
  if (cpc > 5) {
    recommendations.push(
      `CPC alto ($${cpc.toFixed(2)}). Revisa la segmentacion y pujas. Objetivo: <$2.`
    );
  }
  if (roas < 2) {
    recommendations.push(
      `ROAS bajo (${roas.toFixed(2)}x). Considera pausar o reestructurar. Objetivo: >3x.`
    );
  }
  if (cpa > 50) {
    recommendations.push(
      `CPA elevado ($${cpa.toFixed(2)}). Optimiza el funnel de conversion.`
    );
  }
  if (recommendations.length === 0) {
    recommendations.push("La campana muestra buen rendimiento general. Mantener y escalar.");
  }

  return JSON.stringify({
    campaign_id: args.campaign_id,
    period: `Ultimos ${data.length} dias`,
    metrics: {
      spend: `$${totals.spend.toFixed(2)}`,
      impressions: totals.impressions,
      clicks: totals.clicks,
      conversions: totals.conversions,
      ctr: `${ctr.toFixed(2)}%`,
      cpc: `$${cpc.toFixed(2)}`,
      roas: `${roas.toFixed(2)}x`,
      cpa: `$${cpa.toFixed(2)}`,
    },
    recommendations,
  });
}
