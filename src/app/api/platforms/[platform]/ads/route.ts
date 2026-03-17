import { NextRequest } from "next/server";
import { getPlatformClient, isSupportedPlatform } from "@/lib/platforms";
import { decryptToken } from "@/lib/platforms/token-manager";
import { createAdSchema } from "@/lib/validators";
import { getSupabase, getUserId } from "@/lib/auth-helper";

export async function POST(request: NextRequest, { params }: { params: Promise<{ platform: string }> }) {
  const { platform } = await params;
  if (!isSupportedPlatform(platform)) return Response.json({ error: "Plataforma no soportada" }, { status: 400 });

  const supabase = getSupabase();
  const userId = getUserId();

  const body = await request.json();
  const parseResult = createAdSchema.safeParse(body);
  if (!parseResult.success) {
    return Response.json({ error: parseResult.error.issues.map((e) => e.message).join(", ") }, { status: 400 });
  }

  const input = parseResult.data;

  const { data: account } = await supabase
    .from("connected_accounts")
    .select("*")
    .eq("id", input.connectedAccountId)
    .eq("user_id", userId)
    .eq("is_active", true)
    .single();

  if (!account) return Response.json({ error: "Cuenta no encontrada" }, { status: 404 });

  const { data: mapping } = await supabase
    .from("campaign_mappings")
    .select("*")
    .eq("id", input.campaignMappingId)
    .eq("user_id", userId)
    .single();

  if (!mapping) return Response.json({ error: "Campana no encontrada" }, { status: 404 });

  try {
    const client = getPlatformClient(platform);
    const token = decryptToken(account.access_token);

    const result = await client.createAd({ accessToken: token }, account.platform_account_id, {
      campaignId: mapping.platform_campaign_id,
      adSetId: mapping.platform_adset_id,
      headline: input.headline,
      primaryText: input.primaryText,
      description: input.description,
      cta: input.cta,
      imageUrl: input.imageUrl,
      landingUrl: input.landingUrl,
    });

    await supabase
      .from("campaign_mappings")
      .update({ platform_ad_id: result.adId, generation_id: input.generationId, updated_at: new Date().toISOString() })
      .eq("id", input.campaignMappingId);

    return Response.json(result, { status: 201 });
  } catch (err) {
    return Response.json({ error: err instanceof Error ? err.message : "Error al crear anuncio" }, { status: 500 });
  }
}
