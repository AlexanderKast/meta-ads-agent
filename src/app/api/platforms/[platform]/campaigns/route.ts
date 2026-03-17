import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getPlatformClient, isSupportedPlatform } from "@/lib/platforms";
import { decryptToken } from "@/lib/platforms/token-manager";
import { createCampaignSchema } from "@/lib/validators";

export async function GET(request: NextRequest, { params }: { params: Promise<{ platform: string }> }) {
  const { platform } = await params;
  if (!isSupportedPlatform(platform)) return Response.json({ error: "Plataforma no soportada" }, { status: 400 });

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "No autenticado" }, { status: 401 });

  const accountId = request.nextUrl.searchParams.get("accountId");

  const { data: account } = await supabase
    .from("connected_accounts")
    .select("*")
    .eq("user_id", user.id)
    .eq("platform", platform)
    .eq("is_active", true)
    .single();

  if (!account) return Response.json({ error: "Cuenta no conectada" }, { status: 404 });

  try {
    const client = getPlatformClient(platform);
    const token = decryptToken(account.access_token);
    const campaigns = await client.listCampaigns({ accessToken: token }, accountId || account.platform_account_id);
    return Response.json(campaigns);
  } catch (err) {
    return Response.json({ error: err instanceof Error ? err.message : "Error al listar campanas" }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ platform: string }> }) {
  const { platform } = await params;
  if (!isSupportedPlatform(platform)) return Response.json({ error: "Plataforma no soportada" }, { status: 400 });

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "No autenticado" }, { status: 401 });

  const body = await request.json();
  const parseResult = createCampaignSchema.safeParse(body);
  if (!parseResult.success) {
    return Response.json({ error: parseResult.error.issues.map((e) => e.message).join(", ") }, { status: 400 });
  }

  const input = parseResult.data;

  const { data: account } = await supabase
    .from("connected_accounts")
    .select("*")
    .eq("id", input.connectedAccountId)
    .eq("user_id", user.id)
    .eq("is_active", true)
    .single();

  if (!account) return Response.json({ error: "Cuenta no encontrada" }, { status: 404 });

  try {
    const client = getPlatformClient(platform);
    const token = decryptToken(account.access_token);
    const result = await client.createCampaign({ accessToken: token }, account.platform_account_id, input);

    // Save mapping
    const { data: mapping } = await supabase.from("campaign_mappings").insert({
      user_id: user.id,
      connected_account_id: account.id,
      platform,
      platform_campaign_id: result.campaignId,
      platform_adset_id: result.adSetId,
      campaign_name: input.name,
      status: "paused",
      objective: input.objective,
      budget_amount: input.budget.amount,
      budget_currency: input.budget.currency,
    }).select().single();

    return Response.json({ ...result, mapping }, { status: 201 });
  } catch (err) {
    return Response.json({ error: err instanceof Error ? err.message : "Error al crear campana" }, { status: 500 });
  }
}
