import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getPlatformClient, isSupportedPlatform } from "@/lib/platforms";
import { decryptToken } from "@/lib/platforms/token-manager";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ platform: string; campaignId: string }> }
) {
  const { platform, campaignId } = await params;
  if (!isSupportedPlatform(platform)) return Response.json({ error: "Plataforma no soportada" }, { status: 400 });

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "No autenticado" }, { status: 401 });

  const startDate = request.nextUrl.searchParams.get("startDate");
  const endDate = request.nextUrl.searchParams.get("endDate");

  if (!startDate || !endDate) {
    return Response.json({ error: "startDate y endDate son requeridos" }, { status: 400 });
  }

  // Get campaign mapping
  const { data: mapping } = await supabase
    .from("campaign_mappings")
    .select("*, connected_accounts(*)")
    .eq("id", campaignId)
    .eq("user_id", user.id)
    .single();

  if (!mapping) return Response.json({ error: "Campana no encontrada" }, { status: 404 });

  const account = mapping.connected_accounts;
  if (!account) return Response.json({ error: "Cuenta no encontrada" }, { status: 404 });

  try {
    const client = getPlatformClient(platform);
    const token = decryptToken(account.access_token);

    const metrics = await client.getMetrics(
      { accessToken: token },
      mapping.platform_campaign_id,
      account.platform_account_id,
      { start: startDate, end: endDate }
    );

    // Cache metrics in database
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

    // Update last synced
    await supabase.from("campaign_mappings").update({ last_synced_at: new Date().toISOString() }).eq("id", campaignId);

    return Response.json(metrics);
  } catch (err) {
    return Response.json({ error: err instanceof Error ? err.message : "Error al obtener metricas" }, { status: 500 });
  }
}
